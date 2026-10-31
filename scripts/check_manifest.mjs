import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const fail = (message) => {
  console.error(`[check-manifest] ${message}`);
  process.exit(1);
};

const packageJson = readJson('package.json');
const pluginJson = readJson('plugin.json');

if (packageJson.version !== pluginJson.version) {
  fail(`version mismatch: package.json=${packageJson.version}, plugin.json=${pluginJson.version}`);
}

const requiredPluginFields = ['name', 'author', 'url', 'version', 'minAppVersion', 'displayName', 'description'];
for (const field of requiredPluginFields) {
  if (!pluginJson[field]) {
    fail(`plugin.json is missing required field: ${field}`);
  }
}

if (!/^\d+\.\d+\.\d+$/.test(pluginJson.minAppVersion)) {
  fail(`plugin.json minAppVersion must be a semver version: ${pluginJson.minAppVersion}`);
}

for (const field of ['displayName', 'description', 'readme']) {
  const value = pluginJson[field];
  if (value && typeof value === 'object' && !Array.isArray(value) && !value.default) {
    fail(`plugin.json ${field} must contain a "default" entry`);
  }
}

const i18nDir = join(root, 'public/i18n');
if (!existsSync(i18nDir)) {
  fail('public/i18n is missing');
}

const i18nFiles = readdirSync(i18nDir).filter((file) => file.endsWith('.json'));
if (!i18nFiles.includes('en.json') || !i18nFiles.includes('zh-CN.json')) {
  fail('public/i18n must contain en.json and zh-CN.json');
}

const flattenKeys = (value, prefix = '') =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === 'object' && !Array.isArray(child) ? flattenKeys(child, path) : [path];
  });

const referenceKeys = flattenKeys(readJson('public/i18n/en.json')).sort();
for (const file of i18nFiles) {
  const keys = flattenKeys(readJson(`public/i18n/${file}`)).sort();
  if (keys.join('|') !== referenceKeys.join('|')) {
    fail(`i18n key mismatch in ${file}`);
  }
}

if (existsSync(join(root, 'src'))) {
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(path);
      }
      return [path];
    });

  const sourceFiles = walk(join(root, 'src'));
  const vueFiles = sourceFiles.filter((file) => file.endsWith('.vue'));
  if (vueFiles.length > 0) {
    fail(`Vue source files remain: ${vueFiles.map((file) => file.replace(root, '')).join(', ')}`);
  }
}

const dependencyNames = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies });
const vueDependencies = dependencyNames.filter(
  (name) => name === 'vue' || name.startsWith('@vue/') || name.includes('vue-') || name.includes('plugin-vue')
);
if (vueDependencies.length > 0) {
  fail(`Vue dependencies remain: ${vueDependencies.join(', ')}`);
}

console.log('[check-manifest] OK');
