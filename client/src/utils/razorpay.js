const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

// A <script> for checkout.js is appended to the page. We keep a handle on the
// element we created so a failed load can be cleaned up — otherwise the tag
// stays in the DOM and every later attempt short-circuits on the
// `querySelector` check below, resolving immediately with `window.Razorpay`
// still undefined.
let scriptPromise = null;
let scriptEl = null;

const removeScript = () => {
  scriptEl?.parentNode?.removeChild(scriptEl);
  scriptEl = null;
};

/** Load the Razorpay checkout script once and cache the promise. */
const loadRazorpayScript = () => {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Razorpay requires a browser'));

    // Only short-circuit when checkout.js is present AND already finished
    // loading; otherwise we would resolve before `window.Razorpay` exists.
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing && existing.dataset.rzpState === 'ready') return resolve(true);

    // Guard against a network hang (blocked script, flaky connection) so the
    // checkout button can't spin forever.
    const timeout = setTimeout(() => {
      scriptPromise = null;
      removeScript();
      reject(new Error('Payment gateway took too long to load. Check your connection and try again.'));
    }, 20000);

    const onReady = () => {
      clearTimeout(timeout);
      if (existing) existing.dataset.rzpState = 'ready';
      if (window.Razorpay) return resolve(true);
      // Loaded but did not register the global — treat as a failure so the
      // next attempt re-injects the script.
      scriptPromise = null;
      removeScript();
      reject(new Error('Payment gateway failed to initialise. Please try again.'));
    };

    const onFail = () => {
      clearTimeout(timeout);
      scriptPromise = null;
      removeScript();
      reject(new Error('Could not load the payment gateway. Check your connection or any ad-blocker.'));
    };

    if (existing) {
      // Tag is in the DOM but not marked ready — reuse it and wait for load.
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', onFail, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    scriptEl = script;
    script.onload = onReady;
    script.onerror = onFail;
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
