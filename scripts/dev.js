const { spawn } = require('child_process');
const { createServer } = require('vite');
const electron = require('electron');
const path = require('path');
const { execSync } = require('child_process');

async function startDev() {
  // 1. Build main and preload first
  console.log('[Dev] Compiling Electron Main & Preload scripts...');
  execSync('npx tsc -p tsconfig.main.json', { stdio: 'inherit' });

  // 2. Start Vite Dev Server
  console.log('[Dev] Starting Vite dev server...');
  const server = await createServer({
    configFile: path.join(__dirname, '../vite.config.ts'),
    server: { port: 5173 }
  });
  await server.listen();
  const address = server.httpServer.address();
  const devUrl = `http://localhost:${address.port}`;
  console.log(`[Dev] Vite Dev Server running at: ${devUrl}`);

  // 3. Launch Electron
  console.log('[Dev] Spawning Electron window...');
  const electronProcess = spawn(
    electron,
    [path.join(__dirname, '../dist/main/index.js')],
    {
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: devUrl
      },
      stdio: 'inherit'
    }
  );

  electronProcess.on('close', () => {
    server.close();
    process.exit();
  });
}

startDev().catch(err => {
  console.error('[Dev] Error starting dev environment:', err);
  process.exit(1);
});

