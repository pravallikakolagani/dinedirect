import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('WARNING: Supabase URL and Key are not set. Please set SUPABASE_URL and SUPABASE_KEY in your .env file.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

export async function initDatabase() {
    try {
        const { count, error } = await supabase
            .from('restaurants')
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.error('Error checking Supabase restaurants:', error);
            return;
        }

        if (count === 0) {
            console.log('Supabase database empty. Prepopulating default restaurant data...');
            
            // Insert Paradise Biryani
            await supabase.from('restaurants').insert({
                id: 'r1',
                name: 'Paradise Biryani',
                ownerEmail: 'owner@paradise.com',
                address: 'Secunderabad',
                password: 'password123',
                cuisines: 'Biryani, Mughlai',
                rating: '4.5',
                deliveryTime: '30-40 min',
                deliveryFee: 'Free Delivery',
                latitude: 17.4399,
                longitude: 78.4983
            });

            // Insert default menu items for r1
            const menu1 = [
                { id: 'm1', restaurantId: 'r1', name: 'Special Chicken Biryani', price: 350, desc: 'Aromatic basmati rice cooked with succulent chicken pieces.', category: 'Biryani', type: 'non-veg', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
                { id: 'm2', restaurantId: 'r1', name: 'Mutton Haleem', price: 250, desc: 'Rich, slow-cooked meat and wheat stew.', category: 'Biryani', type: 'non-veg', img: 'https://images.unsplash.com/photo-1552590635-27c2c21287f5?auto=format&fit=crop&w=200&q=60' },
                { id: 'm3', restaurantId: 'r1', name: 'Paneer Tikka', price: 220, desc: 'Soft paneer cubes marinated in spices and grilled.', category: 'Dabbas', type: 'veg', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
                { id: 'm4', restaurantId: 'r1', name: 'Diet Coke', price: 60, desc: 'Zero calorie cola refreshment.', category: 'Fast Food', type: 'veg', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=60' }
            ];
            await supabase.from('menu_items').insert(menu1);

            // Insert default tables for r1 (Tables 1 to 10 matching floor plan config)
            const tables1 = [];
            for (let i = 1; i <= 10; i++) {
                tables1.push({ restaurantId: 'r1', num: String(i), status: 'available', isReservable: 1 });
            }
            await supabase.from('tables').insert(tables1);

            // Insert Third Wave Coffee
            await supabase.from('restaurants').insert({
                id: 'r2',
                name: 'Third Wave Coffee',
                ownerEmail: 'coffee@thirdwave.com',
                address: 'Jubilee Hills',
                password: 'password123',
                cuisines: 'Cafe, Desserts',
                rating: '4.8',
                deliveryTime: '15-20 min',
                deliveryFee: 'Free Delivery',
                latitude: 17.4312,
                longitude: 78.4116
            });

            // Insert default menu items for r2
            const menu2 = [
                { id: 'tw1', restaurantId: 'r2', name: 'Cappuccino', price: 180, desc: 'Rich espresso with smooth textured milk micro-foam.', category: 'Cafes', type: 'veg', img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
                { id: 'tw2', restaurantId: 'r2', name: 'Butter Croissant', price: 150, desc: 'Flaky, buttery French pastry baked daily.', category: 'Cafes', type: 'veg', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' }
            ];
            await supabase.from('menu_items').insert(menu2);

            // Insert default tables for r2
            const tables2 = [
                { restaurantId: 'r2', num: '1', status: 'available', isReservable: 1 },
                { restaurantId: 'r2', num: '2', status: 'available', isReservable: 1 }
            ];
            await supabase.from('tables').insert(tables2);
            
            console.log('Prepopulating default data finished.');
        }
    } catch (err) {
        console.error('Supabase initialization failed:', err);
    }
}

export async function getState() {
    const [
        { data: restaurants },
        { data: menuItems },
        { data: tables },
        { data: orders },
        { data: orderItems },
        { data: supportAlerts },
        { data: chatMessages }
    ] = await Promise.all([
        supabase.from('restaurants').select('*'),
        supabase.from('menu_items').select('*'),
        supabase.from('tables').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('order_items').select('*'),
        supabase.from('support_alerts').select('*'),
        supabase.from('chat_messages').select('*').order('timestamp', { ascending: true })
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
        chatMessages: chatMessages || []
    };
}

export async function registerRestaurant(email, name, address, password) {
    const id = 'r_' + Date.now();
    const lat = 17.43 + (Math.random() - 0.5) * 0.05;
    const lng = 78.45 + (Math.random() - 0.5) * 0.05;

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

    await supabase.from('menu_items').insert(newItem);
    return newItem;
}

export async function deleteMenuItem(restaurantId, itemId) {
    const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('restaurantId', restaurantId)
        .eq('id', itemId);
    return !error;
}

export async function addTable(restaurantId, tableNum) {
    const tableStr = String(tableNum);
    
    const { data: exists } = await supabase
        .from('tables')
        .select('num')
        .eq('restaurantId', restaurantId)
        .eq('num', tableStr)
        .maybeSingle();

    if (exists) return false;

    await supabase.from('tables').insert({
        restaurantId,
        num: tableStr,
        status: 'available',
        isReservable: 1
    });
    return true;
}

export async function updateTableStatus(restaurantId, tableNum, status) {
    await supabase
        .from('tables')
        .update({ status })
        .eq('restaurantId', restaurantId)
        .eq('num', String(tableNum));
}

export async function placeOrder(restaurantId, tableNum, items, paymentMethod, customerName) {
    const state = await getState();
    const orders = state.orders;
    const id = 'o_' + (1000 + orders.length + 1);

    const { data: rest } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
    if (!rest) throw new Error('Restaurant not found');

    const { data: menu } = await supabase.from('menu_items').select('*').eq('restaurantId', restaurantId);

    let total = 0;
    const orderItems = Object.keys(items).map(itemId => {
        const menuItem = (menu || []).find(m => m.id === itemId);
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

    await supabase.from('orders').insert({
        id,
        restaurantId,
        tableNum: tableNum ? String(tableNum) : 'Online',
        customerName: customerName || 'Guest',
        total,
        status: 'new',
        paymentMethod,
        paymentStatus,
        timestamp
    });

    const dbOrderItems = orderItems.map(oi => ({
        orderId: id,
        itemId: oi.itemId,
        name: oi.name,
        qty: oi.qty,
        price: oi.price
    }));
    await supabase.from('order_items').insert(dbOrderItems);

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
}

export async function updateOrderPaymentStatus(orderId, paymentStatus) {
    await supabase.from('orders').update({ paymentStatus }).eq('id', orderId);
    const { data: updatedOrder } = await supabase.from('orders').select('*').eq('id', orderId).single();
    return updatedOrder;
}

export async function createSupportAlert(restaurantId, tableNum, customerName, message) {
    const id = 'sa_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const timestamp = Date.now();
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
}

export async function resolveSupportAlert(alertId) {
    const { error } = await supabase
        .from('support_alerts')
        .update({ status: 'resolved' })
        .eq('id', alertId);
    return !error;
}

export async function sendChatMessage(restaurantId, tableNum, customerName, sender, message) {
    const id = 'cm_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const timestamp = Date.now();
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
}

export async function updateRestaurantSetup(restaurantId, details) {
    const { name, cuisines, address, description, ambience, rating, deliveryTime, deliveryFee } = details;
    await supabase
        .from('restaurants')
        .update({
            name: name || '',
            cuisines: cuisines || '',
            address: address || '',
            description: description || '',
            ambience: typeof ambience === 'string' ? ambience : JSON.stringify(ambience || []),
            rating: rating || '4.0',
            deliveryTime: deliveryTime || '30-40 min',
            deliveryFee: deliveryFee || 'Free Delivery'
        })
        .eq('id', restaurantId);
}

export async function updateTableReservationStatus(restaurantId, tableNum, isReservable) {
    await supabase
        .from('tables')
        .update({ isReservable: isReservable ? 1 : 0 })
        .eq('restaurantId', restaurantId)
        .eq('num', String(tableNum));
}
