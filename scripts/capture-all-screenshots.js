const { app, BrowserWindow } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

const distDir = path.join(__dirname, '../dist/renderer');
const outDir = path.join(__dirname, '../docs/screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const tabs = [
  { id: 'accounts', name: '01-accounts-management.png' },
  { id: 'quests', name: '02-quests-farmer.png' },
  { id: 'voice', name: '03-voice-stream-24-7.png' },
  { id: 'badges', name: '04-badge-farmer.png' },
  { id: 'cloner', name: '05-server-cloner.png' },
  { id: 'dm', name: '06-dm-cleaner.png' },
  { id: 'emoji', name: '07-emoji-manager.png' },
  { id: 'hypesquad', name: '08-hypesquad.png' }
];

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const mimeMap = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(filePath));
});

// Use port 0 for random free port
server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  console.log(`[Capture Server] Listening on http://127.0.0.1:${port}`);

  app.whenReady().then(async () => {
    const win = new BrowserWindow({
      width: 1280,
      height: 820,
      frame: false,
      show: false,
      backgroundColor: '#090507',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false
      }
    });

    for (const tab of tabs) {
      const url = `http://127.0.0.1:${port}/?tab=${tab.id}`;
      console.log(`[Capture] Navigating to ${tab.id}...`);

      await win.loadURL(url);
      await new Promise((r) => setTimeout(r, 1400));

      const image = await win.webContents.capturePage();
      const pngBuffer = image.toPNG();
      const filePath = path.join(outDir, tab.name);
      fs.writeFileSync(filePath, pngBuffer);
      console.log(`[Capture] Saved: ${tab.name} (${pngBuffer.length} bytes)`);
    }

    fs.copyFileSync(
      path.join(outDir, '02-quests-farmer.png'),
      path.join(outDir, 'dashboard-preview.png')
    );

    console.log('[Capture] All screenshots captured successfully!');
    server.close();
    app.exit(0);
  });
});
