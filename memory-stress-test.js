// memory-stress-test.js
//
// Usage:
//   node memory-stress-test.js [incrementMB] [delayMs]
//   • incrementMB – how much to allocate each step (default 50 MB)
//   • delayMs     – pause between steps so logs are flushed (default 500 ms)
//
// Example (allocate 100 MB every second):
//   node --max-old-space-size=8192 memory-stress-test.js 100 1000
//
// ⚠️  Expect the process (or the container/VM) to be killed when it hits its limit.

const MB = 1024 * 1024;
const stepMB   = Number(process.argv[2]) || 50;   // per-step allocation
const delayMs  = Number(process.argv[3]) || 500;  // pause between steps

const blocks = [];        // hold references so memory isn’t freed
let totalMB  = 0;

function human(bytes) {
  return `${(bytes / MB).toFixed(1)} MB`;
}

function logStats(tag) {
  const m = process.memoryUsage();       // rss includes native + heap
  console.log(
    `${tag} | total alloc: ${totalMB} MB | rss ${human(m.rss)} | ` +
    `heap ${human(m.heapUsed)}/${human(m.heapTotal)} | ext ${human(m.external)}`
  );
}

console.log(
  `Starting memory-stress test: +${stepMB} MB every ${delayMs} ms…`
);

function tick() {
  try {
    // Buffer allocates outside the JS heap → good for stressing container limits
    blocks.push(Buffer.alloc(stepMB * MB, 0));
    totalMB += stepMB;
    logStats('OK');
    setTimeout(tick, delayMs);
  } catch (err) {
    // If V8 throws before the OS/runner kills us (rare), report and exit
    console.error('\nAllocation failed:', err.message);
    logStats('FAIL');
    process.exit(1);
  }
}

process.on('SIGINT',  () => { console.log('Interrupted'); logStats('INT'); });
process.on('SIGTERM', () => { console.log('Terminated');  logStats('TERM'); });

tick();
