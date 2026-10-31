import fs from 'node:fs';
import path from 'node:path';
import { error, getThisPluginName, log, makeSymbolicLink, resolveTargetDir } from './utils.js';

const targetDir = await resolveTargetDir();
if (!fs.existsSync(targetDir)) {
  error(`Failed! Plugin directory does not exist: ${targetDir}`);
  error('Check the workspace path, or set SIYUAN_PLUGIN_DIR to <workspace>/data/plugins.');
  process.exit(1);
}

const devDir = path.join(process.cwd(), 'dev');
fs.mkdirSync(devDir, { recursive: true });
log(`>>> Dev directory: ${devDir}`);
if (!fs.existsSync(path.join(devDir, 'index.js'))) {
  log('>>> dev/index.js does not exist yet; run "pnpm dev" to build before enabling the plugin.');
}
log('>>> Tip: run "pnpm dev" in another terminal to build and watch.');

const name = getThisPluginName();
if (!name) {
  process.exit(1);
}

makeSymbolicLink(devDir, path.join(targetDir, name));
