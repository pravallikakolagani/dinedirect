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
                <div class="auth-card auth-card-single">
                    <!-- Right column: Interactive Form Pane -->
                    <div class="auth-form-side">
                        <!-- Top Icon to match sample page -->
                        <div class="text-center mb-3">
                            <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: rgba(255, 107, 53, 0.15); border-radius: 50%; border: 1.5px solid rgba(255, 107, 53, 0.3);">
                                <i data-lucide="utensils-cross" style="color:#ff6b35; width:28px; height:28px;"></i>
                            </div>
                        </div>

                        <h1 class="logo-large mb-1" style="justify-content: center; font-size: 2.2rem; background: linear-gradient(135deg, #ffffff, #ffe5d9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            Dine Direct
                        </h1>
                        <p class="text-center mb-4" style="font-size:0.88rem; color:rgba(255,255,255,0.6) !important; font-weight:500;">
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

                        <!-- Customer OTP Flow Forms -->
                        <div id="customerLoginForm" class="login">
                            <!-- Pane 1: Enter Email (Step 1) -->
                            <div id="otpEmailPane">
                                <div class="form-group mb-3 text-left">
                                    <label>Email Address</label>
                                    <input type="email" class="form-control" id="loginEmailInput" placeholder="you@example.com" required style="width:100%;">
                                </div>

                                <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
                                    <button type="button" class="btn btn-primary btn-block" id="btnSendOtp">
                                        <i data-lucide="send"></i> Send Verification Code
                                    </button>
                                </div>

                                <div class="text-center mb-3">
                                    <button type="button" class="btn btn-outline-premium btn-block" id="btnGuestContinue">
                                        <i data-lucide="user-check"></i> Continue as Guest
                                    </button>
                                </div>
                            </div>

                            <!-- Pane 2: Enter Verification Code (Step 2) -->
                            <div id="otpCodePane" class="d-none">
                                <p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-bottom: 20px; line-height: 1.4; text-align: center;">
                                    We have sent a 6-digit verification code to <br><strong id="otpSentEmailSpan" style="color:#ff8c5f;"></strong>.
                                </p>

                                <div class="form-group mb-3 text-left">
                                    <label>Verification Code</label>
                                    <input type="text" class="form-control text-center" id="loginOtpInput" placeholder="••••••" maxlength="6" style="width:100%; letter-spacing: 0.5em; font-size: 1.25rem; font-weight: 700;">
                                </div>

                                <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
                                    <button type="button" class="btn btn-primary btn-block" id="btnVerifyOtp">
                                        <i data-lucide="shield-check"></i> Verify & Log In
                                    </button>
                                </div>

                                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; padding:0 4px;">
                                    <a href="#" id="linkChangeEmail" class="btn-link-premium">
                                        <i data-lucide="arrow-left" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Change Email
                                    </a>
                                    <a href="#" id="linkResendOtp" class="btn-link-premium">
                                        <i data-lucide="refresh-cw" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Resend Code
                                    </a>
                                </div>
                            </div>

                            <!-- Connection Settings Toggle Link -->
                            <div class="text-center" style="margin-top: 24px;">
                                <a href="#" id="toggleConnectionSettings" style="color:rgba(255,255,255,0.6) !important; font-size:0.82rem; text-decoration:none; font-weight:600; display:inline-flex; align-items:center; gap:6px; opacity:0.95; transition:color 0.2s;" onmouseover="this.style.color='#ff8c5f'" onmouseout="this.style.color='rgba(255,255,255,0.6)'">
                                    <i data-lucide="settings" style="width:13px; height:13px; vertical-align:middle;"></i> DB Connection Settings
                                </a>
                            </div>

                            <!-- Connection Settings Panel (Collapsible) -->
                            <div id="connectionSettingsPanel" class="d-none mt-3 p-3" style="background:rgba(15, 23, 42, 0.4); border:1px solid rgba(255, 255, 255, 0.08); border-radius:12px; text-align:left;">
                                <h6 style="font-size:0.8rem; font-weight:700; color:#ffffff; margin-bottom:12px;">Custom Supabase Connection</h6>
                                <div class="form-group mb-2">
                                    <label style="font-size:0.7rem; color:rgba(255,255,255,0.7); font-weight:600;">Supabase URL</label>
                                    <input type="text" class="form-control form-control-sm" id="customDbUrl" placeholder="https://xxx.supabase.co" style="font-size:0.75rem; height:32px; background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.12);">
                                </div>
                                <div class="form-group mb-3">
                                    <label style="font-size:0.7rem; color:rgba(255,255,255,0.7); font-weight:600;">Supabase Anon Key</label>
                                    <input type="text" class="form-control form-control-sm" id="customDbKey" placeholder="sb_publishable_..." style="font-size:0.75rem; height:32px; background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.12);">
                                </div>
                                <div style="display:flex; gap:8px;">
                                    <button type="button" class="btn btn-sm btn-primary" id="btnSaveDbConfig" style="font-size:0.75rem; padding:6px 8px; flex:1; height:auto; line-height:1;">Save & Reload</button>
                                    <button type="button" class="btn btn-sm btn-outline-premium" id="btnClearDbConfig" style="font-size:0.75rem; padding:6px 8px; height:auto; line-height:1;">Reset</button>
                                </div>
                            </div>
                        </div>

                        <!-- Owner Form -->
                        <form id="ownerForm" class="d-none login">
                            <div class="form-group mb-3 text-left">
                                <label>Business Email</label>
                                <input type="email" class="form-control" id="ownerEmail" placeholder="restaurant@example.com" required style="width:100%;">
                            </div>
                            <div class="form-group mb-3 text-left">
                                <label>Password</label>
                                <input type="password" class="form-control" id="ownerPassword" placeholder="••••••••" required style="width:100%;">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block mb-3">
                                <i data-lucide="building"></i> Owner Login
                            </button>
                            <p class="text-center" style="font-size:0.85rem; color:rgba(255,255,255,0.5); margin:0;">
                                <a href="#owner/signup" class="btn-link-premium" style="font-weight:600;">
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
                <div class="auth-card auth-card-single">
                    <div class="auth-form-side">
                        <!-- Top Icon -->
                        <div class="text-center mb-3">
                            <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: rgba(255, 107, 53, 0.15); border-radius: 50%; border: 1.5px solid rgba(255, 107, 53, 0.3);">
                                <i data-lucide="user-check" style="color:#ff6b35; width:28px; height:28px;"></i>
                            </div>
                        </div>

                        <h1 class="logo-large mb-1" style="justify-content: center; font-size: 2.2rem; background: linear-gradient(135deg, #ffffff, #ffe5d9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            Complete Profile
                        </h1>
                        <p class="text-center mb-4" style="font-size:0.88rem; color:rgba(255,255,255,0.6) !important; font-weight:500;">
                            Please enter your details to complete registration.
                        </p>
                        
                        <form id="customerRegisterForm" class="login">
                            <div class="form-group mb-3 text-left">
                                <label>Full Name</label>
                                <input type="text" id="registerNameInput" class="form-control" placeholder="e.g. John Doe" required style="width:100%;">
                            </div>
                            <div class="form-group mb-3 text-left">
                                <label>Phone Number</label>
                                <input type="tel" id="registerPhoneInput" class="form-control" placeholder="e.g. +91 98765 43210" required style="width:100%;">
                            </div>
                            <div class="form-group mb-4 text-left">
                                <label>Create a Password (Optional)</label>
                                <input type="password" id="registerPasswordInput" class="form-control" placeholder="•••••••• (Min 6 chars)" style="width:100%;">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block mb-3">
                                <i data-lucide="check-circle"></i> Save & Continue
                            </button>
                            <div class="text-center mt-3">
                                <a href="#auth" id="btnCancelRegister" class="btn-link-premium" style="font-weight:600; font-size:0.85rem; cursor:pointer; text-decoration:none;">
                                    Cancel & Sign Out
                                </a>
                            </div>
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

    const btnCancelRegister = document.getElementById('btnCancelRegister');
    if (btnCancelRegister) {
        btnCancelRegister.addEventListener('click', async (e) => {
            e.preventDefault();
            await store.logout();
            window.location.hash = '#auth';
        });
    }

    const registerForm = document.getElementById('customerRegisterForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerNameInput').value.trim();
            const phone = document.getElementById('registerPhoneInput').value.trim();
            const password = document.getElementById('registerPasswordInput').value.trim() || null;
 
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
                    address: '',
                    password
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

    // Panes
    const otpEmailPane = document.getElementById('otpEmailPane');
    const otpCodePane = document.getElementById('otpCodePane');

    // Customer OTP buttons
    const btnSendOtp = document.getElementById('btnSendOtp');
    const btnVerifyOtp = document.getElementById('btnVerifyOtp');
    const linkChangeEmail = document.getElementById('linkChangeEmail');
    const linkResendOtp = document.getElementById('linkResendOtp');

    // Customer OTP inputs
    const loginEmailInput = document.getElementById('loginEmailInput');
    const loginOtpInput = document.getElementById('loginOtpInput');
    const otpSentEmailSpan = document.getElementById('otpSentEmailSpan');


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

    // OTP Send Action
    if (btnSendOtp) {
        btnSendOtp.addEventListener('click', async () => {
            const email = loginEmailInput.value.trim();
            if (!email || !email.includes('@')) {
                if (window.showToast) window.showToast('❌ Please enter a valid email address.');
                return;
            }
            const store = window.DineDirectStore;
            
            if (window.showToast) window.showToast('✉️ Sending verification code...');
            try {
                const res = await store.sendEmailOtp(email);
                if (res && res.isFallback) {
                    if (window.showToast) window.showToast('🔔 Offline Mode: Demo code is 123456');
                    if (loginOtpInput) loginOtpInput.value = '123456';
                } else {
                    if (window.showToast) window.showToast('📧 Verification code sent to your email!');
                }
                
                // Switch panes
                if (otpSentEmailSpan) otpSentEmailSpan.textContent = email;
                if (otpEmailPane) otpEmailPane.classList.add('d-none');
                if (otpCodePane) otpCodePane.classList.remove('d-none');
                
                // Auto focus code input
                if (loginOtpInput) {
                    loginOtpInput.focus();
                }
            } catch (err) {
                console.error(err);
                if (window.showToast) window.showToast(`❌ Failed to send code: ${err.message}`);
            }
        });
    }

    // OTP Verify Action
    if (btnVerifyOtp) {
        btnVerifyOtp.addEventListener('click', async () => {
            const email = loginEmailInput.value.trim();
            const token = loginOtpInput.value.trim();
            if (!email) {
                if (window.showToast) window.showToast('❌ Email address is missing. Please go back.');
                return;
            }
            if (!token || token.length < 6) {
                if (window.showToast) window.showToast('❌ Please enter the 6-digit verification code.');
                return;
            }
            const store = window.DineDirectStore;
            
            if (window.showToast) window.showToast('🔑 Verifying code...');
            try {
                await store.verifyEmailOtp(email, token);
                if (window.showToast) window.showToast('✅ Verification successful! Welcome.');
                window.location.hash = '#customer/home';
            } catch (err) {
                console.error(err);
                if (window.showToast) window.showToast(`❌ Verification failed: ${err.message}`);
            }
        });
    }

    // Change Email (Go back to Step 1)
    if (linkChangeEmail) {
        linkChangeEmail.addEventListener('click', (e) => {
            e.preventDefault();
            if (otpCodePane) otpCodePane.classList.add('d-none');
            if (otpEmailPane) otpEmailPane.classList.remove('d-none');
            if (loginEmailInput) loginEmailInput.focus();
        });
    }

    // Resend Code Action
    if (linkResendOtp) {
        linkResendOtp.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = loginEmailInput.value.trim();
            if (!email) return;
            const store = window.DineDirectStore;
            if (!store.supabase) return;
            
            if (window.showToast) window.showToast('✉️ Resending code...');
            try {
                await store.sendEmailOtp(email);
                if (window.showToast) window.showToast('📧 A new verification code has been sent!');
            } catch (err) {
                console.error(err);
                if (window.showToast) window.showToast(`❌ Resend failed: ${err.message}`);
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
    if (fullHash.startsWith('#access_token=') || fullHash.includes('type=recovery')) {
        return;
    }

    // Parse and show authentication errors from the URL hash (like expired links)
    if (fullHash.includes('error=')) {
        const hashParams = new URLSearchParams(fullHash.substring(1));
        const errorDesc = hashParams.get('error_description') || 'Authentication link is invalid or has expired.';
        if (window.showToast) window.showToast(`❌ Login failed: ${errorDesc.replace(/\+/g, ' ')}`);
        window.location.hash = '#auth';
        return;
    }

    const appDiv = document.getElementById('app');
    const hashParts = fullHash.split('?');
    const route = hashParts[0];
    const queryStr = hashParts[1] || '';

    // Auto-redirect logged-in users away from auth screen
    const session = window.DineDirectStore.getSession();
    if (session && session.isLoggedIn) {
        if (route === '#auth' || route === '#owner/signup') {
            if (session.userRole === 'customer') {
                const profile = window.DineDirectStore.state.profile;
                if (!profile || !profile.phone || !profile.address) {
                    window.location.hash = '#customer/register';
                } else {
                    window.location.hash = '#customer/home';
                }
                return;
            } else if (session.userRole === 'owner') {
                window.location.hash = '#owner/dashboard';
                return;
            }
        }
    }

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
    if (route === '#home' || route === '') {
        appDiv.innerHTML = window.MarketingViews ? window.MarketingViews.marketing() : 'Loading...';
        if (window.MarketingViews && window.MarketingViews.setupMarketingListeners) {
            window.MarketingViews.setupMarketingListeners();
        }
    } else if (route === '#auth') {
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
        window.location.hash = '#home';
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
