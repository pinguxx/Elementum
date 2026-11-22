#!/usr/bin/env node
/**
 * Automated Starters Build Verification for @wcomp/elementum
 * Packs the real npm tarball (.tgz), copies each buildable starter into a
 * clean temporary directory (leaving starters/ untouched), rewrites
 * "@wcomp/elementum": "latest" -> "file:<tarball>", runs `npm install` +
 * `npm run build`, verifies non-empty dist/ HTML/JS output, and reports
 * raw and gzipped dist sizes.
 *
 * Usage:
 *   node tools/verify-starters.js                        # Verifies all 5 starters
 *   node tools/verify-starters.js --starter=react-19     # Verifies a single starter
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const ALL_STARTERS = [
  'react-19',
  'vue-3',
  'svelte-5',
  'framework-comparison/react',
  'framework-comparison/vue',
];

const starterFlag = process.argv.find((arg) => arg.startsWith('--starter='));
let targets = ALL_STARTERS;
if (starterFlag) {
  const requested = starterFlag.slice('--starter='.length);
  if (!ALL_STARTERS.includes(requested)) {
    console.error(`Invalid --starter "${requested}". Expected one of: ${ALL_STARTERS.join(', ')}`);
    process.exit(1);
  }
  targets = [requested];
}

function collectDistFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectDistFiles(full));
    } else {
      const buf = fs.readFileSync(full);
      results.push({
        file: path.relative(dir, full).replace(/\\/g, '/'),
        rawBytes: buf.length,
        gzBytes: zlib.gzipSync(buf, { level: 9 }).length,
      });
    }
  }
  return results;
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'elementum-starters-'));
console.log(`📦 Starters Build Verification in ${tmpRoot}`);

try {
  const packOut = execFileSync(npmCmd, ['pack', '--pack-destination', tmpRoot], {
    cwd: rootDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  }).trim();
  const tgzName = packOut.split(/\r?\n/).pop().trim();
  const tgzPath = path.join(tmpRoot, tgzName);
  if (!fs.existsSync(tgzPath)) {
    throw new Error(`Expected tarball not found: ${tgzPath}`);
  }
  const tarballSpec = `file:${tgzPath.replace(/\\/g, '/')}`;
  console.log(`✔ Packed ${tgzName}`);

  for (const starter of targets) {
    const srcDir = path.join(rootDir, 'starters', starter);
    const workDir = path.join(tmpRoot, starter.replace(/\//g, '__'));
    fs.mkdirSync(workDir, { recursive: true });
    fs.cpSync(srcDir, workDir, {
      recursive: true,
      filter: (p) => {
        const base = path.basename(p);
        return base !== 'node_modules' && base !== 'dist';
      },
    });

    const pkgPath = path.join(workDir, 'package.json');
    const starterPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (starterPkg.dependencies?.['@wcomp/elementum']) {
      starterPkg.dependencies['@wcomp/elementum'] = tarballSpec;
    }
    fs.writeFileSync(pkgPath, `${JSON.stringify(starterPkg, null, 2)}\n`, 'utf8');

    console.log(`\n🔨 Installing & building starter "${starter}"...`);
    execFileSync(npmCmd, ['install', '--no-audit', '--no-fund'], {
      cwd: workDir,
      stdio: 'pipe',
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });

    try {
      execFileSync(npmCmd, ['run', 'build'], {
        cwd: workDir,
        stdio: 'pipe',
        encoding: 'utf8',
        shell: process.platform === 'win32',
      });
    } catch (err) {
      if (err.stdout) console.error(err.stdout);
      if (err.stderr) console.error(err.stderr);
      throw err;
    }

    const distDir = path.join(workDir, 'dist');
    const files = collectDistFiles(distDir);
    const hasHtml = files.some((f) => f.file.endsWith('.html') && f.rawBytes > 0);
    const hasJs = files.some((f) => f.file.endsWith('.js') && f.rawBytes > 0);
    if (!hasHtml || !hasJs) {
      throw new Error(`Starter "${starter}" dist/ missing non-empty HTML or JS bundle assets.`);
    }

    const totalRaw = files.reduce((s, f) => s + f.rawBytes, 0);
    const totalGz = files.reduce((s, f) => s + f.gzBytes, 0);
    console.log(
      `✔ Starter "${starter}" built (${files.length} asset(s), ${(totalRaw / 1024).toFixed(1)} KB raw / ${(totalGz / 1024).toFixed(1)} KB gzip)`
    );
  }

  console.log(`\n✅ Verified ${targets.length} starter build(s) cleanly.`);
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
