// Dine Direct Customer Views & Logic

// Global toast utility
function showToast(message) {
    let toast = document.getElementById('dinedirect-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'dinedirect-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '90px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(26,26,26,0.9)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '20px';
        toast.style.fontSize = '0.9rem';
        toast.style.fontWeight = '500';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.zIndex = '9999';
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 2000);
}

window.showToast = showToast;

// Simulated user location (default: Begumpet)
window.customerLocation = window.customerLocation || {
    name: 'Begumpet, Hyderabad',
    lat: 17.4375,
    lng: 78.4482
};



window.customerMinRadius = window.customerMinRadius !== undefined ? window.customerMinRadius : 0;
window.customerMaxRadius = window.customerMaxRadius !== undefined ? window.customerMaxRadius : 10;

// Helper to calculate Haversine distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5; // fallback
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return parseFloat((R * c).toFixed(1));
}

const CustomerViews = {
    // Lightbox Modal functions
    openLightbox: (src, caption) => {
        const lightbox = document.getElementById('tourLightbox');
        const img = document.getElementById('lightboxImage');
        const cap = document.getElementById('lightboxCaption');
        if (lightbox && img && cap) {
            img.src = src;
            cap.textContent = caption;
            lightbox.classList.remove('d-none');
            lightbox.style.display = 'flex';
            lightbox.style.alignItems = 'center';
            lightbox.style.justifyContent = 'center';
            lightbox.style.position = 'fixed';
            lightbox.style.top = '0';
            lightbox.style.left = '0';
            lightbox.style.width = '100vw';
            lightbox.style.height = '100vh';
            lightbox.style.background = 'rgba(0,0,0,0.9)';
            lightbox.style.zIndex = '3000';
        }
    },
    closeLightbox: () => {
        const lightbox = document.getElementById('tourLightbox');
        if (lightbox) {
            lightbox.classList.add('d-none');
            lightbox.style.display = 'none';
        }
    },

    // Tax Invoice Modal functions
    openTaxInvoiceModal: (orderId) => {
        const allOrders = window.DineDirectStore.state.orders || [];
        let order = allOrders.find(o => String(o.id) === String(orderId));
        let relatedOrders = [];

        if (order && order.groupOrderId) {
            relatedOrders = allOrders.filter(o => o.groupOrderId === order.groupOrderId);
        } else if (!order) {
            relatedOrders = allOrders.filter(o => o.groupOrderId === String(orderId));
            if (relatedOrders.length > 0) order = relatedOrders[0];
        }

        if (!order) {
            showToast('⚠️ Order details not found.');
            return;
        }

        const isGroup = relatedOrders.length > 1;
        const targetOrders = isGroup ? relatedOrders : [order];

        // Gather restaurants
        const restNames = targetOrders.map(o => {
            const r = window.DineDirectStore.getRestaurant(o.restaurantId);
            return r ? r.name : o.restaurantId;
        });

        const primaryRest = window.DineDirectStore.getRestaurant(order.restaurantId) || {
            name: 'Dine Direct Restaurant',
            address: 'Hyderabad, India',
            ownerEmail: 'contact@dinedirect.in'
        };

        let subtotal = 0;
        let deliveryFee = 0;

        targetOrders.forEach(o => {
            (o.items || []).forEach(it => {
                subtotal += (Number(it.price) || 0) * (Number(it.qty || it.quantity) || 1);
            });
            deliveryFee += Number(o.deliveryFee) || 0;
        });

        if (subtotal === 0 && order.total) {
            subtotal = Math.round(order.total / 1.10);
        }

        const cgst = Math.round(subtotal * 0.025);
        const sgst = Math.round(subtotal * 0.025);
        const serviceCharge = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + cgst + sgst + serviceCharge + deliveryFee;
        const invoiceNum = isGroup ? `INV-GRP-${String(order.groupOrderId).replace(/\D/g, '').slice(-5)}` : `INV-2026-${String(order.id).replace(/\D/g, '').padStart(5, '0')}`;
        const orderDate = new Date(order.timestamp || Date.now()).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        const isPaid = order.paymentMethod === 'pay_now' || order.paymentStatus === 'paid' || order.paymentMethod === 'card' || order.paymentMethod === 'upi';

        // Remove old modal if present
        const oldModal = document.getElementById('taxInvoiceModal');
        if (oldModal) oldModal.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'taxInvoiceModal';
        modalOverlay.className = 'tax-invoice-modal-overlay animate-fade-in';
        modalOverlay.innerHTML = `
            <div class="tax-invoice-sheet" id="taxInvoicePrintTarget">
                <button onclick="window.CustomerViews.closeTaxInvoiceModal()" style="position:absolute; top:16px; right:16px; background:#f1f5f9; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; color:#64748b;">✕</button>

                <div class="invoice-header-title">
                    <h2>${isGroup ? restNames.join(' & ') : primaryRest.name}</h2>
                    <p style="margin:4px 0 0; font-size:0.85rem; color:#64748b;">${isGroup ? 'Multi-Vendor Kitchen Delivery Network • Hyderabad' : primaryRest.address}</p>
                    <div style="margin-top:6px;">
                        <span class="invoice-tax-badge">${isGroup ? 'Combined Multi-Vendor Tax Invoice (GST)' : 'Tax Invoice (GST)'}</span>
                    </div>
                    <div style="font-size:0.75rem; color:#64748b; margin-top:6px;">
                        <strong>GSTIN:</strong> 36AAACD1234F1Z5 &nbsp;|&nbsp; <strong>FSSAI:</strong> 13622011000452
                    </div>
                </div>

                <div class="invoice-meta-grid">
                    <div>
                        <span style="color:#64748b; display:block; font-size:0.75rem;">Invoice Number</span>
                        <strong>${invoiceNum}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; display:block; font-size:0.75rem;">Order Date & Time</span>
                        <strong>${orderDate}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; display:block; font-size:0.75rem;">Customer Name</span>
                        <strong>${order.customerName || 'Guest'}</strong>
                    </div>
                    <div>
                        <span style="color:#64748b; display:block; font-size:0.75rem;">Order Mode</span>
                        <strong>${isGroup ? `Multi-Restaurant Order (${targetOrders.length} Kitchens)` : (order.tableNum && order.tableNum !== 'Online' ? `Table ${order.tableNum} (Dine-in)` : 'Takeaway / Delivery')}</strong>
                    </div>
                </div>

                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th style="width:45%;">Item Description</th>
                            <th style="text-align:center; width:15%;">Rate</th>
                            <th style="text-align:center; width:15%;">Qty</th>
                            <th style="text-align:right; width:25%;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${targetOrders.map(ord => {
                            const r = window.DineDirectStore.getRestaurant(ord.restaurantId) || { name: 'Restaurant' };
                            const headerRow = isGroup ? `
                                <tr style="background:#f8fafc; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0;">
                                    <td colspan="4" style="font-weight:700; color:var(--primary); padding:8px 10px; font-size:0.85rem;">
                                        🏪 ${r.name} (Ticket #${ord.id})
                                    </td>
                                </tr>
                            ` : '';
                            const itemRows = (ord.items || []).map(it => {
                                const q = it.qty || it.quantity || 1;
                                return `
                                <tr>
                                    <td><strong>${it.name}</strong></td>
                                    <td style="text-align:center;">₹${it.price}</td>
                                    <td style="text-align:center;">${q}</td>
                                    <td style="text-align:right; font-weight:600;">₹${it.price * q}</td>
                                </tr>
                            `}).join('');
                            return headerRow + itemRows;
                        }).join('')}
                    </tbody>
                </table>

                <div class="invoice-totals-section">
                    <div class="invoice-total-row">
                        <span style="color:#64748b;">Subtotal (Taxable Food Value)</span>
                        <span>₹${subtotal}</span>
                    </div>
                    <div class="invoice-total-row">
                        <span style="color:#64748b;">Central GST (CGST @ 2.5%)</span>
                        <span>₹${cgst}</span>
                    </div>
                    <div class="invoice-total-row">
                        <span style="color:#64748b;">State GST (SGST @ 2.5%)</span>
                        <span>₹${sgst}</span>
                    </div>
                    <div class="invoice-total-row">
                        <span style="color:#64748b;">Restaurant Service Charge (5%)</span>
                        <span>₹${serviceCharge}</span>
                    </div>
                    ${deliveryFee > 0 ? `
                        <div class="invoice-total-row">
                            <span style="color:#64748b;">Multi-Stop Distance Delivery Fee</span>
                            <span>₹${deliveryFee}</span>
                        </div>
                    ` : ''}
                    <div class="invoice-grand-total">
                        <span>Grand Total (Paid)</span>
                        <span>₹${grandTotal}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid #e2e8f0;">
                        <div>
                            <span style="color:#64748b; display:block; font-size:0.75rem;">Payment Method</span>
                            <strong style="text-transform:capitalize;">${order.paymentMethod ? order.paymentMethod.replace('_', ' ') : 'Online UPI'}</strong>
                        </div>
                        <div style="text-align:right;">
                            <span style="color:#64748b; display:block; font-size:0.75rem;">Payment Status</span>
                            <strong style="color:${isPaid ? '#16a34a' : '#d97706'};">${isPaid ? 'PAID ONLINE' : 'PENDING AT COUNTER'}</strong>
                        </div>
                    </div>
                </div>

                <div style="text-align:center; font-size:0.75rem; color:#94a3b8; margin-top:16px;">
                    Thank you for dining with Dine Direct! This is an official computer-generated GST tax receipt.
                </div>

                <div class="invoice-actions-bar">
                    <button class="btn btn-secondary" onclick="window.CustomerViews.closeTaxInvoiceModal()" style="flex:1; border:1px solid #cbd5e1;">Close</button>
                    <button class="btn btn-primary" onclick="window.print()" style="flex:2; display:flex; align-items:center; justify-content:center; gap:8px;">
                        <span>🖨️ Print / Save PDF</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);
    },

    closeTaxInvoiceModal: () => {
        const modal = document.getElementById('taxInvoiceModal');
        if (modal) modal.remove();
    },

    // Layout Wrapper for Desktop Sidebar + Mobile Bottom Nav
    wrapLayout: (contentHtml, activePage) => {
        const session = window.DineDirectStore.getSession();
        const userName = session.currentUser || 'Guest';
        const activeTable = session.activeTableNum;
        const cartCount = window.DineDirectStore ? window.DineDirectStore.getCartTotalCount() : 0;
        
        // Sidebar HTML
        const sidebarHtml = `
            <aside class="customer-sidebar">
                <div class="sidebar-logo">
                    <i data-lucide="cooking-pot" class="logo-icon"></i>
                    <h2>Foodie</h2>
                </div>
                <nav class="sidebar-nav">
                    <a href="#customer/home" class="nav-item ${activePage === 'home' ? 'active' : ''}">
                        <i data-lucide="home"></i> <span>Home</span>
                    </a>
                    <a href="#customer/cart" class="nav-item ${activePage === 'cart' ? 'active' : ''}">
                        <i data-lucide="shopping-bag"></i> <span>Cart ${cartCount > 0 ? `(${cartCount})` : ''}</span>
                    </a>
                    <a href="#customer/booking" class="nav-item ${activePage === 'booking' ? 'active' : ''}">
                        <i data-lucide="calendar"></i> <span>Book Table</span>
                    </a>
                    <a href="#customer/profile" class="nav-item ${activePage === 'profile' ? 'active' : ''}">
                        <i data-lucide="user"></i> <span>Profile</span>
                    </a>
                    <a href="#customer/orders" class="nav-item ${activePage === 'orders' ? 'active' : ''}">
                        <i data-lucide="receipt"></i> <span>Orders</span>
                    </a>
                    <a href="#" class="nav-item" id="btnHelpTrigger">
                        <i data-lucide="help-circle"></i> <span>Help</span>
                    </a>
                </nav>
                <div class="sidebar-promo">
                    <h4>Get 50% OFF</h4>
                    <p>on your first order!</p>
                    <div class="promo-code">WELCOME50</div>
                    <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80" alt="burger">
                </div>
                <div class="sidebar-profile" style="cursor: pointer;" onclick="window.location.hash='#customer/profile'">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="profile" class="profile-pic">
                    <div class="profile-info">
                        <span class="profile-name">${userName}</span>
                        <span class="profile-email" style="font-size:0.7rem; opacity:0.8;">View Profile</span>
                    </div>
                    <a href="#auth" onclick="event.stopPropagation(); window.DineDirectStore.logout()" class="logout-icon-btn" title="Logout">
                        <i data-lucide="log-out"></i>
                    </a>
                </div>
            </aside>
        `;

        // Bottom Navigation for Mobile (Responsive fallback)
        const bottomNavHtml = `
            <nav class="bottom-nav">
                <a href="#customer/home" class="${activePage === 'home' ? 'active' : ''}">
                    <i data-lucide="home"></i>
                    <span>Home</span>
                </a>
                <a href="#customer/cart" class="${activePage === 'cart' ? 'active' : ''}" style="position:relative;">
                    <i data-lucide="shopping-bag"></i>
                    <span>Cart</span>
                    ${cartCount > 0 ? `
                        <span class="badge bg-primary" style="position:absolute; top:2px; right:calc(50% - 18px); font-size:0.65rem; padding:1px 5px; border-radius:10px; min-width:16px; text-align:center;">${cartCount}</span>
                    ` : ''}
                </a>
                <a href="#customer/booking" class="${activePage === 'booking' ? 'active' : ''}">
                    <i data-lucide="calendar"></i>
                    <span>Booking</span>
                </a>
                <a href="#customer/orders" class="${activePage === 'orders' ? 'active' : ''}">
                    <i data-lucide="receipt"></i>
                    <span>Orders</span>
                </a>
                <a href="#customer/profile" class="${activePage === 'profile' ? 'active' : ''}">
                    <i data-lucide="user"></i>
                    <span>Profile</span>
                </a>
            </nav>
        `;

        return `
            <div class="customer-desktop-layout">
                ${sidebarHtml}
                <div class="customer-main-panel">
                    ${contentHtml}
                </div>
                ${bottomNavHtml}
            </div>
        `;
    },

    // 1. Home View
    home: () => {
        const session = window.DineDirectStore.getSession();
        const userName = session.currentUser || 'Guest';
        const activeTable = session.activeTableNum;
        const restaurants = window.DineDirectStore.getRestaurants();

        // Gather unique categories from menu items dynamically
        const uniqueCategories = new Set();
        restaurants.forEach(rest => {
            if (rest.menu) {
                rest.menu.forEach(item => {
                    if (item.category) {
                        uniqueCategories.add(item.category.trim());
                    }
                });
            }
        });

        const categoryIcons = {
            'Biryani': '🍛',
            'Dabbas': '🍱',
            'Cafes': '☕',
            'Coffee': '☕',
            'Tea': '☕',
            'Fast Food': '🍔',
            'Burger': '🍔',
            'Pizza': '🍕',
            'Desserts': '🍰',
            'Cake': '🍰',
            'Bakery': '🥐',
            'Chinese': '🥢',
            'South Indian': '🫓',
            'North Indian': '🍛',
            'Beverages': '🥤',
            'Drinks': '🥤'
        };

        const categories = [
            { name: 'All', icon: '🍽️' },
            ...Array.from(uniqueCategories).map(catName => ({
                name: catName,
                icon: categoryIcons[catName] || '🍽️'
            }))
        ];

        // Gather all menu items for "Top picks for you"
        let allItems = [];
        restaurants.forEach(rest => {
            rest.menu.forEach(item => {
                allItems.push({ ...item, restaurantId: rest.id });
            });
        });
        const topPicks = allItems.slice(0, 4);

        const homeHtml = `
            <div class="customer-home-content fade-in">
                <!-- Top Header -->
                <header class="home-top-bar">
                    <div class="delivery-location" id="btnChangeLocation" style="cursor:pointer;">
                        <i data-lucide="map-pin" class="location-icon"></i>
                        <div class="location-details">
                            <span class="loc-label">Your Location</span>
                            <div class="loc-select">
                                <strong id="currentLocationText">${window.customerLocation.name}</strong>
                                <i data-lucide="chevron-down"></i>
                            </div>
                        </div>
                    </div>
                    <div class="search-and-scan">
                        <div class="search-input-wrapper">
                            <i data-lucide="search"></i>
                            <input type="text" id="restaurantSearch" class="form-control" placeholder="Search for restaurants, items, cuisines...">
                        </div>
                        <button class="btn btn-primary" id="btnOpenScanner" title="Scan Table QR Code">
                            <i data-lucide="qr-code"></i> <span>Scan</span>
                        </button>
                    </div>
                </header>

                <!-- Hero Banner Carousel -->
                <section class="hero-promo-card">
                    <div class="promo-text-pane">
                        <span class="hot-deal-tag">HOT DEAL</span>
                        <h1>50% OFF on your<br>first order</h1>
                        <p class="promo-coupon">Use code <strong>WELCOME50</strong></p>
                        <button class="btn btn-order-now" onclick="window.location.hash='#customer/restaurant/r1'">Order Now <i data-lucide="arrow-right"></i></button>
                    </div>
                    <div class="promo-image-pane">
                        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80" alt="Special Burger">
                    </div>
                </section>

                <!-- Radius Filter section -->
                <section class="radius-filter-section mt-4 card animate-fade-in" style="padding: 16px; background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 12px; border: 1px solid rgba(0,0,0,0.05);">
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; color: var(--text-main);">
                        <i data-lucide="navigation" style="width: 18px; height: 18px; color: var(--primary);"></i>
                        <span>Filter Restaurants by Radius Range (in km)</span>
                    </h3>
                    
                    <div style="display: flex; gap: 16px; align-items: center;">
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Min Radius</label>
                            <div style="position: relative; display: flex; align-items: center;">
                                <input type="number" id="minRadiusInput" class="form-control" min="0" value="${window.customerMinRadius}" style="padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); width: 100%; font-weight: 600; color: var(--text-main);" placeholder="0">
                                <span style="position: absolute; right: 12px; font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">km</span>
                            </div>
                        </div>
                        
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Max Radius</label>
                            <div style="position: relative; display: flex; align-items: center;">
                                <input type="number" id="maxRadiusInput" class="form-control" min="0" value="${window.customerMaxRadius === Infinity ? '' : window.customerMaxRadius}" style="padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); width: 100%; font-weight: 600; color: var(--text-main);" placeholder="Unlimited">
                                <span style="position: absolute; right: 12px; font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">km</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Dine-In Table Booking Promo -->
                <section class="booking-promo-section mt-4" style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 16px; padding: 20px; color: white; display: flex; align-items: center; justify-content: space-between; gap: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
                    <div style="flex: 1;">
                        <span style="background: rgba(234, 88, 12, 0.2); color: #f97316; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 8px;">Dine-In Priority</span>
                        <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 6px; color: white;">Skip the Waiting Line!</h2>
                        <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.4;">Book your favorite dining table in advance and unlock priority kitchen dispatch when you arrive.</p>
                    </div>
                    <button class="btn" onclick="window.location.hash='#customer/booking'" style="background: #ea580c; color: white; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; white-space: nowrap; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4);">
                        <i data-lucide="calendar"></i> Book Table
                    </button>
                </section>

                <!-- Craving/Categories Grid -->
                <section class="craving-section mt-4">
                    <h3>What are you craving?</h3>
                    <div class="category-grid" id="homeCategories">
                        ${categories.map((cat, idx) => `
                            <div class="category-card ${idx === 0 ? 'active' : ''}" data-category="${cat.name}">
                                <span class="cat-icon">${cat.icon}</span>
                                <span class="cat-name">${cat.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <!-- Popular Restaurants -->
                <section class="restaurants-section mt-4">
                    <div class="section-header">
                        <h3>Popular restaurants</h3>
                        <a href="#customer/home" class="view-all-link">View all</a>
                    </div>
                    <div class="restaurant-grid" id="homeRestaurantList">
                        ${restaurants.map(rest => {
                            const dist = calculateDistance(
                                window.customerLocation.lat,
                                window.customerLocation.lng,
                                rest.latitude,
                                rest.longitude
                            );
                            return `
                                <div class="restaurant-card" data-id="${rest.id}" data-distance="${dist}" onclick="window.location.hash='#customer/restaurant/${rest.id}'">
                                    <div class="card-img-pane" style="background-image: url('${rest.id === 'r1' ? 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=60'}');">
                                        <span class="delivery-time-badge">${rest.deliveryTime || '20-30 min'}</span>
                                        <span style="position: absolute; bottom: 10px; left: 10px; background: rgba(26,26,26,0.85); color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; z-index: 5;">
                                            <i data-lucide="navigation-2" style="width: 12px; height: 12px; color: var(--primary);"></i>
                                            ${dist} km
                                        </span>
                                        <button class="fav-heart-btn" onclick="event.stopPropagation(); this.classList.toggle('active');"><i data-lucide="heart"></i></button>
                                    </div>
                                    <div class="card-info-pane">
                                        <div class="card-title-row">
                                            <h4>${rest.name}</h4>
                                            <span class="card-rating"><i data-lucide="star"></i> ${rest.rating || '4.0'}</span>
                                        </div>
                                        <p class="card-cuisines">${rest.cuisines || 'Cuisines'}</p>
                                        <div class="card-price-fee" style="display: flex; justify-content: space-between; align-items: center;">
                                            <span>$$ • Min. order $10</span>
                                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold;">${rest.address}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </section>

                <!-- Top picks for you -->
                <section class="picks-section mt-4 mb-4">
                    <div class="section-header">
                        <h3>Top picks for you</h3>
                        <a href="#customer/home" class="view-all-link">View all</a>
                    </div>
                    <div class="picks-grid">
                        ${topPicks.map(item => `
                            <div class="pick-item-card">
                                <div class="pick-img" style="background-image: url('${item.img || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=150&q=80'}');"></div>
                                <div class="pick-info">
                                    <h4>${item.name}</h4>
                                    <p class="pick-desc">${item.desc}</p>
                                    <div class="pick-price-add">
                                        <span class="pick-price">₹${item.price}</span>
                                        <button class="btn btn-add-pick pick-add-btn" data-restid="${item.restaurantId}" data-id="${item.id}">+ Add</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>

            <!-- Location Selection Modal -->
            <div class="modal-overlay d-none" id="locationSelectModal">
                <div class="modal-container card animate-fade-in" style="max-width:400px; width:90%; margin:0 auto; padding:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:12px;">
                        <h3 style="font-size:1.15rem; margin:0;"><i data-lucide="map-pin" style="color:var(--primary); vertical-align:middle; margin-right:6px;"></i> Select Location</h3>
                        <button id="btnCloseLocationModal" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:#888;">✕</button>
                    </div>
                    <p class="text-muted" style="font-size:0.85rem; margin-bottom:20px;">Use GPS to automatically detect your live location and calculate distances to nearby restaurants.</p>
                    
                    <button class="btn btn-primary btn-block" id="btnUseGpsLocation" style="padding:12px; font-weight:700; background:var(--primary); color:white; border-radius:8px; display:flex; justify-content:center; align-items:center; gap:8px;">
                        <i data-lucide="navigation"></i> Use My Live GPS Location
                    </button>
                </div>
            </div>

            <!-- QR Scanner Simulation Modal -->
            <div class="modal-overlay d-none" id="qrScannerModal">
                <div class="modal-container card animate-fade-in" style="max-width:350px; width:90%; margin:0 auto; padding:24px;">
                    <div class="text-center">
                        <i data-lucide="qr-code" style="width:48px;height:48px;color:var(--primary);margin-bottom:12px;"></i>
                        <h3>Scan Table QR Code</h3>
                        <p class="text-muted mt-2" style="font-size:0.9rem;">Simulate scanning by selecting a restaurant and table below.</p>
                    </div>
                    <form id="qrScannerForm" class="mt-4">
                        <div class="form-group">
                            <label>Select Restaurant</label>
                            <select class="form-control" id="scanRestId" required>
                                ${restaurants.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Table Number</label>
                            <input type="number" class="form-control" id="scanTableNum" placeholder="e.g. 3" min="1" max="20" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block mt-4">
                            <i data-lucide="scan"></i> Scan & Enter Menu
                        </button>
                        <button type="button" class="btn btn-secondary btn-block mt-2" id="btnCloseScanner">
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
        `;

        return CustomerViews.wrapLayout(homeHtml, 'home');
    },

    setupHomeListeners: () => {
        const btnOpenScanner = document.getElementById('btnOpenScanner');
        const btnCloseScanner = document.getElementById('btnCloseScanner');
        const qrScannerModal = document.getElementById('qrScannerModal');
        const qrScannerForm = document.getElementById('qrScannerForm');
        
        if (btnOpenScanner && qrScannerModal) {
            btnOpenScanner.addEventListener('click', () => {
                qrScannerModal.classList.remove('d-none');
                qrScannerModal.style.display = 'flex';
                qrScannerModal.style.alignItems = 'center';
                qrScannerModal.style.justifyContent = 'center';
                qrScannerModal.style.position = 'fixed';
                qrScannerModal.style.top = '0';
                qrScannerModal.style.left = '0';
                qrScannerModal.style.width = '100vw';
                qrScannerModal.style.height = '100vh';
                qrScannerModal.style.background = 'rgba(0,0,0,0.6)';
                qrScannerModal.style.zIndex = '1000';
            });
        }

        if (btnCloseScanner && qrScannerModal) {
            btnCloseScanner.addEventListener('click', () => {
                qrScannerModal.classList.add('d-none');
                qrScannerModal.style.display = 'none';
            });
        }

        if (qrScannerForm) {
            qrScannerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const restId = document.getElementById('scanRestId').value;
                const tableNum = document.getElementById('scanTableNum').value;
                
                qrScannerModal.classList.add('d-none');
                qrScannerModal.style.display = 'none';
                
                window.location.hash = `#customer/home?table=${tableNum}&restaurantId=${restId}`;
                showToast(`Successfully scanned Table ${tableNum}!`);
                
                setTimeout(() => {
                    window.location.hash = `#customer/restaurant/${restId}`;
                }, 400);
            });
        }

        // Categories pill selection
        const categoryCards = document.querySelectorAll('#homeCategories .category-card');
        const restCards = document.querySelectorAll('#homeRestaurantList .restaurant-card');
        
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                categoryCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                const category = card.getAttribute('data-category');
                filterRestaurants(category, document.getElementById('restaurantSearch').value);
            });
        });

        const fallbackToSimulatedGps = (silent, reason) => {
            // Simulated coordinates (center of Hyderabad - Begumpet with a tiny random offset to feel live)
            const baseLat = 17.4375;
            const baseLng = 78.4482;
            const jitterLat = (Math.random() - 0.5) * 0.012;
            const jitterLng = (Math.random() - 0.5) * 0.012;
            const lat = baseLat + jitterLat;
            const lng = baseLng + jitterLng;

            window.customerLocation = {
                name: `GPS (Simulated: ${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                lat: lat,
                lng: lng
            };

            const currentLocationText = document.getElementById('currentLocationText');
            if (currentLocationText) {
                currentLocationText.textContent = window.customerLocation.name;
            }

            if (locModal) {
                locModal.classList.add('d-none');
                locModal.style.display = 'none';
            }

            if (!silent) {
                showToast(`⚠️ Location blocked/unavailable. Using simulated GPS!`);
            }
            loadGooglePlaces();
        };

        const trackLiveLocation = (silent = false) => {
            if (!navigator.geolocation || !navigator.geolocation.getCurrentPosition) {
                fallbackToSimulatedGps(silent, 'Geolocation not supported in this browser context (HTTP).');
                return;
            }
            
            const btnUseGpsLocation = document.getElementById('btnUseGpsLocation');
            if (!silent) {
                showToast('📍 Detecting your live location...');
                if (btnUseGpsLocation) {
                    btnUseGpsLocation.disabled = true;
                    btnUseGpsLocation.innerHTML = `Fetching coordinates...`;
                }
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    window.customerLocation = {
                        name: `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                        lat: lat,
                        lng: lng
                    };
                    
                    const currentLocationText = document.getElementById('currentLocationText');
                    if (currentLocationText) {
                        currentLocationText.textContent = window.customerLocation.name;
                    }
                    
                    if (btnUseGpsLocation) {
                        btnUseGpsLocation.disabled = false;
                        btnUseGpsLocation.innerHTML = `<i data-lucide="navigation"></i> Use My Live GPS Location`;
                        if (window.lucide) window.lucide.createIcons();
                    }
                    
                    if (locModal) {
                        locModal.classList.add('d-none');
                        locModal.style.display = 'none';
                    }
                    
                    if (!silent) showToast('✅ Live location active!');
                    loadGooglePlaces();
                },
                (error) => {
                    console.error('Error tracking live location:', error);
                    
                    if (btnUseGpsLocation) {
                        btnUseGpsLocation.disabled = false;
                        btnUseGpsLocation.innerHTML = `<i data-lucide="navigation"></i> Use My Live GPS Location`;
                        if (window.lucide) window.lucide.createIcons();
                    }
                    
                    let reason = 'GPS Unavailable';
                    if (error.code === error.PERMISSION_DENIED) {
                        reason = 'GPS Permission Denied';
                    }
                    
                    fallbackToSimulatedGps(silent, reason);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        };

        // Search filtering (with 300ms debounce to prevent request spamming)
        const searchInput = document.getElementById('restaurantSearch');
        let searchTimeout;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const query = e.target.value;
                    const activeCard = document.querySelector('#homeCategories .category-card.active');
                    const category = activeCard ? activeCard.getAttribute('data-category') : 'All';
                    
                    // Silently retrieve GPS location if search is queried and they haven't set GPS yet
                    if (!window.customerLocation.name.startsWith('GPS Location')) {
                        trackLiveLocation(true);
                    }
                    
                    filterRestaurants(category, query);
                }, 300);
            });
        }

        // Radius inputs change handler (triggers on change or blur, not on every keystroke)
        const minInput = document.getElementById('minRadiusInput');
        const maxInput = document.getElementById('maxRadiusInput');
        
        if (minInput && maxInput) {
            const handleRadiusChange = () => {
                let minVal = parseFloat(minInput.value);
                let maxVal = parseFloat(maxInput.value);
                
                if (isNaN(minVal) || minVal < 0) minVal = 0;
                if (isNaN(maxVal) || maxVal < 0) maxVal = Infinity;
                
                // Set input values back cleanly
                minInput.value = minVal;
                maxInput.value = maxVal === Infinity ? '' : maxVal;
                
                window.customerMinRadius = minVal;
                window.customerMaxRadius = maxVal;
                
                const activeCard = document.querySelector('#homeCategories .category-card.active');
                const category = activeCard ? activeCard.getAttribute('data-category') : 'All';
                filterRestaurants(category, document.getElementById('restaurantSearch').value || '');
            };

            minInput.addEventListener('change', handleRadiusChange);
            minInput.addEventListener('blur', handleRadiusChange);
            maxInput.addEventListener('change', handleRadiusChange);
            maxInput.addEventListener('blur', handleRadiusChange);
        }

        // Open location modal click handler
        const btnChangeLoc = document.getElementById('btnChangeLocation');
        const btnCloseLoc = document.getElementById('btnCloseLocationModal');
        const locModal = document.getElementById('locationSelectModal');

        if (btnChangeLoc && locModal) {
            btnChangeLoc.addEventListener('click', () => {
                locModal.classList.remove('d-none');
                locModal.style.display = 'flex';
                locModal.style.alignItems = 'center';
                locModal.style.justifyContent = 'center';
                locModal.style.position = 'fixed';
                locModal.style.top = '0';
                locModal.style.left = '0';
                locModal.style.width = '100vw';
                locModal.style.height = '100vh';
                locModal.style.background = 'rgba(0,0,0,0.6)';
                locModal.style.zIndex = '1000';
            });
        }

        if (btnCloseLoc && locModal) {
            btnCloseLoc.addEventListener('click', () => {
                locModal.classList.add('d-none');
                locModal.style.display = 'none';
            });
        }

        const btnUseGpsLocation = document.getElementById('btnUseGpsLocation');
        if (btnUseGpsLocation) {
            btnUseGpsLocation.addEventListener('click', () => {
                trackLiveLocation(false);
            });
        }



        const loadGooglePlaces = async () => {
            const listContainer = document.getElementById('homeRestaurantList');
            if (!listContainer) return;
            
            // Increment sequence number to prevent race conditions
            window.googlePlacesLoadSeq = (window.googlePlacesLoadSeq || 0) + 1;
            const currentSeq = window.googlePlacesLoadSeq;

            const lat = window.customerLocation.lat;
            const lng = window.customerLocation.lng;
            const maxRadKm = window.customerMaxRadius !== undefined ? window.customerMaxRadius : 5;
            const radiusMeters = maxRadKm * 1000;
            
            const searchInput = document.getElementById('restaurantSearch');
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const activeCard = document.querySelector('#homeCategories .category-card.active');
            const category = activeCard ? activeCard.getAttribute('data-category') : 'All';
            
            // Remove existing google restaurants
            const existingGooglePlaces = document.querySelectorAll('#homeRestaurantList .google-restaurant-card');
            existingGooglePlaces.forEach(el => el.remove());
            
            // Clear any old loading indicators first
            const existingIndicators = document.querySelectorAll('#homeRestaurantList .google-loading-indicator');
            existingIndicators.forEach(el => el.remove());

            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'text-center text-muted google-loading-indicator';
            loadingIndicator.style.gridColumn = '1 / -1';
            loadingIndicator.style.padding = '20px';
            loadingIndicator.innerHTML = `<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Searching Google Places nearby...`;
            listContainer.appendChild(loadingIndicator);
            
            try {
                const googleRest = await window.DineDirectStore.fetchGoogleRestaurants(lat, lng, radiusMeters);
                
                // If a newer request has started, abort rendering this stale fetch!
                if (currentSeq !== window.googlePlacesLoadSeq) {
                    return;
                }
                
                loadingIndicator.remove();
                
                const registeredRests = window.DineDirectStore.getRestaurants();
                const unifiedList = [];
                
                // 1. Add registered restaurants matching filters
                registeredRests.forEach(r => {
                    const dist = calculateDistance(
                        window.customerLocation.lat,
                        window.customerLocation.lng,
                        r.latitude,
                        r.longitude
                    );
                    
                    const nameMatch = r.name.toLowerCase().includes(query) || 
                                      r.address.toLowerCase().includes(query) ||
                                      (r.cuisines && r.cuisines.toLowerCase().includes(query)) ||
                                      r.menu.some(item => item.name.toLowerCase().includes(query));
                    
                    let categoryMatch = true;
                    if (category !== 'All') {
                        categoryMatch = r.menu.some(item => item.category === category);
                    }
                    
                    const minLimit = window.customerMinRadius !== undefined ? window.customerMinRadius : 0;
                    const maxLimit = window.customerMaxRadius !== undefined ? window.customerMaxRadius : Infinity;
                    const radiusMatch = dist >= minLimit && dist <= maxLimit;
                    
                    if (nameMatch && categoryMatch && radiusMatch) {
                        unifiedList.push({
                            ...r,
                            distance: dist,
                            type: 'registered'
                        });
                    }
                });
                
                // 2. Add Google Places restaurants matching filters
                googleRest.forEach(g => {
                    const dist = g.distance;
                    
                    const nameMatch = g.name.toLowerCase().includes(query) || 
                                      g.address.toLowerCase().includes(query) ||
                                      (g.cuisines && g.cuisines.toLowerCase().includes(query));
                    
                    let categoryMatch = category === 'All';
                    if (category !== 'All') {
                        const catKeyword = category.toLowerCase().replace(/s$/, '');
                        categoryMatch = g.cuisines.toLowerCase().includes(catKeyword);
                    }
                    
                    const minLimit = window.customerMinRadius !== undefined ? window.customerMinRadius : 0;
                    const maxLimit = window.customerMaxRadius !== undefined ? window.customerMaxRadius : Infinity;
                    const radiusMatch = dist >= minLimit && dist <= maxLimit;
                    
                    if (nameMatch && categoryMatch && radiusMatch) {
                        unifiedList.push({
                            ...g,
                            type: 'google'
                        });
                    }
                });
                
                // 3. Sort unified list by distance!
                unifiedList.sort((a, b) => a.distance - b.distance);
                
                // 4. Render the list!
                listContainer.innerHTML = unifiedList.map(rest => {
                    if (rest.type === 'registered') {
                        return `
                            <div class="restaurant-card" data-id="${rest.id}" data-distance="${rest.distance}" onclick="window.location.hash='#customer/restaurant/${rest.id}'">
                                <div class="card-img-pane" style="background-image: url('${rest.id === 'r1' ? 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=60'}');">
                                    <span class="delivery-time-badge">${rest.deliveryTime || '20-30 min'}</span>
                                    <span style="position: absolute; bottom: 10px; left: 10px; background: rgba(26,26,26,0.85); color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; z-index: 5;">
                                        <i data-lucide="navigation-2" style="width: 12px; height: 12px; color: var(--primary);"></i>
                                        ${rest.distance} km
                                    </span>
                                    <button class="fav-heart-btn" onclick="event.stopPropagation(); this.classList.toggle('active');"><i data-lucide="heart"></i></button>
                                </div>
                                <div class="card-info-pane">
                                    <div class="card-title-row">
                                        <h4>${rest.name}</h4>
                                        <span class="card-rating"><i data-lucide="star"></i> ${rest.rating || '4.0'}</span>
                                    </div>
                                    <p class="card-cuisines">${rest.cuisines || 'Cuisines'}</p>
                                    <div class="card-price-fee" style="display: flex; justify-content: space-between; align-items: center;">
                                        <span>$$ • Min. order $10</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold;">${rest.address}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        const defaultImg = rest.name.toLowerCase().includes('coffee') || rest.cuisines.toLowerCase().includes('bakery') || rest.name.toLowerCase().includes('cafe')
                            ? 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=60'
                            : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=60';
                        return `
                            <div class="restaurant-card google-restaurant-card" data-id="${rest.id}" data-distance="${rest.distance}" onclick="window.location.hash='#customer/restaurant/${rest.id}'" style="border:1.5px solid rgba(66, 133, 244, 0.25);">
                                <div class="card-img-pane" style="background-image: url('${defaultImg}');">
                                    <span class="delivery-time-badge" style="background:#4285f4; color:white;">${rest.deliveryTime}</span>
                                    <span style="position: absolute; top: 10px; right: 10px; background: #4285f4; color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: bold; z-index: 5; display: inline-flex; align-items: center; gap: 4px;">
                                        <i data-lucide="info" style="width: 10px; height: 10px;"></i> Google Places
                                    </span>
                                    <span style="position: absolute; bottom: 10px; left: 10px; background: rgba(26,26,26,0.85); color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; z-index: 5;">
                                        <i data-lucide="navigation-2" style="width: 12px; height: 12px; color: #4285f4;"></i>
                                        ${rest.distance} km
                                    </span>
                                </div>
                                <div class="card-info-pane">
                                    <div class="card-title-row">
                                        <h4 style="color:#1a73e8;">${rest.name}</h4>
                                        <span class="card-rating" style="background:rgba(66, 133, 244, 0.1); color:#1a73e8;"><i data-lucide="star"></i> ${rest.rating}</span>
                                    </div>
                                    <p class="card-cuisines">${rest.cuisines}</p>
                                    <div class="card-price-fee" style="display: flex; justify-content: space-between; align-items: center;">
                                        <span>$$ • External Partner</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 180px;">${rest.address}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }).join('');
                
                if (window.lucide) window.lucide.createIcons();
            } catch (err) {
                console.error(err);
                if (loadingIndicator) loadingIndicator.remove();
            }
        };

        function filterRestaurants(category, searchQuery) {
            loadGooglePlaces();
        }

        // Run initial filter on load to apply current radius and trigger live location tracking
        trackLiveLocation(true);
        loadGooglePlaces();

        // Top picks add button wiring
        document.querySelectorAll('.pick-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const restId = btn.getAttribute('data-restid');
                const itemId = btn.getAttribute('data-id');
                window.DineDirectStore.addToCart(restId, itemId);
                showToast('Item added to cart!');
            });
        });

        // Wire Help Trigger inside sidebar
        const helpBtn = document.getElementById('btnHelpTrigger');
        if (helpBtn) {
            helpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const chatWin = document.getElementById('aiChatWindow');
                const bubble = document.getElementById('aiChatBubble');
                if (chatWin && bubble) {
                    chatWin.classList.remove('d-none');
                    bubble.classList.remove('pulse-float');
                    if (CustomerViews.renderChatMessages) {
                        CustomerViews.renderChatMessages();
                    }
                }
            });
        }
    },


    // 2. Restaurant Menu View
    restaurant: (restId) => {
        const rest = window.DineDirectStore.getRestaurant(restId);
        if (!rest) return `<div>Restaurant not found. <a href="#customer/home">Back Home</a></div>`;

        const menu = rest.menu;
        const cart = window.DineDirectStore.getCart(restId);
        
        // Calculate global cart totals across all restaurants
        const globalCartCount = window.DineDirectStore.getCartTotalCount();
        const globalCartSubtotal = window.DineDirectStore.getCartSubtotal();
        const cartRestaurants = window.DineDirectStore.getCartRestaurants();

        // Group menu items by category
        const categories = [...new Set(menu.map(item => item.category))];

        // Fetch live reviews and average rating
        const reviews = window.DineDirectStore.getReviews(restId);
        const avgScore = reviews.length > 0
            ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
            : (rest.rating || '4.8');

        const restHtml = `
            <div class="customer-restaurant-content fade-in">
                <!-- Banner Image -->
                <div class="rest-banner" style="background-image: url('${restId === 'r1' ? 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' : 'https://images.unsplash.com/photo-1552590635-27c2c21287f5?auto=format&fit=crop&w=1000&q=80'}'); height: 200px; border-radius: 20px; overflow: hidden; margin-bottom: 20px;">
                    <button class="back-btn" onclick="window.location.hash='#customer/home'"><i data-lucide="arrow-left"></i></button>
                </div>
                
                <main class="rest-details-main">
                    <div class="rest-header">
                        <h1>${rest.name}</h1>
                        <p class="text-muted">${rest.address} • Table Service</p>
                    </div>

                    <!-- Restaurant Visual Tour Section -->
                    <div class="visual-tour mt-3 card animate-fade-in" style="padding:16px; border:1px solid #f0f0f0; box-shadow:none;">
                        <h3 style="font-size:1rem; font-weight:600; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                            <i data-lucide="image" style="width:16px; height:16px; color:var(--primary);"></i>
                            <span>Explore Restaurant Ambience</span>
                        </h3>
                        <div class="tour-gallery" style="display:flex; gap:10px; overflow-x:auto; padding-bottom:8px;">
                            ${(() => {
                                let ambienceList = [];
                                try {
                                    ambienceList = typeof rest.ambience === 'string' ? JSON.parse(rest.ambience) : (rest.ambience || []);
                                } catch (e) {
                                    console.error('Error parsing ambience:', e);
                                }
                                if (ambienceList.length === 0) {
                                    ambienceList = [
                                        { url: 'images/dining_hall.png', label: 'Dining Hall' },
                                        { url: 'images/patio.png', label: 'Patio Seating' },
                                        { url: 'images/kitchen.png', label: 'Kitchen Tour' }
                                    ];
                                }
                                return ambienceList.map(img => `
                                    <div class="gallery-item" onclick="window.CustomerViews.openLightbox('${img.url}', '${img.label}')" style="flex-shrink:0; width:120px; height:80px; border-radius:8px; background-image:url('${img.url}'); background-size:cover; background-position:center; cursor:pointer; position:relative; overflow:hidden; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                                        <div style="position:absolute; bottom:0; left:0; width:100%; background:rgba(0,0,0,0.6); color:white; font-size:0.65rem; text-align:center; padding:3px 0; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${img.label}</div>
                                    </div>
                                `).join('');
                            })()}
                        </div>
                    </div>

                    ${categories.map(cat => `
                        <div class="menu-section mt-4">
                            <h2 style="font-size:1.3rem; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:8px; margin-bottom:16px;">${cat}</h2>
                            
                            ${menu.filter(item => item.category === cat).map(item => {
                                const qty = cart[item.id] || 0;
                                const isVeg = item.type === 'veg';
                                return `
                                    <div class="menu-item-card card mt-3" style="display:flex; justify-content:space-between; padding:16px;">
                                        <div class="menu-item-info">
                                            <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
                                                <span class="diet-dot ${isVeg ? 'veg' : 'non-veg'}" style="width:12px; height:12px; border:2px solid ${isVeg ? 'green' : 'red'}; display:inline-flex; align-items:center; justify-content:center; border-radius:2px;">
                                                    <span style="width:4px; height:4px; border-radius:50%; background:${isVeg ? 'green' : 'red'};"></span>
                                                </span>
                                                <span style="font-size:0.75rem; text-transform:uppercase; font-weight:600; color:var(--text-muted);">${item.type}</span>
                                            </div>
                                            <h4>${item.name}</h4>
                                            <p class="price" style="font-weight:600; color:var(--primary); margin: 4px 0;">₹${item.price}</p>
                                            <p class="desc text-muted" style="font-size:0.85rem;">${item.desc}</p>
                                        </div>
                                        <div class="menu-item-action" style="display:flex; flex-direction:column; align-items:center; justify-content:space-between; width:100px;">
                                            ${item.img ? `<img src="${item.img}" alt="${item.name}" class="item-img">` : `<div class="placeholder-img" style="display:flex;align-items:center;justify-content:center;color:#aaa;"><i data-lucide="pizza"></i></div>`}
                                            
                                            ${qty === 0 ? `
                                                <button class="btn btn-add item-add-btn" data-id="${item.id}">ADD</button>
                                            ` : `
                                                <div class="qty-counter-container" style="display:inline-flex; align-items:center; justify-content:space-between; width:90px; background:var(--secondary); border:1px solid var(--primary); border-radius:8px; padding:2px 8px; margin-top:-15px; z-index:2; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                                                    <button class="qty-btn dec-btn" data-id="${item.id}" style="border:none; background:none; font-size:1.2rem; font-weight:bold; color:var(--primary); cursor:pointer; width:20px;">-</button>
                                                    <span class="qty-count" style="font-weight:bold; color:var(--text-main);">${qty}</span>
                                                    <button class="qty-btn inc-btn" data-id="${item.id}" style="border:none; background:none; font-size:1.2rem; font-weight:bold; color:var(--primary); cursor:pointer; width:20px;">+</button>
                                                </div>
                                            `}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `).join('')}

                    <!-- Customer Ratings & Reviews Section -->
                    <div class="restaurant-reviews-card card mt-4 animate-fade-in">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                            <h3 style="font-size:1.15rem; font-weight:700; margin:0; display:flex; align-items:center; gap:8px;">
                                <i data-lucide="star" style="width:20px; height:20px; color:#f59e0b; fill:#f59e0b;"></i>
                                <span>Guest Reviews & Ratings</span>
                            </h3>
                            <span class="badge" style="background:#fef3c7; color:#b45309; font-weight:700; padding:4px 10px; border-radius:12px; font-size:0.85rem;">
                                ${reviews.length} ${reviews.length === 1 ? 'Review' : 'Reviews'}
                            </span>
                        </div>

                        <div class="review-rating-summary">
                            <div>
                                <div class="big-rating-number">${avgScore}</div>
                                <div style="color:#f59e0b; font-size:1.1rem; margin-top:4px;">
                                    ${'★'.repeat(Math.min(5, Math.round(Number(avgScore))))}${'☆'.repeat(Math.max(0, 5 - Math.round(Number(avgScore))))}
                                </div>
                                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Verified Dining Rating</div>
                            </div>
                            <div style="flex:1; border-left:1px solid #f1f5f9; padding-left:16px; font-size:0.8rem; color:var(--text-muted);">
                                <div><strong style="color:var(--text-main);">100% Verified Diners</strong></div>
                                <div style="margin-top:4px;">Ratings and compliments submitted by customers after meal delivery.</div>
                            </div>
                        </div>

                        <div class="reviews-list">
                            ${reviews.length === 0 ? `
                                <div class="text-center py-3 text-muted" style="font-size:0.85rem;">
                                    <p>No reviews yet for this restaurant. Be the first to leave feedback after dining!</p>
                                </div>
                            ` : reviews.slice(0, 5).map(rev => {
                                const timeStr = new Date(rev.timestamp || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' });
                                const stars = Number(rev.rating) || 5;
                                const tags = Array.isArray(rev.tags) ? rev.tags : [];
                                return `
                                    <div class="review-list-item">
                                        <div style="display:flex; justify-content:space-between; align-items:center;">
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <div style="width:28px; height:28px; border-radius:50%; background:#fed7aa; color:#9a3412; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">
                                                    ${(rev.customerName || 'G').charAt(0).toUpperCase()}
                                                </div>
                                                <strong style="font-size:0.9rem;">${rev.customerName || 'Guest Diner'}</strong>
                                            </div>
                                            <span style="font-size:0.75rem; color:var(--text-muted);">${timeStr}</span>
                                        </div>
                                        <div style="color:#f59e0b; font-size:0.9rem; margin-top:4px;">
                                            ${'★'.repeat(Math.min(5, stars))}${'☆'.repeat(Math.max(0, 5 - stars))}
                                        </div>
                                        ${rev.comment ? `<p style="font-size:0.85rem; color:var(--text-main); margin:6px 0 0;">${rev.comment}</p>` : ''}
                                        ${tags.length > 0 ? `
                                            <div class="review-tags-display">
                                                ${tags.map(t => `<span class="review-tag-badge">✓ ${t}</span>`).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </main>
                
                <!-- Floating Cart Button -->
                <div class="floating-cart ${globalCartCount > 0 ? '' : 'd-none'}" id="floatingCart" onclick="window.location.hash='#customer/cart'" style="display:${globalCartCount > 0 ? 'flex' : 'none'};">
                    <div class="cart-info">
                        <span class="qty">${globalCartCount} ${globalCartCount === 1 ? 'ITEM' : 'ITEMS'} ${cartRestaurants.length > 1 ? `• ${cartRestaurants.length} Kitchens` : ''}</span>
                        <span class="total">₹${globalCartSubtotal}</span>
                    </div>
                    <span class="view-cart">View Cart <i data-lucide="chevron-right"></i></span>
                </div>

                <!-- Image Lightbox Modal -->
                <div class="modal-overlay d-none" id="tourLightbox" style="background:rgba(0,0,0,0.9); z-index:3000;">
                    <div class="lightbox-container" style="position:relative; max-width:90%; max-height:80%; margin:auto; display:flex; flex-direction:column; align-items:center;">
                        <button class="btn btn-secondary" onclick="window.CustomerViews.closeLightbox()" style="position:absolute; top:-40px; right:0; padding:6px 12px; font-size:0.8rem; background:#fff; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer;">✕</button>
                        <img id="lightboxImage" src="" style="max-width:100%; max-height:70vh; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5); object-fit:contain;">
                        <div id="lightboxCaption" style="color:white; font-family:var(--font-heading); font-weight:600; margin-top:16px; font-size:1.1rem; text-align:center;"></div>
                    </div>
                </div>
            </div>
        `;
        return CustomerViews.wrapLayout(restHtml, 'explore');
    },

    setupRestaurantListeners: (restId) => {
        // Wire ADD buttons
        document.querySelectorAll('.item-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = btn.getAttribute('data-id');
                window.DineDirectStore.addToCart(restId, itemId);
                showToast('Item added to cart!');
            });
        });

        // Wire INC buttons
        document.querySelectorAll('.inc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = btn.getAttribute('data-id');
                window.DineDirectStore.addToCart(restId, itemId);
            });
        });

        // Wire DEC buttons
        document.querySelectorAll('.dec-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = btn.getAttribute('data-id');
                window.DineDirectStore.removeFromCart(restId, itemId);
            });
        });
    },


    cart: () => {
        const session = window.DineDirectStore.getSession();
        const userName = session.currentUser || 'Guest';

        const cartRestaurants = window.DineDirectStore.getCartRestaurants();

        if (cartRestaurants.length === 0) {
            return CustomerViews.wrapLayout(`
                <div class="customer-cart-content fade-in bg-gray" style="min-height:100vh; padding: 60px 20px; text-align:center;">
                    <i data-lucide="shopping-cart" style="width:56px;height:56px;color:var(--text-muted);opacity:0.3;margin-bottom:16px;"></i>
                    <h3>Your Cart is Empty</h3>
                    <p class="text-muted mt-2">Please select a restaurant to browse delicious food items.</p>
                    <button class="btn btn-primary mt-4" onclick="window.location.hash='#customer/home'">Explore Restaurants</button>
                </div>
            `, 'cart');
        }

        // Subtotal calculation across all restaurants
        let subtotal = 0;
        const groupedCart = cartRestaurants.map(rest => {
            const cart = window.DineDirectStore.getCart(rest.id);
            const menu = rest.menu || [];
            const activeItemIds = Object.keys(cart).filter(id => Number(cart[id]) > 0);
            let restTotal = 0;
            const items = activeItemIds.map(itemId => {
                const item = menu.find(m => m.id === itemId);
                const qty = Number(cart[itemId]);
                const price = item ? Number(item.price) || 0 : 0;
                restTotal += price * qty;
                return {
                    id: itemId,
                    name: item ? item.name : 'Unknown Item',
                    price,
                    qty
                };
            });
            subtotal += restTotal;
            return {
                restaurant: rest,
                items,
                restTotal
            };
        });

        // Dynamic Multi-Hop Distance & Delivery Fee Calculation
        const custLat = (window.customerLocation && window.customerLocation.lat) || 17.4375;
        const custLng = (window.customerLocation && window.customerLocation.lng) || 78.4482;
        const custLocName = (window.customerLocation && window.customerLocation.name) || 'Begumpet, Hyderabad';

        let totalDistance = 0;
        const routeStops = [];

        if (cartRestaurants.length === 1) {
            const r = cartRestaurants[0];
            const d = calculateDistance(r.latitude || 17.4411, r.longitude || 78.4983, custLat, custLng);
            totalDistance = d;
            routeStops.push({
                type: 'restaurant',
                name: r.name,
                address: r.address || 'Hyderabad',
                legDist: d
            });
            routeStops.push({
                type: 'home',
                name: custLocName,
                address: 'Delivery Destination',
                legDist: 0
            });
        } else {
            // Multi-restaurant sequential route:
            // Courier visits Restaurant 1 -> Restaurant 2 -> ... -> Delivery to Customer
            for (let i = 0; i < cartRestaurants.length; i++) {
                const cur = cartRestaurants[i];
                let legDist = 0;
                if (i < cartRestaurants.length - 1) {
                    const next = cartRestaurants[i + 1];
                    legDist = calculateDistance(
                        cur.latitude || 17.4411, cur.longitude || 78.4983,
                        next.latitude || 17.4319, next.longitude || 78.4073
                    );
                    totalDistance += legDist;
                } else {
                    legDist = calculateDistance(
                        cur.latitude || 17.4319, cur.longitude || 78.4073,
                        custLat, custLng
                    );
                    totalDistance += legDist;
                }
                routeStops.push({
                    type: 'restaurant',
                    name: cur.name,
                    address: cur.address || 'Hyderabad',
                    legDist
                });
            }
            routeStops.push({
                type: 'home',
                name: custLocName,
                address: 'Your Delivery Address',
                legDist: 0
            });
        }

        totalDistance = parseFloat(totalDistance.toFixed(1));

        // Delivery Pricing Model:
        // Base fee: ₹30 (covers first 2 km)
        // Distance rate: ₹10 per km beyond 2 km
        // Multi-Restaurant Detour Surcharge: ₹25 per additional restaurant
        const baseDeliveryFee = 30;
        const extraKm = Math.max(0, totalDistance - 2.0);
        const distanceCharge = Math.ceil(extraKm) * 10;
        const detourCharge = (cartRestaurants.length - 1) * 25;
        const deliveryFee = baseDeliveryFee + distanceCharge + detourCharge;

        const cgst = Math.round(subtotal * 0.025);
        const sgst = Math.round(subtotal * 0.025);
        const serviceCharge = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + cgst + sgst + serviceCharge + deliveryFee;

        const isMultiVendor = cartRestaurants.length > 1;

        const cartHtml = `
            <div class="customer-cart-content fade-in bg-gray" style="min-height:100vh;">
                <header class="plain-header">
                    <button class="back-btn" onclick="window.history.back()"><i data-lucide="arrow-left"></i></button>
                    <h2>Checkout</h2>
                </header>

                <main class="mobile-main pb-100">
                    <div class="mt-3">
                        ${isMultiVendor ? `
                            <div class="multi-rest-banner animate-fade-in">
                                <i data-lucide="layers" style="color:var(--primary); width:24px; height:24px; flex-shrink:0;"></i>
                                <div style="flex:1;">
                                    <strong style="font-size:0.95rem; color:#9a3412;">Multi-Restaurant Shared Cart</strong>
                                    <div style="font-size:0.8rem; color:#c2410c;">Ordering from <strong>${cartRestaurants.length} restaurants</strong> in a single unified checkout!</div>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Grouped Items per Restaurant -->
                        ${groupedCart.map(grp => `
                            <div class="multi-rest-cart-group">
                                <div class="multi-rest-header">
                                    <div>
                                        <h3 style="font-size:1.05rem; font-weight:700; margin:0; display:flex; align-items:center; gap:6px;">
                                            <i data-lucide="store" style="width:18px; height:18px; color:var(--primary);"></i>
                                            <span>${grp.restaurant.name}</span>
                                        </h3>
                                        <p class="text-muted" style="font-size:0.75rem; margin:2px 0 0;">${grp.restaurant.address || 'Hyderabad'}</p>
                                    </div>
                                    <button class="btn btn-secondary" onclick="window.location.hash='#customer/restaurant/${grp.restaurant.id}'" style="padding:4px 10px; font-size:0.75rem; border-radius:8px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:4px;">
                                        <span>+ Add More</span>
                                    </button>
                                </div>

                                <div class="cart-items" style="padding:16px;">
                                    ${grp.items.map(it => `
                                        <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                                            <div style="flex:1;">
                                                <h4 style="font-weight:500; font-size:0.95rem; margin:0;">${it.name}</h4>
                                                <span style="font-size:0.85rem; color:var(--primary); font-weight:600;">₹${it.price}</span>
                                            </div>
                                            <div class="item-ctrl" style="display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.05); padding:4px 12px; border-radius:8px;">
                                                <button class="qty-btn dec-cart-btn" data-rest-id="${grp.restaurant.id}" data-id="${it.id}">-</button>
                                                <span style="font-weight:bold;">${it.qty}</span>
                                                <button class="qty-btn inc-cart-btn" data-rest-id="${grp.restaurant.id}" data-id="${it.id}">+</button>
                                            </div>
                                            <div style="font-weight:600; width:65px; text-align:right;">₹${it.price * it.qty}</div>
                                        </div>
                                    `).join('')}

                                    <div style="border-top:1px dashed rgba(0,0,0,0.08); padding-top:10px; display:flex; justify-content:space-between; font-size:0.85rem;">
                                        <span class="text-muted">Kitchen Subtotal:</span>
                                        <strong style="color:var(--text-main);">₹${grp.restTotal}</strong>
                                    </div>
                                </div>
                            </div>
                        `).join('')}

                        <!-- Dynamic Multi-Hop Distance & Delivery Route Breakdown -->
                        <div class="route-visualizer animate-fade-in">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <h4 style="font-size:0.95rem; font-weight:700; margin:0; display:flex; align-items:center; gap:8px;">
                                    <i data-lucide="navigation" style="color:var(--primary); width:18px; height:18px;"></i>
                                    <span>${isMultiVendor ? 'Multi-Stop Courier Delivery Route' : 'Direct Courier Delivery Route'}</span>
                                </h4>
                                <span class="badge bg-primary" style="padding:4px 10px; border-radius:12px; font-weight:700; font-size:0.75rem;">
                                    ${totalDistance} km
                                </span>
                            </div>

                            <p style="font-size:0.8rem; color:#64748b; margin:6px 0 14px;">
                                ${isMultiVendor 
                                    ? `Courier collects fresh items sequentially across <strong>${cartRestaurants.length} kitchens</strong> and delivers straight to you.` 
                                    : `Direct fast delivery from kitchen straight to your address.`}
                            </p>

                            <div class="route-steps-container">
                                ${routeStops.map((stop, idx) => `
                                    <div class="route-step-item ${stop.type === 'home' ? 'home' : ''}">
                                        <div class="node-dot"></div>
                                        <div style="flex:1; padding-right:10px;">
                                            <strong style="font-size:0.85rem; display:block; color:var(--text-main);">${stop.name}</strong>
                                            <span style="font-size:0.75rem; color:#64748b;">${stop.address}</span>
                                        </div>
                                        ${stop.legDist > 0 ? `
                                            <span class="badge" style="background:#e0f2fe; color:#0284c7; font-size:0.7rem; padding:2px 8px; border-radius:8px;">
                                                ➔ ${stop.legDist} km
                                            </span>
                                        ` : `
                                            <span class="badge" style="background:#dcfce7; color:#15803d; font-size:0.7rem; padding:2px 8px; border-radius:8px;">
                                                📍 Drop
                                            </span>
                                        `}
                                    </div>
                                `).join('')}
                            </div>

                            <!-- Transparent Pricing Details -->
                            <div style="margin-top:14px; padding:12px; background:#ffffff; border-radius:10px; border:1px solid #e2e8f0; font-size:0.8rem; color:#475569;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                    <span>Base Courier Fee (first 2.0 km):</span>
                                    <strong>₹${baseDeliveryFee}</strong>
                                </div>
                                ${distanceCharge > 0 ? `
                                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                        <span>Route Distance Fee (${extraKm.toFixed(1)} km @ ₹10/km):</span>
                                        <strong>₹${distanceCharge}</strong>
                                    </div>
                                ` : ''}
                                ${detourCharge > 0 ? `
                                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#c2410c;">
                                        <span>Multi-Restaurant Detour Pickup (${cartRestaurants.length - 1} extra):</span>
                                        <strong>₹${detourCharge}</strong>
                                    </div>
                                ` : ''}
                                <div style="display:flex; justify-content:space-between; border-top:1px dashed #e2e8f0; padding-top:6px; margin-top:6px; font-weight:bold; color:var(--text-main);">
                                    <span>Total Distance Delivery Charge:</span>
                                    <span style="color:var(--primary); font-size:0.95rem;">₹${deliveryFee}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Customer Details Form -->
                        ${userName === 'Guest' ? `
                            <div class="customer-details-form card mt-4 animate-fade-in" style="padding:16px;">
                                <h4 style="font-size:1rem; font-weight:600; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                                    <i data-lucide="user" style="width:16px; height:16px; color:var(--primary);"></i>
                                    <span>Contact & Delivery Details</span>
                                </h4>
                                <div class="form-group" style="margin-bottom:12px;">
                                    <label style="font-size:0.8rem; color:var(--text-muted); display:block; margin-bottom:6px; font-weight:500;">Your Name</label>
                                    <input type="text" class="form-control" id="checkoutCustomerName" placeholder="e.g. John Doe" required style="background:#fff; border:1px solid #ddd; padding:10px 12px; border-radius:8px; width:100%; box-sizing:border-box; font-size:0.9rem;">
                                </div>
                                <div class="form-group" style="margin-bottom:8px;">
                                    <label style="font-size:0.8rem; color:var(--text-muted); display:block; margin-bottom:6px; font-weight:500;">Phone Number</label>
                                    <input type="tel" class="form-control" id="checkoutCustomerPhone" placeholder="e.g. +91 98765 43210" required style="background:#fff; border:1px solid #ddd; padding:10px 12px; border-radius:8px; width:100%; box-sizing:border-box; font-size:0.9rem;">
                                </div>
                            </div>
                        ` : ''}

                        <!-- Bill Details Card -->
                        <div class="bill-details card mt-4" style="padding:16px;">
                            <h4 style="font-weight:700; margin-bottom:12px;">Bill Details</h4>
                            <div class="bill-row" style="display:flex; justify-content:space-between; margin-bottom:8px;"><span class="text-muted">Item Subtotal</span> <span>₹${subtotal}</span></div>
                            <div class="bill-row" style="display:flex; justify-content:space-between; margin-bottom:8px;"><span class="text-muted">CGST (2.5%)</span> <span>₹${cgst}</span></div>
                            <div class="bill-row" style="display:flex; justify-content:space-between; margin-bottom:8px;"><span class="text-muted">SGST (2.5%)</span> <span>₹${sgst}</span></div>
                            <div class="bill-row" style="display:flex; justify-content:space-between; margin-bottom:8px;"><span class="text-muted">Restaurant Service Charge (5%)</span> <span>₹${serviceCharge}</span></div>
                            <div class="bill-row" style="display:flex; justify-content:space-between; margin-bottom:8px;"><span class="text-muted">Distance-Based Delivery Fee</span> <span>₹${deliveryFee}</span></div>
                            <div class="bill-row total-row" style="display:flex; justify-content:space-between; margin-top:12px; border-top:1px dashed rgba(0,0,0,0.1); padding-top:12px;">
                                <strong>To Pay (Inclusive of GST & Delivery)</strong> <strong style="color:var(--primary); font-size:1.25rem;">₹${grandTotal}</strong>
                            </div>
                        </div>

                        <!-- Payment Sandbox Section -->
                        <div class="payment-method-selector card mt-4" style="border:1px solid #fed7aa; padding:16px; background:#fffaf7;">
                            <h4 style="font-weight:700; font-size:0.95rem; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                <i data-lucide="shield-check" style="color:var(--primary); width:18px; height:18px;"></i>
                                <span>Choose Payment Option</span>
                            </h4>

                            <div class="payment-methods-grid">
                                <div class="payment-method-card active" data-method="upi" id="payOptionUpi">
                                    <input type="radio" name="paymentOptionRadio" value="upi" checked>
                                    <div style="flex:1;">
                                        <div style="font-weight:600; font-size:0.9rem;">Instant UPI (QR / Apps)</div>
                                        <div style="font-size:0.75rem; color:var(--text-muted);">GPay, PhonePe, Paytm, BHIM</div>
                                    </div>
                                    <i data-lucide="qr-code" style="color:var(--primary); width:20px; height:20px;"></i>
                                </div>

                                <div class="payment-method-card" data-method="card" id="payOptionCard">
                                    <input type="radio" name="paymentOptionRadio" value="card">
                                    <div style="flex:1;">
                                        <div style="font-weight:600; font-size:0.9rem;">Credit / Debit Card Sandbox</div>
                                        <div style="font-size:0.75rem; color:var(--text-muted);">Simulate Visa, Mastercard, RuPay</div>
                                    </div>
                                    <i data-lucide="credit-card" style="color:var(--primary); width:20px; height:20px;"></i>
                                </div>

                                <div class="payment-method-card" data-method="counter" id="payOptionCounter">
                                    <input type="radio" name="paymentOptionRadio" value="counter">
                                    <div style="flex:1;">
                                        <div style="font-weight:600; font-size:0.9rem;">Pay on Delivery / Counter</div>
                                        <div style="font-size:0.75rem; color:var(--text-muted);">Cash / UPI to rider at doorstep</div>
                                    </div>
                                    <i data-lucide="banknote" style="color:var(--primary); width:20px; height:20px;"></i>
                                </div>
                            </div>

                            <!-- Dynamic Subpanel for UPI -->
                            <div class="payment-subpanel" id="panelUpi">
                                <div style="text-align:center;">
                                    <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-bottom:8px;">SCAN TEST QR CODE TO PAY ₹${grandTotal}</div>
                                    <div style="display:inline-block; padding:12px; background:white; border-radius:12px; border:1px solid #e2e8f0;">
                                        <i data-lucide="qr-code" style="width:100px; height:100px; color:#1e293b;"></i>
                                    </div>
                                    <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:10px;">
                                        <span style="font-size:0.8rem; background:#ffffff; border:1px solid #e2e8f0; padding:4px 10px; border-radius:8px; font-family:monospace;">dinedirect@okaxis</span>
                                        <button type="button" class="btn btn-secondary" onclick="navigator.clipboard.writeText('dinedirect@okaxis'); window.showToast('📋 UPI ID copied!');" style="padding:4px 10px; font-size:0.75rem;">Copy</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Dynamic Subpanel for Card Sandbox -->
                            <div class="payment-subpanel d-none" id="panelCard">
                                <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-bottom:10px;">TEST CARD DETAILS</div>
                                <div class="form-group" style="margin-bottom:8px;">
                                    <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Card Number</label>
                                    <input type="text" class="form-control" id="sandboxCardNum" value="4242 •••• •••• 4242" style="background:#fff; font-family:monospace; font-size:0.85rem; padding:8px 12px; border-radius:8px; border:1px solid #ddd; width:100%; box-sizing:border-box;">
                                </div>
                                <div style="display:flex; gap:10px;">
                                    <div style="flex:1;">
                                        <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Valid Thru</label>
                                        <input type="text" class="form-control" id="sandboxCardExp" value="12/28" style="background:#fff; font-family:monospace; font-size:0.85rem; padding:8px 12px; border-radius:8px; border:1px solid #ddd; width:100%; box-sizing:border-box;">
                                    </div>
                                    <div style="flex:1;">
                                        <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">CVV</label>
                                        <input type="password" class="form-control" id="sandboxCardCvv" value="888" style="background:#fff; font-family:monospace; font-size:0.85rem; padding:8px 12px; border-radius:8px; border:1px solid #ddd; width:100%; box-sizing:border-box;">
                                    </div>
                                </div>
                            </div>

                            <!-- Dynamic Subpanel for Counter -->
                            <div class="payment-subpanel d-none" id="panelCounter">
                                <div style="display:flex; gap:10px; align-items:center;">
                                    <i data-lucide="info" style="width:20px; height:20px; color:var(--primary); flex-shrink:0;"></i>
                                    <span style="font-size:0.8rem; color:#475569;">
                                        Your order will be transmitted directly to all kitchens. You can pay <strong>₹${grandTotal}</strong> in cash or UPI to the courier upon delivery.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <div class="checkout-bar text-center">
                    <button class="btn btn-primary btn-block" id="btnPlaceOrderMain" data-delivery-fee="${deliveryFee}" style="padding:14px; font-size:1rem; font-weight:700; border-radius:12px; box-shadow:0 4px 14px rgba(234, 88, 12, 0.35); width:100%; max-width:480px; margin:0 auto; display:flex; align-items:center; justify-content:center; gap:8px;">
                        <span id="checkoutActionLabel">Pay via Instant UPI (₹${grandTotal})</span> <i data-lucide="arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        return CustomerViews.wrapLayout(cartHtml, 'cart');
    },

    setupCartListeners: () => {
        const session = window.DineDirectStore.getSession();

        // Wire counter buttons for each restaurant item
        document.querySelectorAll('.inc-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const restId = btn.getAttribute('data-rest-id');
                const itemId = btn.getAttribute('data-id');
                window.DineDirectStore.addToCart(restId, itemId);
            });
        });

        document.querySelectorAll('.dec-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const restId = btn.getAttribute('data-rest-id');
                const itemId = btn.getAttribute('data-id');
                window.DineDirectStore.removeFromCart(restId, itemId);
            });
        });

        // Payment switcher logic
        let currentMethod = 'upi';
        const methodCards = document.querySelectorAll('.payment-method-card');
        const panelUpi = document.getElementById('panelUpi');
        const panelCard = document.getElementById('panelCard');
        const panelCounter = document.getElementById('panelCounter');
        const checkoutActionLabel = document.getElementById('checkoutActionLabel');
        const btnPlaceOrderMain = document.getElementById('btnPlaceOrderMain');

        const updatePaymentSelection = (method) => {
            currentMethod = method;
            methodCards.forEach(c => {
                if (c.getAttribute('data-method') === method) {
                    c.classList.add('active');
                    const radio = c.querySelector('input[type="radio"]');
                    if (radio) radio.checked = true;
                } else {
                    c.classList.remove('active');
                }
            });

            if (panelUpi) panelUpi.classList.toggle('d-none', method !== 'upi');
            if (panelCard) panelCard.classList.toggle('d-none', method !== 'card');
            if (panelCounter) panelCounter.classList.toggle('d-none', method !== 'counter');

            if (checkoutActionLabel && btnPlaceOrderMain) {
                const subtotal = window.DineDirectStore.getCartSubtotal();
                const cgst = Math.round(subtotal * 0.025);
                const sgst = Math.round(subtotal * 0.025);
                const sc = Math.round(subtotal * 0.05);
                const deliveryFee = Number(btnPlaceOrderMain.getAttribute('data-delivery-fee')) || 0;
                const tot = subtotal + cgst + sgst + sc + deliveryFee;

                if (method === 'upi') {
                    checkoutActionLabel.textContent = `Pay via Instant UPI (₹${tot})`;
                } else if (method === 'card') {
                    checkoutActionLabel.textContent = `Authorize Card & Pay (₹${tot})`;
                } else {
                    checkoutActionLabel.textContent = `Place Order • Pay on Delivery (₹${tot})`;
                }
            }
        };

        methodCards.forEach(card => {
            card.addEventListener('click', () => {
                const method = card.getAttribute('data-method');
                updatePaymentSelection(method);
            });
        });

        // Order Placement button
        if (btnPlaceOrderMain) {
            btnPlaceOrderMain.addEventListener('click', async () => {
                const nameInput = document.getElementById('checkoutCustomerName');
                const phoneInput = document.getElementById('checkoutCustomerPhone');

                if (nameInput && !nameInput.value.trim()) {
                    nameInput.focus();
                    nameInput.style.borderColor = 'var(--danger)';
                    showToast('⚠️ Please enter your name to proceed.');
                    return;
                }
                if (phoneInput && !phoneInput.value.trim()) {
                    phoneInput.focus();
                    phoneInput.style.borderColor = 'var(--danger)';
                    showToast('⚠️ Please enter your phone number to proceed.');
                    return;
                }

                let userName = session.currentUser || 'Guest';
                if (nameInput && nameInput.value.trim()) {
                    userName = nameInput.value.trim();
                    const phoneVal = phoneInput ? phoneInput.value.trim() : '';
                    if (phoneVal) {
                        userName += ` (${phoneVal})`;
                    }
                    window.DineDirectStore.setSession({ currentUser: userName });
                }

                const deliveryFee = Number(btnPlaceOrderMain.getAttribute('data-delivery-fee')) || 0;
                const cartRestaurants = window.DineDirectStore.getCartRestaurants();

                // Simulation feedback
                btnPlaceOrderMain.disabled = true;
                const originalText = btnPlaceOrderMain.innerHTML;
                btnPlaceOrderMain.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Placing Order across ${cartRestaurants.length} Kitchen${cartRestaurants.length > 1 ? 's' : ''}...`;

                setTimeout(async () => {
                    try {
                        const paymentMethodCode = currentMethod === 'counter' ? 'pay_later' : (currentMethod === 'card' ? 'card' : 'pay_now');
                        const result = await window.DineDirectStore.placeGroupOrder(
                            session.activeTableNum,
                            paymentMethodCode,
                            userName,
                            deliveryFee
                        );
                        
                        if (currentMethod === 'counter') {
                            showToast('🍽️ Multi-Restaurant Order Placed! Pay on delivery.');
                        } else {
                            showToast('✅ Payment authorized! All kitchens received your tickets.');
                        }
                        window.location.hash = '#customer/tracking';
                    } catch (err) {
                        showToast('⚠️ Failed to place order: ' + err.message);
                        btnPlaceOrderMain.disabled = false;
                        btnPlaceOrderMain.innerHTML = originalText;
                    }
                }, 400);
            });
        }
    },

    tracking: () => {
        const session = window.DineDirectStore.getSession();
        const activeGroupId = session.activeGroupOrderId;
        const allOrders = window.DineDirectStore.getOrders(); // all orders across all restaurants
        
        let trackedOrders = [];
        if (activeGroupId) {
            trackedOrders = allOrders.filter(o => o.groupOrderId === activeGroupId);
        }
        
        if (trackedOrders.length === 0) {
            const activeTable = session.activeTableNum;
            const activeOrder = allOrders.find(o => 
                (activeTable && String(o.tableNum) === String(activeTable) && o.status !== 'delivered' && o.status !== 'served') || 
                (!activeTable && o.status !== 'delivered' && o.status !== 'served')
            ) || allOrders[0];

            if (activeOrder) {
                if (activeOrder.groupOrderId) {
                    trackedOrders = allOrders.filter(o => o.groupOrderId === activeOrder.groupOrderId);
                } else {
                    trackedOrders = [activeOrder];
                }
            }
        }

        if (trackedOrders.length === 0) {
            const emptyTracking = `
                <div class="customer-tracking-content fade-in">
                    <header class="plain-header">
                        <h2>Order Status</h2>
                    </header>
                    <main class="mobile-main text-center mt-4" style="padding:40px 20px;">
                        <i data-lucide="receipt" style="width:64px;height:64px;color:var(--text-muted);opacity:0.4;margin-bottom:16px;"></i>
                        <h3>No Active Order</h3>
                        <p class="text-muted mt-2">Scan a table QR code or place an order to track cooking live.</p>
                        <button class="btn btn-primary mt-4 btn-block" onclick="window.location.hash='#customer/home'">Go to Home</button>
                    </main>
                </div>
            `;
            return CustomerViews.wrapLayout(emptyTracking, 'orders');
        }

        const isMultiRestaurant = trackedOrders.length > 1;
        const primaryOrder = trackedOrders[0];

        // Overall status across all kitchens in the order
        const allDelivered = trackedOrders.every(o => o.status === 'delivered' || o.status === 'served');
        const anyReady = trackedOrders.some(o => o.status === 'ready');
        const anyPreparing = trackedOrders.some(o => o.status === 'preparing');

        let statusText = isMultiRestaurant ? 'Orders Placed (All Kitchens)' : 'Order Placed';
        let statusDesc = isMultiRestaurant ? 'All kitchens have accepted your order and are cooking.' : 'Waiting for restaurant confirmation...';
        let progressWidth = '15%';
        let step1 = 'active', step2 = '', step3 = '', step4 = '';

        if (allDelivered) {
            statusText = isMultiRestaurant ? 'All Dishes Served & Delivered' : 'Served & Delivered';
            statusDesc = 'Enjoy your multi-restaurant feast! Thanks for ordering.';
            progressWidth = '100%';
            step1 = 'active'; step2 = 'active'; step3 = 'active'; step4 = 'active';
        } else if (anyReady) {
            statusText = isMultiRestaurant ? 'Dishes Ready • Courier Collecting' : 'Food is Ready!';
            statusDesc = isMultiRestaurant ? 'Dishes are ready! Rider is collecting orders across kitchens.' : 'Your order is ready to serve or pick up.';
            progressWidth = '80%';
            step1 = 'active'; step2 = 'active'; step3 = 'active';
        } else if (anyPreparing) {
            statusText = isMultiRestaurant ? 'Kitchens Preparing in Parallel' : 'Preparing Food';
            statusDesc = isMultiRestaurant ? 'Our chefs across multiple restaurants are cooking your meals.' : 'Our chef is cooking your delicious meal.';
            progressWidth = '50%';
            step1 = 'active'; step2 = 'active';
        }

        const existingReviews = window.DineDirectStore.getReviews(primaryOrder.restaurantId);
        const hasReviewed = existingReviews.some(r => String(r.orderId) === String(primaryOrder.id));

        const trackingHtml = `
            <div class="customer-tracking-content fade-in" style="min-height:100vh;">
                <header class="plain-header" style="border-bottom:1px solid rgba(0,0,0,0.05);">
                    <h2>Live Tracking</h2>
                </header>
                <main class="mobile-main flex-center" style="padding-top:40px;">
                    <div class="tracking-container text-center" style="width:100%;">
                        <div class="status-icon ${anyPreparing ? 'pulse' : ''}" style="margin:0 auto; width:100px; height:100px; background:rgba(255, 107, 53, 0.1); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="${anyReady ? 'bell-ring' : (allDelivered ? 'check-circle' : 'chef-hat')}" style="width:48px;height:48px;color:var(--primary)"></i>
                        </div>
                        <h2 class="mt-4">${statusText}</h2>
                        <p class="text-muted mt-2">${statusDesc}</p>
                        
                        <div style="font-weight:bold; margin-top:16px; font-size:1rem; color:var(--text-main);">
                            ${isMultiRestaurant ? `Group Order #${primaryOrder.groupOrderId || primaryOrder.id} • ${trackedOrders.length} Restaurants` : `Order #${primaryOrder.id}`}
                        </div>
                        
                        <div class="progress-bar-container mt-4" style="background:#e9ecef; height:8px; border-radius:4px; width:100%; overflow:hidden;">
                            <div class="progress-fill" style="background:var(--primary); height:100%; width:${progressWidth}; transition: width 0.5s ease;"></div>
                        </div>

                        <div class="order-steps mt-4" style="text-align:left; margin-left:15%;">
                            <div class="step ${step1}">Orders Placed</div>
                            <div class="step ${step2}">${isMultiRestaurant ? 'Parallel Cooking' : 'Preparing'}</div>
                            <div class="step ${step3}">${isMultiRestaurant ? 'Multi-Stop Courier Transit' : 'Ready to Serve'}</div>
                            <div class="step ${step4}">Delivered</div>
                        </div>

                        <!-- Multi-Kitchen Independent Tracking Cards -->
                        ${isMultiRestaurant ? `
                            <div class="mt-4 text-left" style="text-align:left;">
                                <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
                                    <i data-lucide="chef-hat" style="color:var(--primary); width:18px; height:18px;"></i>
                                    <span>Kitchen Preparation Status (${trackedOrders.length} Restaurants)</span>
                                </h4>
                                ${trackedOrders.map(ord => {
                                    const r = window.DineDirectStore.getRestaurant(ord.restaurantId) || { name: 'Restaurant' };
                                    const badgeClass = ord.status === 'delivered' || ord.status === 'served' ? 'bg-success' : (ord.status === 'ready' ? 'bg-warning' : (ord.status === 'preparing' ? 'bg-primary' : 'bg-danger'));
                                    return `
                                        <div class="multi-kitchen-card" style="border-left:4px solid ${ord.status === 'ready' ? '#f59e0b' : (ord.status === 'served' || ord.status === 'delivered' ? '#10b981' : (ord.status === 'preparing' ? 'var(--primary)' : '#ef4444'))};">
                                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                                <div>
                                                    <strong style="font-size:0.95rem; color:var(--text-main);">${r.name}</strong>
                                                    <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Ticket #${ord.id}</span>
                                                </div>
                                                <span class="badge ${badgeClass}" style="text-transform:capitalize; padding:4px 10px; border-radius:10px; font-size:0.75rem;">
                                                    ${ord.status === 'preparing' ? '🍳 Cooking' : (ord.status === 'ready' ? '🔔 Ready' : (ord.status === 'served' || ord.status === 'delivered' ? '✅ Delivered' : '📋 Received'))}
                                                </span>
                                            </div>
                                            <div style="margin-top:8px; font-size:0.85rem; color:#475569; display:flex; flex-wrap:wrap; gap:6px;">
                                                ${(ord.items || []).map(it => `
                                                    <span style="background:#f1f5f9; padding:2px 8px; border-radius:6px; font-size:0.8rem;">${it.qty}x ${it.name}</span>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}

                        <!-- GST Tax Invoice Action -->
                        <button class="btn btn-secondary btn-block mt-4" onclick="window.CustomerViews.openTaxInvoiceModal('${primaryOrder.groupOrderId || primaryOrder.id}')" style="border:1px solid #cbd5e1; display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; font-weight:600; font-size:0.9rem; background:#ffffff;">
                            <i data-lucide="receipt"></i> <span>📄 View GST Tax Invoice / Print Bill</span>
                        </button>

                        ${allDelivered ? `
                            ${hasReviewed ? `
                                <div class="review-submission-card mt-3 animate-fade-in" style="text-align:center; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px;">
                                    <div style="font-size:2rem; margin-bottom:4px;">🌟</div>
                                    <h4 style="color:#166534; font-weight:700; margin:0;">Review Submitted!</h4>
                                    <p style="font-size:0.85rem; color:#15803d; margin-top:6px;">Thank you for your valuable feedback! All kitchens have received your compliments.</p>
                                    <button class="btn btn-primary btn-block mt-3" onclick="window.location.hash='#customer/home'" style="background:var(--success);">Dine Again</button>
                                </div>
                            ` : `
                                <div class="review-submission-card mt-3 animate-fade-in" id="reviewFormCard">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <h4 style="font-size:1.05rem; font-weight:700; margin:0; display:flex; align-items:center; gap:8px;">
                                            <i data-lucide="award" style="color:var(--primary); width:20px; height:20px;"></i>
                                            <span>Rate Your Food & Dining</span>
                                        </h4>
                                        <span class="badge" style="background:#fee2e2; color:#b91c1c; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:8px;">Verified Diner</span>
                                    </div>
                                    <p style="font-size:0.8rem; color:var(--text-muted); margin:4px 0 12px;">How was the taste, presentation, and multi-kitchen delivery?</p>

                                    <div class="star-rating-selector" id="starRatingSelector">
                                        <button type="button" class="star-btn active" data-val="1">★</button>
                                        <button type="button" class="star-btn active" data-val="2">★</button>
                                        <button type="button" class="star-btn active" data-val="3">★</button>
                                        <button type="button" class="star-btn active" data-val="4">★</button>
                                        <button type="button" class="star-btn active" data-val="5">★</button>
                                    </div>

                                    <div style="font-size:0.8rem; font-weight:600; color:var(--text-muted); margin-bottom:6px;">Add Compliment Tags:</div>
                                    <div class="compliment-chips" id="complimentChips">
                                        <button type="button" class="compliment-chip selected" data-tag="Delicious Taste">😋 Delicious Taste</button>
                                        <button type="button" class="compliment-chip selected" data-tag="Hot & Fresh">🔥 Hot & Fresh</button>
                                        <button type="button" class="compliment-chip" data-tag="Fast Multi-Pickup">⚡ Fast Multi-Pickup</button>
                                        <button type="button" class="compliment-chip" data-tag="Great Packaging">📦 Great Packaging</button>
                                        <button type="button" class="compliment-chip" data-tag="Value for Money">💰 Value for Money</button>
                                        <button type="button" class="compliment-chip" data-tag="Friendly Courier">🤝 Friendly Courier</button>
                                    </div>

                                    <div class="form-group mt-3">
                                        <textarea class="review-textarea" id="reviewCommentInput" rows="2" placeholder="Share what you loved about this order..."></textarea>
                                    </div>

                                    <button class="btn btn-primary btn-block mt-3" id="btnSubmitReview" data-order-id="${primaryOrder.id}" data-rest-id="${primaryOrder.restaurantId}" style="display:flex; align-items:center; justify-content:center; gap:8px;">
                                        <i data-lucide="send"></i> <span>Submit Food Review</span>
                                    </button>
                                </div>
                            `}
                        ` : ''}

                        <button class="btn btn-secondary btn-block mt-3" style="border:1px solid #ddd;" onclick="window.location.hash='#customer/home'">Back to Home</button>
                    </div>
                </main>
            </div>
        `;
        return CustomerViews.wrapLayout(trackingHtml, 'orders');
    },

    setupTrackingListeners: () => {
        // Star rating clicks
        let currentRating = 5;
        const starButtons = document.querySelectorAll('#starRatingSelector .star-btn');
        starButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseInt(btn.getAttribute('data-val'), 10);
                currentRating = val;
                starButtons.forEach(b => {
                    const bVal = parseInt(b.getAttribute('data-val'), 10);
                    b.classList.toggle('active', bVal <= val);
                });
            });
        });

        // Compliment chips toggle
        const chipButtons = document.querySelectorAll('#complimentChips .compliment-chip');
        chipButtons.forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('selected');
            });
        });

        // Review submit handler
        const btnSubmitReview = document.getElementById('btnSubmitReview');
        if (btnSubmitReview) {
            btnSubmitReview.addEventListener('click', async () => {
                const orderId = btnSubmitReview.getAttribute('data-order-id');
                const restId = btnSubmitReview.getAttribute('data-rest-id');
                const commentInput = document.getElementById('reviewCommentInput');
                const comment = commentInput ? commentInput.value.trim() : '';

                const selectedTags = [];
                document.querySelectorAll('#complimentChips .compliment-chip.selected').forEach(c => {
                    selectedTags.push(c.getAttribute('data-tag'));
                });

                const session = window.DineDirectStore.getSession();
                const customerName = session.currentUser || 'Guest Diner';

                btnSubmitReview.disabled = true;
                btnSubmitReview.innerHTML = `Submitting review...`;

                await window.DineDirectStore.submitReview(
                    restId,
                    orderId,
                    customerName,
                    currentRating,
                    selectedTags,
                    comment
                );

                showToast('🌟 Thank you for your review!');
                if (window.renderApp) window.renderApp();
            });
        }
    },


    orders: () => {
        const session = window.DineDirectStore.getSession();
        const orders = window.DineDirectStore.getOrders().reverse();

        const ordersHtml = `
            <div class="customer-orders-content fade-in" style="min-height:100vh;">
                <header class="plain-header" style="border-bottom:1px solid rgba(0,0,0,0.05);">
                    <h2>Your Order History</h2>
                </header>
                <main class="mobile-main">
                    <div style="padding-top:20px;">
                        ${orders.length === 0 ? `
                            <div class="text-center py-5 text-muted">
                                <i data-lucide="receipt" style="width:48px;height:48px;opacity:0.3;margin-bottom:12px;"></i>
                                <p>You haven't placed any orders yet.</p>
                            </div>
                        ` : orders.map(order => {
                            const date = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const rest = window.DineDirectStore.getRestaurant(order.restaurantId);
                            const restName = rest ? rest.name : order.restaurantId;
                            const isGroupOrder = Boolean(order.groupOrderId);

                            return `
                                <div class="card mt-4" style="padding:16px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed rgba(0,0,0,0.1); padding-bottom:8px; margin-bottom:12px;">
                                        <div>
                                            <div style="display:flex; align-items:center; gap:6px;">
                                                <strong style="font-size:1.05rem;">${restName}</strong>
                                                ${isGroupOrder ? `<span class="badge bg-primary" style="font-size:0.65rem; padding:2px 6px; border-radius:6px;">Multi-Vendor</span>` : ''}
                                            </div>
                                            <span style="font-size:0.8rem; color:var(--text-muted); display:block;">Order #${order.id} • ${date} • Table ${order.tableNum}</span>
                                        </div>
                                        <span class="badge ${order.status === 'served' || order.status === 'delivered' ? 'bg-success' : (order.status === 'new' ? 'bg-danger' : 'bg-warning')}" style="padding:6px 12px; border-radius:12px; font-size:0.75rem; text-transform:capitalize;">
                                            ${order.status}
                                        </span>
                                    </div>
                                    <div style="font-size:0.9rem;">
                                        ${order.items.map(item => {
                                            const q = item.qty || item.quantity || 1;
                                            return `
                                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                                <span>${q}x ${item.name}</span>
                                                <span class="text-muted">₹${item.price * q}</span>
                                            </div>
                                        `}).join('')}
                                    </div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; border-top:1px solid rgba(0,0,0,0.05); padding-top:12px; font-weight:bold;">
                                        <span>Total Paid via ${order.paymentMethod === 'pay_now' || order.paymentMethod === 'card' || order.paymentMethod === 'upi' ? 'Online' : 'Counter'}</span>
                                        <span style="color:var(--primary); font-size:1.1rem;">₹${order.total + (Number(order.deliveryFee) || 0)}</span>
                                    </div>
                                    <div style="display:flex; gap:10px; margin-top:12px;">
                                        <button class="btn btn-secondary" onclick="window.CustomerViews.openTaxInvoiceModal('${order.groupOrderId || order.id}')" style="flex:1; border:1px solid #cbd5e1; font-size:0.85rem; padding:8px 12px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                                            <i data-lucide="receipt"></i> <span>📄 Tax Invoice</span>
                                        </button>
                                        ${order.status !== 'delivered' && order.status !== 'served' ? `
                                            <button class="btn btn-primary" onclick="window.location.hash='#customer/tracking'" style="flex:1; font-size:0.85rem; padding:8px 12px; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                                                <span>Track Live</span> <i data-lucide="arrow-right"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </main>
            </div>
        `;
        return CustomerViews.wrapLayout(ordersHtml, 'orders');
    },

    setupOrdersListeners: () => {}
};

// Chatbot functions
CustomerViews.ensureSupportChatbot = () => {
    const session = window.DineDirectStore.getSession();
    const currentHash = window.location.hash || '#auth';
    
    // Only show on customer routes
    if (!currentHash.startsWith('#customer')) {
        const container = document.getElementById('dinedirect-ai-chat-container');
        if (container) {
            container.classList.add('d-none');
        }
        return;
    }

    let container = document.getElementById('dinedirect-ai-chat-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'dinedirect-ai-chat-container';
        container.innerHTML = `
            <div class="ai-chatbot-bubble pulse-float" style="position:relative;" id="aiChatBubble">
                <i data-lucide="bot" style="width:28px; height:28px;"></i>
                <span id="aiChatBadge" class="ai-chat-badge d-none"></span>
            </div>
            <div class="ai-chat-window d-none" id="aiChatWindow">
                <div class="ai-chat-header">
                    <h3><i data-lucide="bot"></i> DineDirect AI Support</h3>
                    <button class="ai-chat-close" id="aiChatClose">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="ai-chat-messages" id="aiChatMessages"></div>
                <div class="chat-options" id="aiChatOptions"></div>
                <form class="ai-chat-input-area" id="aiChatInputForm">
                    <input type="text" id="aiChatInputField" placeholder="Type a message..." required autocomplete="off">
                    <button type="submit"><i data-lucide="send" style="width:16px; height:16px;"></i></button>
                </form>
            </div>
        `;
        document.body.appendChild(container);
        
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Initialize state variables for chatbot
        window.activeSupportAlerts = window.activeSupportAlerts || [];
        window.aiChatMessagesList = window.aiChatMessagesList || [];
        window.pendingAlertMessage = null;

        // UI Event Listeners
        const bubble = document.getElementById('aiChatBubble');
        const chatWin = document.getElementById('aiChatWindow');
        const closeBtn = document.getElementById('aiChatClose');
        const inputForm = document.getElementById('aiChatInputForm');
        
        bubble.addEventListener('click', () => {
            chatWin.classList.toggle('d-none');
            bubble.classList.remove('pulse-float');
            CustomerViews.renderChatMessages();
        });

        closeBtn.addEventListener('click', () => {
            chatWin.classList.add('d-none');
            bubble.classList.add('pulse-float');
        });

        inputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const field = document.getElementById('aiChatInputField');
            const text = field.value.trim();
            if (!text) return;
            field.value = '';

            const session = window.DineDirectStore.getSession();
            const restId = session.activeRestaurantId || 'r1';
            const tableNum = session.activeTableNum || 'Online';
            const allAlerts = window.DineDirectStore.state.supportAlerts || [];
            const activeAlert = allAlerts.find(a => a.restaurantId === restId && String(a.tableNum) === String(tableNum) && a.status === 'active');

            if (activeAlert) {
                // Management Mode: send to DB/server
                await window.DineDirectStore.sendChatMessage('customer', text);
            } else {
                // AI Mode: normal logic
                addChatMessage('user', text);
                
                // AI thinks and replies
                setTimeout(() => {
                    window.pendingAlertMessage = text;
                    addChatMessage('ai', `I understand there is an issue: "${text}". I can notify the service desk to assist Table ${tableNum} with this. Would you like me to alert them now?`);
                    renderChatOptions([
                        { text: 'Yes, Alert Staff', value: 'yes' },
                        { text: 'No, Cancel', value: 'no' }
                    ]);
                }, 600);
            }
        });

        // Load welcome message
        if (window.aiChatMessagesList.length === 0) {
            const tableStr = window.DineDirectStore.getSession().activeTableNum ? `Table ${window.DineDirectStore.getSession().activeTableNum}` : 'your table';
            const userStr = window.DineDirectStore.getSession().currentUser || 'Guest';
            
            addChatMessage('ai', `Hi ${userStr}! I'm your DineDirect AI assistant. How is your dining experience at ${tableStr} going today? Let me know if you run into any disturbances or have any requests!`);
        }
        
        renderDefaultOptions();
    } else {
        container.classList.remove('d-none');
    }

    const badge = document.getElementById('aiChatBadge');
    
    // Check if any tracked support alert was resolved
    if (window.activeSupportAlerts && window.activeSupportAlerts.length > 0) {
        const activeAlerts = window.DineDirectStore.state.supportAlerts || [];
        const activeIds = activeAlerts.filter(a => a.status === 'active').map(a => a.id);
        
        const resolved = window.activeSupportAlerts.filter(id => !activeIds.includes(id));
        if (resolved.length > 0) {
            resolved.forEach(id => {
                addChatMessage('system', '✅ Support request resolved by staff');
                addChatMessage('ai', 'The staff has marked this support alert as resolved! Let me know if you need anything else.');
                
                // Show temporary resolution badge
                if (badge) {
                    badge.textContent = '✓';
                    badge.classList.add('resolved');
                    badge.classList.remove('d-none');
                    if (window.aiBadgeTimeout) clearTimeout(window.aiBadgeTimeout);
                    window.aiBadgeTimeout = setTimeout(() => {
                        badge.classList.add('d-none');
                        badge.classList.remove('resolved');
                    }, 5000);
                }

                // Remove from activeSupportAlerts
                window.activeSupportAlerts = window.activeSupportAlerts.filter(aId => aId !== id);
            });
        }
    }

    // Render chat messages
    CustomerViews.renderChatMessages();

    // If there are still active alerts, update badge to alert icon
    if (badge && !badge.classList.contains('resolved')) {
        if (window.activeSupportAlerts && window.activeSupportAlerts.length > 0) {
            badge.textContent = '🔔';
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    }
};

// Internal Chatbot Helpers
CustomerViews.renderChatMessages = () => {
    const msgBox = document.getElementById('aiChatMessages');
    if (!msgBox) return;

    const session = window.DineDirectStore.getSession();
    const restId = session.activeRestaurantId || 'r1';
    const tableNum = session.activeTableNum || 'Online';
    const allAlerts = window.DineDirectStore.state.supportAlerts || [];
    const activeAlert = allAlerts.find(a => a.restaurantId === restId && String(a.tableNum) === String(tableNum) && a.status === 'active');

    msgBox.innerHTML = '';

    if (activeAlert) {
        // Management Mode: Render welcome + connection system msg + DB messages
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'chat-msg ai';
        welcomeMsg.textContent = `Hi ${session.currentUser || 'Guest'}! I'm your DineDirect AI assistant. How is your dining experience at Table ${tableNum} going today? Let me know if you run into any disturbances or have any requests!`;
        msgBox.appendChild(welcomeMsg);

        const sysMsg = document.createElement('div');
        sysMsg.className = 'chat-msg system';
        sysMsg.textContent = '🔔 Connected to Restaurant Management';
        msgBox.appendChild(sysMsg);

        // Fetch DB messages
        const dbMsgs = (window.DineDirectStore.state.chatMessages || []).filter(cm => 
            cm.restaurantId === restId && String(cm.tableNum) === String(tableNum)
        );

        dbMsgs.forEach(msg => {
            const el = document.createElement('div');
            el.className = `chat-msg ${msg.sender === 'customer' ? 'user' : 'management'}`;
            el.innerHTML = msg.sender === 'management' 
                ? `<small style="display:block; font-size:0.7rem; color:var(--primary); font-weight:bold; margin-bottom:2px;">Staff</small>${msg.message}`
                : msg.message;
            msgBox.appendChild(el);
        });
        
        // Hide preset options
        const optBox = document.getElementById('aiChatOptions');
        if (optBox) optBox.innerHTML = '';
        
        // Update input area placeholder
        const inputField = document.getElementById('aiChatInputField');
        if (inputField) {
            inputField.placeholder = "Type message to staff...";
        }
    } else {
        // AI Mode: Render local aiChatMessagesList
        window.aiChatMessagesList.forEach(msg => {
            const el = document.createElement('div');
            el.className = `chat-msg ${msg.sender}`;
            el.textContent = msg.text;
            msgBox.appendChild(el);
        });
        
        // Update input area placeholder
        const inputField = document.getElementById('aiChatInputField');
        if (inputField) {
            inputField.placeholder = "Type a message...";
        }
    }

    msgBox.scrollTop = msgBox.scrollHeight;
};

function addChatMessage(sender, text) {
    const msgBox = document.getElementById('aiChatMessages');
    if (!msgBox) return;

    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    msg.textContent = text;
    msgBox.appendChild(msg);
    msgBox.scrollTop = msgBox.scrollHeight;
    
    // Save to global history list
    if (window.aiChatMessagesList) {
        window.aiChatMessagesList.push({ sender, text });
    }
}

function renderChatOptions(options) {
    const optBox = document.getElementById('aiChatOptions');
    if (!optBox) return;

    optBox.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'chat-opt-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => handleOptionClick(opt.text, opt.value));
        optBox.appendChild(btn);
    });
}

function renderDefaultOptions() {
    renderChatOptions([
        { text: '🥛 Need water / napkins', value: 'water' },
        { text: '⏳ My food is delayed', value: 'delay' },
        { text: '🧼 Clean my table', value: 'clean' },
        { text: '🍛 Problem with food', value: 'food' },
        { text: '💳 Payment issue', value: 'payment' }
    ]);
}

async function handleOptionClick(label, value) {
    addChatMessage('user', label);

    const tableStr = window.DineDirectStore.getSession().activeTableNum ? `Table ${window.DineDirectStore.getSession().activeTableNum}` : 'Online';

    if (value === 'yes') {
        const alertMsg = window.pendingAlertMessage || `Customer assistance requested`;
        const newAlert = await window.DineDirectStore.createSupportAlert(alertMsg);
        
        if (newAlert) {
            window.activeSupportAlerts = window.activeSupportAlerts || [];
            window.activeSupportAlerts.push(newAlert.id);
            
            // Send trigger message as first chat message
            await window.DineDirectStore.sendChatMessage('customer', `Help requested: "${alertMsg}"`);
            
            addChatMessage('system', '🔔 Support Request Sent (Status: Active)');
            addChatMessage('ai', `I have connected you directly to the restaurant owner. You can now chat with them below!`);
        } else {
            addChatMessage('ai', 'Sorry, I couldn\'t reach the service desk. Please try again.');
        }
        window.pendingAlertMessage = null;
        renderDefaultOptions();
    } else if (value === 'no') {
        addChatMessage('ai', 'Alright, request cancelled. Let me know if you need help with anything else!');
        window.pendingAlertMessage = null;
        renderDefaultOptions();
    } else {
        // Preset option click
        let alertText = '';
        let aiResponse = '';
        
        if (value === 'water') {
            alertText = 'Customer needs water / napkins';
            aiResponse = `I can ping the service desk to bring water/napkins to ${tableStr} right away. Would you like me to alert the staff now?`;
        } else if (value === 'delay') {
            alertText = 'Food order is delayed';
            aiResponse = `I will alert the kitchen crew to expedite preparation. Would you like me to send a cooking delay warning now?`;
        } else if (value === 'clean') {
            alertText = 'Table needs cleaning';
            aiResponse = `I will alert the housekeeping staff to clean ${tableStr} immediately. Would you like me to notify them now?`;
        } else if (value === 'food') {
            alertText = 'Issue with food quality/incorrect item';
            aiResponse = `I\'m very sorry to hear that! I can alert the manager and chef about this food disturbance. Shall I notify them now?`;
        } else if (value === 'payment') {
            alertText = 'Payment failed / counter payment help needed';
            aiResponse = `I will notify the billing desk to check your table order payment status. Would you like me to alert them now?`;
        }

        window.pendingAlertMessage = alertText;
        addChatMessage('ai', aiResponse);
        renderChatOptions([
            { text: 'Yes, Alert Staff', value: 'yes' },
            { text: 'No, Cancel', value: 'no' }
        ]);
    }
}

    // 6. Booking View
    CustomerViews.booking = () => {
        const session = window.DineDirectStore.getSession();
        const restaurants = window.DineDirectStore.getRestaurants();
        const selectedRestId = window.selectedBookingRestaurantId || (restaurants[0] ? restaurants[0].id : 'r1');
        const selectedRest = restaurants.find(r => r.id === selectedRestId);
        
        if (!selectedRest) return `<div>No restaurants available for booking.</div>`;
        
        const tables = (selectedRest.tables || []).filter(t => t.isReservable !== 0);
        const activeTable = window.selectedBookingTableNum || null;
        
        // Retrieve booking status from local storage
        let activeBooking = null;
        try {
            const saved = localStorage.getItem('dinedirect_active_booking');
            if (saved) {
                activeBooking = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error reading booking from localStorage', e);
        }
        
        // If booking already exists, render receipt
        if (activeBooking && activeBooking.restaurantId === selectedRestId) {
            return CustomerViews.wrapLayout(`
                <div class="booking-success-container fade-in" style="max-width: 500px; margin: 40px auto; padding: 32px; text-align: center;">
                    <div style="background: rgba(16, 185, 129, 0.1); color: #10b981; width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 2.2rem;">
                        <i data-lucide="check-circle"></i>
                    </div>
                    <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 8px;">Reservation Confirmed!</h2>
                    <p class="text-muted" style="font-size: 0.95rem; margin-bottom: 24px;">Your table is ready and waiting for you.</p>
                    
                    <div class="card" style="border: 2px dashed #cbd5e1; padding: 24px; text-align: left; background: #fafafa; border-radius: 12px; margin-bottom: 28px;">
                        <h3 style="font-size: 1.25rem; font-weight: 700; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 16px; color: var(--primary);">${selectedRest.name}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.9rem;">
                            <div>
                                <span class="text-muted" style="display:block; font-size: 0.75rem; text-transform: uppercase;">Table Reserved</span>
                                <strong>Table ${activeBooking.tableNum}</strong>
                            </div>
                            <div>
                                <span class="text-muted" style="display:block; font-size: 0.75rem; text-transform: uppercase;">Guest Name</span>
                                <strong>${activeBooking.name}</strong>
                            </div>
                            <div>
                                <span class="text-muted" style="display:block; font-size: 0.75rem; text-transform: uppercase;">Date</span>
                                <strong>${activeBooking.date}</strong>
                            </div>
                            <div>
                                <span class="text-muted" style="display:block; font-size: 0.75rem; text-transform: uppercase;">Time Slot</span>
                                <strong>${activeBooking.timeSlot}</strong>
                            </div>
                            <div>
                                <span class="text-muted" style="display:block; font-size: 0.75rem; text-transform: uppercase;">Guests Count</span>
                                <strong>${activeBooking.guests} People</strong>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <button class="btn btn-primary btn-block" id="btnEnterReservedTable" style="padding:12px; font-weight: 600; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <i data-lucide="store"></i> Enter Table Menu & Order
                        </button>
                        <button class="btn btn-secondary btn-block" id="btnCancelBooking" style="padding:10px; border:1px solid #ddd; background:none; color:var(--danger);">
                            Cancel Reservation
                        </button>
                    </div>
                </div>
            `, 'booking');
        }

        // Otherwise, render Booking Wizard
        const tableConfigs = {
            '1': { capacity: 2, feature: 'Window Side Cozy', x: 60, y: 70, width: 65, height: 45 },
            '2': { capacity: 4, feature: 'Window Side Comfort', x: 60, y: 160, width: 85, height: 55 },
            '3': { capacity: 2, feature: 'Window Side Privacy', x: 60, y: 265, width: 65, height: 45 },
            '4': { capacity: 4, feature: 'Center Hall Executive', x: 215, y: 70, width: 85, height: 55 },
            '5': { capacity: 6, feature: 'Center Family Premium', x: 215, y: 160, width: 105, height: 65 },
            '6': { capacity: 4, feature: 'Patio Garden View', x: 385, y: 70, width: 85, height: 55 },
            '7': { capacity: 2, feature: 'Patio Side Quiet', x: 385, y: 160, width: 65, height: 45 },
            '8': { capacity: 4, feature: 'Patio Garden Premium', x: 385, y: 265, width: 85, height: 55 },
            '9': { capacity: 2, feature: 'Cozy Aisle Seating', x: 215, y: 265, width: 65, height: 45 },
            '10': { capacity: 6, feature: 'Garden View Family', x: 385, y: 350, width: 105, height: 65 }
        };

        return CustomerViews.wrapLayout(`
            <div class="booking-wizard-layout fade-in" style="max-width: 1200px; margin: 0 auto; padding: 24px;">
                <header style="margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                    <div>
                        <h2 style="font-size: 1.8rem; font-weight: 700; color:var(--text-main); font-family:var(--font-heading);">Table Reservation</h2>
                        <p class="text-muted" style="font-size: 0.9rem;">Pinch/scroll to zoom, drag to pan, and click an available table to book instantly.</p>
                    </div>
                    <!-- Restaurant Selector -->
                    <div class="form-group" style="margin: 0; min-width: 250px;">
                        <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display:block; color:var(--text-muted); text-transform:uppercase;">Select Restaurant</label>
                        <select class="form-control" id="bookingRestSelect" style="padding: 10px 14px; font-weight:600; border-radius:10px; border:1.5px solid #e2e8f0; background:white; cursor:pointer;">
                            ${restaurants.map(r => `
                                <option value="${r.id}" ${r.id === selectedRestId ? 'selected' : ''}>${r.name} (${r.address})</option>
                            `).join('')}
                        </select>
                    </div>
                </header>

                <div style="width: 100%;">
                    
                    <!-- Full-Width Interactive Map Card -->
                    <div class="card" style="padding: 24px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); background: white; border: 1px solid #f1f5f9; position: relative;">
                        <!-- Visual Grid Guide -->
                        <div style="display:flex; gap:20px; margin-bottom: 20px; font-size:0.85rem; font-weight:600; border-bottom:1px solid #f1f5f9; padding-bottom:14px; color:var(--text-main);">
                            <span style="display:flex; align-items:center; gap:8px;"><span style="width:12px; height:12px; background:rgba(34,197,94,0.15); border:2px solid #22c55e; border-radius:3px;"></span> Available</span>
                            <span style="display:flex; align-items:center; gap:8px;"><span style="width:12px; height:12px; background:rgba(239,68,68,0.15); border:2px solid #ef4444; border-radius:3px;"></span> Occupied</span>
                            <span style="display:flex; align-items:center; gap:8px;"><span style="width:12px; height:12px; background:rgba(249,115,22,0.15); border:2px solid #f97316; border-radius:3px;"></span> Reserved</span>
                        </div>

                        <!-- Floor Plan Container (Viewport) -->
                        <div class="floor-plan-container" id="floorPlanContainer">
                            <!-- Floor Plan Canvas (Draggable / Scalable) -->
                            <div class="floor-plan-canvas" id="floorPlanCanvas" style="width: 600px; height: 450px;">
                                
                                <!-- Kitchen Counter (Top) -->
                                <div style="position: absolute; top: 0; left: 150px; right: 150px; height: 32px; background: linear-gradient(180deg, #334155, #1e293b); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; letter-spacing: 0.05em; border: 1.5px solid #475569; border-top: none; z-index: 5;">
                                    <i data-lucide="chef-hat" style="width: 14px; height: 14px; margin-right: 6px; color: #ea580c;"></i>
                                    KITCHEN COUNTER
                                </div>
                                
                                <!-- Entrance (Bottom) -->
                                <div style="position: absolute; bottom: 0; left: 220px; right: 220px; height: 26px; background: #f8fafc; color: #475569; display: flex; align-items: center; justify-content: center; font-size: 0.725rem; font-weight: 700; border-top-left-radius: 8px; border-top-right-radius: 8px; border: 1.5px solid #cbd5e1; border-bottom: none; letter-spacing: 0.05em; z-index: 5;">
                                    ENTRANCE
                                </div>

                                <!-- Left Side: Windows -->
                                <div style="position: absolute; top: 60px; bottom: 60px; left: 0; width: 6px; display: flex; flex-direction: column; justify-content: space-around; gap: 8px;">
                                    <div style="height: 60px; width: 6px; background: #38bdf8; border-radius: 3px; box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);"></div>
                                    <div style="height: 60px; width: 6px; background: #38bdf8; border-radius: 3px; box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);"></div>
                                    <div style="height: 60px; width: 6px; background: #38bdf8; border-radius: 3px; box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);"></div>
                                </div>
                                <span style="position: absolute; left: 12px; top: 185px; font-size: 0.65rem; color: #94a3b8; font-weight: 800; writing-mode: vertical-lr; transform: rotate(180deg); letter-spacing: 0.15em;">WINDOW VIEW SIDE</span>

                                <!-- Right Side: Patio / Garden -->
                                <div style="position: absolute; top: 60px; bottom: 60px; right: 0; width: 6px; background: #4ade80; border-top-left-radius: 6px; border-bottom-left-radius: 6px; box-shadow: 0 0 10px rgba(74, 222, 128, 0.4);"></div>
                                <span style="position: absolute; right: 12px; top: 185px; font-size: 0.65rem; color: #4ade80; font-weight: 800; writing-mode: vertical-lr; letter-spacing: 0.15em;">PATIO GARDEN SIDE</span>

                                <!-- Dynamic Tables Layout -->
                                ${tables.length === 0 ? `
                                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 0.9rem; font-weight:600;">No tables loaded.</div>
                                ` : tables.map((table, idx) => {
                                    const isBooked = table.status === 'booked';
                                    const isOccupied = table.status === 'occupied';
                                    const isAvailable = !isBooked && !isOccupied;

                                    const config = tableConfigs[table.num] || { 
                                        capacity: 4, 
                                        feature: 'Standard Table', 
                                        x: 100 + (idx % 3) * 140, 
                                        y: 80 + Math.floor(idx / 3) * 100, 
                                        width: 80, 
                                        height: 50 
                                    };

                                    let statusBg = 'rgba(34, 197, 94, 0.12)';
                                    let borderStyle = 'available';
                                    
                                    if (isOccupied) {
                                        statusBg = 'rgba(239, 68, 68, 0.12)';
                                        borderStyle = 'occupied';
                                    } else if (isBooked) {
                                        statusBg = 'rgba(249, 115, 22, 0.12)';
                                        borderStyle = 'booked';
                                    }
                                    
                                    // Generate chairs dynamically on left and right sides
                                    const cap = config.capacity;
                                    let chairsHtml = '';
                                    const chairsPerSide = Math.floor(cap / 2);
                                    
                                    // Left chairs
                                    for(let c = 0; c < chairsPerSide; c++) {
                                        const topOffset = config.height * ((c + 0.5) / chairsPerSide) - 6;
                                        chairsHtml += `<div class="realistic-chair" style="left: -8px; top: ${topOffset}px; width: 6px; height: 12px;"></div>`;
                                    }
                                    // Right chairs
                                    for(let c = 0; c < chairsPerSide; c++) {
                                        const topOffset = config.height * ((c + 0.5) / chairsPerSide) - 6;
                                        chairsHtml += `<div class="realistic-chair" style="right: -8px; top: ${topOffset}px; width: 6px; height: 12px;"></div>`;
                                    }
                                    // Extra chair on top if odd capacity
                                    if (cap % 2 !== 0) {
                                        chairsHtml += `<div class="realistic-chair" style="top: -8px; left: ${config.width/2 - 6}px; width: 12px; height: 6px;"></div>`;
                                    }
                                    
                                    return `
                                        <div class="booking-table-card realistic-table ${borderStyle}" 
                                             data-num="${table.num}" 
                                             data-capacity="${cap}"
                                             data-feature="${config.feature}"
                                             data-available="${isAvailable}" 
                                             style="left: ${config.x}px; top: ${config.y}px; width: ${config.width}px; height: ${config.height}px; background: ${statusBg};">
                                            
                                            ${chairsHtml}
                                            
                                            <span style="font-size: 0.85rem; font-weight: 800; font-family:var(--font-heading);">${table.num}</span>
                                            <span style="font-size: 0.525rem; font-weight: 700; text-transform: uppercase; opacity: 0.8; letter-spacing:0.05em; margin-top: 1px;">
                                                ${cap} Pax
                                            </span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>

                            <!-- Floating Zoom Controls -->
                            <div class="zoom-controls">
                                <button class="zoom-btn" id="btnZoomIn" title="Zoom In">+</button>
                                <button class="zoom-btn" id="btnZoomOut" title="Zoom Out">-</button>
                                <button class="zoom-btn" id="btnZoomReset" title="Reset View" style="font-size:0.95rem;">↺</button>
                            </div>

                            <!-- Floating Tooltip -->
                            <div class="table-tooltip" id="tableTooltip"></div>
                        </div>
                    </div>
                </div>

                <!-- Direct Booking Modal and Overlay -->
                <div class="direct-booking-overlay" id="directBookingOverlay"></div>
                <div class="direct-booking-modal card" id="directBookingModal">
                    <div class="direct-booking-header">
                        <h3 id="modalTableTitle">Book Table</h3>
                        <button class="direct-booking-close" id="btnDirectBookingClose">✕</button>
                    </div>
                    <div class="direct-booking-body">
                        <div id="modalTableSpecs"></div>
                        <form id="directBookingSubmissionForm">
                            <div class="form-group" style="margin-bottom:16px;">
                                <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.85rem; color:var(--text-main);">Your Name</label>
                                <input type="text" class="form-control" id="directBookingName" value="${session.currentUser || ''}" placeholder="Enter guest name" required style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
                            </div>
                            <div class="form-group" style="margin-bottom:16px;">
                                <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.85rem; color:var(--text-main);">Booking Date</label>
                                <input type="date" class="form-control" id="directBookingDate" value="${new Date().toISOString().split('T')[0]}" required style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
                            </div>
                            <div class="form-group" style="margin-bottom:16px;">
                                <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.85rem; color:var(--text-main);">Time Slot</label>
                                <select class="form-control" id="directBookingTimeSlot" required style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; background:white;">
                                    <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM (Lunch)</option>
                                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                                    <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM (Dinner)</option>
                                    <option value="08:00 PM - 10:00 PM" selected>08:00 PM - 10:00 PM (Peak Dinner)</option>
                                    <option value="10:00 PM - 12:00 AM">10:00 PM - 12:00 AM</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom:24px;">
                                <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.85rem; color:var(--text-main);">Number of Guests</label>
                                <input type="number" class="form-control" id="directBookingGuests" min="1" max="12" value="2" required style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
                                <small id="guestCountWarning" class="text-danger d-none" style="display:block; margin-top:4px; font-weight:600; font-size:0.75rem;"></small>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" style="padding:12px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; width:100%; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);">
                                <i data-lucide="check"></i> Confirm Reservation
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `, 'booking');
    };

    // 7. Booking Listeners
    CustomerViews.setupBookingListeners = () => {
        const restSelect = document.getElementById('bookingRestSelect');
        if (restSelect) {
            restSelect.addEventListener('change', () => {
                window.selectedBookingRestaurantId = restSelect.value;
                window.selectedBookingTableNum = null; // reset selected table
                if (window.Router) window.Router();
            });
        }

        // Enter Table Menu button (if already booked)
        const btnEnterReservedTable = document.getElementById('btnEnterReservedTable');
        if (btnEnterReservedTable) {
            btnEnterReservedTable.addEventListener('click', () => {
                try {
                    const saved = localStorage.getItem('dinedirect_active_booking');
                    if (saved) {
                        const booking = JSON.parse(saved);
                        window.DineDirectStore.setSession({
                            activeTableNum: booking.tableNum,
                            activeRestaurantId: booking.restaurantId,
                            userRole: 'customer'
                        });
                        window.location.hash = `#customer/restaurant/${booking.restaurantId}`;
                    }
                } catch (err) {
                    console.error('Failed to enter reserved table', err);
                }
            });
        }

        // Cancel Booking button (if already booked)
        const btnCancelBooking = document.getElementById('btnCancelBooking');
        if (btnCancelBooking) {
            btnCancelBooking.addEventListener('click', async () => {
                if (confirm('Are you sure you want to cancel your table reservation?')) {
                    try {
                        const saved = localStorage.getItem('dinedirect_active_booking');
                        if (saved) {
                            const booking = JSON.parse(saved);
                            await window.DineDirectStore.updateTableStatus(booking.restaurantId, booking.tableNum, 'available');
                            localStorage.removeItem('dinedirect_active_booking');
                            window.selectedBookingTableNum = null;
                            showToast('Reservation cancelled.');
                            if (window.Router) window.Router();
                        }
                    } catch (err) {
                        console.error('Failed to cancel booking', err);
                    }
                }
            });
        }

        // Tooltip Hover Listeners
        const tooltip = document.getElementById('tableTooltip');
        const tables = document.querySelectorAll('.booking-table-card.realistic-table');
        
        tables.forEach(card => {
            card.addEventListener('mouseover', (e) => {
                const num = card.getAttribute('data-num');
                const cap = card.getAttribute('data-capacity');
                const feature = card.getAttribute('data-feature');
                const isAvailable = card.getAttribute('data-available') === 'true';
                
                let statusText = `<span style="color:#ef4444;">Occupied</span>`;
                if (isAvailable) {
                    statusText = `<span style="color:#22c55e;">Available</span>`;
                } else if (card.classList.contains('booked')) {
                    statusText = `<span style="color:#f97316;">Reserved</span>`;
                }

                tooltip.innerHTML = `
                    <div style="font-weight:bold; font-size:0.85rem; margin-bottom:4px; font-family:var(--font-heading);">Table ${num}</div>
                    <div>Capacity: <strong>${cap} Guests</strong></div>
                    <div>Feature: <strong>${feature}</strong></div>
                    <div style="margin-top:4px;">Status: ${statusText}</div>
                `;
                tooltip.style.display = 'block';
            });

            card.addEventListener('mousemove', (e) => {
                const rect = document.getElementById('floorPlanContainer').getBoundingClientRect();
                tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
            });

            card.addEventListener('mouseout', () => {
                tooltip.style.display = 'none';
            });
        });

        // Direct Booking Modal Triggers
        const overlay = document.getElementById('directBookingOverlay');
        const modal = document.getElementById('directBookingModal');
        const modalClose = document.getElementById('btnDirectBookingClose');
        const bookingForm = document.getElementById('directBookingSubmissionForm');
        
        tables.forEach(card => {
            const isAvailable = card.getAttribute('data-available') === 'true';
            if (isAvailable && overlay && modal) {
                card.addEventListener('click', () => {
                    const num = card.getAttribute('data-num');
                    const cap = parseInt(card.getAttribute('data-capacity'), 10);
                    const feature = card.getAttribute('data-feature');
                    
                    window.selectedBookingTableNum = num;
                    
                    // Mark visually as selected
                    tables.forEach(t => t.classList.remove('selected'));
                    card.classList.add('selected');

                    // Set modal text
                    document.getElementById('modalTableTitle').textContent = `Book Table ${num}`;
                    document.getElementById('modalTableSpecs').innerHTML = `
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span>Capacity Limit:</span><strong>${cap} Guests</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span>Layout Area:</span><strong>${feature}</strong>
                        </div>
                    `;

                    // Set input constraints
                    const guestsInput = document.getElementById('directBookingGuests');
                    guestsInput.value = Math.min(2, cap);
                    guestsInput.max = cap;

                    const warning = document.getElementById('guestCountWarning');
                    warning.classList.add('d-none');

                    guestsInput.oninput = () => {
                        const val = parseInt(guestsInput.value, 10);
                        if (val > cap) {
                            warning.textContent = `⚠️ Exceeds capacity limit of ${cap} guests!`;
                            warning.classList.remove('d-none');
                        } else {
                            warning.classList.add('d-none');
                        }
                    };

                    // Show Modal
                    overlay.classList.add('active');
                    modal.classList.add('active');
                });
            }
        });

        const closeModal = () => {
            if(overlay && modal) {
                overlay.classList.remove('active');
                modal.classList.remove('active');
                tables.forEach(t => t.classList.remove('selected'));
            }
        };

        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);

        // Booking Submission Handling
        if (bookingForm) {
            bookingForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('directBookingName').value;
                const date = document.getElementById('directBookingDate').value;
                const timeSlot = document.getElementById('directBookingTimeSlot').value;
                const guests = document.getElementById('directBookingGuests').value;
                
                const restId = window.selectedBookingRestaurantId || 'r1';
                const tableNum = window.selectedBookingTableNum;
                
                const success = await window.DineDirectStore.updateTableStatus(restId, tableNum, 'booked');
                if (success) {
                    window.DineDirectStore.setSession({
                        activeTableNum: tableNum,
                        activeRestaurantId: restId,
                        currentUser: name
                    });

                    const bookingDetails = {
                        restaurantId: restId,
                        tableNum,
                        name,
                        date,
                        timeSlot,
                        guests
                    };
                    localStorage.setItem('dinedirect_active_booking', JSON.stringify(bookingDetails));
                    
                    await window.DineDirectStore.createSupportAlert(
                        `Table reservation confirmed for ${timeSlot} (${guests} people)`
                    );
                    
                    closeModal();
                    showToast('Table booked successfully!');
                    if (window.Router) window.Router();
                } else {
                    alert('Booking failed. The table might have just been taken.');
                }
            });
        }

        // Pan and Zoom Functionality Implementation
        const container = document.getElementById('floorPlanContainer');
        const canvas = document.getElementById('floorPlanCanvas');
        const btnIn = document.getElementById('btnZoomIn');
        const btnOut = document.getElementById('btnZoomOut');
        const btnReset = document.getElementById('btnZoomReset');

        if (container && canvas) {
            window.floorPlanZoom = window.floorPlanZoom || 1.0;
            window.floorPlanPanX = window.floorPlanPanX || 0;
            window.floorPlanPanY = window.floorPlanPanY || 0;

            const applyTransform = () => {
                canvas.style.transform = `translate(${window.floorPlanPanX}px, ${window.floorPlanPanY}px) scale(${window.floorPlanZoom})`;
            };

            applyTransform();

            if (btnIn) {
                btnIn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.floorPlanZoom = Math.min(window.floorPlanZoom + 0.15, 2.2);
                    applyTransform();
                });
            }

            if (btnOut) {
                btnOut.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.floorPlanZoom = Math.max(window.floorPlanZoom - 0.15, 0.65);
                    applyTransform();
                });
            }

            if (btnReset) {
                btnReset.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.floorPlanZoom = 1.0;
                    window.floorPlanPanX = 0;
                    window.floorPlanPanY = 0;
                    applyTransform();
                });
            }

            // Drag Panning Events
            let isDragging = false;
            let startX = 0;
            let startY = 0;

            container.addEventListener('mousedown', (e) => {
                // Only allow dragging on viewport container background, not on interactive table cards
                if (e.target !== container && e.target !== canvas && !e.target.classList.contains('realistic-chair')) {
                    if (!e.target.id && !e.target.style.position) return;
                }
                isDragging = true;
                startX = e.clientX - window.floorPlanPanX;
                startY = e.clientY - window.floorPlanPanY;
                container.style.cursor = 'grabbing';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                window.floorPlanPanX = e.clientX - startX;
                window.floorPlanPanY = e.clientY - startY;
                applyTransform();
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
                container.style.cursor = 'grab';
            });

            // Touch Panning Support (Mobile/Tablet)
            container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    isDragging = true;
                    startX = e.touches[0].clientX - window.floorPlanPanX;
                    startY = e.touches[0].clientY - window.floorPlanPanY;
                }
            });

            container.addEventListener('touchmove', (e) => {
                if (isDragging && e.touches.length === 1) {
                    window.floorPlanPanX = e.touches[0].clientX - startX;
                    window.floorPlanPanY = e.touches[0].clientY - startY;
                    applyTransform();
                }
            });

            container.addEventListener('touchend', () => {
                isDragging = false;
            });
        }
        
        // Re-create lucide icons inside custom UI
        if (window.lucide) {
            window.lucide.createIcons();
        }
     };

    // 8. Customer Profile View
    CustomerViews.profile = () => {
        const store = window.DineDirectStore;
        const session = store.getSession();
        const profile = store.state.profile || {};
        
        const name = profile.name || session.currentUser || 'Guest';
        const email = profile.email || session.userEmail || '';
        const phone = profile.phone || '';
        const address = profile.address || '';

        // Retrieve past order history
        const allOrders = store.state.orders || [];
        const userOrders = allOrders.filter(o => o.customerName === name);

        const orderHistoryRows = userOrders.length > 0 
            ? userOrders.map(order => `
                <div class="card mb-3 p-3" style="border:1px solid #e2e8f0; border-radius:8px; background:#fff;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-weight:700; font-size:0.9rem; color:#1e293b;">Order ID: ${order.id}</span>
                        <span class="badge ${order.status === 'completed' ? 'badge-success' : 'badge-warning'}" style="font-size:0.75rem; padding:4px 8px;">${order.status.toUpperCase()}</span>
                    </div>
                    <div style="font-size:0.8rem; color:#64748b; margin-bottom:6px;">
                        <span>Total: <strong>₹${order.total}</strong></span> | 
                        <span>Payment: <strong>${order.paymentStatus.toUpperCase()} (${order.paymentMethod})</strong></span>
                    </div>
                </div>
            `).join('')
            : `<div style="text-align:center; padding:20px; color:#64748b; font-size:0.85rem;">No past orders found.</div>`;

        const profileHtml = `
            <div class="customer-profile-content fade-in" style="padding: 24px; max-width: 600px; margin: 0 auto;">
                <h2 style="font-weight:800; font-size:1.6rem; color:#8f2c24; margin-bottom:24px;">Your Profile</h2>

                <!-- Profile Card Display -->
                <div class="card p-4 mb-4" id="profileViewCard" style="border: 1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05); background:#fff;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h4 style="font-weight:700; color:#1e293b; margin:0;">Personal Details</h4>
                        ${session.isLoggedIn ? `
                            <button class="btn btn-sm btn-outline-premium" id="btnEditProfile" style="font-size:0.8rem; padding:6px 12px; color:#8f2c24; border-color:#8f2c24 !important;">
                                <i data-lucide="edit-3"></i> Edit
                            </button>
                        ` : ''}
                    </div>

                    <div style="display:flex; flex-direction:column; gap:12px; font-size:0.9rem; color:#334155;">
                        <div>
                            <span style="font-weight:600; color:#64748b; width:120px; display:inline-block;">Full Name:</span>
                            <strong style="color:#0f172a;">${name}</strong>
                        </div>
                        <div>
                            <span style="font-weight:600; color:#64748b; width:120px; display:inline-block;">Email Address:</span>
                            <strong>${email || 'Guest Logged In'}</strong>
                        </div>
                        <div>
                            <span style="font-weight:600; color:#64748b; width:120px; display:inline-block;">Phone Number:</span>
                            <strong>${phone || '<span style="color:#ef4444; font-style:italic;">Not registered</span>'}</strong>
                        </div>
                        <div>
                            <span style="font-weight:600; color:#64748b; width:120px; display:inline-block;">Address:</span>
                            <strong>${address || '<span style="color:#ef4444; font-style:italic;">Not registered</span>'}</strong>
                        </div>
                    </div>

                    ${session.isLoggedIn ? `
                        <hr style="border:0; border-top:1px solid #f1f5f9; margin:20px 0;">
                        <button class="btn btn-outline-danger btn-block" onclick="window.DineDirectStore.logout(); window.location.hash='#auth';">
                            <i data-lucide="log-out"></i> Sign Out
                        </button>
                    ` : `
                        <hr style="border:0; border-top:1px solid #f1f5f9; margin:20px 0;">
                        <div style="text-align:center;">
                            <p style="font-size:0.85rem; color:#64748b; margin-bottom:12px;">You are currently logged in as a guest.</p>
                            <a href="#auth" class="btn btn-primary" style="font-size:0.85rem; font-weight:600;">Sign In / Register</a>
                        </div>
                    `}
                </div>

                <!-- Profile Edit Form (Hidden by default) -->
                <form id="profileEditForm" class="card p-4 mb-4 d-none" style="border: 1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05); background:#fff;">
                    <h4 style="font-weight:700; color:#1e293b; margin-bottom:20px;">Edit Profile</h4>
                    
                    <div class="form-group mb-3">
                        <label style="font-weight:600; font-size:0.85rem; color:#475569; margin-bottom:6px; display:block;">Full Name</label>
                        <input type="text" id="editProfileName" class="form-control" value="${name}" required style="width:100%;">
                    </div>
                    
                    <div class="form-group mb-3">
                        <label style="font-weight:600; font-size:0.85rem; color:#475569; margin-bottom:6px; display:block;">Phone Number</label>
                        <input type="tel" id="editProfilePhone" class="form-control" value="${phone}" required style="width:100%;">
                    </div>
                    
                    <div class="form-group mb-4">
                        <label style="font-weight:600; font-size:0.85rem; color:#475569; margin-bottom:6px; display:block;">Delivery Address</label>
                        <textarea id="editProfileAddress" class="form-control" rows="2" required style="width:100%; resize:none;">${address}</textarea>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="flex:1;">Save Changes</button>
                        <button type="button" class="btn btn-outline-secondary" id="btnCancelEdit">Cancel</button>
                    </div>
                </form>

                <!-- Order History -->
                <h3 style="font-weight:700; font-size:1.2rem; color:#1e293b; margin-bottom:16px;">Order History</h3>
                ${orderHistoryRows}
            </div>
        `;
        return CustomerViews.wrapLayout(profileHtml, 'profile');
    };

    // 9. Profile Listeners
    CustomerViews.setupProfileListeners = () => {
        const btnEditProfile = document.getElementById('btnEditProfile');
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        const profileViewCard = document.getElementById('profileViewCard');
        const profileEditForm = document.getElementById('profileEditForm');

        if (btnEditProfile && profileEditForm && profileViewCard) {
            btnEditProfile.addEventListener('click', () => {
                profileViewCard.classList.add('d-none');
                profileEditForm.classList.remove('d-none');
            });
        }

        if (btnCancelEdit && profileEditForm && profileViewCard) {
            btnCancelEdit.addEventListener('click', () => {
                profileEditForm.classList.add('d-none');
                profileViewCard.classList.remove('d-none');
            });
        }

        if (profileEditForm) {
            profileEditForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('editProfileName').value.trim();
                const phone = document.getElementById('editProfilePhone').value.trim();
                const address = document.getElementById('editProfileAddress').value.trim();

                const store = window.DineDirectStore;
                const session = store.getSession();

                if (!session.userId) {
                    if (window.showToast) window.showToast('❌ Session expired. Please log in.');
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
                        if (window.showToast) window.showToast('✅ Profile updated!');
                        if (window.Router) window.Router();
                    }
                } catch (err) {
                    if (window.showToast) window.showToast(`❌ Error saving profile: ${err.message}`);
                }
            });
        }
    };
 
 window.CustomerViews = CustomerViews;
 export default CustomerViews;
