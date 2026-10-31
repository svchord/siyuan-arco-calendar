import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';

export const log = (info) => console.log(`\x1B[36m%s\x1B[0m`, info);
export const error = (info) => console.error(`\x1B[31m%s\x1B[0m`, info);

const POST_HEADER = {
  'Content-Type': 'application/json',
};

async function myfetch(url, options) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: () => JSON.parse(data) });
        } catch (cause) {
          reject(cause);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

export async function getSiYuanDir() {
  const url = 'http://127.0.0.1:6806/api/system/getWorkspaces';
  try {
    const response = await myfetch(url, { method: 'POST', headers: POST_HEADER });
    if (response.status !== 200) {
      error(`\tHTTP-Error: ${response.status}`);
      return null;
    }
    const conf = await response.json();
    return Array.isArray(conf?.data) ? conf.data : null;
  } catch (cause) {
    error(`\tError: ${cause}`);
    error('\tPlease make sure SiYuan is running!');
    return null;
  }
}

async function chooseTarget(workspaces) {
  const count = workspaces.length;
  log(`>>> Got ${count} SiYuan ${count > 1 ? 'workspaces' : 'workspace'}`);
  workspaces.forEach((workspace, index) => {
    log(`\t[${index}] ${workspace.path}`);
  });

  if (count === 1) {
    return path.join(workspaces[0].path, 'data', 'plugins');
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.question(`\tPlease select a workspace[0-${count - 1}]: `, resolve);
  });
  rl.close();
  const index = Number.parseInt(answer, 10);
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    error(`Invalid workspace index: ${answer}`);
    process.exit(1);
  }
  return path.join(workspaces[index].path, 'data', 'plugins');
}

/**
 * Resolve `<workspace>/data/plugins` or the explicit `SIYUAN_PLUGIN_DIR`.
 * The environment variable takes precedence so CI and custom workspaces can
 * bypass the running-kernel discovery.
 */
export async function resolveTargetDir() {
  const explicit = process.env.SIYUAN_PLUGIN_DIR?.trim();
  if (explicit) {
    log(`>>> Using SIYUAN_PLUGIN_DIR: ${explicit}`);
    return path.resolve(explicit);
  }

  log('>>> Looking for a running SiYuan workspace...');
  const workspaces = await getSiYuanDir();
  if (!workspaces || workspaces.length === 0) {
    error('>>> Could not find a SiYuan workspace.');
    error('\tMake sure SiYuan is running, or set SIYUAN_PLUGIN_DIR to <workspace>/data/plugins.');
    process.exit(1);
  }
  const targetDir = await chooseTarget(workspaces);
  log(`>>> Plugin directory: ${targetDir}`);
  return targetDir;
}

export function getThisPluginName() {
  if (!fs.existsSync('./public/plugin.json')) {
    process.chdir('..');
    if (!fs.existsSync('./public/plugin.json')) {
      error('Failed! public/plugin.json not found');
      return null;
    }
  }
  const plugin = JSON.parse(fs.readFileSync('./public/plugin.json', 'utf8'));
  if (!plugin?.name) {
    error('Failed! Please set plugin name in public/plugin.json');
    return null;
  }
  return plugin.name;
}

export function cmpPath(path1, path2) {
  const normalize = (value) => path.resolve(value).replaceAll('\\', '/').replace(/\/+$/, '');
  return normalize(path1) === normalize(path2);
}

export function copyDirectory(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });
  fs.cpSync(srcDir, dstDir, { recursive: true });
}

/**
 * Make a directory symlink. Junction links are intentionally not used because
 * SiYuan (Go 1.23+) does not treat Windows junctions as symlinks.
 */
export function makeSymbolicLink(srcPath, targetPath) {
  let targetStat;
  try {
    targetStat = fs.lstatSync(targetPath);
  } catch (cause) {
    if (cause.code !== 'ENOENT') {
      throw cause;
    }
  }

  if (targetStat) {
    if (!targetStat.isSymbolicLink()) {
      error(`Failed! ${targetPath} already exists and is not a symbolic link.`);
      error('Rename or remove it first, or use "pnpm make-install" to copy the build instead.');
      process.exit(1);
    }
    const existingTarget = path.resolve(path.dirname(targetPath), fs.readlinkSync(targetPath));
    if (cmpPath(existingTarget, srcPath)) {
      log(`Good! ${targetPath} is already linked to ${srcPath}`);
      return;
    }
    error(`Error! ${targetPath} already links to ${existingTarget}`);
    process.exit(1);
  }

  try {
    fs.symlinkSync(srcPath, targetPath, 'dir');
    log(`Done! Created symlink: ${targetPath}`);
    return;
  } catch (cause) {
    if (cause.code !== 'EPERM' && cause.code !== 'EACCES') {
      throw cause;
    }
    if (process.platform === 'win32' && elevateSymlink(srcPath, targetPath)) {
      log(`Done! Created symlink with elevated permissions: ${targetPath}`);
      return;
    }
    error('Cannot create the directory symlink (permission denied).');
    error('Choose one of these options:');
    if (process.platform === 'win32') {
      error('  1. Approve the automatic UAC prompt, or enable Windows Developer Mode.');
      error('  2. Run the terminal as Administrator and retry.');
    } else {
      error('  1. Fix the permissions of the SiYuan plugin directory.');
      error('  2. Run with a user that can create symlinks (for example, via sudo).');
    }
    error('  3. Run "pnpm make-install" to copy dist/ into the plugin directory instead (no live reload).');
    process.exit(1);
  }
}

/**
 * On Windows, ask for UAC elevation only for the link creation step. The dev
 * watcher itself should keep running as the normal, non-elevated user.
 */
function elevateSymlink(srcPath, targetPath) {
  const quote = (value) => `'${value.replaceAll("'", "''")}'`;
  const createScript = [
    "$ErrorActionPreference = 'Stop'",
    `New-Item -ItemType SymbolicLink -Path ${quote(targetPath)} -Target ${quote(srcPath)} | Out-Null`,
  ].join('; ');
  const encoded = Buffer.from(createScript, 'utf16le').toString('base64');
  const command = [
    "$process = Start-Process -FilePath 'powershell.exe'",
    `-ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand','${encoded}')`,
    '-Verb RunAs -Wait -PassThru',
    '; exit $process.ExitCode',
  ].join(' ');
  log('Requesting administrator permission to create the symbolic link...');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
    stdio: 'inherit',
    windowsHide: false,
  });
  if (result.status !== 0) {
    return false;
  }
  try {
    return fs.lstatSync(targetPath).isSymbolicLink();
  } catch {
    return false;
  }
}
