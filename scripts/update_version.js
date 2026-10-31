import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const writeJson = (filePath, data) => fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

const parseVersion = (version) => version.split('.').map(Number);

const incrementVersion = (version, type) => {
  let [major, minor, patch] = parseVersion(version);
  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
};

const ask = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const pluginJsonPath = path.join(process.cwd(), 'public/plugin.json');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const pluginJson = readJson(pluginJsonPath);
const packageJson = readJson(packageJsonPath);

const currentVersion = packageJson.version;
console.log(`\nCurrent version: ${currentVersion}\n`);
console.log(`  1. patch  -> ${incrementVersion(currentVersion, 'patch')}`);
console.log(`  2. minor  -> ${incrementVersion(currentVersion, 'minor')}`);
console.log(`  3. major  -> ${incrementVersion(currentVersion, 'major')}`);
console.log('  4. manual');
console.log('  0. cancel\n');

const choice = await ask('Choose (1/2/3/4): ');
let nextVersion;
if (choice === '1') nextVersion = incrementVersion(currentVersion, 'patch');
else if (choice === '2') nextVersion = incrementVersion(currentVersion, 'minor');
else if (choice === '3') nextVersion = incrementVersion(currentVersion, 'major');
else if (choice === '4') nextVersion = await ask('Enter version (a.b.c): ');
else {
  console.log('Cancelled.');
  process.exit(0);
}

if (!/^\d+\.\d+\.\d+$/.test(nextVersion)) {
  console.error(`Invalid version: ${nextVersion}`);
  process.exit(1);
}

packageJson.version = nextVersion;
pluginJson.version = nextVersion;
writeJson(packageJsonPath, packageJson);
writeJson(pluginJsonPath, pluginJson);
console.log(`Updated package.json and plugin.json to ${nextVersion}`);
