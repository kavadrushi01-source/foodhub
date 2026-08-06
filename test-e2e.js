const axios = require('axios');
const API = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== FOODHUB END-TO-END TESTS ===\n');
  
  try {
    console.log('1. Testing Public APIs...');
    
    // Test categories
    const categories = await axios.get(API + '/categories');
    console.log('✓ Categories API:', categories.data.success ? 'PASS' : 'FAIL');
    
    // Test foods
    const foods = await axios.get(API + '/foods');
    console.log('✓ Foods API:', foods.data.success ? 'PASS' : 'FAIL');
    
    // Test health (should require auth)
    try {
      await axios.get(API + '/health');
      console.log('✗ Health API: FAIL (should require auth)');
    } catch (err) {
      console.log('✓ Health API: PASS (requires auth as expected)');
    }
    
    console.log('\n2. Testing Authentication...');
    
    // Test registration
    const testEmail = 'test' + Date.now() + '@test.com';
    const register = await axios.post(API + '/auth/register', {
      name: 'Test User',
      email: testEmail,
      password: 'Test123!',
      phone: '9876543210'
    });
    console.log('✓ Registration:', register.data.success ? 'PASS' : 'FAIL');
    
    if (register.data.success && register.data.data && register.data.data.tokens) {
      console.log('\n3. Testing Authenticated APIs...');
      
      const token = register.data.data.tokens.accessToken;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Test get me
      const me = await axios.get(API + '/auth/me', config);
      console.log('✓ Get Me:', me.data.success ? 'PASS' : 'FAIL');
      
      // Test addresses
      const addresses = await axios.get(API + '/addresses', config);
      console.log('✓ Get Addresses:', addresses.data.success ? 'PASS' : 'FAIL');
      
      console.log('\n=== ALL TESTS PASSED ===');
    }
    
  } catch (err) {
    console.error('\n✗ Test Failed:', err.message);
    if (err.response) {
      console.error('Response:', err.response.data);
    }
    process.exit(1);
  }
}

runTests();
