const http = require('http');

async function sendRequest(idx) {
  const payload = JSON.stringify({
    name: `Concurrent User ${idx}`,
    phoneNumber: `988888${String(1000 + idx)}`,
    city: 'Mumbai',
    service: 'Service 1',
    description: `Concurrent Request #${idx}`
  });

  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/leads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({ status: res.statusCode, error: 'Could not parse response: ' + data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Resetting database first...');
  await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/test/reset',
      method: 'POST'
    }, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.end();
  });
  console.log('Database reset complete.');

  console.log('\nSending 10 concurrent lead submissions to /api/leads...');
  const startTime = Date.now();
  const promises = Array.from({ length: 10 }).map((_, i) => sendRequest(i + 1));
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  console.log(`\nAll requests finished in ${duration}ms.\n`);
  
  results.forEach((r, idx) => {
    if (r.status === 201) {
      const providers = r.data.assignedProviders.map(p => `${p.name} (Count: ${p.leadsCount})`).join(', ');
      console.log(`Request #${idx + 1}: Success! Assigned to [${providers}]`);
    } else {
      console.log(`Request #${idx + 1}: Failed with status ${r.status}: ${r.data.error || r.error}`);
    }
  });

  // Verify DB stats
  console.log('\nFetching updated provider stats from dashboard...');
  await new Promise((resolve) => {
    http.get('http://localhost:3000/api/dashboard', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const stats = JSON.parse(data);
        console.log('\nFinal Provider States:');
        stats.providers.forEach(p => {
          console.log(`- ${p.name}: Assigned Leads = ${p.leadsCount}/10, Remaining Quota = ${p.remainingQuota}`);
        });
        resolve();
      });
    });
  });
}

run();
