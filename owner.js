// Dine Direct Restaurant Owner Views & Logic

const renderSidebar = (activePage) => {
    return `
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2>Dine Direct</h2>
                <p class="text-muted">Owner Portal</p>
            </div>
            <ul class="nav-links">
                <li><a href="#owner/dashboard" class="${activePage === 'dashboard' ? 'active' : ''}"><i data-lucide="layout-dashboard"></i> Dashboard</a></li>
                <li><a href="#owner/analytics" class="${activePage === 'analytics' ? 'active' : ''}"><i data-lucide="line-chart"></i> Analytics</a></li>
                <li><a href="#owner/menu" class="${activePage === 'menu' ? 'active' : ''}"><i data-lucide="menu-square"></i> Manage Menu</a></li>
                <li><a href="#owner/tables" class="${activePage === 'tables' ? 'active' : ''}"><i data-lucide="grid-2x2"></i> Tables & QR</a></li>
                <li><a href="#owner/kds" class="${activePage === 'kds' ? 'active' : ''}"><i data-lucide="chef-hat"></i> Kitchen (KDS)</a></li>
                <li><a href="#auth" class="text-danger mt-4" onclick="window.DineDirectStore.logout()"><i data-lucide="log-out"></i> Log Out</a></li>
            </ul>
        </aside>
    `;
};

const OwnerViews = {
    // 1. Dashboard Page
    dashboard: () => {
        const session = window.DineDirectStore.getSession();
        const restId = session.activeRestaurantId || 'r1';
        const rest = window.DineDirectStore.getRestaurant(restId);
        
        if (!rest) return `<div>Restaurant not found. <a href="#auth">Log in again</a></div>`;

        const orders = window.DineDirectStore.getOrders(restId);
        const tables = window.DineDirectStore.getTables(restId);
        const allAlerts = window.DineDirectStore.state.supportAlerts || [];
        const supportAlerts = allAlerts.filter(sa => sa.restaurantId === restId && sa.status === 'active');
        const resolvedAlerts = allAlerts.filter(sa => sa.restaurantId === restId && sa.status === 'resolved');
        
        const todayStr = new Date().toDateString();
        const todayOrders = orders.filter(o => new Date(o.timestamp).toDateString() === todayStr);
        
        // Metrics
        const orderCount = todayOrders.length;
        const revenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
        const occupiedTablesCount = tables.filter(t => t.status === 'occupied').length;

        // Pending and Active Orders
        const activeOrders = orders.filter(o => o.status === 'new' || o.status === 'preparing' || o.status === 'ready');

        return `
            <div class="dashboard-layout fade-in">
                ${renderSidebar('dashboard')}
                
                <main class="main-content">
                    <header class="top-nav">
                        <div>
                            <h2>Overview</h2>
                            <p class="text-muted" style="font-size:0.9rem;">Live restaurant dashboard for ${rest.name}</p>
                        </div>
                        <div class="user-profile">
                            <div class="avatar" style="color:white; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                                ${rest.name.charAt(0)}
                            </div>
                            <span>${rest.name}</span>
                        </div>
                    </header>
                    
                    <div class="stats-grid">
                        <div class="stat-card card">
                            <h3>Today's Orders</h3>
                            <div class="value text-primary">${orderCount}</div>
                        </div>
                        <div class="stat-card card">
                            <h3>Revenue</h3>
                            <div class="value text-success">₹${revenue}</div>
                        </div>
                        <div class="stat-card card">
                            <h3>Table Occupancy</h3>
                            <div class="value text-warning">${occupiedTablesCount}/${tables.length}</div>
                        </div>
                        <div class="stat-card card" style="display:flex; flex-direction:column; justify-content:space-between; padding:20px; min-height:120px;">
                            <h3 style="margin-bottom:8px;">Quick shortcuts</h3>
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <a href="#owner/menu" class="btn btn-primary" style="padding:8px 12px; font-size:0.8rem; text-decoration:none; color:white; display:inline-flex; align-items:center; justify-content:center; gap:6px; width:100%;">
                                    <i data-lucide="menu-square" style="width:14px; height:14px;"></i> Manage Menu
                                </a>
                                <a href="#owner/tables" class="btn btn-secondary" style="padding:8px 12px; font-size:0.8rem; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px; width:100%; border:1px solid #ddd;">
                                    <i data-lucide="grid-2x2" style="width:14px; height:14px;"></i> Tables & QR
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Customer Help Alerts -->
                    ${supportAlerts.length > 0 ? `
                        <div class="card mt-4" style="border-left: 4px solid var(--primary); background: #fffdfb; padding: 20px;">
                            <h3 style="margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                                <i data-lucide="alert-triangle" style="color:var(--primary); width:20px; height:20px;"></i>
                                Active Customer Help Alerts (${supportAlerts.length})
                            </h3>
                            <div style="display:flex; flex-direction:column; gap:12px;">
                                ${supportAlerts.map(alert => {
                                    const time = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return `
                                        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:white; border:1px solid #ffe8df; border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                                            <div>
                                                <span class="badge" style="background:rgba(255, 107, 53, 0.15); color:var(--primary); padding:4px 8px; border-radius:6px; font-weight:bold;">Table ${alert.tableNum}</span>
                                                <span style="font-size:0.85rem; color:var(--text-muted); margin-left:8px; font-weight:500;">(${alert.customerName})</span>
                                                <p style="margin:8px 0 0 0; font-size:0.9rem; color:#d93800; font-weight:600;">
                                                    ${alert.message}
                                                </p>
                                            </div>
                                            <div style="display:flex; gap:12px; align-items:center;">
                                                <span style="font-size:0.75rem; color:#888;">${time}</span>
                                                <button class="btn btn-primary resolve-alert-btn" data-id="${alert.id}" style="padding:6px 12px; font-size:0.75rem; background:#4f46e5; border-color:#4f46e5;">Send Staff / Resolve</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Resolved Help History -->
                    <div class="card mt-4" style="background: #fafafa; border: 1px solid #e5e5e5; padding: 20px;">
                        <h3 style="margin-bottom:16px; font-size:1.1rem; color:var(--text-muted); display:flex; align-items:center; gap:8px;">
                            <i data-lucide="history" style="width:16px; height:16px;"></i>
                            Help Requests History (Last 5 Resolved)
                        </h3>
                        ${resolvedAlerts.length === 0 ? `
                            <p style="font-size:0.85rem; color:#aaa; margin:0;">No resolved support alerts yet.</p>
                        ` : `
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                ${resolvedAlerts.slice(-5).reverse().map(alert => {
                                    const time = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return `
                                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; padding:8px 12px; background:white; border:1px solid #eee; border-radius:6px; color:#555;">
                                            <div>
                                                <strong>Table ${alert.tableNum}</strong>: <span style="text-decoration:line-through; color:#aaa;">${alert.message}</span>
                                                <span style="font-size:0.75rem; color:#bbb; margin-left:8px;">(Guest: ${alert.customerName})</span>
                                            </div>
                                            <span style="font-size:0.75rem; color:#aaa; display:flex; align-items:center; gap:4px;">
                                                <i data-lucide="check" style="width:12px; height:12px; color:var(--success);"></i> Resolved at ${time}
                                            </span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>

                    <div class="recent-orders mt-4 card">
                        <h3 style="margin-bottom:16px;">Active Incoming Orders (${activeOrders.length})</h3>
                        ${activeOrders.length === 0 ? `
                            <div class="empty-state">
                                <i data-lucide="clipboard-list"></i>
                                <p>No active orders at the moment. Dine-in tables are clear!</p>
                            </div>
                        ` : `
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
                                    <thead>
                                        <tr style="border-bottom: 2px solid #eee; padding-bottom: 12px; color: var(--text-muted);">
                                            <th style="padding: 12px 8px;">Order ID</th>
                                            <th style="padding: 12px 8px;">Customer Name</th>
                                            <th style="padding: 12px 8px;">Table</th>
                                            <th style="padding: 12px 8px;">Items</th>
                                            <th style="padding: 12px 8px;">Total</th>
                                            <th style="padding: 12px 8px;">Payment</th>
                                            <th style="padding: 12px 8px;">Status</th>
                                            <th style="padding: 12px 8px; text-align:right;">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${activeOrders.map(order => `
                                            <tr style="border-bottom: 1px solid #f0f0f0;">
                                                <td style="padding: 12px 8px; font-weight:bold;">#${order.id}</td>
                                                <td style="padding: 12px 8px; font-weight:600; color:var(--text-main);">${order.customerName || 'Guest'}</td>
                                                <td style="padding: 12px 8px;"><span class="badge" style="background:#e9ecef;color:#495057;padding:4px 8px;border-radius:6px;">Table ${order.tableNum}</span></td>
                                                <td style="padding: 12px 8px;">
                                                    ${order.items.map(it => `<div>${it.qty}x ${it.name}</div>`).join('')}
                                                </td>
                                                <td style="padding: 12px 8px; font-weight:600; color:var(--primary);">₹${order.total}</td>
                                                <td style="padding: 12px 8px;">
                                                    <span style="font-size:0.8rem; font-weight:bold; color:${order.paymentStatus === 'paid' ? 'green' : 'orange'}">
                                                        ${order.paymentStatus === 'paid' ? 'PAID (Online)' : 'PENDING (Counter)'}
                                                    </span>
                                                    ${order.paymentStatus === 'pending' ? `
                                                        <button class="btn btn-secondary pay-collect-btn" data-id="${order.id}" style="padding:4px 8px; font-size:0.75rem; margin-top:4px; display:block;">Collect Cash</button>
                                                    ` : ''}
                                                </td>
                                                <td style="padding: 12px 8px;">
                                                    <span class="badge ${order.status === 'new' ? 'bg-danger' : 'bg-warning'}" style="padding:4px 8px;border-radius:12px;font-size:0.75rem;text-transform:capitalize;">
                                                        ${order.status}
                                                    </span>
                                                </td>
                                                <td style="padding: 12px 8px; text-align:right;">
                                                    ${order.status === 'new' ? `
                                                        <button class="btn btn-primary start-prep-btn" data-id="${order.id}" style="padding:6px 12px; font-size:0.8rem;">Start Cooking</button>
                                                    ` : ''}
                                                    ${order.status === 'preparing' ? `
                                                        <button class="btn btn-success mark-ready-btn" data-id="${order.id}" style="padding:6px 12px; font-size:0.8rem; background:var(--success);">Mark Ready</button>
                                                    ` : ''}
                                                    ${order.status === 'ready' ? `
                                                        <button class="btn btn-primary mark-served-btn" data-id="${order.id}" style="padding:6px 12px; font-size:0.8rem; background:#4f46e5;">Mark Served</button>
                                                    ` : ''}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </main>
            </div>
        `;
    },

    setupDashboardListeners: () => {
        // Collect cash payment
        document.querySelectorAll('.pay-collect-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.getAttribute('data-id');
                window.DineDirectStore.updateOrderPaymentStatus(orderId, 'paid');
                if (window.showToast) window.showToast(`Payment recorded for order #${orderId}!`);
            });
        });

        // Start Cooking
        document.querySelectorAll('.start-prep-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.getAttribute('data-id');
                window.DineDirectStore.updateOrderStatus(orderId, 'preparing');
                if (window.showToast) window.showToast(`Cooking started for order #${orderId}!`);
            });
        });

        // Mark Ready
        document.querySelectorAll('.mark-ready-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.getAttribute('data-id');
                window.DineDirectStore.updateOrderStatus(orderId, 'ready');
                if (window.showToast) window.showToast(`Order #${orderId} marked as Ready!`);
            });
        });

        // Mark Served
        document.querySelectorAll('.mark-served-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.getAttribute('data-id');
                window.DineDirectStore.updateOrderStatus(orderId, 'served');
                if (window.showToast) window.showToast(`Order #${orderId} served successfully!`);
            });
        });

        // Resolve Support Alert
        document.querySelectorAll('.resolve-alert-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const alertId = btn.getAttribute('data-id');
                window.DineDirectStore.resolveSupportAlert(alertId);
                if (window.showToast) window.showToast(`Staff sent to resolve alert!`);
            });
        });
    },


    // 2. Menu Management Page
    menu: () => {
        const session = window.DineDirectStore.getSession();
        const restId = session.activeRestaurantId || 'r1';
        const rest = window.DineDirectStore.getRestaurant(restId);
        
        if (!rest) return `<div>Restaurant not found.</div>`;

        const menu = window.DineDirectStore.getMenu(restId);

        return `
            <div class="dashboard-layout fade-in">
                ${renderSidebar('menu')}

                <main class="main-content">
                    <header class="top-nav">
                        <div>
                            <h2>Manage Menu</h2>
                            <p class="text-muted" style="font-size:0.9rem;">Add, edit or remove menu items</p>
                        </div>
                        <button class="btn btn-primary" id="btnOpenAddModal"><i data-lucide="plus"></i> Add Item</button>
                    </header>

                    <div class="menu-list card mt-4">
                        ${menu.length === 0 ? `
                            <div class="empty-state">
                                <i data-lucide="pizza"></i>
                                <p>Your menu is empty. Start adding items to display to customers.</p>
                            </div>
                        ` : `
                            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
                                ${menu.map(item => `
                                    <div class="card" style="padding:16px; border:1px solid #f0f0f0; box-shadow:none; display:flex; flex-direction:column; justify-content:space-between;">
                                        <div>
                                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                                <span class="badge" style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:8px; font-size:0.75rem;">${item.category}</span>
                                                <span class="diet-dot ${item.type === 'veg' ? 'veg' : 'non-veg'}" style="width:12px; height:12px; border:2px solid ${item.type === 'veg' ? 'green' : 'red'}; display:inline-flex; align-items:center; justify-content:center; border-radius:2px;">
                                                    <span style="width:4px; height:4px; border-radius:50%; background:${item.type === 'veg' ? 'green' : 'red'};"></span>
                                                </span>
                                            </div>
                                            <h4 style="font-size:1.1rem; margin-bottom:6px;">${item.name}</h4>
                                            <p class="text-muted" style="font-size:0.85rem; line-height:1.4; min-height:40px; margin-bottom:12px;">${item.desc || 'No description provided.'}</p>
                                        </div>
                                        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f5f5f5; padding-top:12px;">
                                            <strong style="color:var(--primary); font-size:1.1rem;">₹${item.price}</strong>
                                            <button class="btn delete-item-btn" data-id="${item.id}" style="padding:6px 12px; font-size:0.8rem; background:rgba(231,76,60,0.1); color:var(--danger); border:none;">
                                                <i data-lucide="trash-2" style="width:14px;height:14px;"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <!-- Add Menu Item Modal -->
                    <div class="modal-overlay d-none" id="addMenuItemModal">
                        <div class="modal-container card animate-fade-in" style="max-width:450px; width:90%; margin:0 auto; padding:28px;">
                            <h3 style="margin-bottom:16px;"><i data-lucide="plus-circle" style="color:var(--primary); vertical-align:middle; margin-right:8px;"></i> Add Menu Item</h3>
                            
                            <form id="addItemForm">
                                <div class="form-group">
                                    <label>Item Name</label>
                                    <input type="text" class="form-control" id="itemName" placeholder="e.g. Garlic Naan" required>
                                </div>
                                <div class="form-group">
                                    <label>Category</label>
                                    <select class="form-control" id="itemCategory" required>
                                        <option value="Biryani">Biryani</option>
                                        <option value="Starters / Appetizers">Starters / Appetizers</option>
                                        <option value="Main Course">Main Course</option>
                                        <option value="Dabbas">Dabbas</option>
                                        <option value="Cafes">Cafes</option>
                                        <option value="Fast Food">Fast Food</option>
                                        <option value="Chinese / Asian">Chinese / Asian</option>
                                        <option value="South Indian">South Indian</option>
                                        <option value="Desserts & Sweets">Desserts & Sweets</option>
                                        <option value="Beverages">Beverages</option>
                                        <option value="custom">-- Add Custom Category --</option>
                                    </select>
                                </div>
                                <div class="form-group d-none" id="customCategoryGroup" style="margin-top:12px;">
                                    <label>Custom Category Name</label>
                                    <input type="text" class="form-control" id="customCategoryInput" placeholder="e.g. Italian, Continental">
                                </div>
                                <div class="form-group">
                                    <label>Dietary Type</label>
                                    <div style="display:flex; gap:16px; margin-top:6px;">
                                        <label style="font-weight:normal; display:flex; align-items:center; gap:6px; cursor:pointer;">
                                            <input type="radio" name="itemType" value="veg" checked> Veg
                                        </label>
                                        <label style="font-weight:normal; display:flex; align-items:center; gap:6px; cursor:pointer;">
                                            <input type="radio" name="itemType" value="non-veg"> Non-Veg
                                        </label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Price (₹)</label>
                                    <input type="number" class="form-control" id="itemPrice" placeholder="e.g. 120" min="0" required>
                                </div>
                                <div class="form-group">
                                    <label>Description</label>
                                    <textarea class="form-control" id="itemDesc" rows="3" placeholder="Describe the dish flavors, ingredients..." style="resize:none;"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>Image URL (Optional)</label>
                                    <input type="url" class="form-control" id="itemImg" placeholder="https://example.com/image.jpg">
                                </div>

                                <div style="display:flex; gap:12px; margin-top:24px;">
                                    <button type="button" class="btn btn-secondary" id="btnCancelAddModal" style="flex:1; border:1px solid #ddd;">Cancel</button>
                                    <button type="submit" class="btn btn-primary" style="flex:1.5;">Save Item</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        `;
    },

    setupMenuListeners: () => {
        const session = window.DineDirectStore.getSession();
        const restId = session.activeRestaurantId || 'r1';

        const btnOpenAddModal = document.getElementById('btnOpenAddModal');
        const btnCancelAddModal = document.getElementById('btnCancelAddModal');
        const addMenuItemModal = document.getElementById('addMenuItemModal');
        const addItemForm = document.getElementById('addItemForm');

        if (btnOpenAddModal && addMenuItemModal) {
            btnOpenAddModal.addEventListener('click', () => {
                addMenuItemModal.classList.remove('d-none');
                addMenuItemModal.style.display = 'flex';
                addMenuItemModal.style.alignItems = 'center';
                addMenuItemModal.style.justifyContent = 'center';
                addMenuItemModal.style.position = 'fixed';
                addMenuItemModal.style.top = '0';
                addMenuItemModal.style.left = '0';
                addMenuItemModal.style.width = '100vw';
                addMenuItemModal.style.height = '100vh';
                addMenuItemModal.style.background = 'rgba(0,0,0,0.6)';
                addMenuItemModal.style.zIndex = '1000';
            });
        }

        if (btnCancelAddModal && addMenuItemModal) {
            btnCancelAddModal.addEventListener('click', () => {
                addMenuItemModal.classList.add('d-none');
                addMenuItemModal.style.display = 'none';
            });
        }

        const itemCategory = document.getElementById('itemCategory');
        const customCategoryGroup = document.getElementById('customCategoryGroup');
        const customCategoryInput = document.getElementById('customCategoryInput');

        if (itemCategory && customCategoryGroup && customCategoryInput) {
            itemCategory.addEventListener('change', () => {
                if (itemCategory.value === 'custom') {
                    customCategoryGroup.classList.remove('d-none');
                    customCategoryInput.setAttribute('required', 'true');
                    customCategoryInput.focus();
                } else {
                    customCategoryGroup.classList.add('d-none');
                    customCategoryInput.removeAttribute('required');
                    customCategoryInput.value = '';
                }
            });
        }

        if (addItemForm) {
            addItemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('itemName').value;
                const categorySelect = document.getElementById('itemCategory').value;
                const customCategory = document.getElementById('customCategoryInput').value;
                const category = categorySelect === 'custom' ? customCategory.trim() : categorySelect;
                const type = document.querySelector('input[name="itemType"]:checked').value;
                const price = document.getElementById('itemPrice').value;
                const desc = document.getElementById('itemDesc').value;
                const img = document.getElementById('itemImg').value;

                window.DineDirectStore.addMenuItem(restId, { name, category, type, price, desc, img });
                
                addMenuItemModal.classList.add('d-none');
                addMenuItemModal.style.display = 'none';
                if (customCategoryGroup) {
                    customCategoryGroup.classList.add('d-none');
                    customCategoryInput.removeAttribute('required');
                }
                addItemForm.reset();
                if (window.showToast) window.showToast(`Menu item "${name}" added under "${category}"!`);
            });
        }

        // Delete button
        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this menu item?')) {
                    window.DineDirectStore.deleteMenuItem(restId, itemId);
                    if (window.showToast) window.showToast('Item deleted from menu.');
                }
            });
        });
    },


    // 3. Tables & QR Code Manager
    tables: () => {
        const session = window.DineDirectStore.getSession();
        const restId = session.activeRestaurantId || 'r1';
        const rest = window.DineDirectStore.getRestaurant(restId);
        
        if (!rest) return `<div>Restaurant not found.</div>`;

        const tables = window.DineDirectStore.getTables(restId);
        const orders = window.DineDirectStore.getOrders(restId);

        return `
            <div class="dashboard-layout fade-in">
                ${renderSidebar('tables')}

                <main class="main-content">
                    <header class="top-nav">
                        <div>
                            <h2>Tables & QR Codes</h2>
                            <p class="text-muted" style="font-size:0.9rem;">Generate QR codes for table-side customer scanning</p>
                        </div>
                        <button class="btn btn-primary" id="btnOpenTableModal"><i data-lucide="plus"></i> Add Table</button>
                    </header>

                    <div class="tables-grid mt-4" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:24px;">
                        ${tables.map(table => {
                            const isOccupied = table.status === 'occupied';
                            const activeOrder = orders.find(o => String(o.tableNum) === String(table.num) && o.status !== 'served' && o.status !== 'delivered');
                            const customerName = activeOrder ? activeOrder.customerName : 'Guest';
                            // Build scan URL linking directly to customer menu with table query param
                            const scanUrl = `${window.location.origin}${window.location.pathname}#customer/home?table=${table.num}&restaurantId=${restId}`;
                            
                            return `
                                <div class="table-card card" style="padding:20px; border:1px solid #f0f0f0; box-shadow:none; text-align:center;">
                                    <div class="table-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                        <h3 style="font-size:1.15rem; font-weight:bold;">Table ${table.num}</h3>
                                        <span class="badge ${isOccupied ? 'bg-danger' : 'bg-success'}" style="padding:4px 8px; border-radius:8px; font-size:0.75rem;">
                                            ${isOccupied ? 'Occupied' : 'Available'}
                                        </span>
                                    </div>
                                    ${isOccupied ? `
                                        <div style="font-size:0.85rem; font-weight:600; color:var(--text-muted); margin-top:-6px; margin-bottom:12px; text-align:left; border-bottom:1px dashed rgba(0,0,0,0.05); padding-bottom:8px;">
                                            Customer: <span style="color:var(--primary);">${customerName}</span>
                                        </div>
                                    ` : ''}
                                    <div class="qr-placeholder mt-2" style="background:#f8f9fa; padding:16px; border-radius:12px; display:inline-block; border:1px solid rgba(0,0,0,0.02); margin-bottom:12px;">
                                        <i data-lucide="qr-code" style="width:100px;height:100px;color:var(--primary);"></i>
                                    </div>
                                    <div style="font-size:0.75rem; color:var(--text-muted); word-break:break-all; background:#f1f3f5; padding:6px; border-radius:4px; margin-bottom:12px;">
                                        ${scanUrl}
                                    </div>
                                    <button class="btn btn-secondary btn-block view-qr-card-btn" data-url="${scanUrl}" data-num="${table.num}" style="padding:8px; font-size:0.85rem; border:1px solid #ddd;">
                                        <i data-lucide="printer" style="width:14px;height:14px;"></i> Print QR Card
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Add Table Modal -->
                    <div class="modal-overlay d-none" id="addTableModal">
                        <div class="modal-container card animate-fade-in" style="max-width:350px; width:90%; margin:0 auto; padding:24px;">
                            <h3>Add Dining Table</h3>
                            <form id="addTableForm" class="mt-4">
                                <div class="form-group">
                                    <label>Table Number / ID</label>
                                    <input type="number" class="form-control" id="tableNumInput" placeholder="e.g. 5" min="1" max="100" required>
                                </div>
                                <div style="display:flex; gap:12px; margin-top:24px;">
                                    <button type="button" class="btn btn-secondary" id="btnCancelTableModal" style="flex:1; border:1px solid #ddd;">Cancel</button>
                                    <button type="submit" class="btn btn-primary" style="flex:1.5;">Add Table</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Printable QR Card Modal -->
                    <div class="modal-overlay d-none" id="printQrModal">
                        <div class="modal-container card animate-fade-in" style="max-width:400px; width:90%; margin:0 auto; padding:28px; text-align:center; border:2px solid var(--primary);">
                            <div style="border:4px double var(--primary); padding:20px; border-radius:8px; background:#fff;">
                                <h1 style="color:var(--primary); font-size:1.8rem; font-family:var(--font-heading); margin-bottom:4px;">DINE DIRECT</h1>
                                <p style="font-weight:600; color:var(--text-muted); font-size:0.95rem;">Paradise Biryani</p>
                                
                                <div style="font-size:2.8rem; font-weight:bold; margin: 20px 0 10px; color:var(--text-main); font-family:var(--font-heading);">
                                    TABLE <span id="printTableNum">X</span>
                                </div>

                                <div style="background:#f8f9fa; padding:20px; border-radius:12px; display:inline-block; border:1px solid #eee;">
                                    <i data-lucide="qr-code" style="width:180px;height:180px;color:var(--primary);"></i>
                                </div>

                                <p style="font-weight:bold; margin-top:16px; font-size:1rem; color:var(--text-main);">SCAN TO ORDER</p>
                                <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Skip the queue. Browse menu, order & pay directly from your table.</p>
                                <div id="printTableUrl" style="font-size:0.65rem; color:#aaa; margin-top:12px; word-break:break-all;"></div>
                            </div>
                            <div style="display:flex; gap:12px; margin-top:20px;">
                                <button class="btn btn-secondary" id="btnClosePrintModal" style="flex:1; border:1px solid #ddd;">Close</button>
                                <button class="btn btn-primary" onclick="window.print()" style="flex:1.5;"><i data-lucide="printer"></i> Print Code</button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    },

    setupTablesListeners: () => {
        const session = window.DineDirectStore.getSession();
        const restId = session.activeRestaurantId || 'r1';

        const btnOpenTableModal = document.getElementById('btnOpenTableModal');
        const btnCancelTableModal = document.getElementById('btnCancelTableModal');
        const addTableModal = document.getElementById('addTableModal');
        const addTableForm = document.getElementById('addTableForm');

        if (btnOpenTableModal && addTableModal) {
            btnOpenTableModal.addEventListener('click', () => {
                addTableModal.classList.remove('d-none');
                addTableModal.style.display = 'flex';
                addTableModal.style.alignItems = 'center';
                addTableModal.style.justifyContent = 'center';
                addTableModal.style.position = 'fixed';
                addTableModal.style.top = '0';
                addTableModal.style.left = '0';
                addTableModal.style.width = '100vw';
                addTableModal.style.height = '100vh';
                addTableModal.style.background = 'rgba(0,0,0,0.6)';
                addTableModal.style.zIndex = '1000';
            });
        }

        if (btnCancelTableModal && addTableModal) {
            btnCancelTableModal.addEventListener('click', () => {
                addTableModal.classList.add('d-none');
                addTableModal.style.display = 'none';
            });
        }

        if (addTableForm) {
            addTableForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const num = document.getElementById('tableNumInput').value;
                const added = await window.DineDirectStore.addTable(restId, num);
                
                addTableModal.classList.add('d-none');
                addTableModal.style.display = 'none';
                addTableForm.reset();

                if (added) {
                    if (window.showToast) window.showToast(`Table ${num} generated successfully!`);
                } else {
                    alert('Table number already exists.');
                }
            });
        }

        // Print Card modal listeners
        const printQrModal = document.getElementById('printQrModal');
        const btnClosePrintModal = document.getElementById('btnClosePrintModal');
        
        document.querySelectorAll('.view-qr-card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.getAttribute('data-url');
                const num = btn.getAttribute('data-num');

                document.getElementById('printTableNum').textContent = num;
                document.getElementById('printTableUrl').textContent = url;

                printQrModal.classList.remove('d-none');
                printQrModal.style.display = 'flex';
                printQrModal.style.alignItems = 'center';
                printQrModal.style.justifyContent = 'center';
                printQrModal.style.position = 'fixed';
                printQrModal.style.top = '0';
                printQrModal.style.left = '0';
                printQrModal.style.width = '100vw';
                printQrModal.style.height = '100vh';
                printQrModal.style.background = 'rgba(0,0,0,0.6)';
                printQrModal.style.zIndex = '1000';
                
                // Reinitialize lucide icons inside print modal
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            });
        });

        if (btnClosePrintModal && printQrModal) {
            btnClosePrintModal.addEventListener('click', () => {
                printQrModal.classList.add('d-none');
                printQrModal.style.display = 'none';
            });
        }
    },


    // 4. Analytics & Reports Page
    analytics: () => {
        const session = window.DineDirectStore.getSession();
        const restId = session.activeRestaurantId || 'r1';
        const rest = window.DineDirectStore.getRestaurant(restId);
        
        if (!rest) return `<div>Restaurant not found.</div>`;

        const orders = window.DineDirectStore.getOrders(restId);
        
        // Dynamic calculations
        const monthlyRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        
        // Count item popularities
        const popularity = {};
        orders.forEach(o => {
            o.items.forEach(it => {
                popularity[it.name] = (popularity[it.name] || 0) + it.qty;
            });
        });
        
        const popularItemsSorted = Object.keys(popularity).map(name => ({ name, count: popularity[name] })).sort((a,b) => b.count - a.count);
        const topItem = popularItemsSorted[0] ? `${popularItemsSorted[0].name}` : 'No orders yet';
        const topItemDesc = popularItemsSorted[0] ? `Ordered ${popularItemsSorted[0].count} times` : '';

        // peak hour simulation based on actual orders
        const hourCounts = Array(24).fill(0);
        orders.forEach(o => {
            const hr = new Date(o.timestamp).getHours();
            hourCounts[hr]++;
        });
        let maxHrIdx = 20; // default 8pm
        let maxCount = 0;
        hourCounts.forEach((cnt, idx) => {
            if (cnt > maxCount) {
                maxCount = cnt;
                maxHrIdx = idx;
            }
        });
        const peakHourText = `${maxHrIdx === 0 ? 12 : (maxHrIdx > 12 ? maxHrIdx - 12 : maxHrIdx)}:00 ${maxHrIdx >= 12 ? 'PM' : 'AM'} - ${(maxHrIdx+1) > 12 ? (maxHrIdx+1) - 12 : (maxHrIdx+1)}:00 ${maxHrIdx >= 11 ? 'PM' : 'AM'}`;

        // Custom SVG Bar Chart calculation (Daily Revenue for the last 7 days)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyRevenue = [0, 0, 0, 0, 0, 0, 0];
        
        orders.forEach(o => {
            const dayIdx = new Date(o.timestamp).getDay();
            dailyRevenue[dayIdx] += o.total;
        });

        // Set baseline values if empty
        const hasOrders = dailyRevenue.some(v => v > 0);
        const displayRevenue = hasOrders ? dailyRevenue : [1200, 2400, 1800, 3100, 4200, 1500, 2200]; // mock baseline that gets replaced as you place orders
        const maxRev = Math.max(...displayRevenue);

        // Chart SVG construction
        const chartHeight = 150;
        const barWidth = 40;
        const barGap = 20;
        const startX = 40;
        
        const svgBars = displayRevenue.map((val, idx) => {
            const valPct = maxRev > 0 ? (val / maxRev) : 0;
            const barH = Math.max(valPct * chartHeight, 6);
            const x = startX + idx * (barWidth + barGap);
            const y = chartHeight - barH;

            return `
                <g>
                    <!-- Hover value box -->
                    <rect x="${x}" y="${y - 25}" width="40" height="20" rx="4" fill="#1a1a1a" opacity="0.85" style="display:none;" />
                    <text x="${x + 20}" y="${y - 12}" fill="white" font-size="9" text-anchor="middle" font-weight="bold">₹${val}</text>
                    
                    <!-- Bar -->
                    <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="${val > 0 ? 'var(--primary)' : '#e2e8f0'}" style="transition: all 0.5s ease;">
                        <animate attributeName="height" from="0" to="${barH}" dur="0.6s" fill="freeze" />
                        <animate attributeName="y" from="${chartHeight}" to="${y}" dur="0.6s" fill="freeze" />
                    </rect>
                    
                    <!-- Text Label -->
                    <text x="${x + 20}" y="${chartHeight + 20}" fill="var(--text-muted)" font-size="10" font-weight="600" text-anchor="middle">${dayNames[idx]}</text>
                    
                    <!-- Value on top of bar -->
                    <text x="${x + 20}" y="${y - 6}" fill="var(--text-main)" font-size="10" font-weight="bold" text-anchor="middle">₹${val}</text>
                </g>
            `;
        }).join('');

        return `
            <div class="dashboard-layout fade-in">
                ${renderSidebar('analytics')}

                <main class="main-content">
                    <header class="top-nav">
                        <div>
                            <h2>Analytics & Growth</h2>
                            <p class="text-muted" style="font-size:0.9rem;">Track sales, orders, and restaurant insights</p>
                        </div>
                        <button class="btn btn-primary" id="btnPushNotify"><i data-lucide="bell-ring"></i> Push Notification</button>
                    </header>

                    <div class="stats-grid">
                        <div class="stat-card card">
                            <h3>Total Revenue</h3>
                            <div class="value text-success">₹${monthlyRevenue}</div>
                            <p class="text-muted" style="font-size:0.8rem;margin-top:4px;">All-time calculated sales</p>
                        </div>
                        <div class="stat-card card">
                            <h3>Popular Item</h3>
                            <div class="value text-primary" style="font-size: 1.3rem; margin-top:12px;">${topItem}</div>
                            <p class="text-muted" style="font-size:0.8rem;margin-top:4px;">${topItemDesc || 'Place orders to calculate'}</p>
                        </div>
                         <div class="stat-card card">
                            <h3>Peak Hours</h3>
                            <div class="value text-warning" style="font-size: 1.2rem; margin-top:12px;">${peakHourText}</div>
                            <p class="text-muted" style="font-size:0.8rem;margin-top:4px;">Highest ordering velocity</p>
                        </div>
                    </div>

                    <div class="card mt-4">
                        <h3 style="margin-bottom:16px;">Daily Sales Distribution</h3>
                        <div style="width:100%; display:flex; align-items:center; justify-content:center; padding:20px 0;">
                            <svg width="480" height="200" viewBox="0 0 480 200" style="overflow:visible;">
                                <!-- Grid lines -->
                                <line x1="20" y1="${chartHeight}" x2="460" y2="${chartHeight}" stroke="#e2e8f0" stroke-width="2" />
                                <line x1="20" y1="${chartHeight/2}" x2="460" y2="${chartHeight/2}" stroke="#f1f5f9" stroke-dasharray="4" />
                                
                                ${svgBars}
                            </svg>
                        </div>
                        <p class="text-center text-muted" style="font-size:0.8rem; margin-top:-10px;">
                            ${hasOrders ? 'Calculated from actual completed order volumes.' : 'No active sales. Rendering mock preview baseline.'}
                        </p>
                    </div>
                </main>
            </div>
        `;
    },

    setupAnalyticsListeners: () => {
        const btnPushNotify = document.getElementById('btnPushNotify');
        if (btnPushNotify) {
            btnPushNotify.addEventListener('click', () => {
                if (window.showToast) window.showToast('Broadcasted mock push notification to customers!');
            });
        }
    }
};

window.OwnerViews = OwnerViews;
export default OwnerViews;
