// Dine Direct Application Router & Coordinator

const createAuthView = () => {
    const session = window.DineDirectStore.getSession();
    const tableNumText = session.activeTableNum ? ` at Table ${session.activeTableNum}` : '';
    return `
        <div class="auth-wrapper animate-fade-in">
            <!-- Glowing background blobs -->
            <div class="bg-blob bg-blob-1"></div>
            <div class="bg-blob bg-blob-2"></div>
            <div class="bg-blob bg-blob-3"></div>

            <div class="auth-card">
                <!-- Left column: Marketing banner (Desktop) -->
                <div class="auth-banner">
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
                        <i data-lucide="utensils-cross" style="color:var(--primary);"></i> Dine Direct
                    </h1>
                    <p class="text-muted mb-4" style="font-size:0.9rem; color:#94a3b8 !important;">
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

                    <!-- Customer Step 1: Contact Form -->
                    <form id="customerForm">
                        <div class="form-group">
                            <label style="color:#94a3b8; font-size:0.8rem;">Phone Number or Email</label>
                            <input type="text" class="form-control" id="customerEmail" placeholder="Enter details to continue" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block mb-3" style="box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);">
                            <i data-lucide="arrow-right"></i> Continue
                        </button>
                        <div class="text-center">
                            <button type="button" class="btn btn-outline-premium btn-block" id="btnGuestContinue">
                                <i data-lucide="user-plus"></i> Continue as Guest
                            </button>
                        </div>
                    </form>

                    <!-- Customer Step 2: OTP & Name Form (Hidden by default) -->
                    <form id="customerOtpForm" class="d-none animate-fade-in">
                        <div class="form-group">
                            <label style="color:#94a3b8; font-size:0.8rem;">Your Full Name</label>
                            <input type="text" class="form-control" id="customerNameInput" placeholder="e.g. John Doe" required>
                        </div>
                        <div class="form-group">
                            <label style="color:#94a3b8; font-size:0.8rem; display:block; margin-bottom:8px;">4-Digit OTP Code</label>
                            <div style="display:flex; gap:12px; justify-content:space-between; margin-bottom:8px;">
                                <input type="text" class="form-control otp-digit" maxlength="1" style="text-align:center; font-size:1.4rem; font-weight:bold; padding:10px 0 !important; width:54px; height:50px; background:#fff !important; border:1.5px solid #cbd5e1 !important; color:#1e293b !important;" required>
                                <input type="text" class="form-control otp-digit" maxlength="1" style="text-align:center; font-size:1.4rem; font-weight:bold; padding:10px 0 !important; width:54px; height:50px; background:#fff !important; border:1.5px solid #cbd5e1 !important; color:#1e293b !important;" required disabled>
                                <input type="text" class="form-control otp-digit" maxlength="1" style="text-align:center; font-size:1.4rem; font-weight:bold; padding:10px 0 !important; width:54px; height:50px; background:#fff !important; border:1.5px solid #cbd5e1 !important; color:#1e293b !important;" required disabled>
                                <input type="text" class="form-control otp-digit" maxlength="1" style="text-align:center; font-size:1.4rem; font-weight:bold; padding:10px 0 !important; width:54px; height:50px; background:#fff !important; border:1.5px solid #cbd5e1 !important; color:#1e293b !important;" required disabled>
                            </div>
                            <p class="text-muted" style="font-size:0.75rem; text-align:left; color:#64748b !important;">
                                Code sent to <strong id="otpSentTarget">user@example.com</strong>
                            </p>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block mb-3" style="box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);">
                            <i data-lucide="shield-check"></i> Verify & Login
                        </button>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; padding-top:8px;">
                            <a href="#" id="btnBackToLogin" style="color:#64748b; text-decoration:none; font-weight:500;">
                                <i data-lucide="arrow-left" style="width:14px;height:14px;vertical-align:middle;margin-right:2px;"></i> Back
                            </a>
                            <a href="#" id="btnResendOtp" style="color:var(--primary); text-decoration:none; font-weight:600;">Resend OTP</a>
                        </div>
                    </form>

                    <!-- Owner Form -->
                    <form id="ownerForm" class="d-none">
                        <div class="form-group">
                            <label style="color:#94a3b8; font-size:0.8rem;">Business Email</label>
                            <input type="email" class="form-control" id="ownerEmail" placeholder="restaurant@example.com" required>
                        </div>
                        <div class="form-group">
                            <label style="color:#94a3b8; font-size:0.8rem;">Password</label>
                            <input type="password" class="form-control" id="ownerPassword" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block mb-3" style="box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);">
                            <i data-lucide="building"></i> Owner Login
                        </button>
                        <p class="text-center">
                            <a href="#owner/signup" class="text-muted" style="font-size:0.85rem; color:#94a3b8 !important;">
                                Register new restaurant
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    `;
};

const createOwnerSignupView = () => {
    return `
        <div class="auth-wrapper animate-fade-in">
            <!-- Glowing background blobs -->
            <div class="bg-blob bg-blob-1"></div>
            <div class="bg-blob bg-blob-2"></div>
            <div class="bg-blob bg-blob-3"></div>

            <div class="auth-card" style="max-width: 450px;">
                <div class="auth-form-side" style="padding: 40px; background: rgba(30, 41, 59, 0.65);">
                    <h1 class="logo-large mb-2" style="justify-content:center;">
                        <i data-lucide="building" style="color:var(--primary);"></i> Onboard Business
                    </h1>
                    <p class="text-center text-muted mb-4" style="font-size:0.85rem; color:#94a3b8 !important;">
                        Register your restaurant and print QR codes in minutes.
                    </p>
                    
                    <form id="ownerSignupForm">
                        <div class="form-group">
                            <label style="color:#94a3b8; font-size:0.8rem;">Restaurant Name</label>
                            <input type="text" id="signupRestName" class="form-control" placeholder="e.g. Paradise Biryani" required>
                        </div>
                        <div class="form-group">
                            <label style="color:#94a3b8; font-size:0.8rem;">Business Email</label>
                            <input type="email" id="signupEmail" class="form-control" placeholder="owner@paradise.com" required>
                        </div>
                        <div class="form-group">
                            <label style="color:#94a3b8; font-size:0.8rem;">Address / Location</label>
                            <input type="text" id="signupAddress" class="form-control" placeholder="e.g. Secunderabad" required>
                        </div>
                        <div class="form-group">
                            <label style="color:#94a3b8; font-size:0.8rem;">Password</label>
                            <input type="password" id="signupPassword" class="form-control" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block mb-3" style="box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);">
                            <i data-lucide="check-circle2"></i> Complete Onboarding
                        </button>
                        <p class="text-center" style="font-size:0.85rem;">
                            <a href="#auth" class="text-muted" style="color:#94a3b8 !important;">Already have account? Login</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    `;
};

const setupAuthListeners = () => {
    const btnCustomer = document.getElementById('btnCustomer');
    const btnOwner = document.getElementById('btnOwner');
    const customerForm = document.getElementById('customerForm');
    const customerOtpForm = document.getElementById('customerOtpForm');
    const ownerForm = document.getElementById('ownerForm');
    const btnGuestContinue = document.getElementById('btnGuestContinue');
    const btnBackToLogin = document.getElementById('btnBackToLogin');
    const btnResendOtp = document.getElementById('btnResendOtp');
    const authRoleToggle = document.getElementById('authRoleToggle');

    // Generate random 4-digit OTP
    const triggerOtpSimulation = (contact) => {
        const code = Math.floor(1000 + Math.random() * 9000);
        window.activeOtp = String(code);
        
        // Dynamic notification toast
        setTimeout(() => {
            if (window.showToast) {
                window.showToast(`🔑 Verification code for Dine Direct is: ${code}`);
            } else {
                alert(`Verification Code: ${code}`);
            }
        }, 800);
    };

    if(btnCustomer && btnOwner) {
        btnCustomer.addEventListener('click', () => {
            btnCustomer.classList.add('active');
            btnOwner.classList.remove('active');
            customerForm.classList.remove('d-none');
            customerOtpForm.classList.add('d-none');
            ownerForm.classList.add('d-none');
        });

        btnOwner.addEventListener('click', () => {
            btnOwner.classList.add('active');
            btnCustomer.classList.remove('active');
            ownerForm.classList.remove('d-none');
            customerForm.classList.add('d-none');
            customerOtpForm.classList.add('d-none');
        });
    }

    if(customerForm) {
        customerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const contact = document.getElementById('customerEmail').value;
            
            // Show OTP step
            document.getElementById('otpSentTarget').textContent = contact;
            customerForm.classList.add('d-none');
            customerOtpForm.classList.remove('d-none');
            authRoleToggle.classList.add('d-none'); // Hide toggle in OTP screen

            // Trigger OTP
            triggerOtpSimulation(contact);

            // Focus first digit
            const firstDigit = document.querySelector('.otp-digit');
            if (firstDigit) firstDigit.focus();
        });
    }

    // OTP Input digits focus transitions
    const otpDigits = document.querySelectorAll('.otp-digit');
    otpDigits.forEach((digit, idx) => {
        digit.addEventListener('input', (e) => {
            // Allow only numbers
            digit.value = digit.value.replace(/[^0-9]/g, '');
            
            if (digit.value.length === 1 && idx < otpDigits.length - 1) {
                otpDigits[idx + 1].removeAttribute('disabled');
                otpDigits[idx + 1].focus();
            }
        });

        digit.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && digit.value === '' && idx > 0) {
                otpDigits[idx - 1].focus();
            }
        });
    });

    if (btnBackToLogin) {
        btnBackToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            customerOtpForm.classList.add('d-none');
            customerForm.classList.remove('d-none');
            authRoleToggle.classList.remove('d-none');
            
            // Clear inputs
            otpDigits.forEach(d => {
                d.value = '';
                if (d !== otpDigits[0]) d.setAttribute('disabled', 'true');
            });
            document.getElementById('customerNameInput').value = '';
        });
    }

    if (btnResendOtp) {
        btnResendOtp.addEventListener('click', (e) => {
            e.preventDefault();
            const contact = document.getElementById('otpSentTarget').textContent;
            
            // Clear current inputs
            otpDigits.forEach(d => {
                d.value = '';
                if (d !== otpDigits[0]) d.setAttribute('disabled', 'true');
            });
            otpDigits[0].focus();

            triggerOtpSimulation(contact);
        });
    }

    if(customerOtpForm) {
        customerOtpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('customerNameInput').value;
            const enteredOtp = Array.from(otpDigits).map(d => d.value).join('');

            if (enteredOtp === window.activeOtp) {
                window.DineDirectStore.setSession({
                    isLoggedIn: true,
                    userRole: 'customer',
                    currentUser: name
                });
                window.location.hash = '#customer/home';
                if (window.showToast) window.showToast(`Welcome, ${name}!`);
            } else {
                if (window.showToast) {
                    window.showToast('❌ Incorrect verification code. Resend OTP to try again.');
                } else {
                    alert('Incorrect verification code.');
                }
            }
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
    const appDiv = document.getElementById('app');
    const fullHash = window.location.hash || '#auth';

    // Parse hash and query params
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
    } else if (route === '#owner/signup') {
        appDiv.innerHTML = createOwnerSignupView();
        setupOwnerSignupListener();
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

window.addEventListener('DOMContentLoaded', () => {
    // Register store subscription
    window.DineDirectStore.subscribe(() => {
        // Always check chatbot updates (e.g. for resolved alerts notifications)
        if (window.CustomerViews && window.CustomerViews.ensureSupportChatbot) {
            window.CustomerViews.ensureSupportChatbot();
        }

        // Real-time notifications and audio chime for Owner
        const session = window.DineDirectStore.getSession();
        if (session && session.userRole === 'owner') {
            const restId = session.activeRestaurantId || 'r1';
            const allAlerts = window.DineDirectStore.state.supportAlerts || [];
            const activeAlerts = allAlerts.filter(sa => sa.restaurantId === restId && sa.status === 'active');
            
            if (activeAlerts.length > prevActiveAlertsCount) {
                // Play soft notification double-beep
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

                // Show toast alert
                const newAlert = activeAlerts[activeAlerts.length - 1];
                if (window.showToast) {
                    window.showToast(`🚨 HELP REQUEST: Table ${newAlert.tableNum} needs help: "${newAlert.message}"`);
                }
            }
            prevActiveAlertsCount = activeAlerts.length;
        } else {
            prevActiveAlertsCount = 0;
        }

        // Skip full routing re-render if we have active modal inputs or popup opened
        const activeModal = document.querySelector('.modal-overlay');
        if (activeModal && !activeModal.classList.contains('d-none')) {
            return;
        }
        
        // Also skip if owner is actively typing in menu forms
        const menuForm = document.getElementById('addItemForm');
        if (menuForm && document.activeElement && menuForm.contains(document.activeElement)) {
            return;
        }

        Router();
    });
});
