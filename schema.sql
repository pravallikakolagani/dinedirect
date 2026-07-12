-- Create Restaurants Table
CREATE TABLE restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    password TEXT NOT NULL,
    cuisines TEXT,
    rating TEXT,
    "deliveryTime" TEXT,
    "deliveryFee" TEXT,
    ambience TEXT,
    description TEXT,
    latitude REAL,
    longitude REAL
);

-- Create Menu Items Table
CREATE TABLE menu_items (
    id TEXT PRIMARY KEY,
    "restaurantId" TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    "desc" TEXT,
    category TEXT,
    type TEXT,
    img TEXT
);

-- Create Tables Table
CREATE TABLE tables (
    "restaurantId" TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    num TEXT NOT NULL,
    status TEXT NOT NULL,
    "isReservable" INTEGER DEFAULT 1,
    PRIMARY KEY ("restaurantId", num)
);

-- Create Orders Table
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    "restaurantId" TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    "tableNum" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    timestamp BIGINT NOT NULL
);

-- Create Order Items Table
CREATE TABLE order_items (
    "orderId" TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    "itemId" TEXT NOT NULL,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price REAL NOT NULL,
    PRIMARY KEY ("orderId", "itemId")
);

-- Create Support Alerts Table
CREATE TABLE support_alerts (
    id TEXT PRIMARY KEY,
    "restaurantId" TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    "tableNum" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    timestamp BIGINT NOT NULL
);

-- Create Chat Messages Table
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    "restaurantId" TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    "tableNum" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp BIGINT NOT NULL
);
