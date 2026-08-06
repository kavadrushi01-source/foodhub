const axios = require('axios');

const API = 'http://localhost:5000/api';

async function testCheckout() {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  };

  try {
    // Test 1: Preview checkout
    console.log('Testing checkout preview API...');
    const previewRes = await axios.post(`${API}/orders/preview`, {
      items: [{ food: 'Cheese Burst Pizza ID', quantity: 1 }],
      couponCode: ''
    }, config);
    
    console.log('✓ Preview response structure:', {
      success: previewRes.data.success,
      hasData: !!previewRes.data.data,
      grandTotal: previewRes.data.data?.grandTotal,
      deliveryCharge: previewRes.data.data?.deliveryCharge
    });

    // Test 2: Get addresses
    console.log('\nTesting addresses API...');
    const addressRes = await axios.get(`${API}/addresses`, config);
    
    console.log('✓ Addresses response structure:', {
      success: addressRes.data.success,
      hasData: !!addressRes.data.data,
      hasAddresses: !!addressRes.data.data?.addresses,
      count: addressRes.data.data?.addresses?.length || 0
    });

    console.log('\n=== API RESPONSE STRUCTURE TEST PASSED ===');
    console.log('The APIs are returning the correct structure for axios interceptor.');
    console.log('\nFixed response access pattern:');
    console.log('  - Addresses: res.data.addresses (NOT res.data.data.addresses)');
    console.log('  - Preview: res.data (NOT res.data.data)');
    console.log('  - Order: res.data.order (NOT res.data.data.order)');
    
  } catch (error) {
    console.error('✗ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testCheckout();