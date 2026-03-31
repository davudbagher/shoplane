/**
 * Test API Token in Browser Console
 * 
 * How to use:
 * 1. Go to Kitchen dashboard (http://localhost:5173/kitchen)
 * 2. Open DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy-paste this entire script and press Enter
 */

(async () => {
  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  console.log('🔐 Token Check:');
  console.log('   Token exists:', !!token);
  console.log('   User:', user.email, user.is_superuser ? '(SUPERUSER)' : '(USER)');
  console.log('');
  
  if (!token) {
    console.log('❌ NOT LOGGED IN!');
    console.log('   Go to http://localhost:5173/login and login first');
    return;
  }
  
  console.log('🧪 Testing API Endpoints...');
  console.log('');
  
  const endpoints = [
    '/admin/super-admin/leads',
    '/admin/super-admin/shops',
    '/admin/super-admin/stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const status = response.status;
      const statusText = status === 200 ? '✅' : '❌';
      console.log(`${statusText} ${endpoint}`);
      console.log(`   Status: ${status} ${response.statusText}`);
      
      if (status === 200) {
        const data = await response.json();
        if (Array.isArray(data)) {
          console.log(`   Data: ${data.length} items`);
        } else {
          console.log(`   Data:`, data);
        }
      } else {
        const error = await response.text();
        console.log(`   Error: ${error}`);
      }
      console.log('');
    } catch (err) {
      console.log(`❌ ${endpoint}`);
      console.log(`   Error: ${err.message}`);
      console.log('');
    }
  }
  
  console.log('='.repeat(60));
  console.log('If all tests pass (✅ 200), refresh the page and leads should appear!');
})();
