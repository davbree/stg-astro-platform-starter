// disk-stress-test.js
//
// Usage:
//   node disk-stress-test.js [incrementMB] [delayMs] [dir]
//   • incrementMB – MB written each step   (default 50)
//   • delayMs     – pause between writes   (default 500 ms)
//   • dir         – where to write files   (default ./disk-stress)
//
// Example (write 100 MB every second):
//   node disk-stress-test.js 100 1000 /tmp/disk-stress
//
// The script keeps writing until ENOSPC (no space left) or the runner kills it.

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MB         = 1024 * 1024;
const stepMB     = Number(process.argv[2]) || 50;
const delayMs    = Number(process.argv[3]) || 500;
const targetDir  = path.resolve(process.argv[4] || './disk-stress');

let fileIndex = 0;
let totalMB   = 0;

function human(bytes) { return `${(bytes / MB).toFixed(1)} MB`; }

function getDiskFree() {
  try {
    // Portable enough for Linux-based CI runners
    const out = execSync(`df -kP ${targetDir}`).toString().trim().split('\n').pop();
    const availKB = parseInt(out.split(/\s+/)[3], 10);
    return availKB * 1024;
  } catch {
    return NaN;
  }
}

function logStats(tag) {
  const free = getDiskFree();
  console.log(
    `${tag} | written ${totalMB} MB | free ${isNaN(free) ? 'N/A' : human(free)}`
  );
}

fs.mkdirSync(targetDir, { recursive: true });
console.log(
  `Starting disk-stress test: +${stepMB} MB every ${delayMs} ms in ${targetDir}…`
);

const buffer = Buffer.alloc(stepMB * MB, 0); // reused each step

function tick() {
  const filePath = path.join(targetDir, `blk_${String(++fileIndex).padStart(6, '0')}.bin`);
  const fd = fs.openSync(filePath, 'w');
  try {
    fs.writeSync(fd, buffer, 0, buffer.length);
    fs.closeSync(fd);
    totalMB += stepMB;
    logStats('OK');
    setTimeout(tick, delayMs);
  } catch (err) {
    console.error('\nWrite failed:', err.code || err.message);
    logStats('FAIL');
    throw err;
    process.exit(err.code === 'ENOSPC' ? 0 : 1);
  }
}

process.on('SIGINT',  () => { console.log('Interrupted'); logStats('INT'); });
process.on('SIGTERM', () => { console.log('Terminated');  logStats('TERM'); });

tick();
