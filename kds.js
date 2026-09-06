// Dine Direct Kitchen Display System (KDS)

const renderKDSSidebar = () => {
    return `
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2>Dine Direct</h2>
                <p class="text-muted">Owner Portal</p>
            </div>
            <ul class="nav-links">
                <li><a href="#owner/dashboard"><i data-lucide="layout-dashboard"></i> Dashboard</a></li>
                <li><a href="#owner/analytics"><i data-lucide="line-chart"></i> Analytics</a></li>
                <li><a href="#owner/menu"><i data-lucide="menu-square"></i> Manage Menu</a></li>
                <li><a href="#owner/tables"><i data-lucide="grid-2x2"></i> Tables & QR</a></li>
                <li><a href="#owner/kds" class="active"><i data-lucide="chef-hat"></i> Kitchen (KDS)</a></li>
                <li><a href="#owner/chats"><i data-lucide="message-square"></i> Live Chats</a></li>
                <li><a href="#auth" class="text-danger mt-4" onclick="window.DineDirectStore.logout()"><i data-lucide="log-out"></i> Log Out</a></li>
            </ul>
        </aside>
    `;
};

let prevKdsNewCount = -1;

const renderKDS = () => {
    const session = window.DineDirectStore.getSession();
    const restId = session.activeRestaurantId || 'r1';
    const rest = window.DineDirectStore.getRestaurant(restId);
    
    // Get orders for this restaurant
    const orders = window.DineDirectStore.getOrders(restId);
    
    // Group orders into KDS stages
    const newOrders = orders.filter(o => o.status === 'new');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    // Ring kitchen bell chime if new order arrived
    if (prevKdsNewCount !== -1 && newOrders.length > prevKdsNewCount) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const playBell = (freq, delay) => {
                setTimeout(() => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.9);
                }, delay);
            };
            playBell(1760, 0);   // A6
            playBell(2093, 140); // C7
        } catch (e) {}
    }
    prevKdsNewCount = newOrders.length;

    const formatTimeAgo = (timestamp) => {
        const diffMs = Date.now() - timestamp;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        return `${diffMins} min ago`;
    };

    return `
        <div class="dashboard-layout fade-in bg-gray" style="min-height:100vh;">
             ${renderKDSSidebar()}

            <main class="main-content kds-main">
                <header class="top-nav kds-nav" style="margin-bottom:24px;">
                    <div>
                        <h2>Kitchen Display System</h2>
                        <p class="text-muted" style="font-size:0.9rem;">Real-time preparation manager • ${rest ? rest.name : 'Dine Direct'}</p>
                    </div>
                    <div class="kds-status" style="display:flex; gap:12px; align-items:center;">
                        <span class="badge bg-success" style="padding:6px 12px; border-radius:20px; font-weight:600;"><span class="pulse-dot"></span> Live KDS Active</span>
                    </div>
                </header>

                <div class="kds-board" style="display:flex; gap:20px; overflow-x:auto; min-height:calc(100vh - 160px); padding-bottom:20px;">
                    
                    <!-- Column 1: New Orders -->
                    <div class="kds-col" style="flex:1; min-width:300px; background:rgba(0,0,0,0.02); border:1px solid rgba(0,0,0,0.05); border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:16px;">
                        <h3 class="col-title text-danger" style="font-size:1.1rem; border-bottom:2px solid var(--danger); padding-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                            <span>New Tickets</span>
                            <span class="badge bg-danger" style="border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem; padding:0;">${newOrders.length}</span>
                        </h3>
                        
                        ${newOrders.length === 0 ? `
                            <div style="text-align:center; padding:40px 0; color:var(--text-muted);">
                                <i data-lucide="inbox" style="width:36px;height:36px;opacity:0.3;margin-bottom:8px;"></i>
                                <p style="font-size:0.85rem;">No new orders.</p>
                            </div>
                        ` : newOrders.map(order => `
                            <div class="order-ticket card border-danger animate-fade-in" style="padding:16px; border-left:5px solid var(--danger); box-shadow:0 4px 12px rgba(231,76,60,0.08);">
                                <div class="ticket-header" style="display:flex; justify-content:space-between; font-weight:bold; border-bottom:1px dashed rgba(0,0,0,0.1); padding-bottom:8px; margin-bottom:12px;">
                                    <div>
                                        <span class="order-num" style="color:var(--text-main); font-size:1.1rem;">#${order.id}</span>
                                        <span class="order-customer" style="font-size:0.85rem; color:var(--text-muted); font-weight:600; display:block; margin-top:2px;">
                                            ${order.customerName || 'Guest'}
                                        </span>
                                    </div>
                                    <span class="order-time" style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">${formatTimeAgo(order.timestamp)}</span>
                                </div>
                                <div class="ticket-body">
                                    <ul style="list-style:none; padding:0; margin:0;">
                                        ${order.items.map(it => `
                                            <li style="margin-bottom:6px; font-size:0.95rem; display:flex; gap:8px;">
                                                <strong style="color:var(--primary);">${it.qty}x</strong> <span>${it.name}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                                <div class="ticket-footer" style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(0,0,0,0.05);">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                        <span class="table-num" style="background:#f1f3f5; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:600;">Table ${order.tableNum}</span>
                                        <button class="btn btn-secondary print-kot-btn" data-id="${order.id}" style="padding:4px 10px; font-size:0.75rem; border:1px solid #ccc; display:inline-flex; align-items:center; gap:4px;">
                                            <i data-lucide="printer" style="width:13px; height:13px;"></i> KOT
                                        </button>
                                    </div>
                                    <button class="btn btn-primary btn-block mt-2 kds-start-btn" data-id="${order.id}">Start Preparing</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Column 2: Preparing -->
                    <div class="kds-col" style="flex:1; min-width:300px; background:rgba(0,0,0,0.02); border:1px solid rgba(0,0,0,0.05); border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:16px;">
                        <h3 class="col-title text-warning" style="font-size:1.1rem; border-bottom:2px solid var(--warning); padding-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                             <span>Preparing</span>
                             <span class="badge bg-warning" style="border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem; padding:0; color:white; background:var(--warning);">${preparingOrders.length}</span>
                        </h3>

                        ${preparingOrders.length === 0 ? `
                            <div style="text-align:center; padding:40px 0; color:var(--text-muted);">
                                <i data-lucide="chef-hat" style="width:36px;height:36px;opacity:0.3;margin-bottom:8px;"></i>
                                <p style="font-size:0.85rem;">Nothing cooking.</p>
                            </div>
                        ` : preparingOrders.map(order => `
                            <div class="order-ticket card border-warning animate-fade-in" style="padding:16px; border-left:5px solid var(--warning); box-shadow:0 4px 12px rgba(241,196,15,0.08);">
                                 <div class="ticket-header" style="display:flex; justify-content:space-between; font-weight:bold; border-bottom:1px dashed rgba(0,0,0,0.1); padding-bottom:8px; margin-bottom:12px;">
                                    <div>
                                        <span class="order-num" style="color:var(--text-main); font-size:1.1rem;">#${order.id}</span>
                                        <span class="order-customer" style="font-size:0.85rem; color:var(--text-muted); font-weight:600; display:block; margin-top:2px;">
                                            ${order.customerName || 'Guest'}
                                        </span>
                                    </div>
                                    <span class="order-time" style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">${formatTimeAgo(order.timestamp)}</span>
                                </div>
                                <div class="ticket-body">
                                    <ul style="list-style:none; padding:0; margin:0;">
                                        ${order.items.map(it => `
                                            <li style="margin-bottom:6px; font-size:0.95rem; display:flex; gap:8px;">
                                                <strong style="color:var(--primary);">${it.qty}x</strong> <span>${it.name}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                                <div class="ticket-footer" style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(0,0,0,0.05);">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                        <span class="table-num" style="background:#f1f3f5; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:600;">Table ${order.tableNum}</span>
                                        <button class="btn btn-secondary print-kot-btn" data-id="${order.id}" style="padding:4px 10px; font-size:0.75rem; border:1px solid #ccc; display:inline-flex; align-items:center; gap:4px;">
                                            <i data-lucide="printer" style="width:13px; height:13px;"></i> KOT
                                        </button>
                                    </div>
                                    <button class="btn btn-success btn-block mt-2 kds-ready-btn" data-id="${order.id}">Mark as Ready</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Column 3: Ready to Serve -->
                    <div class="kds-col" style="flex:1; min-width:300px; background:rgba(0,0,0,0.02); border:1px solid rgba(0,0,0,0.05); border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:16px;">
                        <h3 class="col-title text-success" style="font-size:1.1rem; border-bottom:2px solid var(--success); padding-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                            <span>Ready to Serve</span>
                            <span class="badge bg-success" style="border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem; padding:0; background:var(--success);">${readyOrders.length}</span>
                        </h3>

                        ${readyOrders.length === 0 ? `
                            <div style="text-align:center; padding:40px 0; color:var(--text-muted);">
                                <i data-lucide="bell" style="width:36px;height:36px;opacity:0.3;margin-bottom:8px;"></i>
                                <p style="font-size:0.85rem;">No food waiting.</p>
                            </div>
                        ` : readyOrders.map(order => `
                            <div class="order-ticket card border-success animate-fade-in" style="padding:16px; border-left:5px solid var(--success); box-shadow:0 4px 12px rgba(46,204,113,0.08);">
                                 <div class="ticket-header" style="display:flex; justify-content:space-between; font-weight:bold; border-bottom:1px dashed rgba(0,0,0,0.1); padding-bottom:8px; margin-bottom:12px;">
                                    <div>
                                        <span class="order-num" style="color:var(--text-main); font-size:1.1rem;">#${order.id}</span>
                                        <span class="order-customer" style="font-size:0.85rem; color:var(--text-muted); font-weight:600; display:block; margin-top:2px;">
                                            ${order.customerName || 'Guest'}
                                        </span>
                                    </div>
                                    <span class="order-time" style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">${formatTimeAgo(order.timestamp)}</span>
                                </div>
                                <div class="ticket-body" style="color:var(--text-muted);">
                                    <ul style="list-style:none; padding:0; margin:0;">
                                        ${order.items.map(it => `
                                            <li style="margin-bottom:6px; font-size:0.95rem; display:flex; gap:8px;">
                                                <strong>${it.qty}x</strong> <span>${it.name}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                                <div class="ticket-footer" style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(0,0,0,0.05);">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                        <span class="table-num" style="background:#f1f3f5; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:600;">Table ${order.tableNum}</span>
                                        <button class="btn btn-secondary print-kot-btn" data-id="${order.id}" style="padding:4px 10px; font-size:0.75rem; border:1px solid #ccc; display:inline-flex; align-items:center; gap:4px;">
                                            <i data-lucide="printer" style="width:13px; height:13px;"></i> KOT
                                        </button>
                                    </div>
                                    <button class="btn btn-secondary btn-block mt-2 kds-served-btn" data-id="${order.id}" style="border:1px solid #ddd;">Mark Served</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                </div>
            </main>

            <!-- KOT Thermal Print Modal -->
            <div class="modal-overlay d-none" id="kotModal" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); z-index:9999; display:none; align-items:center; justify-content:center;">
                <div class="kot-modal-container">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h3 style="margin:0; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                            <i data-lucide="printer" style="color:var(--primary);"></i> Kitchen Order Ticket (KOT)
                        </h3>
                        <button id="btnCloseKotModal" style="background:none; border:none; cursor:pointer; font-size:1.5rem; color:#888; line-height:1;">&times;</button>
                    </div>
                    <div id="kotPaper" class="kot-paper"></div>
                    <div style="display:flex; gap:12px; margin-top:20px;">
                        <button class="btn btn-secondary" id="btnCancelKot" style="flex:1; border:1px solid #ddd;">Close</button>
                        <button class="btn btn-primary" id="btnPrintKotAction" style="flex:1.5; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                            <i data-lucide="printer"></i> Print Thermal KOT
                        </button>
                    </div>
                </div>
            </div>

            <!-- Print Area (Only visible during print) -->
            <div id="kotPrintContent" style="display:none;"></div>
        </div>
    `;
};

const setupKDSListeners = () => {
    // Start Cooking Button
    document.querySelectorAll('.kds-start-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-id');
            window.DineDirectStore.updateOrderStatus(orderId, 'preparing');
            if (window.showToast) window.showToast(`Cooking started for ticket #${orderId}!`);
        });
    });

    // Mark as Ready Button
    document.querySelectorAll('.kds-ready-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-id');
            window.DineDirectStore.updateOrderStatus(orderId, 'ready');
            if (window.showToast) window.showToast(`Ticket #${orderId} ready to serve!`);
        });
    });

    // Mark Served Button
    document.querySelectorAll('.kds-served-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-id');
            window.DineDirectStore.updateOrderStatus(orderId, 'served');
            if (window.showToast) window.showToast(`Ticket #${orderId} marked as Served!`);
        });
    });

    // KOT Thermal Print Modal Listeners
    const kotModal = document.getElementById('kotModal');
    const kotPaper = document.getElementById('kotPaper');
    const kotPrintContent = document.getElementById('kotPrintContent');
    const btnCloseKotModal = document.getElementById('btnCloseKotModal');
    const btnCancelKot = document.getElementById('btnCancelKot');
    const btnPrintKotAction = document.getElementById('btnPrintKotAction');

    const closeKot = () => {
        if (kotModal) {
            kotModal.classList.add('d-none');
            kotModal.style.display = 'none';
        }
    };

    if (btnCloseKotModal) btnCloseKotModal.addEventListener('click', closeKot);
    if (btnCancelKot) btnCancelKot.addEventListener('click', closeKot);
    if (btnPrintKotAction) {
        btnPrintKotAction.addEventListener('click', () => {
            window.print();
        });
    }

    document.querySelectorAll('.print-kot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-id');
            const session = window.DineDirectStore.getSession();
            const restId = session.activeRestaurantId || 'r1';
            const rest = window.DineDirectStore.getRestaurant(restId);
            const orders = window.DineDirectStore.getOrders(restId);
            const order = orders.find(o => o.id === orderId);

            if (!order) {
                alert('Order details not found.');
                return;
            }

            const restName = rest ? rest.name : 'Dine Direct Restaurant';
            const dateStr = new Date(order.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
            const totalQty = (order.items || []).reduce((sum, it) => sum + (it.qty || 1), 0);

            const kotText = 
`========================================
       KITCHEN ORDER TICKET (KOT)
========================================
Restaurant : ${restName}
Order No   : #${order.id}
Table No   : TABLE ${order.tableNum}
Customer   : ${order.customerName || 'Guest'}
Date/Time  : ${dateStr}
Type       : DINE-IN SELF-ORDER
----------------------------------------
QTY   ITEM DESCRIPTION
----------------------------------------
${(order.items || []).map(it => ` ${String(it.qty).padEnd(4)} ${it.name}`).join('\n')}
----------------------------------------
Total Items : ${totalQty}
Ticket State: ${order.status.toUpperCase()}
Payment     : ${order.paymentStatus.toUpperCase()} (${order.paymentMethod === 'pay_now' ? 'ONLINE' : 'COUNTER'})
========================================
    *** PREPARE FRESH & EXPEDITE ***
========================================`;

            if (kotPaper) {
                kotPaper.innerHTML = `<pre style="margin:0; font-family:inherit; white-space:pre-wrap; word-break:break-all;">${kotText}</pre>`;
            }
            if (kotPrintContent) {
                kotPrintContent.innerHTML = `<pre style="margin:0; font-family:inherit; font-size:11pt;">${kotText}</pre>`;
            }

            if (kotModal) {
                kotModal.classList.remove('d-none');
                kotModal.style.display = 'flex';
            }
        });
    });
};

// Export to window
if (!window.OwnerViews) window.OwnerViews = {};
window.OwnerViews.kds = renderKDS;
window.OwnerViews.setupKDSListeners = setupKDSListeners;

export default renderKDS;
