// Removes every live account except the three demo accounts, using the
// admin API on the deployed site (which holds the production database).
//
// Deletes one user at a time so each step is visible and a partial run can be
// resumed. Safe to re-run: accounts that are already gone are skipped.
const B = 'https://foodhub-pearl-tau.vercel.app';
const KEEP = ['admin@foodhub.com', 'user@foodhub.com', 'delivery@foodhub.com'];

async function api(path, opts = {}, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(B + path, opts);
      return { status: r.status, body: await r.json() };
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
}

const login = await api('/api/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'admin@foodhub.com', password: 'Admin@123' }),
});
const token = login.body?.data?.tokens?.accessToken;
if (!token) {
  console.log('LOGIN FAILED:', JSON.stringify(login.body).slice(0, 200));
  process.exit(1);
}
const H = { 'content-type': 'application/json', authorization: 'Bearer ' + token };
console.log('logged in as admin\n');

const list = await api('/api/admin/users?limit=200', { headers: H });
const users = list.body?.data?.items || [];
const extras = users.filter((u) => !KEEP.includes(u.email));

console.log('users on live site : ' + users.length);
console.log('to remove          : ' + extras.length);
console.log('to keep            : ' + users.filter((u) => KEEP.includes(u.email)).map((u) => u.email).join(', ') + '\n');

let removed = 0, orders = 0, failed = 0;
for (const u of extras) {
  const r = await api('/api/admin/users/' + u._id, { method: 'DELETE', headers: H });
  if (r.status === 200) {
    removed++;
    orders += r.body?.data?.deletedOrders || 0;
    console.log('  removed  ' + u.email + (r.body?.data?.deletedOrders ? '  (+' + r.body.data.deletedOrders + ' orders)' : ''));
  } else if (r.status === 404) {
    console.log('  skipped  ' + u.email + '  (already gone)');
  } else {
    failed++;
    console.log('  FAILED   ' + u.email + '  -> ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 120));
  }
}

console.log('\n=== SUMMARY ===');
console.log('users removed : ' + removed);
console.log('orders removed: ' + orders);
console.log('failures      : ' + failed);

const after = await api('/api/admin/users?limit=200', { headers: H });
const left = after.body?.data?.items || [];
console.log('\nusers remaining: ' + left.length);
for (const u of left) console.log('  - ' + u.email + '  (' + u.role + ')');

const ordersLeft = await api('/api/admin/orders?limit=200', { headers: H });
console.log('orders remaining: ' + (ordersLeft.body?.data?.items || []).length);
