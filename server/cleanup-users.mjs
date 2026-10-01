// One-off production cleanup: keeps ONLY the three demo accounts
// (admin@ / user@ / delivery@foodhub.com) and removes every other user plus
// their orders, reviews and addresses. Catalogue data (foods, categories,
// coupons, settings) is never touched.
//
// Safety: writes a full JSON backup to BACKUP_FILE before deleting anything,
// and every delete is reported. Run `node cleanup-users.mjs --dry-run` first to
// preview exactly what would be removed.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const KEEP = ['admin@foodhub.com', 'user@foodhub.com', 'delivery@foodhub.com'];
const DRY_RUN = process.argv.includes('--dry-run');
const BACKUP_FILE = path.resolve('db-backup-' + new Date().toISOString().slice(0, 10) + '.json');

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

// ---------- 1. Decide what to remove ----------
const users = await db.collection('users').find({}).toArray();
const keepIds = users.filter((u) => KEEP.includes(u.email)).map((u) => u._id);
const dropUsers = users.filter((u) => !KEEP.includes(u.email));

console.log('users total   : ' + users.length);
console.log('keeping       : ' + keepIds.length);
console.log('removing      : ' + dropUsers.length);
for (const u of dropUsers) console.log('   - ' + u.email + '  (' + (u.role || 'user') + ')');

if (keepIds.length !== KEEP.length) {
  const missing = KEEP.filter((e) => !users.some((u) => u.email === e));
  console.error('\nABORT: these demo accounts do not exist, refusing to run: ' + missing.join(', '));
  process.exit(1);
}
if (dropUsers.length === 0) {
  console.log('\nNothing to remove — already clean.');
  await mongoose.disconnect();
  process.exit(0);
}

const dropIds = dropUsers.map((u) => u._id);

// ---------- 2. Backup ----------
if (!DRY_RUN) {
  const backup = {};
  for (const c of (await db.listCollections().toArray()).map((x) => x.name)) {
    backup[c] = await db.collection(c).find({}).toArray();
  }
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
  const size = (fs.statSync(BACKUP_FILE).size / 1024).toFixed(0);
  console.log('\nbackup written: ' + BACKUP_FILE + ' (' + size + ' KB)');
}

// ---------- 3. Delete dependent data ----------
// Orders/reviews/addresses reference a user by id. Everything else in the DB is
// catalogue data shared by the whole store and must be preserved.
const OWNED = ['orders', 'reviews', 'addresses', 'wishlists'];
const summary = {};

for (const c of OWNED) {
  const exists = (await db.listCollections({ name: c }).toArray()).length > 0;
  if (!exists) continue;
  const n = await db.collection(c).deleteMany({ user: { $in: dropIds } });
  if (n.deletedCount) summary[c] = n.deletedCount;
}

const delUsers = await db.collection('users').deleteMany({ _id: { $in: dropIds } });
summary.users = delUsers.deletedCount;

console.log('\n=== ' + (DRY_RUN ? 'DRY RUN — nothing deleted' : 'DELETED') + ' ===');
for (const [k, v] of Object.entries(summary)) console.log('  ' + k.padEnd(12) + v);

if (DRY_RUN) {
  console.log('\nRe-run without --dry-run to apply.');
} else {
  const after = await db.collection('users').find({}).select('email role').toArray();
  console.log('\n=== USERS REMAINING (' + after.length + ') ===');
  for (const u of after) console.log('  ' + u.email + '  (' + u.role + ')');
  const foods = await db.collection('foods').countDocuments({});
  const orders = await db.collection('orders').countDocuments({});
  console.log('\nmenu items intact: ' + foods + ' | orders now: ' + orders);
  console.log('restore with: node -e "/* restore from ' + path.basename(BACKUP_FILE) + ' */"');
}

await mongoose.disconnect();
