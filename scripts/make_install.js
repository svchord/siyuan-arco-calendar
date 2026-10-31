import fs from 'node:fs';
import path from 'node:path';
import { error, copyDirectory, getThisPluginName, log, resolveTargetDir } from './utils.js';

const targetDir = await resolveTargetDir();
if (!fs.existsSync(targetDir)) {
  error(`Failed! Plugin directory does not exist: ${targetDir}`);
  error('Check the workspace path, or set SIYUAN_PLUGIN_DIR to <workspace>/data/plugins.');
  process.exit(1);
}

const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  error('Failed! dist/ not found. Run "pnpm build" first (or use "pnpm make-install").');
  process.exit(1);
}

const name = getThisPluginName();
if (!name) {
  process.exit(1);
}

const targetPath = path.join(targetDir, name);
if (fs.existsSync(targetPath) || isSymlink(targetPath)) {
  log(`>>> Replacing existing plugin directory: ${targetPath}`);
  fs.rmSync(targetPath, { recursive: true, force: true });
}

copyDirectory(distDir, targetPath);
log(`Done! Copied dist/ to ${targetPath}`);
log('Reload or enable the plugin in SiYuan.');

function isSymlink(target) {
  try {
    return fs.lstatSync(target).isSymbolicLink();
  } catch (cause) {
    if (cause.code === 'ENOENT') {
      return false;
    }
    throw cause;
  }
}
