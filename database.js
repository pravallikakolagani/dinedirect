import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'dinedirect.db');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.warn('Could not initialize Supabase client:', e.message);
    }
}

let sqliteDb = null;
let useSupabase = false;

// 1. Initialize Dual-Engine Database
export async function initDatabase() {
    // Probe Supabase with a 2.5-second timeout
    if (supabase) {
        try {
            const probePromise = supabase.from('restaurants').select('id').limit(1);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Supabase probe timeout (2500ms)')), 2500)
            );
            const { error } = await Promise.race([probePromise, timeoutPromise]);
            if (!error) {
                useSupabase = true;
                console.log('✅ [DB] Successfully connected to Supabase PostgreSQL cloud database.');
                return;
            } else {
                console.warn('⚠️ [DB] Supabase probe returned error:', error.message);
            }
        } catch (err) {
            console.warn('⚠️ [DB] Supabase connection unreachable/paused:', err.message);
        }
    }

    // Fallback to SQLite
    useSupabase = false;
    console.log('🛡️ [DB] Activating local SQLite database fallback (dinedirect.db)...');

    sqliteDb = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });

    // Create SQLite tables if they do not exist
    await sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS restaurants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            ownerEmail TEXT NOT NULL UNIQUE,
            address TEXT NOT NULL,
            password TEXT NOT NULL,
            cuisines TEXT,
            rating TEXT,
            deliveryTime TEXT,
            deliveryFee TEXT,
            ambience TEXT,
            description TEXT,
            latitude REAL,
            longitude REAL
        );

        CREATE TABLE IF NOT EXISTS menu_items (
            id TEXT PRIMARY KEY,
            restaurantId TEXT NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            desc TEXT,
            category TEXT,
            type TEXT,
            img TEXT,
            FOREIGN KEY(restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tables (
            restaurantId TEXT NOT NULL,
            num TEXT NOT NULL,
            status TEXT NOT NULL,
            isReservable INTEGER DEFAULT 1,
            PRIMARY KEY(restaurantId, num),
            FOREIGN KEY(restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            restaurantId TEXT NOT NULL,
            tableNum TEXT NOT NULL,
            customerName TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT NOT NULL,
            paymentMethod TEXT NOT NULL,
            paymentStatus TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            groupOrderId TEXT,
            deliveryFee REAL DEFAULT 0,
            FOREIGN KEY(restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS order_items (
            orderId TEXT NOT NULL,
            itemId TEXT NOT NULL,
            name TEXT NOT NULL,
            qty INTEGER NOT NULL,
            price REAL NOT NULL,
            PRIMARY KEY(orderId, itemId),
            FOREIGN KEY(orderId) REFERENCES orders(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS support_alerts (
            id TEXT PRIMARY KEY,
            restaurantId TEXT NOT NULL,
            tableNum TEXT NOT NULL,
            customerName TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            timestamp INTEGER NOT NULL,
            FOREIGN KEY(restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            restaurantId TEXT NOT NULL,
            tableNum TEXT NOT NULL,
            customerName TEXT NOT NULL,
            sender TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            FOREIGN KEY(restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            restaurantId TEXT NOT NULL,
            orderId TEXT,
            customerName TEXT NOT NULL,
            rating INTEGER NOT NULL,
            tags TEXT,
            comment TEXT,
            timestamp INTEGER NOT NULL,
            FOREIGN KEY(restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
        );
    `);

    // Ensure columns exist (for backward compatibility with older sqlite files)
    try { await sqliteDb.exec(`ALTER TABLE tables ADD COLUMN isReservable INTEGER DEFAULT 1`); } catch (e) {}
    try { await sqliteDb.exec(`ALTER TABLE restaurants ADD COLUMN ambience TEXT`); } catch (e) {}
    try { await sqliteDb.exec(`ALTER TABLE restaurants ADD COLUMN description TEXT`); } catch (e) {}
    try { await sqliteDb.exec(`ALTER TABLE restaurants ADD COLUMN latitude REAL`); } catch (e) {}
    try { await sqliteDb.exec(`ALTER TABLE restaurants ADD COLUMN longitude REAL`); } catch (e) {}
    try { await sqliteDb.exec(`ALTER TABLE orders ADD COLUMN groupOrderId TEXT`); } catch (e) {}
    try { await sqliteDb.exec(`ALTER TABLE orders ADD COLUMN deliveryFee REAL DEFAULT 0`); } catch (e) {}

    // Check if seed data is needed
    const restCount = await sqliteDb.get('SELECT COUNT(*) as count FROM restaurants');
    if (restCount.count === 0) {
        console.log('🌱 [DB] Populating default restaurants and menus into SQLite...');
        
        // 1. Paradise Biryani
        await sqliteDb.run(`
            INSERT INTO restaurants (id, name, ownerEmail, address, password, cuisines, rating, deliveryTime, deliveryFee, ambience, description, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'r1', 'Paradise Biryani', 'owner@paradise.com', 'Secunderabad, Hyderabad', 'password123',
            'Biryani, Mughlai, North Indian', '4.6', '30-40 min', 'Free Delivery',
            JSON.stringify(['images/dining_hall.png', 'images/kitchen.png', 'images/patio.png']),
            'Iconic Hyderabad dining known for royal dum biryanis, aromatic curries, and family heritage since 1953.',
            17.4411, 78.4983
        ]);

        const menu1 = [
            { id: 'm1', name: 'Special Chicken Biryani', price: 350, desc: 'Aromatic basmati rice cooked with succulent marinated chicken and saffron spices.', category: 'Biryani', type: 'non-veg', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=60' },
            { id: 'm2', name: 'Mutton Haleem', price: 280, desc: 'Rich, slow-cooked shredded mutton, lentils, and cracked wheat stew garnished with fried onions.', category: 'Biryani', type: 'non-veg', img: 'https://images.unsplash.com/photo-1552590635-27c2c21287f5?auto=format&fit=crop&w=400&q=60' },
            { id: 'm3', name: 'Paneer Butter Masala', price: 240, desc: 'Tender cottage cheese cubes simmered in creamy tomato and butter gravy.', category: 'Dabbas', type: 'veg', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=60' },
            { id: 'm4', name: 'Garlic Butter Naan', price: 60, desc: 'Tandoor-baked flatbread infused with roasted garlic flakes and butter.', category: 'Dabbas', type: 'veg', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=400&q=60' },
            { id: 'm5', name: 'Diet Coke (Can)', price: 60, desc: 'Chilled 330ml crisp zero-calorie carbonated refreshment.', category: 'Fast Food', type: 'veg', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=60' }
        ];
        for (const item of menu1) {
            await sqliteDb.run(`
                INSERT INTO menu_items (id, restaurantId, name, price, desc, category, type, img)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [item.id, 'r1', item.name, item.price, item.desc, item.category, item.type, item.img]);
        }

        for (let num = 1; num <= 6; num++) {
            await sqliteDb.run(`
                INSERT INTO tables (restaurantId, num, status, isReservable)
                VALUES (?, ?, ?, 1)
            `, ['r1', String(num), 'available']);
        }

        // 2. Third Wave Coffee
        await sqliteDb.run(`
            INSERT INTO restaurants (id, name, ownerEmail, address, password, cuisines, rating, deliveryTime, deliveryFee, ambience, description, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'r2', 'Third Wave Coffee', 'coffee@thirdwave.com', 'Jubilee Hills, Hyderabad', 'password123',
            'Cafes, Specialty Brews, Desserts', '4.8', '15-25 min', 'Free Delivery',
            JSON.stringify(['images/dining_hall.png', 'images/patio.png']),
            'Artisanal coffee roastery providing single-origin espresso, freshly baked sourdough pastries, and a peaceful ambiance.',
            17.4319, 78.4073
        ]);

        const menu2 = [
            { id: 'tw1', name: 'Artisanal Cappuccino', price: 190, desc: 'Double espresso pulled over silky textured milk micro-foam.', category: 'Cafes', type: 'veg', img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=60' },
            { id: 'tw2', name: 'Almond Butter Croissant', price: 160, desc: 'Golden flaky French pastry filled with rich almond cream and toasted slices.', category: 'Cafes', type: 'veg', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=60' },
            { id: 'tw3', name: 'Iced Sea Salt Mocha', price: 230, desc: 'Dark espresso blended with Belgian dark chocolate and sea salt caramel over ice.', category: 'Cafes', type: 'veg', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=60' }
        ];
        for (const item of menu2) {
            await sqliteDb.run(`
                INSERT INTO menu_items (id, restaurantId, name, price, desc, category, type, img)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [item.id, 'r2', item.name, item.price, item.desc, item.category, item.type, item.img]);
        }

        for (let num = 1; num <= 4; num++) {
            await sqliteDb.run(`
                INSERT INTO tables (restaurantId, num, status, isReservable)
                VALUES (?, ?, ?, 1)
            `, ['r2', String(num), 'available']);
        }

        // Add initial sample reviews
        await sqliteDb.run(`
            INSERT INTO reviews (id, restaurantId, orderId, customerName, rating, tags, comment, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, ['rev_1', 'r1', 'o_1001', 'Ananya Sharma', 5, JSON.stringify(['Delicious Food', 'Fast Service']), 'The Special Chicken Biryani was extraordinary! Hot, fragrant and tender.', Date.now() - 3600000 * 2]);
        
        await sqliteDb.run(`
            INSERT INTO reviews (id, restaurantId, orderId, customerName, rating, tags, comment, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, ['rev_2', 'r1', 'o_1002', 'Vikram Rao', 4, JSON.stringify(['Hot & Fresh', 'Great Ambience']), 'Loved the seamless table QR ordering. Naan and Paneer Butter Masala were great.', Date.now() - 3600000 * 5]);
    }

    console.log('✅ [DB] Local SQLite database ready and seeded.');
}

// 2. Get State
export async function getState() {
    if (useSupabase) {
        try {
            const [
                { data: restaurants },
                { data: menuItems },
                { data: tables },
                { data: orders },
                { data: orderItems },
                { data: supportAlerts },
                { data: chatMessages },
                { data: reviews }
            ] = await Promise.all([
                supabase.from('restaurants').select('*'),
                supabase.from('menu_items').select('*'),
                supabase.from('tables').select('*'),
                supabase.from('orders').select('*'),
                supabase.from('order_items').select('*'),
                supabase.from('support_alerts').select('*'),
                supabase.from('chat_messages').select('*').order('timestamp', { ascending: true }),
                supabase.from('reviews').select('*').order('timestamp', { ascending: false })
            ]);

            const formattedRestaurants = (restaurants || []).map(r => ({
                ...r,
                menu: (menuItems || []).filter(m => m.restaurantId === r.id),
                tables: (tables || []).filter(t => t.restaurantId === r.id).map(t => ({
                    num: t.num,
                    status: t.status,
                    isReservable: t.isReservable !== 0 ? 1 : 0
                }))
            }));

            const formattedOrders = (orders || []).map(o => ({
                ...o,
                items: (orderItems || []).filter(oi => oi.orderId === o.id).map(oi => ({
                    id: oi.itemId,
                    name: oi.name,
                    qty: oi.qty,
                    price: oi.price
                }))
            }));

            return {
                restaurants: formattedRestaurants,
                orders: formattedOrders,
                supportAlerts: supportAlerts || [],
                chatMessages: chatMessages || [],
                reviews: reviews || []
            };
        } catch (err) {
            console.warn('Supabase getState failed, falling back to SQLite for this call:', err.message);
        }
    }

    // SQLite Retrieval
    if (!sqliteDb) await initDatabase();

    const restaurants = await sqliteDb.all('SELECT * FROM restaurants');
    const menuItems = await sqliteDb.all('SELECT * FROM menu_items');
    const tables = await sqliteDb.all('SELECT * FROM tables');
    const orders = await sqliteDb.all('SELECT * FROM orders ORDER BY timestamp DESC');
    const orderItems = await sqliteDb.all('SELECT * FROM order_items');
    const supportAlerts = await sqliteDb.all('SELECT * FROM support_alerts ORDER BY timestamp DESC');
    const chatMessages = await sqliteDb.all('SELECT * FROM chat_messages ORDER BY timestamp ASC');
    const reviews = await sqliteDb.all('SELECT * FROM reviews ORDER BY timestamp DESC');

    const formattedRestaurants = restaurants.map(r => ({
        ...r,
        ambience: typeof r.ambience === 'string' && r.ambience.startsWith('[') ? JSON.parse(r.ambience) : r.ambience,
        menu: menuItems.filter(m => m.restaurantId === r.id),
        tables: tables.filter(t => t.restaurantId === r.id).map(t => ({
            num: t.num,
            status: t.status,
            isReservable: t.isReservable !== 0 ? 1 : 0
        }))
    }));

    const formattedOrders = orders.map(o => ({
        ...o,
        items: orderItems.filter(oi => oi.orderId === o.id).map(oi => ({
            id: oi.itemId,
            name: oi.name,
            qty: oi.qty,
            price: oi.price
        }))
    }));

    return {
        restaurants: formattedRestaurants,
        orders: formattedOrders,
        supportAlerts: supportAlerts || [],
        chatMessages: chatMessages || [],
        reviews: (reviews || []).map(rev => ({
            ...rev,
            tags: typeof rev.tags === 'string' && rev.tags.startsWith('[') ? JSON.parse(rev.tags) : []
        }))
    };
}

// 3. Register Restaurant
export async function registerRestaurant(email, name, address, password) {
    const id = 'r_' + Date.now();
    const lat = 17.43 + (Math.random() - 0.5) * 0.05;
    const lng = 78.45 + (Math.random() - 0.5) * 0.05;

    if (useSupabase) {
        try {
            await supabase.from('restaurants').insert({
                id,
                name,
                ownerEmail: email,
                address,
                password,
                cuisines: 'Continental, Fast Food',
                rating: '4.0',
                deliveryTime: '20-30 min',
                deliveryFee: 'Free Delivery',
                latitude: lat,
                longitude: lng
            });

            await supabase.from('menu_items').insert({
                id: 'm_' + Date.now() + '_1',
                restaurantId: id,
                name: 'Starter Special',
                price: 150,
                desc: 'Chef recommended starter.',
                category: 'Fast Food',
                type: 'veg',
                img: ''
            });

            await supabase.from('tables').insert([
                { restaurantId: id, num: '1', status: 'available', isReservable: 1 },
                { restaurantId: id, num: '2', status: 'available', isReservable: 1 }
            ]);

            const { data: rest } = await supabase.from('restaurants').select('*').eq('id', id).single();
            const { data: menu } = await supabase.from('menu_items').select('*').eq('restaurantId', id);
            const { data: tbs } = await supabase.from('tables').select('*').eq('restaurantId', id);

            return {
                ...rest,
                menu: menu || [],
                tables: (tbs || []).map(t => ({ num: t.num, status: t.status }))
            };
        } catch (e) {
            console.warn('Supabase registerRestaurant failed, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run(`
        INSERT INTO restaurants (id, name, ownerEmail, address, password, cuisines, rating, deliveryTime, deliveryFee, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, email, address, password, 'Continental, Fast Food', '4.0', '20-30 min', 'Free Delivery', lat, lng]);

    await sqliteDb.run(`
        INSERT INTO menu_items (id, restaurantId, name, price, desc, category, type, img)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['m_' + Date.now() + '_1', id, 'Starter Special', 150, 'Chef recommended starter.', 'Fast Food', 'veg', '']);

    await sqliteDb.run(`INSERT INTO tables (restaurantId, num, status, isReservable) VALUES (?, '1', 'available', 1)`, [id]);
    await sqliteDb.run(`INSERT INTO tables (restaurantId, num, status, isReservable) VALUES (?, '2', 'available', 1)`, [id]);

    const rest = await sqliteDb.get('SELECT * FROM restaurants WHERE id = ?', [id]);
    const menu = await sqliteDb.all('SELECT * FROM menu_items WHERE restaurantId = ?', [id]);
    const tbs = await sqliteDb.all('SELECT * FROM tables WHERE restaurantId = ?', [id]);

    return {
        ...rest,
        menu,
        tables: tbs.map(t => ({ num: t.num, status: t.status }))
    };
}

// 4. Menu Items API
export async function addMenuItem(restaurantId, item) {
    const id = 'm_' + Date.now();
    const price = parseFloat(item.price) || 0;
    const newItem = {
        id,
        restaurantId,
        name: item.name || 'Unnamed Item',
        price,
        desc: item.desc || '',
        category: item.category || 'All',
        type: item.type || 'veg',
        img: item.img || ''
    };

    if (useSupabase) {
        try {
            await supabase.from('menu_items').insert(newItem);
            return newItem;
        } catch (e) {
            console.warn('Supabase addMenuItem error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run(`
        INSERT INTO menu_items (id, restaurantId, name, price, desc, category, type, img)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [newItem.id, newItem.restaurantId, newItem.name, newItem.price, newItem.desc, newItem.category, newItem.type, newItem.img]);
    return newItem;
}

export async function deleteMenuItem(restaurantId, itemId) {
    if (useSupabase) {
        try {
            const { error } = await supabase.from('menu_items').delete().eq('restaurantId', restaurantId).eq('id', itemId);
            return !error;
        } catch (e) {
            console.warn('Supabase deleteMenuItem error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    const res = await sqliteDb.run('DELETE FROM menu_items WHERE restaurantId = ? AND id = ?', [restaurantId, itemId]);
    return res.changes > 0;
}

// 5. Tables API
export async function addTable(restaurantId, tableNum) {
    const tableStr = String(tableNum);

    if (useSupabase) {
        try {
            const { data: exists } = await supabase.from('tables').select('num').eq('restaurantId', restaurantId).eq('num', tableStr).maybeSingle();
            if (exists) return false;
            await supabase.from('tables').insert({ restaurantId, num: tableStr, status: 'available', isReservable: 1 });
            return true;
        } catch (e) {
            console.warn('Supabase addTable error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    const exists = await sqliteDb.get('SELECT 1 FROM tables WHERE restaurantId = ? AND num = ?', [restaurantId, tableStr]);
    if (exists) return false;

    await sqliteDb.run(`
        INSERT INTO tables (restaurantId, num, status, isReservable)
        VALUES (?, ?, 'available', 1)
    `, [restaurantId, tableStr]);
    return true;
}

export async function updateTableStatus(restaurantId, tableNum, status) {
    if (useSupabase) {
        try {
            await supabase.from('tables').update({ status }).eq('restaurantId', restaurantId).eq('num', String(tableNum));
            return;
        } catch (e) {
            console.warn('Supabase updateTableStatus error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run('UPDATE tables SET status = ? WHERE restaurantId = ? AND num = ?', [status, restaurantId, String(tableNum)]);
}

export async function updateTableReservationStatus(restaurantId, tableNum, isReservable) {
    if (useSupabase) {
        try {
            await supabase.from('tables').update({ isReservable: isReservable ? 1 : 0 }).eq('restaurantId', restaurantId).eq('num', String(tableNum));
            return;
        } catch (e) {
            console.warn('Supabase updateTableReservationStatus error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run('UPDATE tables SET isReservable = ? WHERE restaurantId = ? AND num = ?', [isReservable ? 1 : 0, restaurantId, String(tableNum)]);
}

// 6. Orders API
export async function placeOrder(restaurantId, tableNum, items, paymentMethod, customerName, groupOrderId = null, deliveryFee = 0) {
    const state = await getState();
    const orders = state.orders;
    const uniqueSuffix = Date.now().toString(36).slice(-4) + Math.floor(Math.random() * 1000);
    const id = 'o_' + (1000 + orders.length + 1) + '_' + uniqueSuffix;

    const isGoogleRest = restaurantId && restaurantId.startsWith('g_');
    let menu = [];

    if (!isGoogleRest) {
        const rest = state.restaurants.find(r => r.id === restaurantId);
        menu = rest ? rest.menu : [];
    } else {
        menu = [
            { id: `${restaurantId}_m1`, name: 'Special Mutton Biryani', price: 380 },
            { id: `${restaurantId}_m2`, name: 'Butter Chicken Masala', price: 290 },
            { id: `${restaurantId}_m3`, name: 'Paneer Butter Masala', price: 260 },
            { id: `${restaurantId}_m4`, name: 'Rumali Roti', price: 40 },
            { id: `${restaurantId}_m5`, name: 'Double Ka Meetha', price: 120 }
        ];
    }

    let total = 0;
    let orderItems = [];

    if (Array.isArray(items)) {
        orderItems = items.map(item => {
            const itemId = item.id || item.itemId;
            const menuItem = (menu || []).find(m => m.id === itemId);
            const qty = Number(item.quantity || item.qty) || 1;
            const price = Number(item.price !== undefined ? item.price : (menuItem ? menuItem.price : 0)) || 0;
            total += price * qty;
            return {
                itemId,
                name: item.name || (menuItem ? menuItem.name : 'Unknown Item'),
                qty,
                price
            };
        });
    } else if (items && typeof items === 'object') {
        orderItems = Object.keys(items).map(itemId => {
            const menuItem = (menu || []).find(m => m.id === itemId);
            const qty = Number(items[itemId]) || 1;
            const price = menuItem ? Number(menuItem.price) || 0 : 0;
            total += price * qty;
            return {
                itemId,
                name: menuItem ? menuItem.name : 'Unknown Item',
                qty,
                price
            };
        });
    }

    total = isNaN(total) ? 0 : Math.round(total);

    const paymentStatus = (paymentMethod === 'pay_now' || paymentMethod === 'card' || paymentMethod === 'upi') ? 'paid' : 'pending';
    const timestamp = Date.now();
    const cleanFee = Number(deliveryFee) || 0;

    if (useSupabase) {
        try {
            await supabase.from('orders').insert({
                id,
                restaurantId,
                tableNum: tableNum ? String(tableNum) : 'Online',
                customerName: customerName || 'Guest',
                total,
                status: 'new',
                paymentMethod,
                paymentStatus,
                timestamp,
                groupOrderId: groupOrderId || null,
                deliveryFee: cleanFee
            });

            await supabase.from('order_items').insert(orderItems.map(oi => ({
                orderId: id,
                itemId: oi.itemId,
                name: oi.name,
                qty: oi.qty,
                price: oi.price
            })));

            if (tableNum && !isGoogleRest) {
                await updateTableStatus(restaurantId, tableNum, 'occupied');
            }

            return {
                id,
                restaurantId,
                tableNum: tableNum ? String(tableNum) : 'Online',
                customerName: customerName || 'Guest',
                items: orderItems,
                total,
                status: 'new',
                paymentMethod,
                paymentStatus,
                timestamp,
                groupOrderId: groupOrderId || null,
                deliveryFee: cleanFee
            };
        } catch (e) {
            console.warn('Supabase placeOrder error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run(`
        INSERT INTO orders (id, restaurantId, tableNum, customerName, total, status, paymentMethod, paymentStatus, timestamp, groupOrderId, deliveryFee)
        VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?)
    `, [id, restaurantId, tableNum ? String(tableNum) : 'Online', customerName || 'Guest', total, paymentMethod, paymentStatus, timestamp, groupOrderId || null, cleanFee]);

    for (const oi of orderItems) {
        await sqliteDb.run(`
            INSERT INTO order_items (orderId, itemId, name, qty, price)
            VALUES (?, ?, ?, ?, ?)
        `, [id, oi.itemId, oi.name, oi.qty, oi.price]);
    }

    if (tableNum && !isGoogleRest) {
        await updateTableStatus(restaurantId, tableNum, 'occupied');
    }

    return {
        id,
        restaurantId,
        tableNum: tableNum ? String(tableNum) : 'Online',
        customerName: customerName || 'Guest',
        items: orderItems,
        total,
        status: 'new',
        paymentMethod,
        paymentStatus,
        timestamp,
        groupOrderId: groupOrderId || null,
        deliveryFee: cleanFee
    };
}

export async function placeGroupOrder({ customerName, tableNum, paymentMethod, deliveryFee = 0, restaurantsPayload }) {
    const groupOrderId = 'grp_' + Date.now().toString(36) + '_' + Math.floor(100 + Math.random() * 900);
    const createdOrders = [];
    const cleanFee = Number(deliveryFee) || 0;

    for (let i = 0; i < (restaurantsPayload || []).length; i++) {
        const payload = restaurantsPayload[i];
        // Assign the deliveryFee to the primary order in the group
        const orderFee = i === 0 ? cleanFee : 0;
        const childOrder = await placeOrder(
            payload.restaurantId,
            tableNum,
            payload.items,
            paymentMethod,
            customerName,
            groupOrderId,
            orderFee
        );
        if (childOrder) {
            createdOrders.push(childOrder);
        }
    }

    return {
        success: true,
        groupOrderId,
        deliveryFee: cleanFee,
        orders: createdOrders,
        childOrders: createdOrders
    };
}

export async function updateOrderStatus(orderId, status) {
    if (useSupabase) {
        try {
            const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
            if (!order) return null;
            await supabase.from('orders').update({ status }).eq('id', orderId);

            if (status === 'served' || status === 'delivered') {
                if (order.tableNum && order.tableNum !== 'Online') {
                    const { data: activeOrders } = await supabase
                        .from('orders')
                        .select('id')
                        .eq('restaurantId', order.restaurantId)
                        .eq('tableNum', order.tableNum)
                        .neq('id', orderId)
                        .not('status', 'in', '("served","delivered")')
                        .limit(1);

                    if (!activeOrders || activeOrders.length === 0) {
                        await updateTableStatus(order.restaurantId, order.tableNum, 'available');
                    }
                }
            }
            const { data: updatedOrder } = await supabase.from('orders').select('*').eq('id', orderId).single();
            return updatedOrder;
        } catch (e) {
            console.warn('Supabase updateOrderStatus error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    const order = await sqliteDb.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return null;

    await sqliteDb.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

    if (status === 'served' || status === 'delivered') {
        if (order.tableNum && order.tableNum !== 'Online') {
            const hasActive = await sqliteDb.get(`
                SELECT 1 FROM orders
                WHERE restaurantId = ? AND tableNum = ? AND id != ? AND status != 'served' AND status != 'delivered'
                LIMIT 1
            `, [order.restaurantId, order.tableNum, orderId]);

            if (!hasActive) {
                await updateTableStatus(order.restaurantId, order.tableNum, 'available');
            }
        }
    }

    return await sqliteDb.get('SELECT * FROM orders WHERE id = ?', [orderId]);
}

export async function updateOrderPaymentStatus(orderId, paymentStatus) {
    if (useSupabase) {
        try {
            await supabase.from('orders').update({ paymentStatus }).eq('id', orderId);
            const { data: updatedOrder } = await supabase.from('orders').select('*').eq('id', orderId).single();
            return updatedOrder;
        } catch (e) {
            console.warn('Supabase updateOrderPaymentStatus error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run('UPDATE orders SET paymentStatus = ? WHERE id = ?', [paymentStatus, orderId]);
    return await sqliteDb.get('SELECT * FROM orders WHERE id = ?', [orderId]);
}

// 7. Support Alerts & Chat
export async function createSupportAlert(restaurantId, tableNum, customerName, message) {
    const id = 'sa_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const timestamp = Date.now();

    if (useSupabase) {
        try {
            await supabase.from('support_alerts').insert({
                id,
                restaurantId,
                tableNum: String(tableNum),
                customerName: customerName || 'Guest',
                message,
                status: 'active',
                timestamp
            });
            return { id, restaurantId, tableNum: String(tableNum), customerName: customerName || 'Guest', message, status: 'active', timestamp };
        } catch (e) {
            console.warn('Supabase createSupportAlert error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run(`
        INSERT INTO support_alerts (id, restaurantId, tableNum, customerName, message, status, timestamp)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
    `, [id, restaurantId, String(tableNum), customerName || 'Guest', message, timestamp]);
    return { id, restaurantId, tableNum: String(tableNum), customerName: customerName || 'Guest', message, status: 'active', timestamp };
}

export async function resolveSupportAlert(alertId) {
    if (useSupabase) {
        try {
            const { error } = await supabase.from('support_alerts').update({ status: 'resolved' }).eq('id', alertId);
            return !error;
        } catch (e) {
            console.warn('Supabase resolveSupportAlert error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    const res = await sqliteDb.run('UPDATE support_alerts SET status = "resolved" WHERE id = ?', [alertId]);
    return res.changes > 0;
}

export async function sendChatMessage(restaurantId, tableNum, customerName, sender, message) {
    const id = 'cm_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const timestamp = Date.now();

    if (useSupabase) {
        try {
            await supabase.from('chat_messages').insert({
                id,
                restaurantId,
                tableNum: String(tableNum),
                customerName: customerName || 'Guest',
                sender,
                message,
                timestamp
            });
            return { id, restaurantId, tableNum: String(tableNum), customerName: customerName || 'Guest', sender, message, timestamp };
        } catch (e) {
            console.warn('Supabase sendChatMessage error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run(`
        INSERT INTO chat_messages (id, restaurantId, tableNum, customerName, sender, message, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, restaurantId, String(tableNum), customerName || 'Guest', sender, message, timestamp]);
    return { id, restaurantId, tableNum: String(tableNum), customerName: customerName || 'Guest', sender, message, timestamp };
}

// 8. Restaurant Setup & Profiles
export async function updateRestaurantSetup(restaurantId, details) {
    const { name, cuisines, address, description, ambience, rating, deliveryTime, deliveryFee } = details;
    const ambienceStr = typeof ambience === 'string' ? ambience : JSON.stringify(ambience || []);

    if (useSupabase) {
        try {
            await supabase.from('restaurants').update({
                name: name || '',
                cuisines: cuisines || '',
                address: address || '',
                description: description || '',
                ambience: ambienceStr,
                rating: rating || '4.0',
                deliveryTime: deliveryTime || '30-40 min',
                deliveryFee: deliveryFee || 'Free Delivery'
            }).eq('id', restaurantId);
            return;
        } catch (e) {
            console.warn('Supabase updateRestaurantSetup error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run(`
        UPDATE restaurants SET 
            name = COALESCE(?, name),
            cuisines = COALESCE(?, cuisines),
            address = COALESCE(?, address),
            description = COALESCE(?, description),
            ambience = COALESCE(?, ambience),
            rating = COALESCE(?, rating),
            deliveryTime = COALESCE(?, deliveryTime),
            deliveryFee = COALESCE(?, deliveryFee)
        WHERE id = ?
    `, [name, cuisines, address, description, ambienceStr, rating, deliveryTime, deliveryFee, restaurantId]);
}

export async function saveProfile(profile) {
    const { id, name, email, phone, address } = profile;

    if (useSupabase) {
        try {
            const { data, error } = await supabase.from('profiles').upsert({ id, name, email, phone, address });
            if (!error) return data;
        } catch (e) {
            console.warn('Supabase saveProfile error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run(`
        INSERT INTO profiles (id, name, email, phone, address)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            email = excluded.email,
            phone = excluded.phone,
            address = excluded.address
    `, [id, name, email, phone, address]);
    return profile;
}

export async function getProfile(id) {
    if (useSupabase) {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
            if (!error && data) return data;
        } catch (e) {
            console.warn('Supabase getProfile error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    return await sqliteDb.get('SELECT * FROM profiles WHERE id = ?', [id]);
}

// 9. Customer Reviews & Ratings System
export async function addReview(restaurantId, orderId, customerName, rating, tags, comment) {
    const id = 'rev_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const timestamp = Date.now();
    const tagsArr = Array.isArray(tags) ? tags : [];
    const tagsStr = JSON.stringify(tagsArr);
    const numRating = parseInt(rating, 10) || 5;

    const newReview = {
        id,
        restaurantId,
        orderId: orderId || null,
        customerName: customerName || 'Valued Guest',
        rating: numRating,
        tags: tagsArr,
        comment: comment || '',
        timestamp
    };

    if (useSupabase) {
        try {
            await supabase.from('reviews').insert({
                id,
                restaurantId,
                orderId: orderId || null,
                customerName: customerName || 'Valued Guest',
                rating: numRating,
                tags: tagsStr,
                comment: comment || '',
                timestamp
            });
            // Update restaurant average rating
            await updateAverageRestaurantRating(restaurantId);
            return newReview;
        } catch (e) {
            console.warn('Supabase addReview error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    await sqliteDb.run(`
        INSERT INTO reviews (id, restaurantId, orderId, customerName, rating, tags, comment, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, restaurantId, orderId || null, customerName || 'Valued Guest', numRating, tagsStr, comment || '', timestamp]);

    // Recalculate average rating for restaurant
    await updateAverageRestaurantRating(restaurantId);

    return newReview;
}

export async function getReviews(restaurantId) {
    if (useSupabase) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('restaurantId', restaurantId)
                .order('timestamp', { ascending: false });
            if (!error && data) {
                return data.map(r => ({
                    ...r,
                    tags: typeof r.tags === 'string' && r.tags.startsWith('[') ? JSON.parse(r.tags) : []
                }));
            }
        } catch (e) {
            console.warn('Supabase getReviews error, falling back to SQLite', e);
        }
    }

    if (!sqliteDb) await initDatabase();
    const list = await sqliteDb.all('SELECT * FROM reviews WHERE restaurantId = ? ORDER BY timestamp DESC', [restaurantId]);
    return list.map(r => ({
        ...r,
        tags: typeof r.tags === 'string' && r.tags.startsWith('[') ? JSON.parse(r.tags) : []
    }));
}

async function updateAverageRestaurantRating(restaurantId) {
    try {
        if (!sqliteDb) await initDatabase();
        const row = await sqliteDb.get('SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE restaurantId = ?', [restaurantId]);
        if (row && row.count > 0) {
            const rounded = (Math.round(row.avgRating * 10) / 10).toFixed(1);
            await sqliteDb.run('UPDATE restaurants SET rating = ? WHERE id = ?', [rounded, restaurantId]);
            if (useSupabase && supabase) {
                await supabase.from('restaurants').update({ rating: rounded }).eq('id', restaurantId);
            }
        }
    } catch (e) {
        console.error('Error updating average restaurant rating:', e);
    }
}
