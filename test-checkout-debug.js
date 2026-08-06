const axios = require('axios');
const API = 'http://localhost:5000/api';

async function debugCheckout() {
  try {
    console.log('=== DEBUG CHECKOUT FLOW ===\n');
    
    // Register
    const reg = await axios.post(API + '/auth/register', {
      name: 'Test User',
      email: 'checkout' + Date.now() + '@test.com',
      password: 'Test123!',
      phone: '9876543210'
    });
    const token = reg.data.data.tokens.accessToken;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('1. ✓ Registered');
    
    // Get foods
    const foods = await axios.get(API + '/foods');
    const foodId = foods.data.data.items[0]._id;
    console.log('2. ✓ Got food:', foods.data.data.items[0].name);
    
    // Add address
    const addr = await axios.post(API + '/addresses', {
      label: 'Home', line1: '123 Test', city: 'Mumbai', state: 'MH', pincode: '400001', phone: '9876543210'
    }, config);
    const addrId = addr.data.data.addresses[0]._id;
    console.log('3. ✓ Added address:', addrId);
    console.log('   Address response keys:', Object.keys(addr.data));
    console.log('   Address data keys:', Object.keys(addr.data.data));
    
    // Preview
    const preview = await axios.post(API + '/orders/preview', {
      items: [{ food: foodId, quantity: 2 }],
      couponCode: ''
    }, config);
    console.log('\n4. ✓ Preview calculated');
    console.log('   Preview response keys:', Object.keys(preview.data));
    console.log('   Preview data keys:', Object.keys(preview.data.data));
    console.log('   Grand total:', preview.data.data.grandTotal);
    console.log('   Subtotal:', preview.data.data.subTotal);
    
    // Create order
    const order = await axios.post(API + '/orders', {
      items: [{ food: foodId, quantity: 2 }],
      addressId: addrId,
      paymentMethod: 'cod'
    }, config);
    console.log('\n5. ✓ Order created');
    console.log('   Order response keys:', Object.keys(order.data));
    console.log('   Order data keys:', Object.keys(order.data.data));
    console.log('   Has order obj:', !!order.data.data.order);
    if (order.data.data.order) {
      console.log('   Order keys:', Object.keys(order.data.data.order));
      console.log('   Order number:', order.data.data.order.orderNumber);
    }
    
    console.log('\n=== ALL RESPONSE STRUCTURES CAPTURED ===');
    process.exit(0);
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) console.log('Response:', JSON.stringify(err.response.data, null, 2));
    process.exit(1);
  }
}

debugCheckout();
