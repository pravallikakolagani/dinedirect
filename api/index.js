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
    sendOtp,
    verifyOtp
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

// 0.b Send OTP to email/phone
app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const contact = req.body.email || req.body.contact;
        if (!contact) {
            return res.status(400).json({ error: 'Email or phone number is required' });
        }
        
        try {
            await sendOtp(contact);
            res.json({ success: true });
        } catch (authErr) {
            const isEmail = contact.includes('@');
            // If SMS provider is not configured, trigger simulation fallback
            if (!isEmail && (authErr.message.includes('provider') || authErr.message.includes('SMS') || authErr.message.includes('sms'))) {
                console.log(`[SMS Simulation] Fallback triggered for ${contact}. Use code 123456`);
                return res.json({ 
                    success: true, 
                    isSimulated: true, 
                    message: 'SMS provider not configured in Supabase. Simulating OTP code: 123456' 
                });
            }
            throw authErr;
        }
    } catch (err) {
        console.error('Error sending OTP:', err);
        res.status(500).json({ error: err.message });
    }
});

// 0.c Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const contact = req.body.email || req.body.contact;
        const { token } = req.body;
        if (!contact || !token) {
            return res.status(400).json({ error: 'Contact detail and token are required' });
        }
        
        const isEmail = contact.includes('@');
        // Bypass verification for simulated SMS OTP
        if (!isEmail && token === '123456') {
            console.log(`[SMS Simulation] Successfully verified simulated OTP for ${contact}`);
            return res.json({ 
                success: true, 
                isSimulated: true,
                user: { email: null, phone: contact },
                session: null
            });
        }

        const data = await verifyOtp(contact, token);
        res.json({ success: true, user: data.user, session: data.session });
    } catch (err) {
        console.error('Error verifying OTP:', err);
        res.status(400).json({ error: err.message });
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
