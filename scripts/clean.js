import { existsSync, lstatSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Recursively remove a path. Explicit traversal keeps cleanup reliable on
 * Windows where a directory can be a junction/symlink to another checkout.
 */
function removePath(path) {
  if (!existsSync(path)) {
    return;
  }

  if (lstatSync(path).isDirectory() && !lstatSync(path).isSymbolicLink()) {
    for (const entry of readdirSync(path)) {
      removePath(join(path, entry));
    }
    rmSync(path, { recursive: true, force: true });
    return;
  }

  unlinkSync(path);
}

for (const path of ['dist', 'dev', 'package.zip']) {
  removePath(path);
}
