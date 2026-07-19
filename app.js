// Dine Direct Application Router & Coordinator

const startFloatingFood = () => {
    const container = document.getElementById('food-container');
    if (!container) return;
    
    container.innerHTML = '';
    const foodItems = ['🍕', '🍔', '🌮', '🍜', '🍣', '🍰', '🍷', '🥐', '🍟', '🍩', '🥑', '🥩', '🍤', '☕'];
    
    for (let i = 0; i < 20; i++) {
        const food = document.createElement('div');
        food.className = 'floating-food';
        food.textContent = foodItems[Math.floor(Math.random() * foodItems.length)];
        
        const size = Math.random() * 16 + 18; // 18px to 34px
        const left = Math.random() * 100; // 0% to 100%
        const delay = Math.random() * 10; // 0s to 10s
        const duration = Math.random() * 8 + 8; // 8s to 16s
        
        food.style.cssText = `
            position: absolute;
            top: -40px;
            left: ${left}%;
            font-size: ${size}px;
            opacity: ${Math.random() * 0.25 + 0.25};
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15)) blur(0.5px);
            pointer-events: none;
            animation: food-drift ${duration}s linear infinite;
            animation-delay: ${delay}s;
        `;
        
        container.appendChild(food);
    }
};

const createAuthView = () => {
    const session = window.DineDirectStore.getSession();
    const tableNumText = session.activeTableNum ? ` at Table ${session.activeTableNum}` : '';
    return `
        <section class="auth-section" style="position: relative; width: 100vw; height: 100vh; overflow: hidden;">
            <!-- Background Image -->
            <img src="images/restaurant_background.png" class="bg">
            <!-- Floating food overlay container -->
            <div id="food-container" style="position: absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; pointer-events:none; z-index:5;"></div>

            <div class="auth-wrapper animate-fade-in" style="z-index: 10; position: relative; background: none;">
                <div class="auth-card" style="background: rgba(255, 255, 255, 0.15) !important; backdrop-filter: blur(15px) !important; -webkit-backdrop-filter: blur(15px) !important; border: 1.5px solid rgba(255, 255, 255, 0.25) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.2) !important;">
                    <!-- Left column: Marketing banner (Desktop) -->
                    <div class="auth-banner" style="background: linear-gradient(135deg, rgba(143, 44, 36, 0.8), rgba(255, 107, 53, 0.8)); border-right: 1px solid rgba(255, 255, 255, 0.15);">
                        <div>
                            <h2 class="auth-banner-title">Scan. Order.<br>Savor.</h2>
                            <ul class="auth-banner-features">
                                <li><i data-lucide="zap"></i> Order instantly from your table</li>
                                <li><i data-lucide="credit-card"></i> Pay securely via mock UPI / Card</li>
                                <li><i data-lucide="chef-hat"></i> Track preparation stage live</li>
                                <li><i data-lucide="check-circle"></i> Direct integration with Kitchen KDS</li>
                            </ul>
                        </div>
                        <p class="text-muted" style="color:rgba(255,255,255,0.7) !important; font-size:0.85rem;">
                            Dine Direct connects customers & kitchen workflows seamlessly.
                        </p>
                    </div>

                    <!-- Right column: Interactive Form Pane -->
                    <div class="auth-form-side">
                        <h1 class="logo-large mb-2">
                            <i data-lucide="utensils-cross" style="color:#8f2c24;"></i> Dine Direct
                        </h1>
                        <p class="text-muted mb-4" style="font-size:0.9rem; color:#8f2c24 !important; opacity:0.8; font-weight:600;">
                            Your entire dining ecosystem${tableNumText}
                        </p>
                        
                        <div class="form-toggle mb-4" id="authRoleToggle">
                            <div class="toggle-btn active" id="btnCustomer">
                                <i data-lucide="user"></i> Customer
                            </div>
                            <div class="toggle-btn" id="btnOwner">
                                <i data-lucide="store"></i> Owner
                            </div>
                        </div>

                        <!-- Customer Step 1: Login Form (Google OAuth) -->
                        <div id="customerLoginForm" class="login">
                            <button type="button" class="btn btn-outline-premium btn-block mb-3" id="btnGoogleLogin" style="background:#fff !important; color:#4285F4; border:1px solid #dadce0 !important; font-weight:600; display:flex; align-items:center; justify-content:center; gap:10px; box-shadow:0 2px 4px rgba(0,0,0,0.08);">
                                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.25h2.9c1.7-1.56 2.69-3.86 2.69-6.58z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.9-2.25c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.58-5.05-3.7H.94v2.32C2.42 16.02 5.48 18 9 18z"/><path fill="#FBBC05" d="M3.95 10.71a5.4 5.4 0 0 1 0-3.42V4.97H.94a9 9 0 0 0 0 8.06l3.01-2.32z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2A9 9 0 0 0 .94 4.97l3.01 2.32C4.66 5.16 6.65 3.58 9 3.58z"/></svg>
                                Sign in with Google
                            </button>
                            
                            <div class="text-center mb-3">
                                <button type="button" class="btn btn-outline-premium btn-block" id="btnGuestContinue" style="color:#8f2c24; border-color:#8f2c24 !important;">
                                    <i data-lucide="user-plus"></i> Continue as Guest
                                </button>
                            </div>

                            <!-- Connection Settings Toggle Link -->
                            <div class="text-center">
                                <a href="#" id="toggleConnectionSettings" style="color:#64748b; font-size:0.75rem; text-decoration:none;">
                                    <i data-lucide="settings" style="width:12px; height:12px; vertical-align:middle;"></i> DB Connection Settings
                                </a>
                            </div>

                            <!-- Connection Settings Panel (Collapsible) -->
                            <div id="connectionSettingsPanel" class="d-none mt-3 p-3" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; text-align:left;">
                                <h6 style="font-size:0.8rem; font-weight:700; color:#1e293b; margin-bottom:10px;">Custom Supabase Connection</h6>
                                <div class="form-group mb-2">
                                    <label style="font-size:0.7rem; color:#475569; font-weight:600;">Supabase URL</label>
                                    <input type="text" class="form-control form-control-sm" id="customDbUrl" placeholder="https://xxx.supabase.co" style="font-size:0.75rem; height:32px;">
                                </div>
                                <div class="form-group mb-3">
                                    <label style="font-size:0.7rem; color:#475569; font-weight:600;">Supabase Anon Key</label>
                                    <input type="text" class="form-control form-control-sm" id="customDbKey" placeholder="sb_publishable_..." style="font-size:0.75rem; height:32px;">
                                </div>
                                <div style="display:flex; gap:8px;">
                                    <button type="button" class="btn btn-sm btn-primary" id="btnSaveDbConfig" style="font-size:0.75rem; padding:4px 8px; flex:1;">Save & Reload</button>
                                    <button type="button" class="btn btn-sm btn-outline-danger" id="btnClearDbConfig" style="font-size:0.75rem; padding:4px 8px;">Reset</button>
                                </div>
                            </div>
                        </div>

                        <!-- Owner Form -->
                        <form id="ownerForm" class="d-none login">
                            <div class="form-group inputBox">
                                <label style="color:#8f2c24; font-size:0.8rem; font-weight:600;">Business Email</label>
                                <input type="email" class="form-control" id="ownerEmail" placeholder="restaurant@example.com" required>
                            </div>
                            <div class="form-group inputBox">
                                <label style="color:#8f2c24; font-size:0.8rem; font-weight:600;">Password</label>
                                <input type="password" class="form-control" id="ownerPassword" placeholder="••••••••" required>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block mb-3" style="box-shadow: 0 4px 12px rgba(143, 44, 36, 0.3);">
                                <i data-lucide="building"></i> Owner Login
                            </button>
                            <p class="text-center">
                                <a href="#owner/signup" style="font-size:0.85rem; color:#8f2c24 !important; font-weight:600; text-decoration:none;">
                                    Register new restaurant
                                </a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    `;
};

const createOwnerSignupView = () => {
    return `
        <section class="auth-section" style="position: relative; width: 100vw; height: 100vh; overflow: hidden;">
            <!-- Background Image -->
            <img src="images/restaurant_background.png" class="bg">
            <!-- Floating food overlay container -->
            <div id="food-container" style="position: absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; pointer-events:none; z-index:5;"></div>

            <div class="auth-wrapper animate-fade-in" style="z-index: 10; position: relative; background: none;">
                <div class="auth-card" style="max-width: 450px; background: rgba(255, 255, 255, 0.15) !important; backdrop-filter: blur(15px) !important; -webkit-backdrop-filter: blur(15px) !important; border: 1.5px solid rgba(255, 255, 255, 0.25) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.2) !important;">
                    <div class="auth-form-side" style="padding: 40px;">
                        <h1 class="logo-large mb-2" style="justify-content:center;">
                            <i data-lucide="building" style="color:#8f2c24;"></i> Onboard Business
                        </h1>
                        <p class="text-center text-muted mb-4" style="font-size:0.85rem; color:#8f2c24 !important; opacity:0.8; font-weight:600;">
                            Register your restaurant and print QR codes in minutes.
                        </p>
                        
                        <form id="ownerSignupForm" class="login">
                            <div class="form-group inputBox">
                                <label style="color:#8f2c24; font-size:0.8rem; font-weight:600;">Restaurant Name</label>
                                <input type="text" id="signupRestName" class="form-control" placeholder="e.g. Paradise Biryani" required>
                            </div>
                            <div class="form-group inputBox">
                                <label style="color:#8f2c24; font-size:0.8rem; font-weight:600;">Business Email</label>
                                <input type="email" id="signupEmail" class="form-control" placeholder="owner@paradise.com" required>
                            </div>
                            <div class="form-group inputBox">
                                <label style="color:#8f2c24; font-size:0.8rem; font-weight:600;">Address / Location</label>
                                <input type="text" id="signupAddress" class="form-control" placeholder="e.g. Secunderabad" required>
                            </div>
                            <div class="form-group inputBox">
                                <label style="color:#8f2c24; font-size:0.8rem; font-weight:600;">Password</label>
                                <input type="password" id="signupPassword" class="form-control" placeholder="••••••••" required>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block mb-3" style="box-shadow: 0 4px 12px rgba(143, 44, 36, 0.3);">
                                <i data-lucide="check-circle2"></i> Complete Onboarding
                            </button>
                            <p class="text-center" style="font-size:0.85rem;">
                                <a href="#auth" style="color:#8f2c24 !important; font-weight:600; text-decoration:none;">Already have account? Login</a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    `;
};

const createRegisterView = () => {
    return `
        <section class="auth-section" style="position: relative; width: 100vw; height: 100vh; overflow: hidden;">
            <!-- Background Image -->
            <img src="images/restaurant_background.png" class="bg">
            <!-- Floating food overlay container -->
            <div id="food-container" style="position: absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; pointer-events:none; z-index:5;"></div>

            <div class="auth-wrapper animate-fade-in" style="z-index: 10; position: relative; background: none;">
                <div class="auth-card" style="max-width: 450px; background: rgba(255, 255, 255, 0.15) !important; backdrop-filter: blur(15px) !important; -webkit-backdrop-filter: blur(15px) !important; border: 1.5px solid rgba(255, 255, 255, 0.25) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.2) !important;">
                    <div class="auth-form-side" style="padding: 40px;">
                        <h1 class="logo-large mb-2" style="justify-content:center;">
                            <i data-lucide="user-check" style="color:#8f2c24;"></i> Complete Profile
                        </h1>
                        <p class="text-center text-muted mb-4" style="font-size:0.85rem; color:#8f2c24 !important; opacity:0.8; font-weight:600;">
                            Please enter your details to complete registration.
                        </p>
                        
                        <form id="customerRegisterForm" class="login">
                            <div class="form-group inputBox">
                                <label style="color:#8f2c24; font-size:0.8rem; font-weight:600;">Full Name</label>
                                <input type="text" id="registerNameInput" class="form-control" placeholder="e.g. John Doe" required>
                            </div>
                            <div class="form-group inputBox">
                                <label style="color:#8f2c24; font-size:0.8rem; font-weight:600;">Phone Number</label>
                                <input type="tel" id="registerPhoneInput" class="form-control" placeholder="e.g. +91 98765 43210" required>
                            </div>
                            <div class="form-group inputBox">
                                <label style="color:#8f2c24; font-size:0.8rem; font-weight:600;">Delivery Address</label>
                                <textarea id="registerAddressInput" class="form-control" rows="2" placeholder="Street, City, Pincode" required style="resize:none;"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block mb-3" style="box-shadow: 0 4px 12px rgba(143, 44, 36, 0.3);">
                                <i data-lucide="check-circle"></i> Save & Continue
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    `;
};

const setupRegisterListeners = () => {
    // Prefill name from Supabase user metadata
    const store = window.DineDirectStore;
    if (store.supabase && store.supabase.auth) {
        store.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && session.user) {
                const nameInput = document.getElementById('registerNameInput');
                if (nameInput && !nameInput.value) {
                    nameInput.value = session.user.user_metadata.full_name || '';
                }
            }
        });
    }

    const registerForm = document.getElementById('customerRegisterForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerNameInput').value.trim();
            const phone = document.getElementById('registerPhoneInput').value.trim();
            const address = document.getElementById('registerAddressInput').value.trim();

            const session = store.getSession();
            if (!session.userId) {
                if (window.showToast) window.showToast('❌ User session not found. Please log in again.');
                return;
            }

            if (window.showToast) window.showToast('💾 Saving profile...');

            try {
                const success = await store.saveUserProfile({
                    id: session.userId,
                    name,
                    email: session.userEmail,
                    phone,
                    address
                });
                if (success) {
                    if (window.showToast) window.showToast('✅ Profile saved successfully!');
                    window.location.hash = '#customer/home';
                }
            } catch (err) {
                if (window.showToast) window.showToast(`❌ Error saving profile: ${err.message}`);
            }
        });
    }
};

const setupAuthListeners = () => {
    const btnCustomer = document.getElementById('btnCustomer');
    const btnOwner = document.getElementById('btnOwner');
    const customerLoginForm = document.getElementById('customerLoginForm');
    const ownerForm = document.getElementById('ownerForm');
    const btnGuestContinue = document.getElementById('btnGuestContinue');
    const authRoleToggle = document.getElementById('authRoleToggle');

    if(btnCustomer && btnOwner) {
        btnCustomer.addEventListener('click', () => {
            btnCustomer.classList.add('active');
            btnOwner.classList.remove('active');
            customerLoginForm.classList.remove('d-none');
            ownerForm.classList.add('d-none');
        });

        btnOwner.addEventListener('click', () => {
            btnOwner.classList.add('active');
            btnCustomer.classList.remove('active');
            ownerForm.classList.remove('d-none');
            customerLoginForm.classList.add('d-none');
        });
    }

    // Google OAuth login trigger
    const btnGoogleLogin = document.getElementById('btnGoogleLogin');
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', async () => {
            const store = window.DineDirectStore;
            if (!store.supabase) {
                if (window.showToast) window.showToast('❌ Supabase not initialized. Check your settings.');
                return;
            }
            if (window.showToast) window.showToast('🔄 Redirecting to Google Login...');
            try {
                const { error } = await store.supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin
                    }
                });
                if (error) throw error;
            } catch (err) {
                console.error(err);
                if (window.showToast) window.showToast(`❌ Login failed: ${err.message}`);
            }
        });
    }

    // Toggle custom DB Connection Settings
    const toggleConnectionSettings = document.getElementById('toggleConnectionSettings');
    const connectionSettingsPanel = document.getElementById('connectionSettingsPanel');
    if (toggleConnectionSettings && connectionSettingsPanel) {
        toggleConnectionSettings.addEventListener('click', (e) => {
            e.preventDefault();
            connectionSettingsPanel.classList.toggle('d-none');
        });
    }

    // Custom DB connection buttons
    const btnSaveDbConfig = document.getElementById('btnSaveDbConfig');
    const btnClearDbConfig = document.getElementById('btnClearDbConfig');
    const customDbUrl = document.getElementById('customDbUrl');
    const customDbKey = document.getElementById('customDbKey');

    if (customDbUrl && customDbKey) {
        customDbUrl.value = localStorage.getItem('dinedirect_supabase_url') || '';
        customDbKey.value = localStorage.getItem('dinedirect_supabase_anon_key') || '';
    }

    if (btnSaveDbConfig) {
        btnSaveDbConfig.addEventListener('click', () => {
            const url = customDbUrl.value.trim();
            const key = customDbKey.value.trim();
            if (!url || !key) {
                if (window.showToast) window.showToast('❌ Both URL and Key are required.');
                return;
            }
            window.DineDirectStore.saveCustomConnection(url, key);
        });
    }

    if (btnClearDbConfig) {
        btnClearDbConfig.addEventListener('click', () => {
            window.DineDirectStore.saveCustomConnection(null, null);
        });
    }

    if(btnGuestContinue) {
        btnGuestContinue.addEventListener('click', () => {
            window.DineDirectStore.setSession({
                isLoggedIn: false,
                userRole: 'customer',
                currentUser: 'Guest'
            });
            window.location.hash = '#customer/home';
        });
    }

    if(ownerForm) {
        ownerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('ownerEmail').value;
            const password = document.getElementById('ownerPassword').value;
            
            const loggedIn = window.DineDirectStore.loginOwner(email, password);
            if (loggedIn) {
                window.location.hash = '#owner/dashboard';
            } else {
                alert('Invalid Owner credentials. Please try owner@paradise.com / password123 or register.');
            }
        });
    }
};

const setupOwnerSignupListener = () => {
    const signupForm = document.getElementById('ownerSignupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signupRestName').value;
            const email = document.getElementById('signupEmail').value;
            const address = document.getElementById('signupAddress').value;
            const password = document.getElementById('signupPassword').value;

            window.DineDirectStore.registerRestaurant(email, name, address, password);
            window.location.hash = '#owner/dashboard';
        });
    }
};

const Router = () => {
    const fullHash = window.location.hash || '#auth';
    
    // If this is a Supabase OAuth callback hash, let the Supabase client parse it first
    if (fullHash.startsWith('#access_token=') || fullHash.includes('type=recovery') || fullHash.includes('error=')) {
        return;
    }

    const appDiv = document.getElementById('app');
    const hashParts = fullHash.split('?');
    const route = hashParts[0];
    const queryStr = hashParts[1] || '';

    const params = {};
    if (queryStr) {
        queryStr.split('&').forEach(pair => {
            const [key, val] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(val || '');
            }
        });
    }

    // Handle incoming QR table scanning
    if (params.table || params.restaurantId) {
        const session = window.DineDirectStore.getSession();
        const nextTable = params.table || null;
        const nextRest = params.restaurantId || 'r1';
        
        if (session.activeTableNum !== nextTable || session.activeRestaurantId !== nextRest) {
            window.DineDirectStore.setSession({
                activeTableNum: nextTable,
                activeRestaurantId: nextRest,
                userRole: 'customer'
            });
        }
    }

    appDiv.innerHTML = ''; // Clear container

    // Routes Matcher
    if (route === '#auth') {
        appDiv.innerHTML = createAuthView();
        setupAuthListeners();
        startFloatingFood();
    } else if (route === '#owner/signup') {
        appDiv.innerHTML = createOwnerSignupView();
        setupOwnerSignupListener();
        startFloatingFood();
    } else if (route === '#customer/register') {
        appDiv.innerHTML = createRegisterView();
        setupRegisterListeners();
        startFloatingFood();
    } else if (route === '#customer/home') {
        appDiv.innerHTML = window.CustomerViews ? window.CustomerViews.home() : 'Loading...';
        if (window.CustomerViews && window.CustomerViews.setupHomeListeners) {
            window.CustomerViews.setupHomeListeners();
        }
    } else if (route.startsWith('#customer/restaurant/')) {
        const restId = route.split('/').pop();
        // Sync active restaurant in session
        const session = window.DineDirectStore.getSession();
        if (session.activeRestaurantId !== restId) {
            window.DineDirectStore.setSession({ activeRestaurantId: restId });
        }
        appDiv.innerHTML = window.CustomerViews ? window.CustomerViews.restaurant(restId) : 'Loading...';
        if (window.CustomerViews && window.CustomerViews.setupRestaurantListeners) {
            window.CustomerViews.setupRestaurantListeners(restId);
        }
    } else if (route === '#customer/cart') {
        appDiv.innerHTML = window.CustomerViews ? window.CustomerViews.cart() : 'Loading...';
        if (window.CustomerViews && window.CustomerViews.setupCartListeners) {
            window.CustomerViews.setupCartListeners();
        }
    } else if (route === '#customer/booking') {
        appDiv.innerHTML = window.CustomerViews && window.CustomerViews.booking ? window.CustomerViews.booking() : 'Loading...';
        if (window.CustomerViews && window.CustomerViews.setupBookingListeners) {
            window.CustomerViews.setupBookingListeners();
        }
    } else if (route === '#customer/tracking') {
        appDiv.innerHTML = window.CustomerViews ? window.CustomerViews.tracking() : 'Loading...';
        if (window.CustomerViews && window.CustomerViews.setupTrackingListeners) {
            window.CustomerViews.setupTrackingListeners();
        }
    } else if (route === '#customer/orders') {
        appDiv.innerHTML = window.CustomerViews && window.CustomerViews.orders ? window.CustomerViews.orders() : 'Loading...';
        if (window.CustomerViews && window.CustomerViews.setupOrdersListeners) {
            window.CustomerViews.setupOrdersListeners();
        }
    } else if (route === '#customer/profile') {
        appDiv.innerHTML = window.CustomerViews && window.CustomerViews.profile ? window.CustomerViews.profile() : 'Loading...';
        if (window.CustomerViews && window.CustomerViews.setupProfileListeners) {
            window.CustomerViews.setupProfileListeners();
        }
    } else if (route === '#owner/dashboard') {
        appDiv.innerHTML = window.OwnerViews ? window.OwnerViews.dashboard() : 'Loading...';
        if (window.OwnerViews && window.OwnerViews.setupDashboardListeners) {
            window.OwnerViews.setupDashboardListeners();
        }
    } else if (route === '#owner/menu') {
        appDiv.innerHTML = window.OwnerViews ? window.OwnerViews.menu() : 'Loading...';
        if (window.OwnerViews && window.OwnerViews.setupMenuListeners) {
            window.OwnerViews.setupMenuListeners();
        }
    } else if (route === '#owner/tables') {
        appDiv.innerHTML = window.OwnerViews ? window.OwnerViews.tables() : 'Loading...';
        if (window.OwnerViews && window.OwnerViews.setupTablesListeners) {
            window.OwnerViews.setupTablesListeners();
        }
    } else if (route === '#owner/setup') {
        appDiv.innerHTML = window.OwnerViews && window.OwnerViews.setup ? window.OwnerViews.setup() : 'Loading...';
        if (window.OwnerViews && window.OwnerViews.setupSetupListeners) {
            window.OwnerViews.setupSetupListeners();
        }
    } else if (route === '#owner/kds') {
        appDiv.innerHTML = window.OwnerViews && window.OwnerViews.kds ? window.OwnerViews.kds() : 'Loading...';
        if (window.OwnerViews && window.OwnerViews.setupKDSListeners) {
            window.OwnerViews.setupKDSListeners();
        }
    } else if (route === '#owner/analytics') {
        appDiv.innerHTML = window.OwnerViews ? window.OwnerViews.analytics() : 'Loading...';
        if (window.OwnerViews && window.OwnerViews.setupAnalyticsListeners) {
            window.OwnerViews.setupAnalyticsListeners();
        }
    } else if (route === '#owner/chats') {
        appDiv.innerHTML = window.OwnerViews && window.OwnerViews.chats ? window.OwnerViews.chats() : 'Loading...';
        if (window.OwnerViews && window.OwnerViews.setupChatsListeners) {
            window.OwnerViews.setupChatsListeners();
        }
    } else {
        // Default Fallback
        window.location.hash = '#auth';
    }

    // Re-create lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Ensure customer support chatbot is updated on route changes
    if (window.CustomerViews && window.CustomerViews.ensureSupportChatbot) {
        window.CustomerViews.ensureSupportChatbot();
    }
};

// Listeners
window.addEventListener('hashchange', Router);

let prevActiveAlertsCount = 0;
let prevChatMessagesCount = 0;
let prevManagementChatsCount = 0;

const init = () => {
    // Register store subscription
    window.DineDirectStore.subscribe(() => {
        // Always check chatbot updates (e.g. for resolved alerts notifications)
        if (window.CustomerViews && window.CustomerViews.ensureSupportChatbot) {
            window.CustomerViews.ensureSupportChatbot();
        }

        // Real-time notifications and audio chime
        const session = window.DineDirectStore.getSession();
        if (session && session.userRole === 'owner') {
            const restId = session.activeRestaurantId || 'r1';
            
            // 1. Support alert chimes
            const allAlerts = window.DineDirectStore.state.supportAlerts || [];
            const activeAlerts = allAlerts.filter(sa => sa.restaurantId === restId && sa.status === 'active');
            
            if (activeAlerts.length > prevActiveAlertsCount) {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const playBeep = (freq, duration, delay) => {
                        setTimeout(() => {
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.frequency.value = freq;
                            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
                            osc.start();
                            osc.stop(audioCtx.currentTime + duration);
                        }, delay);
                    };
                    playBeep(880, 0.12, 0);
                    playBeep(1200, 0.15, 120);
                } catch (e) {
                    console.error('AudioContext notification sound failed', e);
                }

                const newAlert = activeAlerts[activeAlerts.length - 1];
                if (window.showToast) {
                    window.showToast(`🚨 HELP REQUEST: Table ${newAlert.tableNum} needs help: "${newAlert.message}"`);
                }
            }
            prevActiveAlertsCount = activeAlerts.length;

            // 2. Chat messages chimes for Owner
            const chatMessages = window.DineDirectStore.state.chatMessages || [];
            const customerChats = chatMessages.filter(cm => cm.restaurantId === restId && cm.sender === 'customer');
            
            if (customerChats.length > prevChatMessagesCount) {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const playBeep = (freq, duration, delay) => {
                        setTimeout(() => {
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.frequency.value = freq;
                            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
                            osc.start();
                            osc.stop(audioCtx.currentTime + duration);
                        }, delay);
                    };
                    playBeep(600, 0.15, 0);
                } catch (e) {
                    console.error('AudioContext notification sound failed', e);
                }

                const newMsg = customerChats[customerChats.length - 1];
                if (window.showToast) {
                    window.showToast(`💬 Table ${newMsg.tableNum}: "${newMsg.message}"`);
                }
            }
            prevChatMessagesCount = customerChats.length;
        } else if (session && session.userRole === 'customer') {
            prevActiveAlertsCount = 0;
            prevChatMessagesCount = 0;

            const restId = session.activeRestaurantId || 'r1';
            const tableNum = session.activeTableNum || 'Online';
            const chatMessages = window.DineDirectStore.state.chatMessages || [];
            const managementChats = chatMessages.filter(cm => cm.restaurantId === restId && String(cm.tableNum) === String(tableNum) && cm.sender === 'management');
            
            if (managementChats.length > prevManagementChatsCount) {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const playBeep = (freq, duration, delay) => {
                        setTimeout(() => {
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.frequency.value = freq;
                            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
                            osc.start();
                            osc.stop(audioCtx.currentTime + duration);
                        }, delay);
                    };
                    playBeep(988, 0.15, 0);
                } catch (e) {
                    console.error('AudioContext notification sound failed', e);
                }

                const badge = document.getElementById('aiChatBadge');
                if (badge && document.getElementById('aiChatWindow').classList.contains('d-none')) {
                    badge.textContent = '💬';
                    badge.classList.remove('d-none');
                }
            }
            prevManagementChatsCount = managementChats.length;
        } else {
            prevActiveAlertsCount = 0;
            prevChatMessagesCount = 0;
            prevManagementChatsCount = 0;
        }

        // Skip full routing re-render if we have active modal inputs or popup opened
        const activeModal = document.querySelector('.modal-overlay');
        if (activeModal && !activeModal.classList.contains('d-none')) {
            return;
        }
        
        // Also skip if owner is actively typing in menu forms, chat inputs, or setup forms
        const menuForm = document.getElementById('addItemForm');
        const chatForm = document.getElementById('ownerChatInputForm');
        const infoForm = document.getElementById('restaurantInfoForm');
        const ambForm = document.getElementById('addAmbienceForm');
        const tabForm = document.getElementById('setupAddTableForm');
        if (
            (menuForm && document.activeElement && menuForm.contains(document.activeElement)) ||
            (chatForm && document.activeElement && chatForm.contains(document.activeElement)) ||
            (infoForm && document.activeElement && infoForm.contains(document.activeElement)) ||
            (ambForm && document.activeElement && ambForm.contains(document.activeElement)) ||
            (tabForm && document.activeElement && tabForm.contains(document.activeElement))
        ) {
            return;
        }

        Router();
    });
};

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
