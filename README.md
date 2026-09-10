# CanvasBag Bangladesh — Next.js 16.3.4 Production Platform

Modern, ultra-fast e-commerce platform built for **CanvasBag Bangladesh** using Next.js 16 App Router, Turbopack, Tailwind CSS v4, Dual-Write Database architecture, Cloudflare R2 Media Storage, and real-time live order tracking.

---

## 🚀 Key Features

- **Next.js 16.3.4 App Router**: Lightning-fast Server Components, edge routing, and streaming SSR.
- **Shopify-Style Admin CMS**: Complete catalog management, categories, landing pages, reviews, support messages, and fulfillment orders.
- **Cloudflare R2 Media Library**: Integrated asset picker with automatic WebP 90% compression and instant insertion.
- **Dual-Database Architecture**:
  - **Remote Supabase Cloud (PostgreSQL)**: Central CRM & call center database for orders (`orders` table).
  - **Local SQLite Fallback**: High-speed, fail-safe local database (`database/database.sqlite`).
  - **Catalog DB**: Scalable catalog documents for products (`cb_products`), categories (`cb_categories`), and site settings (`cb_settings`).
- **Live Customer Order Tracking (`/track`)**:
  - Real-time 5-stage timeline with 25-second live auto-polling.
  - Track with **Phone Number Only** (e.g. `01540400247`) or Order ID.
  - Multi-order quick switcher for customers with repeated orders.
- **DB Product Name / Custom SKU**: Map internal warehouse / call center codes (e.g. `LTB-2`) directly into the orders database at checkout.
- **Conversion-Optimized Checkout**: Seamless Cash on Delivery (COD) in Bangladesh with Meta Conversions API (CAPI) server-side event tracking.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16.3.4](https://nextjs.org) (Turbopack, App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Databases**: Supabase (PostgreSQL), SQLite (`better-sqlite3`)
- **Storage**: Cloudflare R2 (S3-compatible) via AWS SDK v3
- **Analytics**: Meta Conversions API (CAPI), Google Analytics 4, Facebook Pixel

---

## 📦 Vercel Deployment Instructions

### 1. Import Repository
Import this repository into your [Vercel Dashboard](https://vercel.com/new).

### 2. Configure Environment Variables
In **Project Settings → Environment Variables**, add the following keys from `.env.example`:

```env
SUPABASE_CATALOG_URL=http://supabasekong-a5tg2fvpwj6emkewfdknamid.187.77.159.209.sslip.io
SUPABASE_CATALOG_KEY=your_catalog_jwt_key
SUPABASE_ORDERS_URL=https://drbpysumezfjbudxzxzj.supabase.co
SUPABASE_ORDERS_KEY=your_orders_jwt_key
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=images-for-canvas
R2_PUBLIC_URL=https://pub-c87cf7c070ae4a08a702a89ea3340662.r2.dev
```

### 3. Deploy
Click **Deploy**. Next.js will build with Turbopack and deploy to Vercel's global edge network.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000` to preview the storefront, or `http://localhost:3000/admin` for the admin portal.

---

## 📄 License
Private commercial software for CanvasBag Bangladesh. All rights reserved.
