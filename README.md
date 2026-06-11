# Dine Direct 🍽️✨

Dine Direct is a premium, real-time, self-service table ordering and restaurant management platform. Designed for modern dining establishments, it enables customers to scan table QR codes, explore restaurant ambience, customize and place orders, and chat with an interactive AI Support Assistant. On the business side, owners get real-time kitchen tracking (KDS), analytics, menu management, and a live alert notification system for customer support.

---

## 🚀 Key Features

### 👤 Customer Features
- **Table QR Scan Simulation**: Check in directly to specific tables using URL parameters (e.g. `?table=3&restaurantId=r1`) or the in-app scanner modal.
- **Ambience Tour Gallery**: Explore high-resolution visuals of the dining hall, patio garden, and prep kitchen, complete with a smooth lightbox zoom view.
- **Dietary Indicators & Live Craving Filters**: Filter menus instantly by categories or search keywords, complete with clear veg/non-veg indicator badges.
- **Seamless UPI Payment Simulator**: Authorize mock payments with QR codes during checkout.
- **Live Order Status Tracking**: Watch your order progress through cooking stages (Placed ➔ Preparing ➔ Ready ➔ Served) in real-time.
- **🤖 Floating AI Support Chatbot**: Chat with an AI assistant for table service requests (need water, cleaning, payment issues, or custom messages).

### 💼 Owner & Staff Features
- **Live Metrics Dashboard**: Track active revenue, today's order counts, and real-time seating occupancy.
- **Kitchen Display System (KDS)**: Manage ticket pipelines (New ➔ Preparing ➔ Ready ➔ Served) with active customer names displayed.
- **🔔 Live Help Alerts**: Receive audio-visual Toast warnings on the dashboard when a customer triggers an AI chatbot support alert, and resolve requests instantly.
- **Menu Category Manager**: Add new menu items under existing categories or create custom classifications on the fly.
- **Dynamic Seating Seeding**: Generate and print table QR codes dynamically.
- **SVG Analytics Charts**: Review sales trends visually with live bar charts.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, ES6 JavaScript modules, Lucide icons, and modern responsive CSS (featuring glassmorphism, backdrop filters, and slide-up animations).
- **Backend**: Node.js & Express.
- **Real-Time Sync**: HTML5 WebSockets (`ws` library) for instantaneous cross-device status broadcasts.
- **Database**: SQLite (`sqlite` & `sqlite3` driver) for relational data persistence.

---

## 📂 Project Structure

```text
├── server.js          # Node.js Express & WebSocket server setup
├── database.js        # SQLite database connection, schema, and API helper functions
├── dinedirect.db      # SQLite database file (created automatically on startup)
├── package.json       # Node project configuration and dependency list
├── index.html         # Main client application entry point
├── style.css          # Core design system and global UI utility classes
├── app.js             # Client-side router, page coordinator, and store subscriber
├── state.js           # Central data store syncing client state via REST APIs & WebSockets
├── customer.js        # Customer UI views (Menu, Cart, Lightbox, Tracking, AI Chatbot)
├── customer.css       # Mobile-first styling rules for customer screens and chatbot
├── owner.js           # Owner views (Dashboard, Menu manager, Tables grid, Analytics)
├── owner.css          # Styling rules for owner dashboard panels and sidebars
├── kds.js             # Kitchen Display System layout and status updates
├── kds.css            # Styles for KDS ticket lanes and progress badges
└── images/            # Directory containing restaurant tour images
```

---

## 📥 Installation & Setup

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start the Server**:
   ```bash
   npm start
   ```
4. **Access the Application**:
   - Open **http://localhost:3000** in your browser.
   - For customer ordering: [http://localhost:3000/#customer/home](http://localhost:3000/#customer/home)
   - For owner dashboard: [http://localhost:3000/#owner/dashboard](http://localhost:3000/#owner/dashboard)

---

## 🧪 Simulation Walkthrough

To see the real-time cross-device synchronization and AI support alerts in action:

1. **Check-in to a Seating Table**:
   - Navigate to [http://localhost:3000/#customer/home](http://localhost:3000/#customer/home) on your mobile device or in Browser Tab A.
   - Click **Scan**, select "Paradise Biryani", enter Table **3**, and click **Scan & Enter**.
   - Input your name (e.g. `"John Doe"`) at checkout.
2. **Open the Dashboard**:
   - Open [http://localhost:3000/#owner/dashboard](http://localhost:3000/#owner/dashboard) in Browser Tab B.
3. **Place an Order**:
   - Complete checkout in Tab A. 
   - Watch the occupancy stats in Tab B automatically increment and Table 3 mark itself as Occupied by `"John Doe"` instantly.
4. **Kitchen Cooking Status**:
   - Go to KDS (`#owner/kds`) in Tab B. Click **Start Preparing** on John's ticket.
   - Tab A will instantly update to show a 50% cooking progress bar.
5. **Request AI Assistance**:
   - In Tab A, click the floating AI chatbot bubble in the bottom right corner.
   - Click the chip `"🥛 Need water / napkins"`, then choose `"Yes, Alert Staff"`.
   - Switch to Tab B. A warning toast will pop up, and a help alert card will appear under **Active Customer Help Alerts**.
   - Click **Send Staff / Resolve** on the dashboard.
   - In Tab A, the chatbot immediately prints: `✅ Support request resolved by staff` and the AI assistant confirms the resolution!
