const axios = require('axios');
const API = 'http://localhost:5000/api';

let pass = 0, fail = 0;
const results = [];
function ok(name) { pass++; results.push('  ✅ ' + name); }
function bad(name, err) { fail++; results.push('  ❌ ' + name + ' — ' + (err?.response?.data?.message || err?.message || err)); }

async function req(method, url, data, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const r = await axios({ method, url: API + url, data, headers, validateStatus: () => true });
  return r;
}

async function main() {
  console.log('=== FOODHUB FULL TEST SUITE ===\n');

  // ---- Public endpoints ----
  try {
    console.log('PUBLIC API');
    const health = await axios({ method: 'get', url: 'http://localhost:5000/health', validateStatus: () => true });
    health.data.success ? ok('GET /health') : bad('GET /health');

    const cats = await req('get', '/categories');
    cats.data.success && cats.data.data.categories.length ? ok(`GET /categories (${cats.data.data.categories.length})`) : bad('GET /categories');

    const feat = await req('get', '/featured');
    feat.data.success && feat.data.data.bestsellers ? ok('GET /featured') : bad('GET /featured');

    const foods = await req('get', '/foods?limit=12');
    foods.data.success && foods.data.data.items.length ? ok(`GET /foods (${foods.data.data.items.length})`) : bad('GET /foods');
    const foodsSearch = await req('get', '/foods?search=burger');
    foodsSearch.data.success ? ok('GET /foods?search=') : bad('GET /foods?search=');
    const foodsVeg = await req('get', '/foods?isVeg=true');
    foodsVeg.data.success ? ok('GET /foods?isVeg=true') : bad('GET /foods?isVeg=true');
    const foodsSort = await req('get', '/foods?sort=popular');
    foodsSort.data.success ? ok('GET /foods?sort=popular') : bad('GET /foods?sort=popular');
    const foodsPage = await req('get', '/foods?page=2&limit=4');
    foodsPage.data.success ? ok('GET /foods pagination') : bad('GET /foods pagination');

    const slug = foods.data.data.items[0].slug;
    const detail = await req('get', `/foods/${slug}`);
    detail.data.success ? ok(`GET /foods/:slug (${slug})`) : bad('GET /foods/:slug');

    const reviews = await req('get', `/reviews/${foods.data.data.items[0]._id}`);
    reviews.data.success ? ok('GET /reviews/:foodId') : bad('GET /reviews/:foodId');
  } catch (e) { bad('public group', e); }

  // ---- Guest protections ----
  try {
    console.log('\nAUTH GUARDS');
    const w = await req('get', '/wishlist'); w.status === 401 ? ok('Wishlist requires auth') : bad('Wishlist requires auth', 'status ' + w.status);
    const o = await req('get', '/orders/me'); o.status === 401 ? ok('Orders requires auth') : bad('Orders requires auth', 'status ' + o.status);
    const a = await req('get', '/admin/stats'); a.status === 401 ? ok('Admin requires auth') : bad('Admin requires auth', 'status ' + a.status);
    const d = await req('get', '/delivery/deliveries'); d.status === 401 ? ok('Delivery requires auth') : bad('Delivery requires auth', 'status ' + d.status);
  } catch (e) { bad('auth guards', e); }

  // ---- Customer journey ----
  let customerToken;
  try {
    console.log('\nCUSTOMER');
    const email = 'uitest' + Date.now() + '@test.com';
    const reg = await req('post', '/auth/register', { name: 'UI Test', email, password: 'Test123!', phone: '9876543210' });
    reg.data.success ? ok('POST /auth/register') : bad('POST /auth/register', reg.data.message);
    customerToken = reg.data.data.tokens.accessToken;

    const login = await req('post', '/auth/login', { email, password: 'Test123!' });
    login.data.success ? ok('POST /auth/login') : bad('POST /auth/login', login.data.message);
    const me = await req('get', '/auth/me', null, customerToken);
    me.data.success ? ok('GET /auth/me') : bad('GET /auth/me');

    const f = await req('get', '/foods?limit=5');
    const food = f.data.data.items[0];

    const w = await req('post', `/wishlist/${food._id}`, {}, customerToken);
    w.data.success ? ok('POST /wishlist/:id') : bad('POST /wishlist/:id', w.data.message);
    const wl = await req('get', '/wishlist', null, customerToken);
    wl.data.success && wl.data.data.wishlist.length ? ok('GET /wishlist') : bad('GET /wishlist');

    const addr = await req('post', '/addresses', { label: 'Home', line1: '123 Test St', city: 'Mumbai', state: 'MH', pincode: '400001', phone: '9876543210' }, customerToken);
    addr.data.success ? ok('POST /addresses') : bad('POST /addresses', addr.data.message);
    const addrId = addr.data.data.addresses.at(-1)._id;
    const addrs = await req('get', '/addresses', null, customerToken);
    addrs.data.success && addrs.data.data.addresses.length ? ok('GET /addresses') : bad('GET /addresses');

    const prev = await req('post', '/orders/preview', { items: [{ food: food._id, quantity: 2 }], couponCode: '' }, customerToken);
    prev.data.success && Number.isFinite(prev.data.data.grandTotal) ? ok('POST /orders/preview → ' + prev.data.data.grandTotal) : bad('POST /orders/preview', prev.data.message);

    const order = await req('post', '/orders', { items: [{ food: food._id, quantity: 2 }], addressId: addrId, paymentMethod: 'cod' }, customerToken);
    order.data.success ? ok('POST /orders (COD) → ' + order.data.data.order.orderNumber) : bad('POST /orders', order.data.message);

    const myOrders = await req('get', '/orders/me', null, customerToken);
    myOrders.data.success ? ok('GET /orders/me') : bad('GET /orders/me');
    const orderDetail = await req('get', `/orders/${order.data.data.order._id}`, null, customerToken);
    orderDetail.data.success ? ok('GET /orders/:id') : bad('GET /orders/:id');

    const cupon = await req('get', '/admin/coupons', null, customerToken);
    if (cupon.status === 403) ok('Customer blocked from admin (403)'); else bad('Customer blocked from admin', 'status ' + cupon.status);
  } catch (e) { bad('customer group', e); }

  // ---- Admin ----
  let adminToken;
  try {
    console.log('\nADMIN');
    const login = await req('post', '/auth/login', { email: 'admin@foodhub.com', password: 'Admin@123' });
    if (!login.data.success) throw new Error('admin login: ' + login.data.message);
    adminToken = login.data.data.tokens.accessToken;
    ok('Admin login');

    const stats = await req('get', '/admin/stats', null, adminToken);
    stats.data.success ? ok('GET /admin/stats') : bad('GET /admin/stats', stats.data.message);
    const rev = await req('get', '/admin/revenue?days=30', null, adminToken);
    rev.data.success ? ok('GET /admin/revenue') : bad('GET /admin/revenue', rev.data.message);
    const top = await req('get', '/admin/top-foods', null, adminToken);
    top.data.success ? ok('GET /admin/top-foods') : bad('GET /admin/top-foods', top.data.message);
    const cat = await req('get', '/admin/category-stats', null, adminToken);
    cat.data.success ? ok('GET /admin/category-stats') : bad('GET /admin/category-stats', cat.data.message);
    const foods = await req('get', '/admin/foods', null, adminToken);
    foods.data.success ? ok('GET /admin/foods') : bad('GET /admin/foods', foods.data.message);
    const cats = await req('get', '/admin/categories', null, adminToken);
    cats.data.success ? ok('GET /admin/categories') : bad('GET /admin/categories', cats.data.message);
    const cups = await req('get', '/admin/coupons', null, adminToken);
    cups.data.success ? ok('GET /admin/coupons') : bad('GET /admin/coupons', cups.data.message);
    const aorders = await req('get', '/admin/orders', null, adminToken);
    aorders.data.success ? ok('GET /admin/orders') : bad('GET /admin/orders', aorders.data.message);
    const users = await req('get', '/admin/users', null, adminToken);
    users.data.success ? ok('GET /admin/users') : bad('GET /admin/users', users.data.message);
    const arevs = await req('get', '/admin/reviews', null, adminToken);
    arevs.data.success ? ok('GET /admin/reviews') : bad('GET /admin/reviews', arevs.data.message);
    const settings = await req('get', '/admin/settings', null, adminToken);
    settings.data.success ? ok('GET /admin/settings') : bad('GET /admin/settings', settings.data.message);
  } catch (e) { bad('admin group', e); }

  // ---- Delivery ----
  let deliveryToken;
  try {
    console.log('\nDELIVERY');
    const login = await req('post', '/auth/login', { email: 'delivery@foodhub.com', password: 'Delivery@123' });
    if (!login.data.success) throw new Error('delivery login: ' + login.data.message);
    deliveryToken = login.data.data.tokens.accessToken;
    ok('Delivery login');

    const dlv = await req('get', '/delivery/deliveries', null, deliveryToken);
    dlv.data.success ? ok('GET /delivery/deliveries') : bad('GET /delivery/deliveries', dlv.data.message);
    const earn = await req('get', '/delivery/earnings', null, deliveryToken);
    earn.data.success ? ok('GET /delivery/earnings') : bad('GET /delivery/earnings', earn.data.message);

    const asAdmin = await req('get', '/admin/stats', null, deliveryToken);
    asAdmin.status === 403 ? ok('Delivery blocked from admin (403)') : bad('Delivery blocked from admin', 'status ' + asAdmin.status);
  } catch (e) { bad('delivery group', e); }

  console.log('\n\n=== RESULTS ===');
  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
