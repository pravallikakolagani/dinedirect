import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'dinedirect.db');
 
let db;
 
export async function initDatabase() {
    db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });
 
    // Create tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS restaurants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            ownerEmail TEXT NOT NULL UNIQUE,
            address TEXT NOT NULL,
            password TEXT NOT NULL,
            cuisines TEXT,
            rating TEXT,
            deliveryTime TEXT,
            deliveryFee TEXT
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
    `);
 
    // Prepopulate database if empty
    const restCount = await db.get('SELECT COUNT(*) as count FROM restaurants');
    if (restCount.count === 0) {
        console.log('Database empty. Prepopulating default restaurant data...');
        
        // 1. Paradise Biryani
        await db.run(`
            INSERT INTO restaurants (id, name, ownerEmail, address, password, cuisines, rating, deliveryTime, deliveryFee)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, ['r1', 'Paradise Biryani', 'owner@paradise.com', 'Secunderabad', 'password123', 'Biryani, Mughlai', '4.5', '30-40 min', 'Free Delivery']);
 
        const menu1 = [
            { id: 'm1', name: 'Special Chicken Biryani', price: 350, desc: 'Aromatic basmati rice cooked with succulent chicken pieces.', category: 'Biryani', type: 'non-veg', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
            { id: 'm2', name: 'Mutton Haleem', price: 250, desc: 'Rich, slow-cooked meat and wheat stew.', category: 'Biryani', type: 'non-veg', img: 'https://images.unsplash.com/photo-1552590635-27c2c21287f5?auto=format&fit=crop&w=200&q=60' },
            { id: 'm3', name: 'Paneer Tikka', price: 220, desc: 'Soft paneer cubes marinated in spices and grilled.', category: 'Dabbas', type: 'veg', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
            { id: 'm4', name: 'Diet Coke', price: 60, desc: 'Zero calorie cola refreshment.', category: 'Fast Food', type: 'veg', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=60' }
        ];
        for (const item of menu1) {
            await db.run(`
                INSERT INTO menu_items (id, restaurantId, name, price, desc, category, type, img)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [item.id, 'r1', item.name, item.price, item.desc, item.category, item.type, item.img]);
        }
 
        const tables1 = ['1', '2', '3', '4'];
        for (const num of tables1) {
            await db.run(`
                INSERT INTO tables (restaurantId, num, status)
                VALUES (?, ?, ?)
            `, ['r1', num, 'available']);
        }
 
        // 2. Third Wave Coffee
        await db.run(`
            INSERT INTO restaurants (id, name, ownerEmail, address, password, cuisines, rating, deliveryTime, deliveryFee)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, ['r2', 'Third Wave Coffee', 'coffee@thirdwave.com', 'Jubilee Hills', 'password123', 'Cafe, Desserts', '4.8', '15-20 min', 'Free Delivery']);
 
        const menu2 = [
            { id: 'tw1', name: 'Cappuccino', price: 180, desc: 'Rich espresso with smooth textured milk micro-foam.', category: 'Cafes', type: 'veg', img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
            { id: 'tw2', name: 'Butter Croissant', price: 150, desc: 'Flaky, buttery French pastry baked daily.', category: 'Cafes', type: 'veg', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' }
        ];
        for (const item of menu2) {
            await db.run(`
                INSERT INTO menu_items (id, restaurantId, name, price, desc, category, type, img)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [item.id, 'r2', item.name, item.price, item.desc, item.category, item.type, item.img]);
        }
 
        const tables2 = ['1', '2'];
        for (const num of tables2) {
            await db.run(`
                INSERT INTO tables (restaurantId, num, status)
                VALUES (?, ?, ?)
            `, ['r2', num, 'available']);
        }
    }
}
 
export async function getState() {
    const restaurants = await db.all('SELECT * FROM restaurants');
    const menuItems = await db.all('SELECT * FROM menu_items');
    const tables = await db.all('SELECT * FROM tables');
    const orders = await db.all('SELECT * FROM orders');
    const orderItems = await db.all('SELECT * FROM order_items');
    
    let supportAlerts = [];
    try {
        supportAlerts = await db.all('SELECT * FROM support_alerts');
    } catch (err) {
        console.error('Error reading support_alerts from DB:', err);
    }
 
    let chatMessages = [];
    try {
        chatMessages = await db.all('SELECT * FROM chat_messages ORDER BY timestamp ASC');
    } catch (err) {
        console.error('Error reading chat_messages from DB:', err);
    }
 
    // Nest menus and tables inside restaurants
    const formattedRestaurants = restaurants.map(r => {
        return {
            ...r,
            menu: menuItems.filter(m => m.restaurantId === r.id),
            tables: tables.filter(t => t.restaurantId === r.id).map(t => ({ num: t.num, status: t.status }))
        };
    });
 
    // Nest items inside orders
    const formattedOrders = orders.map(o => {
        return {
            ...o,
            items: orderItems.filter(oi => oi.orderId === o.id).map(oi => ({ id: oi.itemId, name: oi.name, qty: oi.qty, price: oi.price }))
        };
    });
 
    return {
        restaurants: formattedRestaurants,
        orders: formattedOrders,
        supportAlerts,
        chatMessages
    };
}
 
export async function registerRestaurant(email, name, address, password) {
    const id = 'r_' + Date.now();
    await db.run(`
        INSERT INTO restaurants (id, name, ownerEmail, address, password, cuisines, rating, deliveryTime, deliveryFee)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, email, address, password, 'Continental, Fast Food', '4.0', '20-30 min', 'Free Delivery']);
 
    // Default starter item
    await db.run(`
        INSERT INTO menu_items (id, restaurantId, name, price, desc, category, type, img)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['m_' + Date.now() + '_1', id, 'Starter Special', 150, 'Chef recommended starter.', 'Fast Food', 'veg', '']);
 
    // Default tables
    await db.run(`INSERT INTO tables (restaurantId, num, status) VALUES (?, ?, ?)`, [id, '1', 'available']);
    await db.run(`INSERT INTO tables (restaurantId, num, status) VALUES (?, ?, ?)`, [id, '2', 'available']);
 
    // Return the full restaurant object
    const rest = await db.get('SELECT * FROM restaurants WHERE id = ?', [id]);
    const menu = await db.all('SELECT * FROM menu_items WHERE restaurantId = ?', [id]);
    const tbs = await db.all('SELECT * FROM tables WHERE restaurantId = ?', [id]);
 
    return {
        ...rest,
        menu,
        tables: tbs.map(t => ({ num: t.num, status: t.status }))
    };
}
 
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
 
    await db.run(`
        INSERT INTO menu_items (id, restaurantId, name, price, desc, category, type, img)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [newItem.id, newItem.restaurantId, newItem.name, newItem.price, newItem.desc, newItem.category, newItem.type, newItem.img]);
 
    return newItem;
}
 
export async function deleteMenuItem(restaurantId, itemId) {
    const res = await db.run('DELETE FROM menu_items WHERE restaurantId = ? AND id = ?', [restaurantId, itemId]);
    return res.changes > 0;
}
 
export async function addTable(restaurantId, tableNum) {
    const tableStr = String(tableNum);
    
    // Check if table exists
    const exists = await db.get('SELECT 1 FROM tables WHERE restaurantId = ? AND num = ?', [restaurantId, tableStr]);
    if (exists) return false;
 
    await db.run(`
        INSERT INTO tables (restaurantId, num, status)
        VALUES (?, ?, ?)
    `, [restaurantId, tableStr, 'available']);
    return true;
}
 
export async function updateTableStatus(restaurantId, tableNum, status) {
    await db.run('UPDATE tables SET status = ? WHERE restaurantId = ? AND num = ?', [status, restaurantId, String(tableNum)]);
}
 
export async function placeOrder(restaurantId, tableNum, items, paymentMethod, customerName) {
    const state = await getState();
    const orders = state.orders;
    const id = 'o_' + (1000 + orders.length + 1);
 
    const rest = await db.get('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);
    if (!rest) throw new Error('Restaurant not found');
 
    const menu = await db.all('SELECT * FROM menu_items WHERE restaurantId = ?', [restaurantId]);
 
    let total = 0;
    const orderItems = Object.keys(items).map(itemId => {
        const menuItem = menu.find(m => m.id === itemId);
        const qty = items[itemId];
        const price = menuItem ? menuItem.price : 0;
        total += price * qty;
        return {
            itemId,
            name: menuItem ? menuItem.name : 'Unknown Item',
            qty,
            price
        };
    });
 
    const paymentStatus = paymentMethod === 'pay_now' ? 'paid' : 'pending';
    const timestamp = Date.now();
 
    // Insert order
    await db.run(`
        INSERT INTO orders (id, restaurantId, tableNum, customerName, total, status, paymentMethod, paymentStatus, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, restaurantId, tableNum ? String(tableNum) : 'Online', customerName || 'Guest', total, 'new', paymentMethod, paymentStatus, timestamp]);
 
    // Insert order items
    for (const item of orderItems) {
        await db.run(`
            INSERT INTO order_items (orderId, itemId, name, qty, price)
            VALUES (?, ?, ?, ?, ?)
        `, [id, item.itemId, item.name, item.qty, item.price]);
    }
 
    // Update table occupancy status
    if (tableNum) {
        await updateTableStatus(restaurantId, tableNum, 'occupied');
    }
 
    return {
        id,
        restaurantId,
        tableNum: tableNum ? String(tableNum) : 'Online',
        customerName: customerName || 'Guest',
        items: orderItems.map(oi => ({ id: oi.itemId, name: oi.name, qty: oi.qty, price: oi.price })),
        total,
        status: 'new',
        paymentMethod,
        paymentStatus,
        timestamp
    };
}
 
export async function updateOrderStatus(orderId, status) {
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return null;
 
    await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
 
    // If served/delivered, set table to available
    if (status === 'served' || status === 'delivered') {
        if (order.tableNum && order.tableNum !== 'Online') {
            const hasActive = await db.get(`
                SELECT 1 FROM orders 
                WHERE restaurantId = ? AND tableNum = ? AND id != ? AND status != 'served' AND status != 'delivered'
                LIMIT 1
            `, [order.restaurantId, order.tableNum, orderId]);
 
            if (!hasActive) {
                await updateTableStatus(order.restaurantId, order.tableNum, 'available');
            }
        }
    }
 
    return await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
}
 
export async function updateOrderPaymentStatus(orderId, paymentStatus) {
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return null;
 
    await db.run('UPDATE orders SET paymentStatus = ? WHERE id = ?', [paymentStatus, orderId]);
    return await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
}
 
export async function createSupportAlert(restaurantId, tableNum, customerName, message) {
    const id = 'sa_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const timestamp = Date.now();
    await db.run(`
        INSERT INTO support_alerts (id, restaurantId, tableNum, customerName, message, status, timestamp)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
    `, [id, restaurantId, String(tableNum), customerName || 'Guest', message, timestamp]);
    return { id, restaurantId, tableNum: String(tableNum), customerName: customerName || 'Guest', message, status: 'active', timestamp };
}
 
export async function resolveSupportAlert(alertId) {
    const res = await db.run('UPDATE support_alerts SET status = "resolved" WHERE id = ?', [alertId]);
    return res.changes > 0;
}
 
export async function sendChatMessage(restaurantId, tableNum, customerName, sender, message) {
    const id = 'cm_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const timestamp = Date.now();
    await db.run(`
        INSERT INTO chat_messages (id, restaurantId, tableNum, customerName, sender, message, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, restaurantId, String(tableNum), customerName || 'Guest', sender, message, timestamp]);
    return { id, restaurantId, tableNum: String(tableNum), customerName: customerName || 'Guest', sender, message, timestamp };
}
