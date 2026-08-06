const axios = require('axios');
const API = 'http://localhost:5000/api';

async function testCompleteJourney() {
  console.log('=== TESTING COMPLETE USER JOURNEY ===\n');
  
  try {
    // Step 1: Register a new user
    console.log('1. Testing User Registration & Login Journey...');
    const testEmail = 'journey' + Date.now() + '@test.com';
    const register = await axios.post(API + '/auth/register', {
      name: 'Journey Test User',
      email: testEmail,
      password: 'Test123!',
      phone: '9876543210'
    });
    
    if (!register.data.success) throw new Error('Registration failed');
    const token = register.data.data.tokens.accessToken;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✓ User registered successfully');
    
    // Step 2: Get menu items
    console.log('\n2. Testing Menu Browsing...');
    const foods = await axios.get(API + '/foods');
    console.log('✓ Menu loaded -', foods.data.data.items.length, 'items available');
    
    // Step 3: Get categories
    const categories = await axios.get(API + '/categories');
    console.log('✓ Categories loaded -', categories.data.data.categories.length, 'categories');
    
    // Step 4: Add to wishlist
    console.log('\n3. Testing Wishlist...');
    const foodId = foods.data.data.items[0]._id;
    await axios.post(API + '/wishlist/' + foodId, {}, config);
    const wishlist = await axios.get(API + '/wishlist', config);
    console.log('✓ Wishlist working -', wishlist.data.data.wishlist.length, 'items');
    
    // Step 5: Add address
    console.log('\n4. Testing Address Management...');
    const address = await axios.post(API + '/addresses', {
      label: 'Home',
      line1: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '9876543210'
    }, config);
    console.log('✓ Address added');
    
    // Step 6: Create order
    console.log('\n5. Testing Order Placement...');
    const order = await axios.post(API + '/orders', {
      items: [{ food: foodId, quantity: 1 }],
      addressId: address.data.data.addresses[0]._id,
      paymentMethod: 'cod'
    }, config);
    console.log('✓ Order placed:', order.data.data.order.orderNumber);
    
    // Step 7: Get order history
    console.log('\n6. Testing Order History...');
    const orders = await axios.get(API + '/orders/me', config);
    console.log('✓ Order history loaded');
    
    // Step 8: Test order preview
    console.log('\n7. Testing Checkout Preview...');
    const preview = await axios.post(API + '/orders/preview', {
      items: [{ food: foodId, quantity: 2 }],
      couponCode: ''
    }, config);
    console.log('✓ Checkout preview calculated - Total:', preview.data.data.grandTotal);
    
    console.log('\n=== COMPLETE USER JOURNEY PASSED ===');
    console.log('All critical features working:');
    console.log('  ✓ User registration & authentication');
    console.log('  ✓ Menu browsing');
    console.log('  ✓ Wishlist');
    console.log('  ✓ Address management');
    console.log('  ✓ Order placement (COD)');
    console.log('  ✓ Order history');
    console.log('  ✓ Checkout preview');
    
    process.exit(0);
    
  } catch (err) {
    console.error('\n✗ Journey Failed:', err.message);
    if (err.response) {
      console.error('Response:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

testCompleteJourney();
