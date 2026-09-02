import app from '../src/app.js';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('='.repeat(70));
  console.log('🧪 RUNNING COMPREHENSIVE BACKEND INTEGRATION TEST SUITE');
  console.log('='.repeat(70));

  const server = app.listen(3099);
  const BASE = 'http://localhost:3099';

  let testUserId = null;
  let testUserToken = null;
  let adminToken = null;
  let testEnquiryId = null;
  let passedCount = 0;
  let failedCount = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name} ${extra}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${extra}`);
      failedCount++;
    }
  }

  try {
    // 1. Health Check
    console.log('\n--- 1. Health & Server Info ---');
    const res1 = await fetch(`${BASE}/health`);
    const data1 = await res1.json();
    assert('GET /health', res1.status === 200 && data1.status === 'healthy');

    // 2. Auth: Register a test user
    console.log('\n--- 2. Auth Domain ---');
    const randomSuffix = Date.now().toString().slice(-4);
    const testEmail = `testuser_${randomSuffix}@ngk.com`;
    const res2 = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test Driver ${randomSuffix}`,
        email: testEmail,
        password: 'Password123!',
        role: 'owner',
        address: '100 Test Blvd, Sandton',
      }),
    });
    const data2 = await res2.json();
    assert('POST /api/auth/register', res2.status === 201 && data2.success === true && !!data2.token);
    testUserId = data2.user?.id;
    testUserToken = data2.token;

    // 3. Auth: Login as newly registered user
    const res3 = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'Password123!' }),
    });
    const data3 = await res3.json();
    assert('POST /api/auth/login (New User)', res3.status === 200 && data3.success === true && !!data3.token);

    // 4. Auth: Login as Admin
    const res4 = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ngk.com', password: 'admin' }),
    });
    const data4 = await res4.json();
    assert('POST /api/auth/login (Admin)', res4.status === 200 && data4.success === true);
    adminToken = data4.token;

    // 5. User Domain: Get Profile
    console.log('\n--- 3. User Domain ---');
    const res5 = await fetch(`${BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data5 = await res5.json();
    assert('GET /api/users/me with JWT', res5.status === 200 && data5.user?.[0]?.email === testEmail);

    // 6. User Domain: List all users (Admin view)
    const res6 = await fetch(`${BASE}/api/users/users`);
    const data6 = await res6.json();
    assert('GET /api/users/users', res6.status === 200 && Array.isArray(data6.users) && data6.users.length > 0, `(${data6.users?.length} users)`);

    // 7. Dealer Domain: Get Dealers
    console.log('\n--- 4. Dealer Domain ---');
    const res7 = await fetch(`${BASE}/api/dealers`);
    const data7 = await res7.json();
    assert('GET /api/dealers', res7.status === 200 && Array.isArray(data7.dealers) && data7.dealers.length > 0, `(${data7.dealers?.length} dealers found)`);

    // 8. Garage Domain: Add Vehicle
    console.log('\n--- 5. Garage Domain ---');
    const res8 = await fetch(`${BASE}/api/garage/addVehicleToGarage/${testUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        make: 'Volkswagen',
        model: 'Golf 8 GTI',
        year: '2023',
        vin: 'WVWZZZAUZLW123456',
        engineCode: 'EA888',
      }),
    });
    const data8 = await res8.json();
    assert('PUT /api/garage/addVehicleToGarage/:id', res8.status === 200 && data8.success === true);

    // 9. Garage Domain: Add to Watchlist
    const res9 = await fetch(`${BASE}/api/garage/addVehicleToWatchlist/${testUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: 'NGK-94122',
        partNumber: 'ILZKR7B-11',
        brandName: 'NGK',
        title: 'Laser Iridium Spark Plug',
      }),
    });
    const data9 = await res9.json();
    assert('PUT /api/garage/addVehicleToWatchlist/:id', res9.status === 200 && data9.success === true);

    // 10. Enquiry Domain: Create Technical Enquiry
    console.log('\n--- 6. Enquiry Domain ---');
    const res10 = await fetch(`${BASE}/api/enquiries/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        vehicle: {
          title: 'Volkswagen Golf 8 GTI Spark Plugs',
          description: 'Looking for OEM NGK Laser Iridium part compatibility verification',
          quantity: 4,
          enquiryDetails: 'Please verify spark plug gap and heat range for tuned ECU',
        },
      }),
    });
    const data10 = await res10.json();
    assert('POST /api/enquiries/add', res10.status === 201 && data10.success === true && !!data10.enquiry?.[0]?.id);
    testEnquiryId = data10.enquiry?.[0]?.id;

    // 11. Enquiry Domain: Fetch Enquiries for User
    const res11 = await fetch(`${BASE}/api/enquiries/getEnquiry/${testUserId}`);
    const data11 = await res11.json();
    assert('GET /api/enquiries/getEnquiry/:userId', res11.status === 200 && Array.isArray(data11.enquiry) && data11.enquiry.length > 0);

    // 12. Enquiry Domain: Update Status
    if (testEnquiryId) {
      const res12 = await fetch(`${BASE}/api/enquiries/updateStatus/${testEnquiryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'InProgress',
          responderName: 'NGK Tech Support',
          role: 'reseller',
        }),
      });
      const data12 = await res12.json();
      assert('PUT /api/enquiries/updateStatus/:id', res12.status === 200 && data12.success === true);

      // 13. Enquiry Domain: Add Message in Thread
      const res13 = await fetch(`${BASE}/api/enquiries/addMessage/${testEnquiryId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'reseller',
          senderName: 'NGK Specialist',
          text: 'We recommend ILZKR7B-11 with 0.8mm gap for stage 1 tuned Golf 8 GTI.',
        }),
      });
      const data13 = await res13.json();
      assert('POST /api/enquiries/addMessage/:id', res13.status === 200 && data13.success === true);
    }

    // 14. Upload Domain: Upload temporary file
    console.log('\n--- 7. Upload Domain ---');
    const tempFilePath = path.join(process.cwd(), 'temp_test_image.jpg');
    fs.writeFileSync(tempFilePath, 'fake-jpeg-binary-data');

    const formData = new FormData();
    const blob = new Blob(['fake-image-content'], { type: 'image/jpeg' });
    formData.append('file', blob, 'sparkplug_sample.jpg');

    const res14 = await fetch(`${BASE}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    const data14 = await res14.json();
    assert('POST /api/upload (Multer File Pipeline)', res14.status === 201 && data14.success === true && !!data14.url);

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    // 15. Backward Compatibility Route Checks
    console.log('\n--- 8. Backward Compatibility Aliases ---');
    const res15 = await fetch(`${BASE}/api/user/user/${testUserId}`);
    const data15 = await res15.json();
    assert('GET /api/user/user/:id (Legacy Route Alias)', res15.status === 200 && data15.user?.[0]?.email === testEmail);

    console.log('\n' + '='.repeat(70));
    console.log(`🏁 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('='.repeat(70));

    server.close();
    process.exit(failedCount > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Suite Exception:', err);
    server.close();
    process.exit(1);
  }
}

runTests();
