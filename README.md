# The Secret Shop

MERN e-commerce store for PC hardware. The storefront is scroll-driven and editorial, built with GSAP ScrollTrigger and Lenis smooth scroll. The admin panel covers the dashboard, orders, categories and products.

## Quick start

```bash
npm run install:all      # installs root, server and client deps
npm run dev              # API on :5000, web on :5173
```

Open http://localhost:5173.

If `server/.env` has no `MONGO_URI`, the API starts an **in-memory MongoDB** and seeds it. Data resets on every restart. To keep data, copy `server/.env.example` to `server/.env`, set `MONGO_URI` (Atlas or local) and `JWT_SECRET`, then run `npm run seed` once.

| Role     | Email                     | Password |
|----------|---------------------------|----------|
| Admin    | admin@thesecretshop.com   | admin123 |
| Customer | demo@thesecretshop.com    | demo123  |

## Production

```bash
npm run build                          # builds client/dist
NODE_ENV=production npm start          # Express serves API + built client
```

## Structure

```
server/src
  models/      User, Category, Product, Order
  routes/      auth, categories, products, orders, admin (stats), upload
  middleware/  JWT auth + admin guard, error handling
  seed.js      demo data (categories, products, orders)
client/src
  pages/       Home, Shop, Product, Checkout, Auth, MyOrders, OrderDetail
  pages/admin  Dashboard, Orders, Categories, Products
  hooks/       useSmoothScroll (Lenis⇄GSAP), useReveal (scroll reveals/parallax)
  components/  Cursor, Preloader, Magnetic, Header, Footer, CartDrawer, …
```

## Scroll effects (home page)

- Preloader: a counter runs to 100, then a curtain wipe.
- Hero: the letters stagger in. The section then pins while the image expands from a card to full screen.
- Marquee: two rows that speed up with scroll velocity.
- Manifesto: words light up as they are scrolled through.
- Category rail: a pinned horizontal scroll with a parallax image in each card.
- "Anatomy of a build": a pinned section with step crossfades, a rotating ring and a counter.
- Product grid: columns drift at different speeds.
- Below that: counters that run on view, and a closing line that fills with colour as you scroll.
- Throughout: a footer that reveals from underneath, a custom cursor, magnetic buttons, a curtain transition on route change and a header that hides on scroll.
- All of this is turned off when `prefers-reduced-motion` is set.

## Order rules

- Stock is reserved atomically when an order is placed, and returned when an order is cancelled (by the customer while pending, or by an admin).
- Status flow: `pending → processing → shipped → delivered`. Cancelling is allowed from pending or processing. A delivered COD order is automatically marked paid.
- Prices are in INR, with 18% GST. Shipping is free over ₹50,000, otherwise ₹499.
