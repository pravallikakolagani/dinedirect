# Dine Direct 🍽️✨

Dine Direct is an end-to-end, real-time table ordering, contactless billing, and restaurant management platform. Built with a responsive mobile-first architecture, it enables diners to scan table QR codes, explore restaurant ambience, customize and place orders, chat with an interactive AI Support Assistant, rate meals, and print official GST tax invoices. For kitchen and restaurant staff, it provides a high-efficiency Kitchen Display System (KDS) with thermal KOT printing, audible bell alerts, live customer ratings, and dynamic revenue analytics.

---

## 🌟 What's New: The 5 Major Feature Upgrades

### 1. 🛡️ Resilient Dual-Engine Database Fallback (Supabase + SQLite)
- **Zero-Downtime Guarantee**: Features a smart connection probe that tests Supabase cloud connectivity with a 2.5-second timeout.
- If Supabase is active, the system runs on Supabase PostgreSQL.
- If Supabase is sleeping, paused, or unreachable (`ENOTFOUND`), Dine Direct **automatically falls back to local SQLite (`dinedirect.db`)**, instantly seeding default restaurants (*Paradise Biryani*, *Third Wave Coffee*), full menus, tables, and reviews.
- Diners and restaurant operators never encounter empty screens or downtime.

### 2. 🖨️ Thermal Kitchen Order Ticket (KOT) Printing & Audio Chime
- **POS Ready**: Added a dedicated **"🖨️ KOT"** button to every ticket lane in the Kitchen Display System (`#owner/kds`) and active incoming dashboard orders.
- **Thermal Receipt Layout**: Modal preview formatted for standard **80mm / 58mm thermal receipt paper** rolls, displaying Table Number, Server/Customer Name, Token ID, Order Timestamp, Item Quantities, and Special Instructions.
- **Audio Kitchen Bell**: Uses the Web Audio API to play an authentic dual-tone kitchen order chime (ding-ding at 1760Hz / 2093Hz) when new tickets drop into the queue.

### 3. ⭐ Customer Reviews & Food Ratings System
- **Verified Dining Reviews**: When meals are marked `Served` or `Delivered`, customers can submit 1–5 star ratings on the live tracking screen (`#customer/tracking`).
- **Compliment Tags**: Quick-select sentiment chips: *😋 Delicious Taste*, *🔥 Hot & Fresh*, *⚡ Fast Service*, *📦 Great Packaging*, *💰 Value for Money*, *🤝 Friendly Staff*.
- **Restaurant Reviews & Ratings**: Displayed live on the restaurant view (`#customer/restaurant/:id`) with aggregate scores and guest feedback.
- **Owner Sentiment Dashboard**: Real-time feedback feed on the Owner Dashboard showing recent ratings and guest satisfaction badges.

### 4. 💳 Multi-Mode Payment Sandbox & Itemized GST Tax Invoices
- **Realistic Payment Options**:
  - **Instant UPI Simulator**: Displays simulated dynamic QR codes, UPI ID (`dinedirect@okaxis`), and 1-click test clipboard copy.
  - **Card Sandbox Simulator**: Interactive Visa/Mastercard/RuPay test card simulation (`4242 •••• •••• 4242`) with instant 3D Secure verification.
  - **Pay at Counter**: Option to place orders directly and settle the bill at the restaurant billing desk.
- **Printable GST Tax Invoice**:
  - Click **"📄 View GST Tax Invoice / Print Bill"** from live tracking or order history (`#customer/orders`).
  - Professional invoice complete with Restaurant Name, Address, Mock GSTIN (`36AAACD1234F1Z5`), FSSAI Lic (`13622011000452`), Invoice Number (`INV-2026-XXXX`), Date & Time, Itemized Rate/Qty breakdown, CGST (2.5%), SGST (2.5%), Restaurant Service Charge (5%), and Payment Status.
  - Dedicated `@media print` styling enables one-click **Print or Save as PDF**.

### 5. 🚀 Production Deployment Ready (Vercel)
- `vercel.json` configured with `@vercel/node` serverless functions routing `/api/*` requests to Express, and static caching for UI assets.
- Testable from actual smartphones on local Wi-Fi or when deployed live to Vercel.

### 6. 🛵 Multi-Restaurant Unified Ordering & Distance-Based Delivery Engine
- **Cross-Kitchen Unified Cart**: Diners can select dishes from multiple different restaurants (e.g. *Paradise Biryani* + *Third Wave Coffee*) in a single session without clearing their cart.
- **Dynamic Multi-Hop Haversine Distance Pricing**:
  - Calculates actual courier transit distance across all pickup spots to customer destination ($R_1 \to R_2 \to \text{Customer}$).
  - Transparent pricing formula: Base fee of ₹30 (covers up to 2.0 km) + ₹10/km for distance beyond 2.0 km + ₹25 multi-kitchen detour fee per additional restaurant.
  - Interactive Courier Route Visualizer right on the checkout screen.
- **Kitchen Isolation (Independent KDS Tickets)**:
  - When the unified order is authorized, linked child tickets are generated under a shared `groupOrderId`.
  - Paradise Kitchen receives *only* Biryani tickets; Third Wave Kitchen receives *only* Beverage tickets with separate kitchen chimes.
- **Synchronized Live Tracking & Combined GST Tax Invoices**:
  - Live customer tracking displays simultaneous cooking progress for both kitchens in real time.
  - Generates unified Multi-Vendor GST Tax Invoices itemized by kitchen.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, ES6 JavaScript modules, Lucide icons, responsive CSS (glassmorphism, mobile-first design system).
- **Audio & Print**: Web Audio API oscillator synthesis, `@media print` thermal & A4 invoice stylesheets.
- **Backend**: Node.js & Express.
- **Real-Time Sync**: HTML5 WebSockets (`ws` library) for instantaneous cross-device status broadcasts.
- **Database Engine**: Dual-Engine (Primary: Supabase PostgreSQL; Resilient Fallback: Local SQLite `sqlite3`).

---

## 📂 Project Structure

```text
├── api/
│   └── index.js       # Express server & API endpoints (reviews, orders, menu, tables)
├── database.js        # Dual-engine database adapter (Supabase health probe + SQLite fallback)
├── dinedirect.db      # Local SQLite database file (auto-created on startup)
├── state.js           # Central reactive state store & API sync
├── customer.js        # Customer views (Menu, Cart, Payment Sandbox, KOT/Tax Invoice, Reviews)
├── customer.css       # Styles for mobile-first customer UI, review cards, and invoices
├── owner.js           # Owner views (Dashboard, Reviews feed, KOT Print, Analytics)
├── owner.css          # Styles for owner management dashboard
├── kds.js             # Kitchen Display System (ticket lanes, thermal KOT modal, audio bell)
├── kds.css            # Styles for KDS and 80mm/58mm thermal print rules
├── vercel.json        # Vercel serverless deployment and rewrite configuration
├── package.json       # Node.js dependencies and scripts
└── images/            # High-resolution restaurant tour visuals
```

---

## 📥 Installation & Setup

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start the Server**:
   ```bash
   npm start
   ```
4. **Access the Application**:
   - Customer Portal: [http://localhost:3000/#customer/home](http://localhost:3000/#customer/home)
   - Table QR Simulation: [http://localhost:3000/?table=3&restaurantId=r1#customer/restaurant/r1](http://localhost:3000/?table=3&restaurantId=r1#customer/restaurant/r1)
   - Kitchen Display (KDS): [http://localhost:3000/#owner/kds](http://localhost:3000/#owner/kds)
   - Owner Dashboard: [http://localhost:3000/#owner/dashboard](http://localhost:3000/#owner/dashboard)

---

## 🧪 Simulation Walkthrough

1. **Place an Order with Payment Sandbox**:
   - Open [http://localhost:3000/#customer/home](http://localhost:3000/#customer/home), click **Paradise Biryani**, and add items to cart.
   - Go to Checkout (`#customer/cart`). Choose **Instant UPI** or **Card Sandbox**, review the 5% GST breakdown, and place the order.
2. **Kitchen Receives Order with Bell & KOT**:
   - In another browser tab, open [http://localhost:3000/#owner/kds](http://localhost:3000/#owner/kds).
   - Listen to the **audible kitchen bell chime** ringing upon ticket arrival!
   - Click **🖨️ KOT** on the ticket to preview the 80mm thermal receipt and trigger print.
3. **Advance Order to Served & Review**:
   - In KDS, click **Start Preparing**, then **Mark Ready**, then **Mark Served**.
   - Switch back to the customer tracking tab.
   - Click **📄 View GST Tax Invoice / Print Bill** to inspect the itemized tax receipt with CGST & SGST.
   - Fill out the **1–5 Star Food Review**, pick compliment chips (*😋 Delicious Taste*, *🔥 Hot & Fresh*), and tap **Submit Food Review**.
4. **Inspect Reviews on Owner Dashboard**:
   - Go to `#owner/dashboard` to view the new review dynamically reflected in **Guest Reviews & Ratings**!
