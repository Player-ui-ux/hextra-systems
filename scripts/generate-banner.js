const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

const bannerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1280px;
      height: 420px;
      overflow: hidden;
      background: #090507;
      font-family: 'Inter', sans-serif;
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 30, 39, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 30, 39, 0.05) 1px, transparent 1px);
      background-size: 32px 32px;
      mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 80%);
    }
    .glow-radial {
      position: absolute;
      width: 600px;
      height: 250px;
      background: radial-gradient(circle, rgba(255, 30, 39, 0.18) 0%, rgba(255, 30, 39, 0) 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .content {
      position: relative;
      z-index: 10;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 40px;
    }
    .badge-top {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(255, 30, 39, 0.12);
      border: 1px solid rgba(255, 30, 39, 0.35);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      color: #ff3d44;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 18px;
      box-shadow: 0 0 16px rgba(255, 30, 39, 0.25);
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ff1e27;
      box-shadow: 0 0 8px #ff1e27;
    }
    h1 {
      font-family: 'Inter', sans-serif;
      font-size: 52px;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin-bottom: 14px;
      text-shadow: 0 0 30px rgba(255, 30, 39, 0.3);
    }
    h1 span.brand {
      color: #ffffff;
    }
    h1 span.red {
      color: #ff1e27;
      text-shadow: 0 0 25px rgba(255, 30, 39, 0.6);
    }
    p.subtitle {
      font-size: 17px;
      color: #9ca3af;
      max-width: 780px;
      line-height: 1.5;
      margin-bottom: 24px;
      font-weight: 400;
    }
    .pills {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      background: rgba(21, 12, 17, 0.85);
      border: 1px solid rgba(255, 30, 39, 0.2);
      border-radius: 8px;
      color: #e5e7eb;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pill span.highlight {
      color: #ff3d44;
    }
    .border-glow-line {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(255, 30, 39, 0.6) 50%, transparent 100%);
    }
    .border-top-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(255, 30, 39, 0.4) 50%, transparent 100%);
    }
  </style>
</head>
<body>
  <div class="border-top-line"></div>
  <div class="grid-bg"></div>
  <div class="glow-radial"></div>

  <div class="content">
    <div class="badge-top">
      <div class="pulse-dot"></div>
      <span>Siberpunk Discord Desktop Suite &bull; Anti-Ban v9175</span>
    </div>

    <h1>
      <span class="brand">HEXTRA</span><span class="red">.STUDIO</span>
    </h1>

    <p class="subtitle">
      Discord kullanıcıları için geliştirilmiş gelişmiş masaüstü otomasyon & araçlar merkezi.
      Discord Orbs görevleri, 7/24 ses & yayın akışı, rozet fulleme ve sunucu klonlama.
    </p>

    <div class="pills">
      <div class="pill">⚡ <span class="highlight">Discord Orbs</span> & Görev Kasıcı</div>
      <div class="pill">🔊 <span class="highlight">7/24 Ses</span> & Go Live 1080p</div>
      <div class="pill">🏆 <span class="highlight">10.400+ Oyun</span> Rozet Fulleme</div>
      <div class="pill">📋 <span class="highlight">Sunucu</span> Klonlayıcı</div>
      <div class="pill">🧹 <span class="highlight">DM</span> Temizleyici</div>
      <div class="pill">🛡️ <span class="highlight">AES-256-GCM</span> Güvenlik</div>
    </div>
  </div>

  <div class="border-glow-line"></div>
</body>
</html>
`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 420,
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: false
    }
  });

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(bannerHtml)}`);
  await new Promise(r => setTimeout(r, 1200));

  const image = await win.webContents.capturePage();
  const bannerPath = path.join(__dirname, '../docs/screenshots/banner.png');
  fs.writeFileSync(bannerPath, image.toPNG());
  console.log('[Banner] Created banner at:', bannerPath);

  app.exit(0);
});
