import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const CATEGORIES = [
  { name: 'Gaming PCs', description: 'Pre-built rigs tuned for high-refresh gaming.', image: img('photo-1587202372634-32705e3bf49c'), sortOrder: 1 },
  { name: 'Graphics Cards', description: 'Raw rendering muscle for every resolution.', image: img('photo-1591488320449-011701bb6704'), sortOrder: 2 },
  { name: 'Processors', description: 'The brains — multi-core CPUs for work and play.', image: img('photo-1555617981-dac3880eac6e'), sortOrder: 3 },
  { name: 'Memory & Storage', description: 'Fast DDR5 and NVMe that never makes you wait.', image: img('photo-1562976540-1502c2145186'), sortOrder: 4 },
  { name: 'Monitors', description: 'High-refresh, colour-accurate displays.', image: img('photo-1547082299-de196ea013d6'), sortOrder: 5 },
  { name: 'Peripherals', description: 'Keyboards, mice and audio that feel right.', image: img('photo-1527814050087-3793815479db'), sortOrder: 6 },
];

const PRODUCTS = {
  'Gaming PCs': [
    { name: 'Phantom X1 Gaming Rig', brand: 'Secret Labs', price: 189999, comparePrice: 209999, stock: 8, isFeatured: true, image: 'photo-1587202372634-32705e3bf49c',
      specs: [['CPU', 'Ryzen 7 9800X3D'], ['GPU', 'RTX 5080 16GB'], ['RAM', '32GB DDR5 6000'], ['Storage', '2TB NVMe Gen4']] },
    { name: 'Shadow Mini ITX', brand: 'Secret Labs', price: 124999, comparePrice: 0, stock: 5, isFeatured: true, image: 'photo-1593640408182-31c70c8268f5',
      specs: [['CPU', 'Core Ultra 7 265K'], ['GPU', 'RTX 5070 12GB'], ['RAM', '32GB DDR5'], ['Form factor', 'Mini-ITX 12L']] },
    { name: 'Eclipse Creator Workstation', brand: 'Secret Labs', price: 299999, comparePrice: 329999, stock: 3, image: 'photo-1624705002806-5d72df19c3ad',
      specs: [['CPU', 'Ryzen 9 9950X'], ['GPU', 'RTX 5090 32GB'], ['RAM', '96GB DDR5'], ['Storage', '4TB NVMe']] },
  ],
  'Graphics Cards': [
    { name: 'GeForce RTX 5080 Founders', brand: 'NVIDIA', price: 109999, comparePrice: 0, stock: 6, isFeatured: true, image: 'photo-1591488320449-011701bb6704',
      specs: [['VRAM', '16GB GDDR7'], ['Boost', '2.62 GHz'], ['TGP', '360W']] },
    { name: 'Radeon RX 9070 XT', brand: 'AMD', price: 64999, comparePrice: 69999, stock: 12, image: 'photo-1587202372775-e229f172b9d7',
      specs: [['VRAM', '16GB GDDR6'], ['Boost', '2.97 GHz'], ['TBP', '304W']] },
    { name: 'GeForce RTX 5070 Ti OC', brand: 'ASUS', price: 84999, comparePrice: 0, stock: 4, image: 'photo-1600861194942-f883de0dfe96',
      specs: [['VRAM', '16GB GDDR7'], ['Cooling', 'Triple fan'], ['Slots', '3.1']] },
  ],
  Processors: [
    { name: 'Ryzen 7 9800X3D', brand: 'AMD', price: 47999, comparePrice: 52999, stock: 15, isFeatured: true, image: 'photo-1555617981-dac3880eac6e',
      specs: [['Cores / Threads', '8 / 16'], ['Boost', '5.2 GHz'], ['Cache', '104MB'], ['Socket', 'AM5']] },
    { name: 'Core Ultra 9 285K', brand: 'Intel', price: 56999, comparePrice: 0, stock: 9, image: 'photo-1591799264318-7e6ef8ddb7ea',
      specs: [['Cores', '24 (8P + 16E)'], ['Boost', '5.7 GHz'], ['Socket', 'LGA 1851']] },
  ],
  'Memory & Storage': [
    { name: 'Vengeance RGB 32GB DDR5-6000', brand: 'Corsair', price: 10999, comparePrice: 12999, stock: 30, image: 'photo-1562976540-1502c2145186',
      specs: [['Kit', '2 × 16GB'], ['Latency', 'CL30'], ['Profile', 'EXPO / XMP']] },
    { name: '990 Pro 2TB NVMe', brand: 'Samsung', price: 15999, comparePrice: 0, stock: 2, isFeatured: true, image: 'photo-1597872200969-2b65d56bd16b',
      specs: [['Interface', 'PCIe 4.0 x4'], ['Read', '7,450 MB/s'], ['Write', '6,900 MB/s']] },
  ],
  Monitors: [
    { name: 'Odyssey OLED G8 34"', brand: 'Samsung', price: 89999, comparePrice: 99999, stock: 7, isFeatured: true, image: 'photo-1547082299-de196ea013d6',
      specs: [['Panel', 'QD-OLED 3440×1440'], ['Refresh', '175 Hz'], ['Response', '0.03 ms']] },
    { name: 'UltraGear 27" 240Hz', brand: 'LG', price: 32999, comparePrice: 0, stock: 11, image: 'photo-1586210579191-33b45e38fa2c',
      specs: [['Panel', 'IPS 2560×1440'], ['Refresh', '240 Hz'], ['HDR', 'HDR400']] },
  ],
  Peripherals: [
    { name: 'Apex Pro TKL Keyboard', brand: 'SteelSeries', price: 18999, comparePrice: 21999, stock: 20, image: 'photo-1527814050087-3793815479db',
      specs: [['Switches', 'OmniPoint 2.0 adjustable'], ['Layout', 'Tenkeyless']] },
    { name: 'Viper V3 Pro Mouse', brand: 'Razer', price: 13999, comparePrice: 0, stock: 1, image: 'photo-1527864550417-7fd91fc51a46',
      specs: [['Weight', '54 g'], ['Sensor', 'Focus Pro 35K'], ['Polling', '8000 Hz']] },
    { name: 'Arctis Nova Pro Wireless', brand: 'SteelSeries', price: 29999, comparePrice: 34999, stock: 6, image: 'photo-1618366712010-f4ae9c647dcb',
      specs: [['Drivers', '40 mm neodymium'], ['ANC', 'Yes'], ['Battery', 'Hot-swap']] },
  ],
};

const ADDRESS = {
  fullName: 'Aarav Sharma', phone: '9876543210', line1: '42 MG Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India',
};

export async function seedData({ wipe = false } = {}) {
  if (wipe) {
    await Promise.all([User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({}), Order.deleteMany({})]);
  }

  const admin = await User.create({
    name: 'Shop Admin',
    email: process.env.ADMIN_EMAIL || 'admin@thesecretshop.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin',
  });
  const customer = await User.create({ name: 'Aarav Sharma', email: 'demo@thesecretshop.com', password: 'demo123' });

  const products = [];
  for (const c of CATEGORIES) {
    const category = await Category.create(c);
    for (const p of PRODUCTS[c.name] || []) {
      products.push(
        await Product.create({
          name: p.name,
          brand: p.brand,
          category: category._id,
          price: p.price,
          comparePrice: p.comparePrice,
          stock: p.stock,
          isFeatured: Boolean(p.isFeatured),
          images: [img(p.image)],
          specs: p.specs.map(([label, value]) => ({ label, value })),
          description: `${p.name} by ${p.brand}. Hand-picked, bench-tested and backed by The Secret Shop's 2-year warranty.`,
        })
      );
    }
  }

  // Sample orders across the last two weeks so the dashboard has something to show.
  const statuses = ['delivered', 'delivered', 'shipped', 'processing', 'pending', 'pending', 'cancelled', 'delivered', 'processing', 'shipped'];
  for (let i = 0; i < statuses.length; i++) {
    const picks = [products[(i * 3) % products.length], products[(i * 5 + 1) % products.length]];
    const items = picks.map((p, k) => ({ product: p._id, name: p.name, image: p.images[0], price: p.price, quantity: k + 1 }));
    const itemsTotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const tax = Math.round(itemsTotal * 0.18);
    const createdAt = new Date(Date.now() - (i * 1.3 + 0.2) * 86400000);
    const status = statuses[i];
    await Order.create({
      user: customer._id,
      items,
      shippingAddress: ADDRESS,
      paymentMethod: i % 3 === 0 ? 'upi' : 'cod',
      isPaid: status === 'delivered' || i % 3 === 0,
      itemsTotal,
      shippingFee: 0,
      tax,
      grandTotal: itemsTotal + tax,
      status,
      statusHistory: [{ status: 'pending', note: 'Order placed', at: createdAt }, ...(status !== 'pending' ? [{ status, at: createdAt }] : [])],
      createdAt,
    });
  }

  console.log(`✔  Seeded: ${CATEGORIES.length} categories, ${products.length} products, ${statuses.length} orders`);
  console.log(`   Admin login:    ${admin.email} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  console.log('   Customer login: demo@thesecretshop.com / demo123');
}

export async function seedIfEmpty() {
  if (await User.exists({})) return;
  await seedData();
}

// `npm run seed` — wipes and re-seeds the database in MONGO_URI.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { connectDB, disconnectDB } = await import('./config/db.js');
  if (!process.env.MONGO_URI) {
    console.log('No MONGO_URI set — the in-memory DB is seeded automatically when the server starts. Nothing to do.');
    process.exit(0);
  }
  await connectDB();
  await seedData({ wipe: true });
  await disconnectDB();
}
