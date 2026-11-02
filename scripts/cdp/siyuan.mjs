/**
 * Small SiYuan glue used by the CDP inspection scripts:
 * - locate the running kernel port
 * - build the desktop frontend URL
 * - locate a local Chrome/Edge binary
 *
 * The browser automation itself lives in puppeteer-core.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

export function findChrome() {
  const explicit = process.env.CHROME_PATH?.trim();
  if (explicit) {
    if (!existsSync(explicit)) throw new Error('CHROME_PATH 不存在: ' + explicit);
    return explicit;
  }
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) throw new Error('未找到 Chrome/Edge，请安装或设置 CHROME_PATH');
  return found;
}

function runPowerShell(command) {
  return new Promise((resolve) => {
    const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', command], {
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    });
    let out = '';
    child.stdout.on('data', (chunk) => {
      out += chunk.toString();
    });
    child.on('close', () => resolve(out.trim()));
    child.on('error', () => resolve(''));
  });
}

async function probe(url, timeoutMs = 1500) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return response.ok;
  } catch {
    return false;
  }
}

export async function findKernelPort() {
  const explicit = process.env.SIYUAN_PORT?.trim();
  if (explicit) return Number(explicit);

  const pidText = await runPowerShell(
    '(Get-Process SiYuan-Kernel -ErrorAction SilentlyContinue | Select-Object -First 1).Id'
  );
  const pid = pidText.split(/\s+/).filter(Boolean)[0];

  const mapFiles = [
    join(process.env.USERPROFILE || '', '.config', 'siyuan', 'port.json'),
    join(process.env.APPDATA || '', 'SiYuan', 'port.json'),
  ];

  for (const file of mapFiles) {
    if (!existsSync(file)) continue;
    try {
      const map = JSON.parse(readFileSync(file, 'utf8'));
      if (pid && map[pid]) {
        const port = Number(map[pid]);
        if (await probe('http://127.0.0.1:' + port + '/api/system/status')) return port;
      }
      const values = Object.values(map).map(Number);
      if (values.length) {
        const candidate = values[values.length - 1];
        if (await probe('http://127.0.0.1:' + candidate + '/api/system/status')) return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }

  for (const port of [6806, 6807, 6808, 6809]) {
    if (await probe('http://127.0.0.1:' + port + '/api/system/status')) return port;
  }
  throw new Error('无法定位 SiYuan kernel 端口：确认思源已启动，或设置 SIYUAN_PORT');
}

export function frontendUrl(port) {
  const random = Math.random().toString(36).slice(2, 9);
  return 'http://127.0.0.1:' + port + '/stage/build/desktop/?r=' + random;
}
