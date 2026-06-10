const { spawn } = require('child_process');
const path = require('path');

const ROOT = __dirname;

// Colors
const colors = {
  api: '\x1b[36m',
  web: '\x1b[32m',
  reset: '\x1b[0m',
};

function prefix(server, color) {
  return (data) => {
    data.toString().split('\n').filter(Boolean).forEach(line => {
      console.log(`${color}[${server}]${colors.reset} ${line}`);
    });
  };
}

console.log('========================================');
console.log('  JuanLeMe - starting...');
console.log('========================================\n');

// 1. Install dependencies if needed
const fs = require('fs');
const backendOk = fs.existsSync(path.join(ROOT, 'backend', 'node_modules'));
const clientOk = fs.existsSync(path.join(ROOT, 'client', 'node_modules'));

function installDeps(dir, label, cb) {
  if (label === 'backend' && backendOk) return cb();
  if (label === 'client' && clientOk) return cb();

  console.log(`Installing ${label} dependencies...`);
  const inst = spawn('npm', ['install'], {
    cwd: path.join(ROOT, dir),
    stdio: 'inherit',
    shell: true,
  });
  inst.on('close', (code) => {
    if (code !== 0) process.exit(code);
    cb();
  });
}

installDeps('backend', 'backend', () => {
  const api = spawn('node', ['src/index.js'], {
    cwd: path.join(ROOT, 'backend'),
    shell: true,
  });
  api.stdout.on('data', prefix('API', colors.api));
  api.stderr.on('data', prefix('API', colors.api));

  api.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
    process.exit();
  });

  installDeps('client', 'client', () => {
    setTimeout(() => {
      const web = spawn('npx', ['vite', '--host'], {
        cwd: path.join(ROOT, 'client'),
        shell: true,
      });
      web.stdout.on('data', prefix('WEB', colors.web));
      web.stderr.on('data', prefix('WEB', colors.web));
    }, 2000);
  });
});

process.on('SIGINT', () => process.exit());
