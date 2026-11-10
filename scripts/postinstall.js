const fs = require('fs');
const path = require('path');

try {
  const root = path.join(__dirname, '..');
  const src = path.join(root, 'node_modules', 'libsodium', 'dist', 'modules-esm', 'libsodium.mjs');
  const destDir = path.join(root, 'node_modules', 'libsodium-wrappers', 'dist', 'modules-esm');
  const dest = path.join(destDir, 'libsodium.mjs');

  if (fs.existsSync(src)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log('[Postinstall] Successfully patched libsodium-wrappers with libsodium.mjs');
  } else {
    console.log('[Postinstall] libsodium.mjs not found at ' + src + ' (may not be installed yet)');
  }
} catch (err) {
  console.warn('[Postinstall] Warning during patch:', err.message);
}
