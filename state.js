// Dine Direct Central State Store

const STORAGE_KEY = 'dinedirect_state_v1';



class DineDirectStateStore {
    constructor() {
        // Initialize default template state
        this.state = {
            restaurants: [],
            orders: [],
            supportAlerts: [],
            chatMessages: [],
            reviews: [],
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

        // Initialize Supabase Client
        this.initSupabase();
    }

    async fetchState() {
        try {
            const res = await fetch('/api/state');
            const data = await res.json();
            
            this.state.restaurants = data.restaurants;
            this.state.orders = data.orders;
            this.state.supportAlerts = data.supportAlerts || [];
            this.state.chatMessages = data.chatMessages || [];
            this.state.reviews = data.reviews || [];
            
            this._notify();
        } catch (err) {
            console.error('Failed to fetch state from server', err);
        }
    }

    async initSupabase() {
        try {
            // Check for custom connection override in localStorage
            let supabaseUrl = localStorage.getItem('dinedirect_supabase_url');
            let supabaseAnonKey = localStorage.getItem('dinedirect_supabase_anon_key');

            if (!supabaseUrl || !supabaseAnonKey) {
                // Fetch public Supabase configuration from Express server
                const configRes = await fetch('/api/config');
                if (!configRes.ok) {
                    throw new Error(`Failed to fetch /api/config: ${configRes.statusText}`);
                }
                const config = await configRes.json();
                supabaseUrl = config.supabaseUrl;
                supabaseAnonKey = config.supabaseAnonKey;
            }

            if (!supabaseUrl || !supabaseAnonKey) {
                console.warn('Supabase URL or Anon Key is missing.');
                return;
            }

            console.log('Initializing Supabase client...');
            const { createClient } = window.supabase;
            this.supabase = createClient(supabaseUrl, supabaseAnonKey);

            // Connect Realtime
            this.connectSupabaseRealtime();

            // Set up Auth state change listener
            this.setupAuthListener();

        } catch (err) {
            console.error('Failed to initialize Supabase client:', err);
        }
    }

    connectSupabaseRealtime() {
        if (!this.supabase) return;
        try {
            // Subscribe to all database changes in the public schema
            const channel = this.supabase.channel('dinedirect-db-changes')
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
        }
    }

    setupAuthListener() {
        if (!this.supabase) return;
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event change:', event, session);
            if (session && session.user) {
                const user = session.user;
                // Update internal session
                const name = user.user_metadata.full_name || user.email.split('@')[0];
                this.setSession({
                    isLoggedIn: true,
                    userRole: 'customer',
                    currentUser: name,
                    userEmail: user.email,
                    userId: user.id
                });
                
                // Fetch customer profile
                await this.fetchUserProfile(user.id);
            } else {
                if (this.state.session.userRole === 'customer') {
                    this.setSession({
                        isLoggedIn: false,
                        userRole: null,
                        currentUser: null,
                        userEmail: null,
                        userId: null
                    });
                    this.state.profile = null;
                }
            }
        });
    }

    async fetchUserProfile(userId) {
        try {
            const res = await fetch(`/api/profile/${userId}`);
            if (res.ok) {
                const profile = await res.json();
                this.state.profile = profile || null;
                this._notify();
                
                // If logged in, but profile details are missing, redirect to register
                if (this.state.session.isLoggedIn && (!profile || !profile.phone)) {
                    window.location.hash = '#customer/register';
                }
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
        }
    }

    async saveUserProfile(profileData) {
        try {
            const { password, ...dbProfileData } = profileData;
            
            // Save to profile database
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbProfileData)
            });
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to save profile');
            }

            // If password is provided, set it in Supabase auth account
            if (password) {
                const { error: pwdErr } = await this.supabase.auth.updateUser({ password });
                if (pwdErr) throw pwdErr;
            }

            this.state.profile = { ...this.state.profile, ...dbProfileData };
            this.setSession({ currentUser: dbProfileData.name });
            this._notify();
            return true;
        } catch (err) {
            console.error('Error saving user profile:', err);
            throw err;
        }
    }

    async sendEmailOtp(email) {
        this.mockOtp = { email, code: '123456', isFallback: false };
        if (this.supabase) {
            try {
                // Try Supabase with a 3-second timeout
                const probePromise = this.supabase.auth.signInWithOtp({
                    email,
                    options: {
                        shouldCreateUser: true,
                        emailRedirectTo: window.location.origin
                    }
                });
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Supabase Auth timeout')), 3000)
                );
                const { error } = await Promise.race([probePromise, timeoutPromise]);
                if (!error) {
                    return { success: true, isFallback: false };
                }
                console.warn('Supabase signInWithOtp error, switching to resilient fallback:', error.message);
            } catch (err) {
                console.warn('Supabase signInWithOtp failed (paused/offline), switching to resilient fallback:', err.message);
            }
        }
        
        // Resilient Fallback OTP
        this.mockOtp.isFallback = true;
        return { success: true, isFallback: true, code: '123456' };
    }

    async verifyEmailOtp(email, token) {
        if (this.supabase && (!this.mockOtp || !this.mockOtp.isFallback)) {
            try {
                const { data, error } = await this.supabase.auth.verifyOtp({
                    email,
                    token,
                    type: 'email'
                });
                if (!error && data && data.user) {
                    return data;
                }
                console.warn('Supabase verifyOtp failed, checking offline fallback:', error ? error.message : 'no user');
            } catch (err) {
                console.warn('Supabase verifyOtp network error, switching to fallback:', err.message);
            }
        }

        // Resilient Verification (accept 123456 or mock code)
        if (token === '123456' || (this.mockOtp && this.mockOtp.code === token)) {
            const name = email.split('@')[0];
            const sessionData = {
                isLoggedIn: true,
                userRole: 'customer',
                currentUser: name,
                userEmail: email,
                userId: 'usr_' + Date.now()
            };
            this.setSession(sessionData);
            this.state.profile = {
                id: sessionData.userId,
                name: name,
                email: email,
                phone: '+91 98765 43210'
            };
            this._notify();
            return { user: { id: sessionData.userId, email } };
        }

        throw new Error('Invalid verification code. Please use 123456.');
    }

    async loginWithEmailPassword(email, password) {
        if (!this.supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    async signUpWithEmailPassword(email, password) {
        if (!this.supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    saveCustomConnection(url, anonKey) {
        if (url && anonKey) {
            localStorage.setItem('dinedirect_supabase_url', url);
            localStorage.setItem('dinedirect_supabase_anon_key', anonKey);
        } else {
            localStorage.removeItem('dinedirect_supabase_url');
            localStorage.removeItem('dinedirect_supabase_anon_key');
        }
        window.location.reload();
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

    async logout() {
        if (this.supabase && this.state.session.userRole === 'customer') {
            try {
                await this.supabase.auth.signOut();
            } catch (err) {
                console.error('Error signing out of Supabase:', err);
            }
        }
        this.state.session = {
            userRole: null,
            currentUser: null,
            activeRestaurantId: 'r1',
            activeTableNum: null
        };
        this.state.cart = {};
        this.state.profile = null;
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
        if (id && id.startsWith('g_')) {
            const googleRest = (this.state.googleRestaurants || []).find(r => r.id === id);
            if (googleRest) {
                if (!googleRest.menu) {
                    googleRest.menu = [
                        { id: `${id}_m1`, name: 'Special Mutton Biryani', price: 380, desc: 'Fragrant basmati rice cooked with tender mutton and authentic spices.', category: 'Biryani', type: 'non-veg', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
                        { id: `${id}_m2`, name: 'Butter Chicken Masala', price: 290, desc: 'Succulent chicken tikka pieces in a rich, buttery tomato gravy.', category: 'Curries', type: 'non-veg', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=200&q=60' },
                        { id: `${id}_m3`, name: 'Paneer Butter Masala', price: 260, desc: 'Cottage cheese cubes in a creamy tomato gravy.', category: 'Curries', type: 'veg', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60' },
                        { id: `${id}_m4`, name: 'Rumali Roti', price: 40, desc: 'Extremely thin, soft flatbread.', category: 'Breads', type: 'veg', img: 'https://images.unsplash.com/photo-1534080391025-aa7c08365f8c?auto=format&fit=crop&w=200&q=60' },
                        { id: `${id}_m5`, name: 'Double Ka Meetha', price: 120, desc: 'Traditional Hyderabadi bread pudding dessert.', category: 'Desserts', type: 'veg', img: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=200&q=60' }
                    ];
                    googleRest.tables = [
                        { num: '1', status: 'available' },
                        { num: '2', status: 'available' },
                        { num: '3', status: 'available' }
                    ];
                }
                return googleRest;
            }
        }
        return this.state.restaurants.find(r => r.id === id);
    }

    async fetchGoogleRestaurants(lat, lng, radius) {
        try {
            const res = await fetch(`/api/google-restaurants?lat=${lat}&lng=${lng}&radius=${radius}`);
            if (res.ok) {
                const googleRest = await res.json();
                this.state.googleRestaurants = googleRest || [];
                return this.state.googleRestaurants;
            }
        } catch (err) {
            console.error('Error fetching Google restaurants:', err);
        }
        return [];
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

    clearAllCarts() {
        this.state.cart = {};
        try {
            localStorage.setItem('dinedirect_cart', JSON.stringify(this.state.cart));
        } catch (e) {
            console.error('Failed to save cart to localStorage', e);
        }
        this._notify();
    }

    getCartRestaurants() {
        const allCarts = this.state.cart || {};
        const restaurantIds = Object.keys(allCarts).filter(rId => {
            const c = allCarts[rId];
            return c && Object.values(c).some(qty => Number(qty) > 0);
        });

        return restaurantIds.map(rId => {
            const rest = this.getRestaurant(rId);
            if (rest) return rest;
            return {
                id: rId,
                name: 'Restaurant ' + rId,
                address: 'Hyderabad',
                menu: []
            };
        });
    }

    getCartTotalCount() {
        const allCarts = this.state.cart || {};
        let count = 0;
        Object.values(allCarts).forEach(c => {
            if (c) {
                Object.values(c).forEach(qty => {
                    count += Number(qty) || 0;
                });
            }
        });
        return count;
    }

    getCartSubtotal() {
        const allCarts = this.state.cart || {};
        let subtotal = 0;
        Object.keys(allCarts).forEach(rId => {
            const cart = allCarts[rId];
            const rest = this.getRestaurant(rId);
            const menu = rest ? rest.menu || [] : [];
            if (cart) {
                Object.keys(cart).forEach(itemId => {
                    const qty = Number(cart[itemId]) || 0;
                    if (qty > 0) {
                        const item = menu.find(m => m.id === itemId);
                        if (item) {
                            subtotal += (Number(item.price) || 0) * qty;
                        }
                    }
                });
            }
        });
        return subtotal;
    }

    // --- Orders API ---
    getOrders(restaurantId = null) {
        if (!restaurantId) return this.state.orders || [];
        return (this.state.orders || []).filter(o => o.restaurantId === restaurantId);
    }

    getOrdersByGroup(groupOrderId) {
        if (!groupOrderId) return [];
        return (this.state.orders || []).filter(o => o.groupOrderId === groupOrderId);
    }

    async placeOrder(restaurantId, tableNum, items, paymentMethod, customerName, groupOrderId = null, deliveryFee = 0) {
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, tableNum, items, paymentMethod, customerName, groupOrderId, deliveryFee })
            });
            const newOrder = await res.json();
            
            // Clear cart for this restaurant
            this.clearCart(restaurantId);
            await this.fetchState();
            return newOrder;
        } catch (err) {
            console.error('Failed to place order', err);
        }
    }

    async placeGroupOrder(tableNum, paymentMethod, customerName, deliveryFee = 0) {
        try {
            const allCarts = this.state.cart || {};
            const restaurantsPayload = [];

            Object.keys(allCarts).forEach(rId => {
                const c = allCarts[rId];
                if (c) {
                    const activeItems = {};
                    Object.keys(c).forEach(itemId => {
                        if (Number(c[itemId]) > 0) {
                            activeItems[itemId] = Number(c[itemId]);
                        }
                    });
                    if (Object.keys(activeItems).length > 0) {
                        restaurantsPayload.push({
                            restaurantId: rId,
                            items: activeItems
                        });
                    }
                }
            });

            if (restaurantsPayload.length === 0) {
                throw new Error('Cart is empty');
            }

            const res = await fetch('/api/orders/group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: customerName || 'Guest',
                    tableNum: tableNum ? String(tableNum) : 'Online',
                    paymentMethod,
                    deliveryFee: Number(deliveryFee) || 0,
                    restaurantsPayload
                })
            });

            const result = await res.json();

            if (result && result.groupOrderId) {
                this.setSession({
                    activeGroupOrderId: result.groupOrderId,
                    lastPlacedOrderTime: Date.now()
                });
            }

            this.clearAllCarts();
            await this.fetchState();
            return result;
        } catch (err) {
            console.error('Failed to place multi-restaurant group order:', err);
            throw err;
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

    // --- Reviews API ---
    getReviews(restaurantId) {
        if (!restaurantId) return this.state.reviews || [];
        return (this.state.reviews || []).filter(r => r.restaurantId === restaurantId);
    }

    async submitReview(restaurantId, orderId, customerName, rating, tags = [], comment = '') {
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, orderId, customerName, rating, tags, comment })
            });
            const newReview = await res.json();
            if (res.ok) {
                if (!this.state.reviews) this.state.reviews = [];
                // Prepend to local reviews
                this.state.reviews.unshift(newReview);
                this._notify();
            }
            return newReview;
        } catch (err) {
            console.error('Failed to submit review', err);
            return null;
        }
    }
}

// Instantiate and attach to window
window.DineDirectStore = new DineDirectStateStore();
export default window.DineDirectStore;
