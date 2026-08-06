const BASE = 'http://localhost:5000/api';

async function req(method, path, body, cookie = '') {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, setCookie: res.headers.get('set-cookie') || '' };
}

const P = [];
const results = [];
function check(name, cond, info = '') {
  results.push({ name, ok: !!cond, info });
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${name}${info ? ' => ' + info : ''}`);
}

async function run() {
  console.log('=== 1. Public APIs ===');
  let r = await fetch('http://localhost:5000/health').then((res) => ({ status: res.status })).catch(() => ({ status: 0 }));
  check('health', r.status === 200);
  r = await req('GET', '/categories');
  check('categories', r.status === 200 && r.json.data.categories.length === 8, `count=${r.json?.data?.categories?.length}`);
  r = await req('GET', '/foods', null);
  check('foods', r.status === 200 && r.json.data.items?.length === 8, `count=${r.json?.data?.items?.length}`);
  r = await req('GET', '/featured');
  check('featured', r.status === 200);
  const foods = r.json || (await req('GET', '/foods')).json;
  let allFoods = await req('GET', '/foods', null);
  const first = allFoods.json.data.items[0];
  r = await req('GET', '/foods/' + first.slug);
  check('food-detail', r.status === 200 && r.json.data?.food, `slug=${first.slug}`);

  console.log('=== AUTH: register ===');
  const email = 'user' + Date.now() + '@test.com';
  r = await req('POST', '/auth/register', { name: 'Journey Tester', email, password: 'Test@1234', phone: '9999999999', role: 'user' });
  check('register', r.status === 201 && r.json.data?.user, r.json?.message);
  let ck = r.setCookie;
  const userTokens = r.json.data?.tokens;

  console.log('=== AUTH: login demo user (separate check) ===');
  r = await req('POST', '/auth/login', { email: 'user@foodhub.com', password: 'User@123' });
  check('login-demo', r.status === 200 && r.json.data?.user?.role === 'user', r.json?.message);

  console.log('=== USER: me ===');
  r = await req('GET', '/auth/me', null, ck);
  check('me', r.status === 200 && r.json.data?.user, r.json?.message);
  const userId = r.json.data.user._id;

  console.log('=== ADDRESSES ===');
  r = await req('POST', '/addresses', { label: 'Home', line1: 'Test Street 123', city: 'Mumbai', state: 'MH', pincode: '400001', phone: '9999999999' }, ck);
  check('add-address', r.status === 201 && r.json.data?.addresses?.length === 1, r.json?.message);
  const addrId = r.json.data.addresses[0]._id;
  r = await req('GET', '/addresses', null, ck);
  check('get-addresses', r.status === 200 && r.json.data?.addresses?.length === 1, r.json?.message);

  console.log('=== WISHLIST ===');
  r = await req('POST', '/wishlist/' + first._id, null, ck);
  check('toggle-wishlist', r.status === 200 && r.json.data?.inWishlist === true, r.json?.message);

  console.log('=== ORDER PREVIEW ===');
  const items = [{ food: first._id, quantity: 2 }];
  r = await req('POST', '/orders/preview', { items }, ck);
  check('preview', r.status === 200 && r.json.data?.subTotal > 0, JSON.stringify(r.json?.data?.subTotal));
  const subTotal = r.json.data.subTotal;

  console.log('=== COUPON APPLY ===');
  const couponCode = subTotal >= 300 ? 'FLAT50' : 'WELCOME10';
  r = await req('POST', '/orders/coupon/apply', { code: couponCode, subTotal }, ck);
  check('apply-coupon', r.status === 200 && r.json.data?.discount > 0, `${couponCode} disc=${r.json?.data?.discount}`);

  console.log('=== CREATE ORDER: COD ===');
  r = await req('POST', '/orders', { items, addressId: addrId, paymentMethod: 'cod', couponCode }, ck);
  check('create-order-cod', r.status === 201 && r.json.data?.order?.orderNumber, r.json?.message);
  const orderNumber = r.json.data?.order?.orderNumber;
  const orderId = r.json.data?.order?._id;

  console.log('=== CREATE ORDER: invalid payment method (card/upi) ===');
  r = await req('POST', '/orders', { items, addressId: addrId, paymentMethod: 'card' }, ck);
  check('reject-invalid-payment', r.status === 400, `status=${r.status} ${JSON.stringify(r.json?.message)}`);

  console.log('=== MY ORDERS ===');
  r = await req('GET', '/orders/me', null, ck);
  check('my-orders', r.status === 200 && r.json.data?.items?.length >= 1, `count=${r.json?.data?.items?.length}`);

  console.log('=== ORDER DETAIL ===');
  r = await req('GET', '/orders/' + orderNumber, null, ck);
  check('order-detail', r.status === 200 && r.json.data?.order?.orderNumber === orderNumber, r.json?.message);

  console.log('=== CANCEL ORDER + RESTOCK ===');
  r = await req('POST', '/orders/' + orderId + '/cancel', { reason: 'test cancel' }, ck);
  check('cancel-order', r.status === 200 && r.json.data?.order?.status === 'cancelled', r.json?.message);

  console.log('=== ADMIN LOGIN ===');
  r = await req('POST', '/auth/login', { email: 'admin@foodhub.com', password: 'Admin@123' });
  check('admin-login', r.status === 200 && r.json.data?.user?.role === 'admin');
  const adminCk = r.setCookie;

  console.log('=== ADMIN APIs ===');
  r = await req('GET', '/admin/stats', null, adminCk);
  check('admin-stats', r.status === 200 && r.json.data, r.json?.message);
  r = await req('GET', '/admin/orders', null, adminCk);
  check('admin-orders', r.status === 200 && r.json.data?.items, r.json?.message);
  r = await req('GET', '/admin/revenue?days=30', null, adminCk);
  check('admin-revenue', r.status === 200, r.json?.message);
  r = await req('GET', '/admin/top-foods', null, adminCk);
  check('admin-top-foods', r.status === 200, r.json?.message);
  r = await req('GET', '/admin/categories', null, adminCk);
  check('admin-categories', r.status === 200 && r.json.data?.categories?.length === 8, r.json?.message);
  r = await req('GET', '/admin/coupons', null, adminCk);
  check('admin-coupons', r.status === 200 && r.json.data?.coupons?.length === 3, r.json?.message);
  r = await req('GET', '/admin/users', null, adminCk);
  check('admin-users', r.status === 200, r.json?.message);
  r = await req('GET', '/admin/settings', null, adminCk);
  check('admin-settings', r.status === 200 && r.json.data?.settings, r.json?.message);

  console.log('=== ACCESS CONTROL: user cannot access admin ===');
  r = await req('GET', '/admin/stats', null, ck);
  check('user-forbidden-admin', r.status === 403, `status=${r.status}`);

  console.log('=== DELIVERY LOGIN + APIs ===');
  r = await req('POST', '/auth/login', { email: 'delivery@foodhub.com', password: 'Delivery@123' });
  check('delivery-login', r.status === 200 && r.json.data?.user?.role === 'delivery');
  const delCk = r.setCookie;
  r = await req('GET', '/delivery/earnings', null, delCk);
  check('delivery-earnings', r.status === 200, r.json?.message);

  console.log('=== ADMIN assigns delivery + deliver via OTP ===');
  // Find a pending order to work with
  r = await req('GET', '/admin/orders?status=confirmed', null, adminCk);
  let targetOrder;
  if (r.json.data?.items?.length) {
    targetOrder = r.json.data.items[0];
  } else {
    // create a confirmed order path: set first order to confirmed via admin
    // Use cancelled order? create a new one instead. Just pick an existing one and signal.
    r = await req('GET', '/admin/orders', null, adminCk);
    targetOrder = r.json.data?.items?.find(o => o.status === 'pending') || r.json.data?.items?.[0];
  }
  if (targetOrder) {
    const oid = targetOrder._id;
    r = await req('PATCH', '/admin/orders/' + oid + '/status', { status: 'out_for_delivery' }, adminCk);
    check('admin-set-outfordelivery', r.status === 200, r.json?.message);
    r = await req('POST', '/admin/orders/' + oid + '/assign', { deliveryPartnerId: (await req('GET', '/admin/users?role=delivery', null, adminCk)).json.data.items[0]._id }, adminCk);
    check('admin-assign-delivery', r.status === 200, r.json?.message);
    r = await req('GET', '/delivery/deliveries', null, delCk);
    check('delivery-assigned-visible', r.status === 200, r.json?.message);
  } else {
    check('delivery-flow orders available', false, 'no orders to assign');
  }

  const passed = results.filter((x) => x.ok).length;
  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n===== TOTALS =====`);
  console.log(`PASS: ${passed}  FAIL: ${failed}  TOTAL: ${results.length}`);
  process.exit(failed ? 1 : 0);
}

run().catch((e) => { console.error('SCRIPT ERROR:', e); process.exit(1); });