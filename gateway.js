const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 10000;
const API_PORT = 4000;
const WEB_PORT = 3000;

console.log('🚀 Initializing GrowEasy Combined Gateway...');

// Start Express Backend API on port 4000
const apiProcess = spawn('node', ['apps/api/dist/index.js'], {
  env: { ...process.env, PORT: String(API_PORT) },
  stdio: 'inherit',
});

apiProcess.on('exit', (code) => {
  console.error(`❌ Backend API process exited with code ${code}`);
});

// Start Next.js Standalone Frontend on port 3000
const webProcess = spawn('node', ['apps/web/server.js'], {
  env: {
    ...process.env,
    PORT: String(WEB_PORT),
    HOSTNAME: '127.0.0.1',
  },
  stdio: 'inherit',
});

webProcess.on('exit', (code) => {
  console.error(`❌ Frontend Web process exited with code ${code}`);
});

// Create unified HTTP gateway routing /api/* and /health to API, and /* to Web
const server = http.createServer((req, res) => {
  const isApiRoute =
    req.url &&
    (req.url.startsWith('/api') || req.url.startsWith('/health'));

  const targetPort = isApiRoute ? API_PORT : WEB_PORT;

  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    },
  );

  proxyReq.on('error', (err) => {
    console.error(`[Gateway Error routing to port ${targetPort}]:`, err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: false,
        error: 'Service warming up or temporarily unavailable.',
      }),
    );
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌟 GrowEasy Combined Gateway listening on port ${PORT}`);
  console.log(`   ├── /api/* & /health -> Express API (internal :${API_PORT})`);
  console.log(`   └── /*              -> Next.js Web (internal :${WEB_PORT})\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close();
  apiProcess.kill('SIGTERM');
  webProcess.kill('SIGTERM');
});
