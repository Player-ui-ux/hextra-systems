const cp = require('child_process');
const electronPath = require('electron');
const path = require('path');

const scriptPath = path.join(__dirname, 'capture-all-screenshots.js');
console.log('[Runner] Spawning Electron with:', scriptPath);

const res = cp.spawnSync(electronPath, [scriptPath], {
  encoding: 'utf8',
  stdio: 'inherit'
});

console.log('[Runner] Finished with status:', res.status);
