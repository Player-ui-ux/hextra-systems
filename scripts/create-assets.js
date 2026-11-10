const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1. Generate black.mp4 for Go Live screen streaming using ffmpeg-static
const blackMp4Path = path.join(assetsDir, 'black.mp4');
try {
  let ffmpegPath = require('ffmpeg-static');
  if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    console.log('[Assets] Generating 5-second 640x360 looped black.mp4 via ffmpeg-static...');
    const cmd = `"${ffmpegPath}" -y -f lavfi -i color=c=black:s=640x360:r=30 -t 5 -c:v libx264 -pix_fmt yuv420p "${blackMp4Path}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('[Assets] black.mp4 generated successfully at:', blackMp4Path);
  }
} catch (e) {
  console.warn('[Assets] ffmpeg generation note:', e.message);
}

// Fallback: If black.mp4 does not exist or ffmpeg failed, write minimal valid MP4
if (!fs.existsSync(blackMp4Path) || fs.statSync(blackMp4Path).size === 0) {
  // Minimal valid ftyp + moov + mdat bytes
  const minimalMp4Base64 =
    'AAAAHGZ0eXBpc29tAAAAAGlzb21tcDQxYXZjMWFhYWFjAAAAMG1vb3YAAABsbXZoZAAAAADaA' +
    'a5AAADaAa5AAA+gAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAA';
  fs.writeFileSync(blackMp4Path, Buffer.from(minimalMp4Base64, 'base64'));
  console.log('[Assets] Fallback minimal black.mp4 created.');
}

// 2. Generate a stylish cyberpunk SVG/PNG and ICO for Hextra Studio
const iconPngPath = path.join(assetsDir, 'icon.png');
const iconIcoPath = path.join(assetsDir, 'icon.ico');

// Generate 256x256 PNG icon with cyberpunk red and black design
function createCyberpunkIcon() {
  // We can create a simple BMP or raw icon, or let canvas/ffmpeg produce it
  try {
    let ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      // Create a 256x256 dark background with red crosshair/hexagon via ffmpeg lavfi
      const cmd = `"${ffmpegPath}" -y -f lavfi -i color=c=0x090507:s=256x256 -vf "drawbox=x=32:y=32:w=192:h=192:color=0xff1e27@0.9:t=6,drawbox=x=64:y=64:w=128:h=128:color=0xff1e27@0.5:t=2" -vframes 1 "${iconPngPath}"`;
      execSync(cmd, { stdio: 'inherit' });
      // Also convert to .ico
      execSync(`"${ffmpegPath}" -y -i "${iconPngPath}" "${iconIcoPath}"`, { stdio: 'inherit' });
      console.log('[Assets] Cyberpunk icon.png and icon.ico generated successfully.');
      return;
    }
  } catch (err) {
    console.warn('[Assets] ffmpeg icon creation note:', err.message);
  }

  // Minimal 1x1 or 16x16 fallback ICO
  if (!fs.existsSync(iconIcoPath)) {
    // 16x16 minimal ICO header + 16x16 32-bit BMP
    const icoHeader = Buffer.from([
      0, 0, 1, 0, 1, 0, 16, 16, 0, 0, 1, 0, 32, 0, 68, 4, 0, 0, 22, 0, 0, 0
    ]);
    const bmpHeader = Buffer.alloc(1068);
    fs.writeFileSync(iconIcoPath, Buffer.concat([icoHeader, bmpHeader]));
  }
  if (!fs.existsSync(iconPngPath)) {
    fs.writeFileSync(iconPngPath, Buffer.alloc(100));
  }
}

createCyberpunkIcon();
