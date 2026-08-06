const axios = require('axios');
const API = 'http://localhost:5000/api';

async function testOrderFlow() {
  console.log('=== TESTING COMPLETE ORDER FLOW ===\n');
  
  try {
    // Step 1: Register user
    console.log('1. Registering test user...');
    const testEmail = 'orderflow' + Date.now() + '@test.com';
    const register = await axios.post(API + '/auth/register', {
      name: 'Order Test User',
      email: testEmail,
      password: 'Test123!',
      phone: '9876543210'
    });
    
    if (!register.data.success) {
      throw new Error('Registration failed');
    }
    
    const token = register.data.data.tokens.accessToken;
    const userId = register.data.data.user._id;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✓ User registered:', userId);
    
    // Step 2: Get available foods
    console.log('\n2. Getting available foods...');
    const foods = await axios.get(API + '/foods');
    const testFood = foods.data.data.items[0];
    console.log('✓ Test food:', testFood.name, '-', testFood._id);
    
    // Step 3: Add address
    console.log('\n3. Adding delivery address...');
    const addressRes = await axios.post(API + '/addresses', {
      label: 'Home',
      line1: '123 Test Street',
      line2: 'Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '9876543210'
    }, config);
    
    const addressId = addressRes.data.data.addresses[0]._id;
    console.log('✓ Address added:', addressId);
    
    // Step 4: Create order with COD
    console.log('\n4. Creating order (COD)...');
    const orderRes = await axios.post(API + '/orders', {
      items: [{ food: testFood._id, quantity: 2 }],
      addressId: addressId,
      paymentMethod: 'cod'
    }, config);
    
    if (!orderRes.data.success) {
      throw new Error('Order creation failed: ' + JSON.stringify(orderRes.data));
    }
    
    const order = orderRes.data.data.order;
    console.log('✓ Order created:', order.orderNumber);
    console.log('  - Total:', order.grandTotal);
    console.log('  - Status:', order.status);
    console.log('  - Payment:', order.payment.method);
    
    // Step 5: Get order details
    console.log('\n5. Fetching order details...');
    const orderDetail = await axios.get(API + '/orders/' + order._id, config);
    console.log('✓ Order details retrieved');
    
    // Step 6: Get user orders
    console.log('\n6. Fetching user orders...');
    const myOrders = await axios.get(API + '/orders/me', config);
    console.log('✓ User has', myOrders.data.data.orders?.length || myOrders.data.data.length || 0, 'order(s)');
    
    // Step 7: Test order preview
    console.log('\n7. Testing order preview...');
    const preview = await axios.post(API + '/orders/preview', {
      items: [{ food: testFood._id, quantity: 2 }],
      couponCode: ''
    }, config);
    console.log('✓ Preview calculated - Total:', preview.data.data.grandTotal);
    
    console.log('\n=== COMPLETE ORDER FLOW TEST PASSED ===');
    console.log('Summary:');
    console.log('  ✓ User registration');
    console.log('  ✓ Address management');
    console.log('  ✓ Order creation (COD)');
    console.log('  ✓ Order retrieval');
    console.log('  ✓ Order preview');
    
    process.exit(0);
    
  } catch (err) {
    console.error('\n✗ Order Flow Failed:', err.message);
    if (err.response) {
      console.error('Response:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

testOrderFlow();
