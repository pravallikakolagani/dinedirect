// Dine Direct Central State Store

const STORAGE_KEY = 'dinedirect_state_v1';

const DEFAULT_STATE = {
    restaurants: [
        {
            id: 'r1',
            name: 'Paradise Biryani',
            ownerEmail: 'owner@paradise.com',
            address: 'Secunderabad',
            password: 'password123',
            cuisines: 'Biryani, Mughlai',
            rating: '4.5',
            deliveryTime: '30-40 min',
            deliveryFee: 'Free Delivery',
            menu: [
                { id: 'm1', name: 'Special Chicken Biryani', price: 350, desc: 'Aromatic basmati rice cooked with succulent chicken pieces.', category: 'Biryani', type: 'non-veg', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
                { id: 'm2', name: 'Mutton Haleem', price: 250, desc: 'Rich, slow-cooked meat and wheat stew.', category: 'Biryani', type: 'non-veg', img: 'https://images.unsplash.com/photo-1552590635-27c2c21287f5?auto=format&fit=crop&w=200&q=60' },
                { id: 'm3', name: 'Paneer Tikka', price: 220, desc: 'Soft paneer cubes marinated in spices and grilled.', category: 'Dabbas', type: 'veg', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
                { id: 'm4', name: 'Diet Coke', price: 60, desc: 'Zero calorie cola refreshment.', category: 'Fast Food', type: 'veg', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=60' }
            ],
            tables: [
                { num: '1', status: 'available' },
                { num: '2', status: 'available' },
                { num: '3', status: 'available' },
                { num: '4', status: 'available' }
            ]
        },
        {
            id: 'r2',
            name: 'Third Wave Coffee',
            ownerEmail: 'coffee@thirdwave.com',
            address: 'Jubilee Hills',
            password: 'password123',
            cuisines: 'Cafe, Desserts',
            rating: '4.8',
            deliveryTime: '15-20 min',
            deliveryFee: 'Free Delivery',
            menu: [
                { id: 'tw1', name: 'Cappuccino', price: 180, desc: 'Rich espresso with smooth textured milk micro-foam.', category: 'Cafes', type: 'veg', img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
                { id: 'tw2', name: 'Butter Croissant', price: 150, desc: 'Flaky, buttery French pastry baked daily.', category: 'Cafes', type: 'veg', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' }
            ],
            tables: [
                { num: '1', status: 'available' },
                { num: '2', status: 'available' }
            ]
        }
    ],
    orders: [],
    session: {
        userRole: null, // 'customer' | 'owner'
        currentUser: null,
        activeRestaurantId: 'r1',
        activeTableNum: null
    },
    cart: {} // { [restaurantId]: { [itemId]: quantity } }
};

class DineDirectStateStore {
    constructor() {
        // Initialize default template state
        this.state = {
            restaurants: [],
            orders: [],
            supportAlerts: [],
            chatMessages: [],
            session: {
                userRole: null,
                currentUser: null,
                activeRestaurantId: 'r1',
                activeTableNum: null
            },
            cart: {}
        };
        
        // Restore session and cart from localStorage
        try {
            const savedSession = localStorage.getItem('dinedirect_session');
            if (savedSession) {
                this.state.session = JSON.parse(savedSession);
            }
            const savedCart = localStorage.getItem('dinedirect_cart');
            if (savedCart) {
                this.state.cart = JSON.parse(savedCart);
            }
        } catch (e) {
            console.error('Error reading session/cart from localStorage', e);
        }

        this.listeners = [];

        // Fetch initial state from server
        this.fetchState();

        // Connect Supabase Realtime for real-time sync
        this.connectSupabaseRealtime();
    }

    async fetchState() {
        try {
            const res = await fetch('/api/state');
            const data = await res.json();
            
            this.state.restaurants = data.restaurants;
            this.state.orders = data.orders;
            this.state.supportAlerts = data.supportAlerts || [];
            this.state.chatMessages = data.chatMessages || [];
            
            this._notify();
        } catch (err) {
            console.error('Failed to fetch state from server', err);
        }
    }

    async connectSupabaseRealtime() {
        try {
            // Fetch public Supabase configuration from Express server
            const configRes = await fetch('/api/config');
            if (!configRes.ok) {
                throw new Error(`Failed to fetch /api/config: ${configRes.statusText}`);
            }
            const config = await configRes.json();
            
            if (!config.supabaseUrl || !config.supabaseAnonKey) {
                console.warn('Supabase URL or Anon Key is missing. Realtime sync disabled.');
                return;
            }

            console.log('Initializing Supabase Realtime client...');
            const { createClient } = window.supabase;
            const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

            // Subscribe to all database changes in the public schema
            const channel = supabase.channel('dinedirect-db-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public'
                    },
                    (payload) => {
                        console.log('Database change detected, refetching state:', payload);
                        this.fetchState();
                    }
                )
                .subscribe((status) => {
                    console.log('Supabase Realtime subscription status:', status);
                });
        } catch (err) {
            console.error('Failed to connect to Supabase Realtime:', err);
            console.log('Retrying Realtime connection in 5 seconds...');
            setTimeout(() => this.connectSupabaseRealtime(), 5000);
        }
    }

    _notify() {
        this.listeners.forEach(callback => {
            try {
                callback(this.state);
            } catch (err) {
                console.error('Error in state subscriber', err);
            }
        });
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.state);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    // --- Session API ---
    getSession() {
        return this.state.session;
    }

    setSession(sessionData) {
        this.state.session = { ...this.state.session, ...sessionData };
        try {
            localStorage.setItem('dinedirect_session', JSON.stringify(this.state.session));
        } catch (e) {
            console.error('Failed to save session to localStorage', e);
        }
        this._notify();
    }

    logout() {
        this.state.session = {
            userRole: null,
            currentUser: null,
            activeRestaurantId: 'r1',
            activeTableNum: null
        };
        this.state.cart = {};
        try {
            localStorage.removeItem('dinedirect_session');
            localStorage.removeItem('dinedirect_cart');
        } catch (e) {
            console.error('Failed to clear session from localStorage', e);
        }
        this._notify();
    }

    // --- Restaurant API ---
    getRestaurants() {
        return this.state.restaurants;
    }

    getRestaurant(id) {
        return this.state.restaurants.find(r => r.id === id);
    }

    async registerRestaurant(email, name, address, password) {
        try {
            const res = await fetch('/api/restaurants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, address, password })
            });
            const newRest = await res.json();
            
            this.setSession({
                activeRestaurantId: newRest.id,
                userRole: 'owner',
                currentUser: email
            });
            
            return newRest;
        } catch (err) {
            console.error('Failed to register restaurant', err);
        }
    }

    loginOwner(email, password) {
        const rest = this.state.restaurants.find(r => r.ownerEmail === email && r.password === password);
        if (rest) {
            this.setSession({
                activeRestaurantId: rest.id,
                userRole: 'owner',
                currentUser: email
            });
            return true;
        }
        return false;
    }

    // --- Menu API ---
    getMenu(restaurantId) {
        const rest = this.getRestaurant(restaurantId);
        return rest ? rest.menu : [];
    }

    async addMenuItem(restaurantId, item) {
        try {
            const res = await fetch('/api/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, item })
            });
            const newItem = await res.json();
            return newItem;
        } catch (err) {
            console.error('Failed to add menu item', err);
            return null;
        }
    }

    async updateMenuItem(restaurantId, itemId, updatedData) {
        try {
            const res = await fetch(`/api/menu/${restaurantId}/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            return res.ok;
        } catch (err) {
            console.error('Failed to update menu item', err);
            return false;
        }
    }

    async deleteMenuItem(restaurantId, itemId) {
        try {
            const res = await fetch(`/api/menu/${restaurantId}/${itemId}`, {
                method: 'DELETE'
            });
            return res.ok;
        } catch (err) {
            console.error('Failed to delete menu item', err);
            return false;
        }
    }

    // --- Tables API ---
    getTables(restaurantId) {
        const rest = this.getRestaurant(restaurantId);
        return rest ? rest.tables : [];
    }

    async addTable(restaurantId, tableNum) {
        try {
            const res = await fetch('/api/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, tableNum })
            });
            return res.ok;
        } catch (err) {
            console.error('Failed to add table', err);
            return false;
        }
    }

    // --- Support Alerts API ---
    getSupportAlerts(restaurantId) {
        return this.state.supportAlerts.filter(sa => sa.restaurantId === restaurantId);
    }

    async createSupportAlert(message) {
        const session = this.getSession();
        const restaurantId = session.activeRestaurantId || 'r1';
        const tableNum = session.activeTableNum || 'Online';
        const customerName = session.currentUser || 'Guest';

        try {
            const res = await fetch('/api/support-alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, tableNum, customerName, message })
            });
            const newAlert = await res.json();
            return newAlert;
        } catch (err) {
            console.error('Failed to create support alert', err);
            return null;
        }
    }

    async resolveSupportAlert(alertId) {
        try {
            const res = await fetch(`/api/support-alerts/${alertId}/resolve`, {
                method: 'PUT'
            });
            return res.ok;
        } catch (err) {
            console.error('Failed to resolve support alert', err);
            return false;
        }
    }

    async sendChatMessage(sender, message, targetTable = null, targetCustomer = null, targetRestId = null) {
        const session = this.getSession();
        const restaurantId = targetRestId || session.activeRestaurantId || 'r1';
        const tableNum = targetTable || session.activeTableNum || 'Online';
        const customerName = targetCustomer || session.currentUser || 'Guest';

        try {
            const res = await fetch('/api/chat-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, tableNum, customerName, sender, message })
            });
            const newMsg = await res.json();
            return newMsg;
        } catch (err) {
            console.error('Failed to send chat message', err);
            return null;
        }
    }

    // --- Cart API ---
    getCart(restaurantId) {
        if (!this.state.cart[restaurantId]) {
            this.state.cart[restaurantId] = {};
        }
        return this.state.cart[restaurantId];
    }

    addToCart(restaurantId, itemId) {
        const cart = this.getCart(restaurantId);
        if (cart[itemId]) {
            cart[itemId]++;
        } else {
            cart[itemId] = 1;
        }
        try {
            localStorage.setItem('dinedirect_cart', JSON.stringify(this.state.cart));
        } catch (e) {
            console.error('Failed to save cart to localStorage', e);
        }
        this._notify();
    }

    removeFromCart(restaurantId, itemId) {
        const cart = this.getCart(restaurantId);
        if (cart[itemId]) {
            cart[itemId]--;
            if (cart[itemId] <= 0) {
                delete cart[itemId];
            }
            try {
                localStorage.setItem('dinedirect_cart', JSON.stringify(this.state.cart));
            } catch (e) {
                console.error('Failed to save cart to localStorage', e);
            }
            this._notify();
        }
    }

    clearCart(restaurantId) {
        this.state.cart[restaurantId] = {};
        try {
            localStorage.setItem('dinedirect_cart', JSON.stringify(this.state.cart));
        } catch (e) {
            console.error('Failed to save cart to localStorage', e);
        }
        this._notify();
    }

    // --- Orders API ---
    getOrders(restaurantId) {
        return this.state.orders.filter(o => o.restaurantId === restaurantId);
    }

    async placeOrder(restaurantId, tableNum, items, paymentMethod, customerName) {
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, tableNum, items, paymentMethod, customerName })
            });
            const newOrder = await res.json();
            
            // Clear cart
            this.clearCart(restaurantId);
            return newOrder;
        } catch (err) {
            console.error('Failed to place order', err);
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            return res.ok;
        } catch (err) {
            console.error('Failed to update order status', err);
            return false;
        }
    }

    async updateOrderPaymentStatus(orderId, paymentStatus) {
        try {
            const res = await fetch(`/api/orders/${orderId}/payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentStatus })
            });
            return res.ok;
        } catch (err) {
            console.error('Failed to update order payment status', err);
            return false;
        }
    }

    async updateTableStatus(restaurantId, tableNum, status) {
        try {
            const res = await fetch(`/api/tables/${restaurantId}/${tableNum}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            return res.ok;
        } catch (err) {
            console.error('Failed to update table status', err);
            return false;
        }
    }
}

// Instantiate and attach to window
window.DineDirectStore = new DineDirectStateStore();
export default window.DineDirectStore;
