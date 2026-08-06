import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { adminApi } from '../../api';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setSettings((await adminApi.getSettings()).data.settings); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setNested = (group, key, value) => setSettings((s) => ({ ...s, [group]: { ...s[group], [key]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings({ delivery: settings.delivery, charges: settings.charges, features: settings.features, contact: settings.contact });
      toast.success('Settings saved');
    } catch {} finally { setSaving(false); }
  };

  if (loading || !settings) return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>;

  const num = (v) => Number(v);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Store Settings</h1>
        <Button onClick={save} isLoading={saving}><Save size={16} /> Save Changes</Button>
      </div>
      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="font-display font-bold text-lg mb-4">Delivery Charges</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block text-sm"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Base Charge (₹)</span><input type="number" className="input" value={settings.delivery.baseCharge} onChange={(e) => setNested('delivery', 'baseCharge', num(e.target.value))} /></label>
            <label className="block text-sm"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Per KM Charge (₹)</span><input type="number" className="input" value={settings.delivery.perKmCharge} onChange={(e) => setNested('delivery', 'perKmCharge', num(e.target.value))} /></label>
            <label className="block text-sm"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Free Delivery Above (₹)</span><input type="number" className="input" value={settings.delivery.freeDeliveryThreshold} onChange={(e) => setNested('delivery', 'freeDeliveryThreshold', num(e.target.value))} /></label>
            <label className="block text-sm"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Max Radius (km)</span><input type="number" className="input" value={settings.delivery.maxDeliveryRadiusKm} onChange={(e) => setNested('delivery', 'maxDeliveryRadiusKm', num(e.target.value))} /></label>
            <label className="block text-sm"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Estimated Prep (min)</span><input type="number" className="input" value={settings.delivery.estimatedPrepTimeMin} onChange={(e) => setNested('delivery', 'estimatedPrepTimeMin', num(e.target.value))} /></label>
            <label className="block text-sm"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Estimated Delivery (min)</span><input type="number" className="input" value={settings.delivery.estimatedDeliveryTimeMin} onChange={(e) => setNested('delivery', 'estimatedDeliveryTimeMin', num(e.target.value))} /></label>
          </div>
        </section>
        <section className="card p-6">
          <h2 className="font-display font-bold text-lg mb-4">Charges & Tax</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block text-sm"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Packaging Charge (₹)</span><input type="number" className="input" value={settings.charges.packagingCharge} onChange={(e) => setNested('charges', 'packagingCharge', num(e.target.value))} /></label>
            <label className="block text-sm"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Tax %</span><input type="number" className="input" value={settings.charges.taxPercent} onChange={(e) => setNested('charges', 'taxPercent', num(e.target.value))} /></label>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-display font-bold text-lg mb-4">Payment Methods</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.features.codEnabled} onChange={(e) => setNested('features', 'codEnabled', e.target.checked)} /> Cash on Delivery</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.features.razorpayEnabled} onChange={(e) => setNested('features', 'razorpayEnabled', e.target.checked)} /> Razorpay</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.features.stripeEnabled} onChange={(e) => setNested('features', 'stripeEnabled', e.target.checked)} /> Stripe</label>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-display font-bold text-lg mb-4">Contact Info</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Phone</span><input className="input" value={settings.contact.phone} onChange={(e) => setNested('contact', 'phone', e.target.value)} /></label>
            <label className="block text-sm"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Email</span><input className="input" value={settings.contact.email} onChange={(e) => setNested('contact', 'email', e.target.value)} /></label>
            <label className="block text-sm sm:col-span-2"><span className="text-ink-600 dark:text-ink-300 mb-1 block">Address</span><input className="input" value={settings.contact.address} onChange={(e) => setNested('contact', 'address', e.target.value)} /></label>
          </div>
        </section>
      </div>
    </div>
  );
}

