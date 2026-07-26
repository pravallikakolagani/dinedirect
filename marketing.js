// Dine Direct Public Marketing Landing Page View & Controllers

export const createMarketingView = () => {
    return `
        <style>
            /* Reset & Core Marketing Styles */
            .marketing-body {
                font-family: 'Outfit', 'Inter', sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                color: #f8fafc;
                overflow-x: hidden;
                scroll-behavior: smooth;
                min-height: 100vh;
            }

            /* Container */
            .m-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 24px;
            }

            /* Navbar */
            .m-navbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .m-logo {
                font-size: 1.5rem;
                font-weight: 700;
                color: #ff6b35;
                display: flex;
                align-items: center;
                gap: 8px;
                text-decoration: none;
            }
            .m-nav-links {
                display: flex;
                gap: 32px;
                align-items: center;
            }
            .m-nav-link {
                color: rgba(248, 250, 252, 0.8);
                text-decoration: none;
                font-size: 0.95rem;
                font-weight: 500;
                transition: color 0.2s;
            }
            .m-nav-link:hover {
                color: #ff6b35;
            }
            .m-btn {
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.9rem;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .m-btn-ghost {
                color: #f8fafc;
                background: transparent;
                border: 1.5px solid rgba(255, 255, 255, 0.2);
            }
            .m-btn-ghost:hover {
                border-color: #ff6b35;
                color: #ff6b35;
            }
            .m-btn-primary {
                background: #ff6b35;
                color: #ffffff;
                border: none;
                box-shadow: 0 4px 14px rgba(255, 107, 53, 0.3);
            }
            .m-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
            }

            /* Hero Section */
            .m-hero {
                padding: 80px 0;
                display: grid;
                grid-template-columns: 1.2fr 1fr;
                gap: 48px;
                align-items: center;
            }
            .m-hero-title {
                font-size: 3.5rem;
                font-weight: 700;
                line-height: 1.15;
                margin-bottom: 24px;
                background: linear-gradient(to right, #ffffff, #ff9e7d);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .m-hero-subtitle {
                font-size: 1.2rem;
                color: rgba(248, 250, 252, 0.7);
                line-height: 1.6;
                margin-bottom: 36px;
            }
            .m-hero-ctas {
                display: flex;
                gap: 16px;
            }

            /* Floating Mockup Screen */
            .m-mockup {
                background: rgba(255, 255, 255, 0.05);
                border: 1.5px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 24px;
                backdrop-filter: blur(10px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                position: relative;
                animation: floatAnim 4s ease-in-out infinite alternate;
            }
            @keyframes floatAnim {
                0% { transform: translateY(0); }
                100% { transform: translateY(-15px); }
            }
            .m-mockup-flow-step {
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 14px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .m-mockup-flow-step:last-child { margin-bottom: 0; }
            .m-step-badge {
                width: 28px;
                height: 28px;
                background: rgba(255, 107, 53, 0.2);
                color: #ff6b35;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 0.85rem;
            }

            /* Trusted By Section */
            .m-trusted {
                padding: 40px 0;
                text-align: center;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            .m-trusted-title {
                font-size: 0.85rem;
                font-weight: 600;
                color: rgba(248, 250, 252, 0.4);
                text-transform: uppercase;
                letter-spacing: 0.15em;
                margin-bottom: 24px;
            }
            .m-trusted-logos {
                display: flex;
                justify-content: space-around;
                flex-wrap: wrap;
                gap: 24px;
            }
            .m-logo-item {
                font-size: 1.1rem;
                font-weight: 600;
                color: rgba(248, 250, 252, 0.35);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            /* Problem & Solution */
            .m-section-header {
                text-align: center;
                max-width: 600px;
                margin: 80px auto 48px;
            }
            .m-section-header h2 {
                font-size: 2.2rem;
                font-weight: 700;
                margin-bottom: 16px;
            }
            .m-section-header p {
                color: rgba(248, 250, 252, 0.65);
                font-size: 1.05rem;
                line-height: 1.5;
            }
            .m-comparison {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 32px;
                margin-bottom: 80px;
            }
            .m-comparison-card {
                padding: 32px;
                border-radius: 16px;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.06);
            }
            .m-comparison-card.bad {
                border-left: 4px solid #ef4444;
            }
            .m-comparison-card.good {
                border-left: 4px solid #10b981;
                background: rgba(16, 185, 129, 0.02);
            }

            /* Features Grid */
            .m-features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 24px;
                margin-bottom: 80px;
            }
            .m-feature-card {
                padding: 28px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 16px;
                transition: all 0.3s;
            }
            .m-feature-card:hover {
                transform: translateY(-5px);
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 107, 53, 0.3);
            }
            .m-feature-icon {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                background: rgba(255, 107, 53, 0.1);
                color: #ff6b35;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
            }

            /* Interactive Preview System */
            .m-preview-tabs {
                display: flex;
                justify-content: center;
                gap: 16px;
                margin-bottom: 32px;
            }
            .m-tab-btn {
                padding: 12px 24px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: rgba(248, 250, 252, 0.6);
                border-radius: 30px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .m-tab-btn.active {
                background: #ff6b35;
                color: #fff;
                border-color: #ff6b35;
                box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
            }
            .m-preview-window {
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 24px;
                min-height: 380px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.4);
                margin-bottom: 80px;
            }

            /* Pricing Plans */
            .m-pricing {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 28px;
                margin-bottom: 80px;
            }
            .m-price-card {
                padding: 40px 32px;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 20px;
                display: flex;
                flex-direction: column;
                position: relative;
                transition: all 0.3s;
            }
            .m-price-card.popular {
                background: rgba(255, 107, 53, 0.03);
                border-color: #ff6b35;
            }
            .m-price-card:hover {
                transform: translateY(-5px);
            }
            .m-popular-badge {
                position: absolute;
                top: 20px;
                right: 20px;
                background: #ff6b35;
                color: #fff;
                font-size: 0.75rem;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 20px;
                text-transform: uppercase;
            }
            .m-price-title {
                font-size: 1.3rem;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .m-price-amount {
                font-size: 2.5rem;
                font-weight: 700;
                margin: 20px 0;
            }
            .m-price-amount span {
                font-size: 1rem;
                font-weight: 500;
                color: rgba(248, 250, 252, 0.5);
            }
            .m-price-features {
                list-style: none;
                padding: 0;
                margin: 0 0 32px 0;
                display: flex;
                flex-direction: column;
                gap: 14px;
                flex: 1;
            }
            .m-price-features li {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.95rem;
                color: rgba(248, 250, 252, 0.75);
            }

            /* FAQ Accordion */
            .m-faq-list {
                max-width: 800px;
                margin: 0 auto 80px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .m-faq-item {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 12px;
                overflow: hidden;
            }
            .m-faq-header {
                padding: 20px 24px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background 0.2s;
            }
            .m-faq-header:hover {
                background: rgba(255, 255, 255, 0.04);
            }
            .m-faq-content {
                padding: 0 24px;
                max-height: 0;
                overflow: hidden;
                transition: all 0.3s ease-out;
                color: rgba(248, 250, 252, 0.7);
                line-height: 1.6;
                font-size: 0.95rem;
            }

            /* Footer */
            .m-footer {
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding: 60px 0 30px;
                background: rgba(15, 23, 42, 0.3);
            }
            .m-footer-grid {
                display: grid;
                grid-template-columns: 1.5fr 1fr 1fr 1fr;
                gap: 48px;
                margin-bottom: 40px;
            }
            .m-footer-title {
                font-weight: 700;
                font-size: 1rem;
                margin-bottom: 20px;
            }
            .m-footer-links {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .m-footer-links a {
                color: rgba(248, 250, 252, 0.6);
                text-decoration: none;
                transition: color 0.2s;
                font-size: 0.9rem;
            }
            .m-footer-links a:hover {
                color: #ff6b35;
            }
            .m-footer-bottom {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                padding-top: 24px;
                font-size: 0.85rem;
                color: rgba(248, 250, 252, 0.4);
            }

            /* Responsive */
            @media (max-width: 768px) {
                .m-hero {
                    grid-template-columns: 1fr;
                    text-align: center;
                    padding: 40px 0;
                }
                .m-hero-title {
                    font-size: 2.5rem;
                }
                .m-hero-ctas {
                    justify-content: center;
                }
                .m-comparison {
                    grid-template-columns: 1fr;
                }
                .m-footer-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
        </style>

        <div class="marketing-body animate-fade-in">
            <!-- Navbar -->
            <header class="m-navbar m-container">
                <a href="#home" class="m-logo">
                    <i data-lucide="utensils" style="stroke-width:2.5;"></i> Dine Direct
                </a>
                <nav class="m-nav-links">
                    <a href="#features" class="m-nav-link">Features</a>
                    <a href="#how-it-works" class="m-nav-link">How It Works</a>
                    <a href="#pricing" class="m-nav-link">Pricing</a>
                    <a href="#faq" class="m-nav-link">FAQs</a>
                    <a href="#auth" class="m-btn m-btn-ghost">Log In</a>
                    <a href="#owner/signup" class="m-btn m-btn-primary">Onboard Business</a>
                </nav>
            </header>

            <!-- Hero Section -->
            <section class="m-hero m-container">
                <div>
                    <h1 class="m-hero-title">The Smart Restaurant Operating System</h1>
                    <p class="m-hero-subtitle">Digitize your restaurant with contactless QR table ordering, AI-powered menu suggestions, real-time KDS dispatching, and business sales analytics.</p>
                    <div class="m-hero-ctas">
                        <a href="#owner/signup" class="m-btn m-btn-primary">
                            <i data-lucide="building"></i> Register Restaurant
                        </a>
                        <a href="#customer/home" class="m-btn m-btn-ghost">
                            <i data-lucide="map-pin"></i> Explore Restaurants
                        </a>
                    </div>
                </div>
                <div>
                    <div class="m-mockup">
                        <h4 style="margin: 0 0 16px 0; color:#ff6b35; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                            <i data-lucide="zap"></i> Instant Order Cycle
                        </h4>
                        <div class="m-mockup-flow-step">
                            <div class="m-step-badge">1</div>
                            <div>
                                <strong style="display:block; font-size:0.9rem;">Customer Scans QR</strong>
                                <span style="font-size:0.75rem; color:rgba(255,255,255,0.5);">Table 4 checks in and opens digital menu.</span>
                            </div>
                        </div>
                        <div class="m-mockup-flow-step">
                            <div class="m-step-badge">2</div>
                            <div>
                                <strong style="display:block; font-size:0.9rem;">Adds Special Biryani</strong>
                                <span style="font-size:0.75rem; color:rgba(255,255,255,0.5);">Customizes spiciness and orders.</span>
                            </div>
                        </div>
                        <div class="m-mockup-flow-step">
                            <div class="m-step-badge">3</div>
                            <div>
                                <strong style="display:block; font-size:0.9rem;">Kitchen Receives Instantly</strong>
                                <span style="font-size:0.75rem; color:rgba(255,255,255,0.5);">KDS display alerts chef with order detail.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Trusted By -->
            <section class="m-trusted m-container">
                <div class="m-trusted-title">Empowering Multiple Dining Formats</div>
                <div class="m-trusted-logos">
                    <div class="m-logo-item"><i data-lucide="coffee"></i> Irani Cafes</div>
                    <div class="m-logo-item"><i data-lucide="utensils-cross"></i> Fine Dining</div>
                    <div class="m-logo-item"><i data-lucide="hotel"></i> Luxury Hotels</div>
                    <div class="m-logo-item"><i data-lucide="shopping-bag"></i> Food Courts</div>
                </div>
            </section>

            <!-- Problem vs Solution -->
            <section class="m-container">
                <div class="m-section-header" id="features">
                    <h2>Modernizing the Dining Experience</h2>
                    <p>Traditional ordering methods lead to slow turnaround and ordering mistakes. Dine Direct connects operations from table to kitchen instantly.</p>
                </div>

                <div class="m-comparison">
                    <div class="m-comparison-card bad">
                        <h4 style="color:#ef4444; margin:0 0 16px 0; display:flex; align-items:center; gap:8px;">
                            <i data-lucide="x-circle"></i> Traditional Waiter Method
                        </h4>
                        <ul style="padding-left:20px; line-height:1.8; color:rgba(255,255,255,0.6); font-size:0.92rem;">
                            <li>Wait for waiter to bring paper menu.</li>
                            <li>Order mistakes due to manual writing.</li>
                            <li>Handwritten slips delayed reaching the kitchen.</li>
                            <li>Long waiting line to pay or split bills.</li>
                        </ul>
                    </div>
                    <div class="m-comparison-card good">
                        <h4 style="color:#10b981; margin:0 0 16px 0; display:flex; align-items:center; gap:8px;">
                            <i data-lucide="check-circle2"></i> Dine Direct Method
                        </h4>
                        <ul style="padding-left:20px; line-height:1.8; color:rgba(255,255,255,0.85); font-size:0.92rem;">
                            <li>Scan QR on table and browse menus instantly.</li>
                            <li>Customize dishes and review dietary labels.</li>
                            <li>Orders routed directly to KDS with no waiter errors.</li>
                            <li>Integrated digital checkouts and self-payments.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- Product Features -->
            <section class="m-container">
                <div class="m-section-header">
                    <h2>Packed with Powerful Features</h2>
                    <p>Everything you need to automate order cycles, manage tables, and understand business trends.</p>
                </div>

                <div class="m-features-grid">
                    <div class="m-feature-card">
                        <div class="m-feature-icon"><i data-lucide="qr-code"></i></div>
                        <h4 style="margin:0 0 10px 0; font-size:1.1rem;">Table QR Ordering</h4>
                        <p style="margin:0; font-size:0.88rem; color:rgba(255,255,255,0.6); line-height:1.5;">Print custom QR stickers for each table. Customers scan, browse, customize, and order instantly without waiting.</p>
                    </div>
                    <div class="m-feature-card">
                        <div class="m-feature-icon"><i data-lucide="book-open"></i></div>
                        <h4 style="margin:0 0 10px 0; font-size:1.1rem;">Smart Digital Menu</h4>
                        <p style="margin:0; font-size:0.88rem; color:rgba(255,255,255,0.6); line-height:1.5;">Showcase high-resolution dish pictures, ingredients, calorie counters, veg/non-veg tags, and dynamic customization modifiers.</p>
                    </div>
                    <div class="m-feature-card">
                        <div class="m-feature-icon"><i data-lucide="chef-hat"></i></div>
                        <h4 style="margin:0 0 10px 0; font-size:1.1rem;">Kitchen KDS Queue</h4>
                        <p style="margin:0; font-size:0.88rem; color:rgba(255,255,255,0.6); line-height:1.5;">A clean dashboard for your kitchen crew to receive orders immediately, manage preparation timelines, and dispatch ready plates.</p>
                    </div>
                    <div class="m-feature-card">
                        <div class="m-feature-icon"><i data-lucide="bar-chart-3"></i></div>
                        <h4 style="margin:0 0 10px 0; font-size:1.1rem;">Realtime Analytics</h4>
                        <p style="margin:0; font-size:0.88rem; color:rgba(255,255,255,0.6); line-height:1.5;">Understand your business metrics instantly: track revenue patterns, peak hours occupancy, and top-selling menu items.</p>
                    </div>
                    <div class="m-feature-card">
                        <div class="m-feature-icon"><i data-lucide="sparkles"></i></div>
                        <h4 style="margin:0 0 10px 0; font-size:1.1rem;">AI Recommendations</h4>
                        <p style="margin:0; font-size:0.88rem; color:rgba(255,255,255,0.6); line-height:1.5;">Suggest popular combos, desserts, or complementary drinks to customers during checkouts to increase Average Order Values.</p>
                    </div>
                    <div class="m-feature-card">
                        <div class="m-feature-icon"><i data-lucide="grid"></i></div>
                        <h4 style="margin:0 0 10px 0; font-size:1.1rem;">Table Operations</h4>
                        <p style="margin:0; font-size:0.88rem; color:rgba(255,255,255,0.6); line-height:1.5;">Manage restaurant floor occupancy states (Available, Occupied, Cleaning) in real-time from the central business admin.</p>
                    </div>
                </div>
            </section>

            <!-- Dashboard Previews -->
            <section class="m-container" id="how-it-works">
                <div class="m-section-header">
                    <h2>Explore the Interfaces</h2>
                    <p>Choose a perspective to preview how Dine Direct simplifies operations across the dining cycle.</p>
                </div>

                <div class="m-preview-tabs">
                    <button class="m-tab-btn active" data-target="p-customer">Customer App</button>
                    <button class="m-tab-btn" data-target="p-owner">Owner Dashboard</button>
                    <button class="m-tab-btn" data-target="p-kitchen">Kitchen Screen</button>
                </div>

                <div class="m-preview-window">
                    <!-- Customer Pane -->
                    <div id="p-customer" class="preview-pane">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items:center;">
                            <div>
                                <h3 style="color:#ff6b35; margin:0 0 16px 0; font-size:1.5rem;">📱 Premium Customer PWA</h3>
                                <p style="line-height:1.6; color:rgba(255,255,255,0.7); font-size:0.95rem;">
                                    A fast, mobile-responsive web application that runs directly in any browser upon scanning a table QR code. 
                                    Customers search restaurants, browse rich menus, customize options, checkout with UPI/Cards, and track live order prep status.
                                </p>
                                <ul style="padding-left:20px; color:rgba(255,255,255,0.6); font-size:0.9rem; line-height:1.8;">
                                    <li>Supports browser location radius filter.</li>
                                    <li>Dynamic filter tabs (Veg, Spicy, Ratings).</li>
                                    <li>Built-in waiter help alert chatbot.</li>
                                </ul>
                            </div>
                            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:20px; max-width:320px; margin:0 auto;">
                                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; margin-bottom:16px;">
                                    <span style="font-weight:700; font-size:0.9rem; color:#ff6b35;"><i data-lucide="utensils" style="width:14px; height:14px; display:inline; vertical-align:middle;"></i> Paradise Biryani</span>
                                    <span style="background:rgba(24,198,133,0.15); color:#10b981; font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:600;">Table 4</span>
                                </div>
                                <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; display:flex; gap:10px; align-items:center; margin-bottom:10px;">
                                    <div style="background:#ff6b35; width:32px; height:32px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-weight:700;">1x</div>
                                    <div style="flex:1;">
                                        <div style="font-size:0.82rem; font-weight:600;">Special Mutton Biryani</div>
                                        <div style="font-size:0.7rem; color:rgba(255,255,255,0.4);">Double Masala</div>
                                    </div>
                                    <div style="font-size:0.85rem; font-weight:600;">₹380</div>
                                </div>
                                <div style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:10px; margin-top:12px; display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700;">
                                    <span>Total Amount:</span>
                                    <span style="color:#ff6b35;">₹380</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Owner Pane -->
                    <div id="p-owner" class="preview-pane d-none">
                        <div style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap: 32px; align-items:center;">
                            <div>
                                <h3 style="color:#ff6b35; margin:0 0 16px 0; font-size:1.5rem;">💻 Business Owner Dashboard</h3>
                                <p style="line-height:1.6; color:rgba(255,255,255,0.7); font-size:0.95rem;">
                                    A robust administration control center for restaurant operators. Manage categories, upload menu items, print custom table QR codes, trace revenue summaries, view peak transaction hours, and access live performance analytics.
                                </p>
                                <ul style="padding-left:20px; color:rgba(255,255,255,0.6); font-size:0.9rem; line-height:1.8;">
                                    <li>Add/edit menu variants and add-on items.</li>
                                    <li>Download dynamic QR configurations.</li>
                                    <li>Real-time chat client to talk to customers.</li>
                                </ul>
                            </div>
                            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:20px;">
                                <div style="font-size:0.8rem; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:4px; font-weight:600;">Today's Revenue</div>
                                <div style="font-size:1.8rem; font-weight:700; color:#10b981; margin-bottom:12px;">₹14,250</div>
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.75rem;">
                                    <div style="background:rgba(0,0,0,0.2); padding:8px; border-radius:6px;">
                                        <span style="display:block; opacity:0.5;">Orders</span>
                                        <strong style="font-size:0.9rem;">32</strong>
                                    </div>
                                    <div style="background:rgba(0,0,0,0.2); padding:8px; border-radius:6px;">
                                        <span style="display:block; opacity:0.5;">Active Tables</span>
                                        <strong style="font-size:0.9rem;">5</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Kitchen Pane -->
                    <div id="p-kitchen" class="preview-pane d-none">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items:center;">
                            <div>
                                <h3 style="color:#ff6b35; margin:0 0 16px 0; font-size:1.5rem;">👨‍🍳 Kitchen Display System (KDS)</h3>
                                <p style="line-height:1.6; color:rgba(255,255,255,0.7); font-size:0.95rem;">
                                    An optimized, high-contrast, tactile dashboard built for tablets and wall-mounted screens in hot kitchens. 
                                    Chefs track incoming order queues, customize prep alerts, view elapsed prep timers, and trigger alert chimes on customer phones.
                                </p>
                                <ul style="padding-left:20px; color:rgba(255,255,255,0.6); font-size:0.9rem; line-height:1.8;">
                                    <li>Visual time alerts to flag delayed orders.</li>
                                    <li>Order card sorting based on oldest orders.</li>
                                    <li>One-tap order completion controls.</li>
                                </ul>
                            </div>
                            <div style="background:rgba(255,107,53,0.04); border:1.5px solid #ff6b35; border-radius:12px; padding:16px; width:280px; margin:0 auto;">
                                <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; margin-bottom:10px; font-weight:700;">
                                    <span>ORDER #204</span>
                                    <span style="color:#ff6b35;">Table 2</span>
                                </div>
                                <div style="font-size:0.85rem; line-height:1.6; margin-bottom:12px;">
                                    <div style="font-weight:600;">1x Paneer Butter Masala</div>
                                    <div style="font-size:0.75rem; color:rgba(255,255,255,0.5); padding-left:12px;">- Rumali Roti x2</div>
                                </div>
                                <button style="width:100%; border:none; background:#ff6b35; color:#fff; font-weight:700; padding:8px; border-radius:6px; font-size:0.8rem; cursor:pointer;">Mark as Ready</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Pricing Section -->
            <section class="m-container" id="pricing">
                <div class="m-section-header">
                    <h2>Transparent Plans for Growing Brands</h2>
                    <p>No commissions or hidden platform fees. Choose a plan that fits your business scaling needs.</p>
                </div>

                <div class="m-pricing">
                    <!-- Plan 1 -->
                    <div class="m-price-card">
                        <div class="m-price-title">Starter</div>
                        <div style="color:rgba(248,250,252,0.5); font-size:0.85rem;">For single food trucks and popups</div>
                        <div class="m-price-amount">₹0 <span>/ month</span></div>
                        <ul class="m-price-features">
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Up to 2 active tables</li>
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Interactive digital menu</li>
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Basic sales tracking</li>
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Support ticketing</li>
                        </ul>
                        <a href="#owner/signup" class="m-btn m-btn-ghost" style="text-align:center; justify-content:center;">Get Started Free</a>
                    </div>
                    <!-- Plan 2 -->
                    <div class="m-price-card popular">
                        <div class="m-popular-badge">Popular</div>
                        <div class="m-price-title">Growth</div>
                        <div style="color:rgba(248,250,252,0.5); font-size:0.85rem;">For high-volume restaurants & cafes</div>
                        <div class="m-price-amount">₹1,999 <span>/ month</span></div>
                        <ul class="m-price-features">
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Unlimited dining tables</li>
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Dynamic QR generator</li>
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Kitchen display queue</li>
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Full analytics & reports</li>
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> AI recommendations module</li>
                        </ul>
                        <a href="#owner/signup" class="m-btn m-btn-primary" style="text-align:center; justify-content:center;">Start Free Trial</a>
                    </div>
                    <!-- Plan 3 -->
                    <div class="m-price-card">
                        <div class="m-price-title">Enterprise</div>
                        <div style="color:rgba(248,250,252,0.5); font-size:0.85rem;">For large multi-branch chains</div>
                        <div class="m-price-amount">Custom</div>
                        <ul class="m-price-features">
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Multi-branch central dashboard</li>
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Integration with existing POS</li>
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Dedicated support manager</li>
                            <li><i data-lucide="check" style="color:#10b981; width:16px;"></i> Custom branding elements</li>
                        </ul>
                        <a href="mailto:sales@dinedirect.app" class="m-btn m-btn-ghost" style="text-align:center; justify-content:center;">Contact Sales</a>
                    </div>
                </div>
            </section>

            <!-- FAQ Section -->
            <section class="m-container" id="faq">
                <div class="m-section-header">
                    <h2>Frequently Asked Questions</h2>
                    <p>Have questions about setting up Dine Direct? Find the answers below.</p>
                </div>

                <div class="m-faq-list">
                    <div class="m-faq-item">
                        <div class="m-faq-header">
                            <span>Can I use my own QR code stickers?</span>
                            <i data-lucide="plus" style="width:18px;"></i>
                        </div>
                        <div class="m-faq-content">
                            Yes! Dine Direct generates table-specific URLs which you can link to any QR code scanner system or print onto customized table stickers.
                        </div>
                    </div>
                    <div class="m-faq-item">
                        <div class="m-faq-header">
                            <span>Do customers need to download a mobile app?</span>
                            <i data-lucide="plus" style="width:18px;"></i>
                        </div>
                        <div class="m-faq-content">
                            No download is needed. The customer interface runs as a fast Progressive Web App (PWA) directly in their mobile browser as soon as they scan a table QR code.
                        </div>
                    </div>
                    <div class="m-faq-item">
                        <div class="m-faq-header">
                            <span>Can I update my menu card instantly?</span>
                            <i data-lucide="plus" style="width:18px;"></i>
                        </div>
                        <div class="m-faq-content">
                            Yes. Any modifications to menus, descriptions, prices, or dish availability made in the Owner Portal reflect on active customer screens instantly in real-time.
                        </div>
                    </div>
                    <div class="m-faq-item">
                        <div class="m-faq-header">
                            <span>Is the online payment flow secure?</span>
                            <i data-lucide="plus" style="width:18px;"></i>
                        </div>
                        <div class="m-faq-content">
                            All checkout transactions are handled securely through trusted payment providers. Cards, UPIs, and popular digital wallets are fully supported.
                        </div>
                    </div>
                </div>
            </section>

            <!-- Footer -->
            <footer class="m-footer">
                <div class="m-footer-grid m-container">
                    <div>
                        <div class="m-logo" style="margin-bottom:16px;">
                            <i data-lucide="utensils"></i> Dine Direct
                        </div>
                        <p style="font-size:0.88rem; color:rgba(248,250,252,0.5); line-height:1.6; margin:0;">
                            The complete Restaurant Operating System for table ordering, kitchen management, and business intelligence.
                        </p>
                    </div>
                    <div>
                        <h5 class="m-footer-title">Platform</h5>
                        <ul class="m-footer-links">
                            <li><a href="#features">Features</a></li>
                            <li><a href="#pricing">Pricing</a></li>
                            <li><a href="#faq">FAQs</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 class="m-footer-title">Legal</h5>
                        <ul class="m-footer-links">
                            <li><a href="#privacy">Privacy Policy</a></li>
                            <li><a href="#terms">Terms of Service</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 class="m-footer-title">Contact</h5>
                        <ul class="m-footer-links" style="color:rgba(248,250,252,0.6); font-size:0.9rem;">
                            <li><i data-lucide="mail" style="width:14px; display:inline; vertical-align:middle; margin-right:6px;"></i> support@dinedirect.com</li>
                            <li><i data-lucide="phone" style="width:14px; display:inline; vertical-align:middle; margin-right:6px;"></i> +91 98765 43210</li>
                        </ul>
                    </div>
                </div>
                <div class="m-footer-bottom m-container">
                    <span>&copy; 2026 Dine Direct. All rights reserved.</span>
                    <div style="display:flex; gap:16px;">
                        <a href="#" style="color:inherit;"><i data-lucide="twitter" style="width:18px;"></i></a>
                        <a href="#" style="color:inherit;"><i data-lucide="instagram" style="width:18px;"></i></a>
                        <a href="#" style="color:inherit;"><i data-lucide="linkedin" style="width:18px;"></i></a>
                    </div>
                </div>
            </footer>
        </div>
    `;
};

export const setupMarketingListeners = () => {
    // 1. Dashboard Preview Tabs Listener
    const tabBtns = document.querySelectorAll('.m-tab-btn');
    const panes = document.querySelectorAll('.preview-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetId = btn.getAttribute('data-target');
            panes.forEach(pane => {
                if (pane.id === targetId) {
                    pane.classList.remove('d-none');
                } else {
                    pane.classList.add('d-none');
                }
            });
        });
    });

    // 2. FAQ Accordion Toggles
    const faqHeaders = document.querySelectorAll('.m-faq-header');
    
    faqHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('i');
            
            const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
            
            // Close all first for accordion behavior
            document.querySelectorAll('.m-faq-content').forEach(c => {
                c.style.maxHeight = '0px';
                c.style.paddingTop = '0px';
                c.style.paddingBottom = '0px';
            });
            document.querySelectorAll('.m-faq-header i').forEach(i => {
                if (window.lucide) {
                    i.setAttribute('data-lucide', 'plus');
                }
            });

            // Toggle selected
            if (!isOpen) {
                content.style.maxHeight = content.scrollHeight + 40 + 'px';
                content.style.paddingTop = '10px';
                content.style.paddingBottom = '24px';
                if (window.lucide) {
                    icon.setAttribute('data-lucide', 'minus');
                }
            }
            
            if (window.lucide) {
                window.lucide.createIcons();
            }
        });
    });
};

window.MarketingViews = {
    marketing: createMarketingView,
    setupMarketingListeners: setupMarketingListeners
};

