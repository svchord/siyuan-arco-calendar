/**
 * 把 semantic-release 计算出的版本号写入指定 JSON 文件。
 * 用法：node ./scripts/sync-version.mjs <file> <version>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , file, version] = process.argv;
if (!file || !version) {
  console.error('usage: node ./scripts/sync-version.mjs <file> <version>');
  process.exit(1);
}
const json = JSON.parse(readFileSync(file, 'utf8'));
json.version = version;
writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log('[sync-version] ' + file + ' -> ' + version);
