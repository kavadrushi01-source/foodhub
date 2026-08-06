import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Banknote, CreditCard, ShieldCheck, Plus, Loader2 } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { orderApi, foodApi, paymentApi } from '../api';
import { openRazorpayCheckout } from '../utils/razorpay';
import { formatCurrency } from '../utils/format';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart, coupon } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' });

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await foodApi.getAddresses();
      setAddresses(res.data.addresses);
      const def = res.data.addresses.find((a) => a.isDefault) || res.data.addresses[0];
      if (def) setSelectedAddress(def._id);
    } catch (err) {
      console.error('Failed to load addresses:', err);
      toast.error('Failed to load addresses');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const loadPreview = async () => {
    if (!items.length) {
      setLoadingPreview(false);
      return;
    }
    setLoadingPreview(true);
    try {
      const res = await orderApi.preview({ items: items.map((i) => ({ food: i.food._id, quantity: i.quantity })), couponCode: coupon?.code || '' });
      setPreview(res.data);
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      return;
    }
    loadAddresses();
    paymentApi
      .getConfig()
      .then((res) => {
        const cfg = res.data;
        setPaymentConfig(cfg);
        if (cfg.methods.length && !cfg.methods.includes(paymentMethod)) {
          setPaymentMethod(cfg.methods[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPayment(false));
  }, [isAuthenticated]);

  useEffect(() => { loadPreview(); }, [items, coupon]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await foodApi.addAddress(addressForm);
      setAddresses(res.data.addresses);
      setSelectedAddress(res.data.addresses[res.data.addresses.length - 1]._id);
      setIsNewAddress(false);
      setAddressForm({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' });
      toast.success('Address saved');
    } catch (err) {
      console.error('Failed to save address:', err);
      toast.error('Failed to save address');
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress && !isNewAddress) {
      toast.error('Please select or add a delivery address');
      return;
    }
    setPlacing(true);
    try {
      const payload = { items: items.map((i) => ({ food: i.food._id, quantity: i.quantity })), paymentMethod, couponCode: coupon?.code || '' };
      if (isNewAddress) payload.address = addressForm;
      else payload.addressId = selectedAddress;
      const res = await orderApi.create(payload);
      const order = res.data.order;

      // Cash on Delivery completes immediately.
      if (paymentMethod === 'cod') {
        clearCart();
        toast.success('Order placed successfully!');
        navigate('/orders/' + order.orderNumber);
        return;
      }

      // Online payments: create a Razorpay order, open Checkout, verify signature.
      try {
        const rzpRes = await paymentApi.createOrder(order._id);
        const d = rzpRes.data;
        const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(window.navigator.userAgent || '');
        const payment = await openRazorpayCheckout({
          key: d.keyId,
          amount: d.amount,
          currency: d.currency,
          orderId: d.orderId,
          name: 'FoodHub',
          description: `Order ${order.orderNumber}`,
          prefill: { name: d.name, email: d.email, contact: d.contact },
          // UPI intent auto-opens Google Pay / PhonePe / Paytm on mobile for a
          // one-tap UPI payment; desktop falls back to the UPI form.
          method: paymentMethod === 'upi' && isMobile ? { upi: { flow: 'intent' } } : null,
          hideMethods: paymentMethod === 'upi' ? ['card', 'netbanking', 'wallet', 'emi', 'voucher', 'paylater'] : [],
        });
        await paymentApi.verify({
          orderId: d.internalOrderId,
          razorpayOrderId: payment.razorpay_order_id,
          razorpayPaymentId: payment.razorpay_payment_id,
          razorpaySignature: payment.razorpay_signature,
        });
        clearCart();
        toast.success('Payment successful! Order confirmed.');
        navigate('/orders/' + order.orderNumber);
      } catch (payErr) {
        const msg = payErr?.response?.data?.message || 'Payment could not be completed.';
        toast.error(`${msg} Your order is saved as pending — you can retry from My Orders.`);
        navigate('/orders/' + order.orderNumber, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setPlacing(false); }
  };
  const getEffectivePrice = (food) => {
    return food.discountPrice != null && food.discountPrice < food.price ? food.discountPrice : food.price;
  };

  const subtotal = items.reduce((s, i) => s + getEffectivePrice(i.food) * i.quantity, 0);
  const deliveryFee = preview?.deliveryCharge || 0;
  const discount = preview?.discount || 0;
  const total = preview?.grandTotal ?? subtotal + deliveryFee - discount;
  const isEmpty = !items.length;

  if (isEmpty) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link to="/menu" className="text-emerald-600 hover:underline">Browse menu</Link>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (loadingPreview || loadingAddresses || loadingPayment) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="animate-spin text-brand-500 mx-auto mb-4" size={48} />
            <p className="text-gray-600">Loading checkout details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Address */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
            {addresses.length === 0 && !isNewAddress ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No addresses saved</p>
                <button onClick={() => setIsNewAddress(true)} className="text-emerald-600 hover:underline flex items-center justify-center gap-2 mx-auto">
                  <Plus size={18} /> Add new address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label key={addr._id} className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress === addr._id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="address" value={addr._id} checked={selectedAddress === addr._id} onChange={() => setSelectedAddress(addr._id)} className="mt-1" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{addr.label}</span>
                        {addr.isDefault && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Default</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}</p>
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-sm text-gray-600">{addr.phone}</p>
                    </div>
                  </label>
                ))}
                {!isNewAddress && (
                  <button onClick={() => setIsNewAddress(true)} className="text-emerald-600 hover:underline flex items-center gap-2 text-sm">
                    <Plus size={16} /> Add new address
                  </button>
                )}
              </div>
            )}


            {isNewAddress && (
              <form onSubmit={handleSaveAddress} className="mt-4 space-y-3 border-t pt-4">
                <h3 className="font-semibold">New Address</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Label (Home/Work)" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} className="border rounded-lg px-3 py-2" />
                  <input required placeholder="Phone" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="border rounded-lg px-3 py-2" />
                </div>
                <input required placeholder="Address Line 1" value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} className="border rounded-lg px-3 py-2 w-full" />
                <input placeholder="Address Line 2" value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} className="border rounded-lg px-3 py-2 w-full" />
                <div className="grid grid-cols-3 gap-3">
                  <input required placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="border rounded-lg px-3 py-2" />
                  <input required placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="border rounded-lg px-3 py-2" />
                  <input required placeholder="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} className="border rounded-lg px-3 py-2" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">Save Address</button>
                  <button type="button" onClick={() => { setIsNewAddress(false); setAddressForm({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' }); }} className="border px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <div className="space-y-3">
              {[
                { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when your order arrives', enabled: paymentConfig?.methods?.includes('cod') },
                { id: 'upi', label: 'UPI — Google Pay, PhonePe, Paytm', icon: ShieldCheck, desc: 'Pay instantly from any UPI app', enabled: paymentConfig?.methods?.includes('upi') },
                { id: 'razorpay', label: 'Credit / Debit Card & Net Banking', icon: CreditCard, desc: 'Visa, Mastercard, RuPay via Razorpay', enabled: paymentConfig?.methods?.includes('razorpay') },
              ]
                .filter((o) => o.enabled)
                .map(({ id, label, icon: Icon, desc, enabled }) => (
                  <label key={id} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="hidden" />
                    <Icon className="text-emerald-600" size={22} />
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                  </label>
                ))}
              {!paymentConfig?.razorpayConfigured && paymentConfig && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  UPI / Card are available after the store owner configures Razorpay keys. Cash on Delivery works now.
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Summary */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map((i) => {
                const effectivePrice = getEffectivePrice(i.food);
                return (
                  <div key={i.food._id} className="flex justify-between text-sm">
                    <span>{i.food.name} x{i.quantity}</span>
                    <span>{formatCurrency(effectivePrice * i.quantity)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery Fee</span><span>{deliveryFee ? formatCurrency(deliveryFee) : '--'}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
            </div>
            <button disabled={placing || !selectedAddress} onClick={placeOrder} className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              {placing ? 'Placing Order...' : `Pay ${formatCurrency(total)}`}
            </button>
            {(!selectedAddress && !isNewAddress) && <p className="text-red-500 text-sm mt-2 text-center">Please select or add an address</p>}
          </div>
        </div>
      </div>
    </div>
  );
}