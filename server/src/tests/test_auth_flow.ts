import express from 'express';
import { router as apiRouter } from '../routes/api.js';
import http from 'http';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

async function testAuthFlow() {
  console.log('🧪 Starting AgriSaarthi Authentication & User Isolation Flow Test...\n');
  
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, resolve));

  const BASE_URL = 'http://localhost:5099/api';

  let total = 0;
  let passed = 0;

  function assert(cond: boolean, name: string) {
    total++;
    if (cond) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
    }
  }

  try {
    // 1. Unauthenticated request to /dashboard must fail with 401
    const unauthRes = await fetch(`${BASE_URL}/dashboard`);
    assert(unauthRes.status === 401, 'Unauthenticated request to /dashboard returns 401 Unauthorized');

    // 2. Register a new user
    const uniqueMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regPayload = {
      name: 'Ramesh Patil',
      emailOrMobile: uniqueMobile,
      password: 'mypassword123',
      preferredLanguage: 'mr'
    };

    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload)
    });

    assert(regRes.status === 201, 'New user registration returns 201 Created');
    const regData: any = await regRes.json();
    assert(!!regData.token, 'Registration response includes JWT token');
    assert(regData.user.name === 'Ramesh Patil', 'Registration returns correct user name');
    const token = regData.token;

    // 3. Test Login with wrong password
    const wrongLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrMobile: uniqueMobile, password: 'wrongpassword' })
    });
    assert(wrongLoginRes.status === 401, 'Login with incorrect password returns 401');

    // 4. Test Login with correct credentials
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrMobile: uniqueMobile, password: 'mypassword123' })
    });
    assert(loginRes.status === 200, 'Login with valid credentials returns 200 OK');
    const loginData: any = await loginRes.json();
    assert(loginData.user.name === 'Ramesh Patil', 'Login returns authenticated user profile');

    // 5. Query Dashboard for newly registered user before farm setup
    const initialDashRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(initialDashRes.status === 200, 'Authenticated /dashboard returns 200 OK');
    const initialDash: any = await initialDashRes.json();
    assert(initialDash.hasFarm === false, 'New user hasFarm is false before setting up farm');
    assert(initialDash.farmer.name === 'Ramesh Patil', 'Dashboard farmer profile matches logged-in user');

    // 6. User sets up their farm (Nashik)
    const farmRes = await fetch(`${BASE_URL}/farms`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        farmName: 'Patil Krishi Shivar',
        state: 'Maharashtra',
        district: 'Nashik',
        taluka: 'Niphad',
        village: 'Pimpalgaon',
        area: 4.5,
        areaUnit: 'Acre',
        soilType: 'Medium Black (Madhyam Kali)',
        irrigationType: 'Drip'
      })
    });
    assert(farmRes.status === 201, 'POST /farms creates user farm');

    // 7. User adds their crop (Onion)
    const cropRes = await fetch(`${BASE_URL}/crops`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        cropName: 'Onion',
        variety: 'Fursungi',
        cropStage: 'Vegetative',
        farmArea: 4.5
      })
    });
    assert(cropRes.status === 201, 'POST /crops creates user crop');

    // 8. Query Dashboard again: User now has personalized farm & crop
    const updatedDashRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const updatedDash: any = await updatedDashRes.json();
    assert(updatedDash.hasFarm === true, 'Dashboard hasFarm is now true');
    assert(updatedDash.farm.name === 'Patil Krishi Shivar', 'Dashboard displays user farm name');
    assert(updatedDash.crop.name === 'Onion', 'Dashboard displays user active crop');
    assert(updatedDash.farm.location.includes('Nashik'), 'Dashboard displays user location');

    console.log(`\n🎉 Auth Flow Test Summary: ${passed}/${total} assertions passed.\n`);
  } catch (err) {
    console.error('Fatal error during auth flow test:', err);
  } finally {
    server.close();
    if (passed !== total) {
      process.exit(1);
    }
  }
}

testAuthFlow();
