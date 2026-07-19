import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// Import Supabase Database operations
import { 
    initDatabase, 
    getState, 
    registerRestaurant, 
    addMenuItem, 
    deleteMenuItem, 
    addTable, 
    updateTableStatus,
    placeOrder, 
    updateOrderStatus, 
    updateOrderPaymentStatus,
    createSupportAlert,
    resolveSupportAlert,
    sendChatMessage,
    updateRestaurantSetup,
    updateTableReservationStatus,
    saveProfile,
    getProfile
} from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
});

// Serve static frontend files from parent directory
app.use(express.static(path.join(__dirname, '..')));

const server = http.createServer(app);
let wss;
if (!process.env.VERCEL) {
    wss = new WebSocketServer({ server });
}

// WebSockets Broadcast Helper
function broadcast(data) {
    if (!wss) return; // Skip under Vercel
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
        }
    });
}

// REST API Endpoints

// 0. Get Supabase config
app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    });
});

// 0.b Save or update customer profile
app.post('/api/profile', async (req, res) => {
    try {
        const profile = req.body;
        if (!profile.id || !profile.email || !profile.name) {
            return res.status(400).json({ error: 'id, email, and name are required' });
        }
        const data = await saveProfile(profile);
        res.json({ success: true, data });
    } catch (err) {
        console.error('Error saving profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// 0.c Get customer profile
app.get('/api/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await getProfile(id);
        res.json(profile || null);
    } catch (err) {
        console.error('Error getting profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// 1. Get entire state
app.get('/api/state', async (req, res) => {
    try {
        const state = await getState();
        res.json(state);
    } catch (err) {
        console.error('Error fetching state:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Register new restaurant
app.post('/api/restaurants', async (req, res) => {
    try {
        const { email, name, address, password } = req.body;
        const newRest = await registerRestaurant(email, name, address, password);
        
        broadcast({ type: 'STATE_UPDATED' });
        res.status(201).json(newRest);
    } catch (err) {
        console.error('Error registering restaurant:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Add menu item
app.post('/api/menu', async (req, res) => {
    try {
        const { restaurantId, item } = req.body;
        const newItem = await addMenuItem(restaurantId, item);
        
        broadcast({ type: 'STATE_UPDATED' });
        res.status(201).json(newItem);
    } catch (err) {
        console.error('Error adding menu item:', err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Delete menu item
app.delete('/api/menu/:restId/:itemId', async (req, res) => {
    try {
        const { restId, itemId } = req.params;
        await deleteMenuItem(restId, itemId);
        
        broadcast({ type: 'STATE_UPDATED' });
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting menu item:', err);
        res.status(500).json({ error: err.message });
    }
});

// 5. Add dining table
app.post('/api/tables', async (req, res) => {
    try {
        const { restaurantId, tableNum } = req.body;
        const added = await addTable(restaurantId, tableNum);
        
        if (added) {
            broadcast({ type: 'STATE_UPDATED' });
            res.status(201).json({ success: true });
        } else {
            res.status(400).json({ error: 'Table already exists' });
        }
    } catch (err) {
        console.error('Error adding table:', err);
        res.status(500).json({ error: err.message });
    }
});

// 5.b Update dining table status
app.put('/api/tables/:restId/:tableNum/status', async (req, res) => {
    try {
        const { restId, tableNum } = req.params;
        const { status } = req.body;
        await updateTableStatus(restId, tableNum, status);
        
        broadcast({ type: 'STATE_UPDATED' });
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating table status:', err);
        res.status(500).json({ error: err.message });
    }
});

// 5.c Update dining table reservation status
app.put('/api/tables/:restId/:tableNum/reservable', async (req, res) => {
    try {
        const { restId, tableNum } = req.params;
        const { isReservable } = req.body;
        await updateTableReservationStatus(restId, tableNum, isReservable);
        
        broadcast({ type: 'STATE_UPDATED' });
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating table reservation status:', err);
        res.status(500).json({ error: err.message });
    }
});

// 5.d Update restaurant setup details
app.put('/api/restaurants/:id/setup', async (req, res) => {
    try {
        const { id } = req.params;
        const details = req.body;
        await updateRestaurantSetup(id, details);
        
        broadcast({ type: 'STATE_UPDATED' });
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating restaurant setup:', err);
        res.status(500).json({ error: err.message });
    }
});

// 6. Place order
app.post('/api/orders', async (req, res) => {
    try {
        const { restaurantId, tableNum, items, paymentMethod, customerName } = req.body;
        const newOrder = await placeOrder(restaurantId, tableNum, items, paymentMethod, customerName);
        
        broadcast({ type: 'ORDER_PLACED', order: newOrder });
        res.status(201).json(newOrder);
    } catch (err) {
        console.error('Error placing order:', err);
        res.status(500).json({ error: err.message });
    }
});

// 7. Update order cooking status
app.put('/api/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const updatedOrder = await updateOrderStatus(orderId, status);
        
        broadcast({ type: 'STATUS_UPDATED', orderId, status });
        res.json(updatedOrder);
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: err.message });
    }
});

// 8. Update order payment status
app.put('/api/orders/:orderId/payment', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentStatus } = req.body;
        const updatedOrder = await updateOrderPaymentStatus(orderId, paymentStatus);
        
        broadcast({ type: 'STATE_UPDATED' });
        res.json(updatedOrder);
    } catch (err) {
        console.error('Error updating payment status:', err);
        res.status(500).json({ error: err.message });
    }
});

// 9. Create support alert
app.post('/api/support-alerts', async (req, res) => {
    try {
        const { restaurantId, tableNum, customerName, message } = req.body;
        const newAlert = await createSupportAlert(restaurantId, tableNum, customerName, message);
        
        broadcast({ type: 'STATE_UPDATED' }); // Sync state for everyone
        res.status(201).json(newAlert);
    } catch (err) {
        console.error('Error creating support alert:', err);
        res.status(500).json({ error: err.message });
    }
});

// 10. Resolve support alert
app.put('/api/support-alerts/:alertId/resolve', async (req, res) => {
    try {
        const { alertId } = req.params;
        await resolveSupportAlert(alertId);
        
        broadcast({ type: 'STATE_UPDATED' }); // Sync state for everyone
        res.json({ success: true });
    } catch (err) {
        console.error('Error resolving support alert:', err);
        res.status(500).json({ error: err.message });
    }
});

// 11. Send chat message
app.post('/api/chat-messages', async (req, res) => {
    try {
        const { restaurantId, tableNum, customerName, sender, message } = req.body;
        const newMsg = await sendChatMessage(restaurantId, tableNum, customerName, sender, message);
        
        broadcast({ type: 'STATE_UPDATED' });
        res.status(201).json(newMsg);
    } catch (err) {
        console.error('Error sending chat message:', err);
        res.status(500).json({ error: err.message });
    }
});

// 12. Fetch real-world restaurants using Google Places API (or high-quality simulated fallback)
app.get('/api/google-restaurants', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        
        let radius = parseFloat(req.query.radius);
        if (isNaN(radius) || radius <= 0 || radius === Infinity) {
            radius = 5000; // default 5km
        } else if (radius > 50000) {
            radius = 50000; // clamp to 50km max for Google API safety
        }

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: 'lat and lng parameters are required' });
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (apiKey) {
            console.log(`[Google Places] Searching nearby restaurants for lat:${lat}, lng:${lng}, radius:${radius}m`);
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${apiKey}`;
            const apiRes = await fetch(url);
            const data = await apiRes.json();
            
            if (data.status === 'OK' && data.results) {
                // Map Google API results to our format
                const googleRest = data.results.map((place, index) => {
                    const rLat = place.geometry.location.lat;
                    const rLng = place.geometry.location.lng;
                    
                    const R = 6371; // km
                    const dLat = (rLat - lat) * Math.PI / 180;
                    const dLng = (rLng - lng) * Math.PI / 180;
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                              Math.cos(lat * Math.PI / 180) * Math.cos(rLat * Math.PI / 180) *
                              Math.sin(dLng/2) * Math.sin(dLng/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const distance = parseFloat((R * c).toFixed(1));

                    return {
                        id: `g_${place.place_id || 'place_' + index}`,
                        name: place.name,
                        address: place.vicinity || 'Nearby',
                        rating: place.rating ? String(place.rating) : '4.2',
                        cuisines: place.types ? place.types.slice(0, 3).join(', ').replace(/_/g, ' ') : 'Indian, Fast Food',
                        latitude: rLat,
                        longitude: rLng,
                        distance: distance,
                        source: 'google',
                        deliveryTime: `${Math.floor(distance * 5 + 15)}-${Math.floor(distance * 5 + 25)} min`
                    };
                });
                
                return res.json(googleRest);
            } else {
                console.warn(`[Google Places] API returned status: ${data.status}. Falling back to simulation.`);
            }
        }

        // --- Simulated Fallback ---
        const mockRestaurantsList = [
            { name: 'Bawarchi Restaurant', cuisines: 'Biryani, North Indian, Kebabs', rating: '4.3' },
            { name: 'Cafe Niloufer', cuisines: 'Tea, Osmania Biscuits, Bakery', rating: '4.6' },
            { name: 'Mehfil Restaurant', cuisines: 'Mughlai, Biryani, Chinese', rating: '4.1' },
            { name: 'Pista House', cuisines: 'Haleem, Biryani, Desserts', rating: '4.4' },
            { name: 'Chutneys', cuisines: 'South Indian, Vegetarian', rating: '4.5' },
            { name: 'Shah Ghouse Cafe', cuisines: 'Biryani, Mandi, Kebabs', rating: '4.2' },
            { name: 'Jewel of Nizam', cuisines: 'Mughlai, Nizami Fine Dining', rating: '4.7' },
            { name: 'Cream Stone', cuisines: 'Ice Cream, Waffles, Desserts', rating: '4.5' },
            { name: 'Paradise Biryani', cuisines: 'Biryani, Kebabs, Desserts', rating: '4.3' },
            { name: 'SodaBottleOpenerWala', cuisines: 'Parsi, Irani Cafe, Bombay Street Food', rating: '4.2' }
        ];

        const shuffled = mockRestaurantsList.sort(() => 0.5 - Math.random());
        const selectedCount = Math.min(5 + Math.floor(Math.random() * 3), shuffled.length); 
        
        const results = shuffled.slice(0, selectedCount).map((rest, index) => {
            const angle = Math.random() * Math.PI * 2;
            const distanceKm = 0.5 + Math.random() * (radius / 1000 - 0.5); 
            const latOffset = (distanceKm / 111) * Math.sin(angle);
            const lngOffset = (distanceKm / (111 * Math.cos(lat * Math.PI / 180))) * Math.cos(angle);

            const rLat = lat + latOffset;
            const rLng = lng + lngOffset;

            const R = 6371;
            const dLat = (rLat - lat) * Math.PI / 180;
            const dLng = (rLng - lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat * Math.PI / 180) * Math.cos(rLat * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const calculatedDist = parseFloat((R * c).toFixed(1));

            return {
                id: `g_mock_${index}_${Date.now()}`,
                name: rest.name,
                address: `${Math.floor(Math.random()*100)+1}, Main Road, Hyderabad`,
                rating: rest.rating,
                cuisines: rest.cuisines,
                latitude: rLat,
                longitude: rLng,
                distance: calculatedDist,
                source: 'google',
                deliveryTime: `${Math.floor(calculatedDist * 5 + 15)}-${Math.floor(calculatedDist * 5 + 25)} min`
            };
        });

        results.sort((a, b) => a.distance - b.distance);
        res.json(results);
    } catch (err) {
        console.error('Error fetching Google restaurants:', err);
        res.status(500).json({ error: err.message });
    }
});

// Catch-all route to redirect direct page requests (without hash) to their hash-based equivalent
app.get('/customer/restaurant/:restId', (req, res) => {
    return res.redirect(`/#customer/restaurant/${req.params.restId}`);
});

app.get('/:role/:page', (req, res, next) => {
    const { role, page } = req.params;
    if (['customer', 'owner'].includes(role)) {
        return res.redirect(`/#${role}/${page}`);
    }
    next();
});

app.get('/:role', (req, res, next) => {
    const { role } = req.params;
    if (role === 'customer') {
        return res.redirect('/#customer/home');
    } else if (role === 'owner') {
        return res.redirect('/#owner/dashboard');
    }
    next();
});


// WebSocket Server Connections
if (wss) {
    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket server');
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('Received WebSocket message:', data);
            } catch (err) {
                console.error('Error parsing WebSocket client message:', err);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
}

if (!process.env.VERCEL) {
    // Initialize database before starting HTTP server locally
    initDatabase().then(() => {
        server.listen(PORT, () => {
            // Find local network IP address
            let localIp = '127.0.0.1';
            try {
                const interfaces = os.networkInterfaces();
                for (const devName in interfaces) {
                    const iface = interfaces[devName];
                    for (let i = 0; i < iface.length; i++) {
                        const alias = iface[i];
                        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                            localIp = alias.address;
                            break;
                        }
                    }
                    if (localIp !== '127.0.0.1') break;
                }
            } catch (e) {
                console.error('Error fetching local network IP:', e);
            }

            console.log(`\n======================================================`);
            console.log(`Dine Direct server is running with Supabase and accessible:`);
            console.log(`- Localhost:     http://localhost:${PORT}`);
            console.log(`- Local Network:  http://${localIp}:${PORT}`);
            console.log(`======================================================\n`);
        });
    }).catch(err => {
        console.error('CRITICAL: Failed to initialize Supabase database:', err);
    });
} else {
    // Under Vercel, just initialize connection on load
    initDatabase().catch(err => {
        console.error('Failed to initialize Supabase database on serverless start:', err);
    });
}

export default app;
