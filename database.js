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
        const { data, error } = await supabase
            .from('restaurants')
            .select('id')
            .limit(1);
        
        if (error) {
            console.error('Error validating Supabase connection:', error);
        } else {
            console.log('Successfully connected to Supabase database.');
        }
    } catch (err) {
        console.error('Supabase connection validation failed:', err);
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

    const isGoogleRest = restaurantId && restaurantId.startsWith('g_');
    let menu = [];

    if (!isGoogleRest) {
        const { data: rest } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
        if (!rest) throw new Error('Restaurant not found');
        const { data: dbMenu } = await supabase.from('menu_items').select('*').eq('restaurantId', restaurantId);
        menu = dbMenu || [];
    } else {
        // Mock menu definition for Google Places simulation
        menu = [
            { id: `${restaurantId}_m1`, name: 'Special Mutton Biryani', price: 380 },
            { id: `${restaurantId}_m2`, name: 'Butter Chicken Masala', price: 290 },
            { id: `${restaurantId}_m3`, name: 'Paneer Butter Masala', price: 260 },
            { id: `${restaurantId}_m4`, name: 'Rumali Roti', price: 40 },
            { id: `${restaurantId}_m5`, name: 'Double Ka Meetha', price: 120 }
        ];
    }

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

    if (tableNum && !isGoogleRest) {
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

export async function saveProfile(profile) {
    const { id, name, email, phone, address } = profile;
    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id,
            name,
            email,
            phone,
            address
        });
    if (error) throw error;
    return data;
}

export async function getProfile(id) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    return data;
}

