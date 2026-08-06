const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

/** Load the Razorpay checkout script once and cache the promise. */
const loadRazorpayScript = () => {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Razorpay requires a browser'));
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return resolve(true);
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load the payment gateway'));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
};

/**
 * Open the Razorpay checkout modal and resolve with the payment response
 * (`razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`) on success.
 * Rejects when the user closes the modal or the payment fails.
 */
export const openRazorpayCheckout = async ({
  key,
  amount,
  currency = 'INR',
  orderId,
  name = 'FoodHub',
  description = 'FoodHub order',
  prefill = {},
  themeColor = '#f97316',
  hideMethods = [],
  method = null,
}) => {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount, // paise
      currency,
      order_id: orderId,
      name,
      description,
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.contact || '',
      },
      theme: { color: themeColor },
      modal: {
        ondismiss: () => reject(new Error('Payment window closed')),
      },
      handler: (response) => resolve(response),
    };
    if (method) {
      options.method = method;
    }
    if (hideMethods.length) {
      options.config = { display: { hide: hideMethods } };
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      reject(new Error(response?.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
};

export default { openRazorpayCheckout };
