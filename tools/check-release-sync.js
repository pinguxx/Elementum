#!/usr/bin/env node
/**
 * Release Version & Metadata Synchronization Gate
 * Ensures package.json, lockfile, MCP server registry metadata, CHANGELOG,
 * README, QUALITY matrix counts, security/stability policy docs, HTML badges,
 * and Penpot tooling all reference the exact same release version.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

const pkg = readJson('package.json');
const version = pkg.version;
const match = /^(\d+\.\d+)\./.exec(version);
const minorLine = match ? `${match[1]}.x` : version;

const failures = [];

function check(label, condition, detail) {
  if (!condition) {
    failures.push(`- ${label}: ${detail}`);
  }
}

// 1. package-lock.json
const lock = readJson('package-lock.json');
check(
  'package-lock.json (root version)',
  lock.version === version,
  `expected "${version}", found "${lock.version}"`
);
check(
  'package-lock.json (packages[""].version)',
  lock.packages?.['']?.version === version,
  `expected "${version}", found "${lock.packages?.['']?.version}"`
);

// 2. server.json (MCP Registry)
const srv = readJson('server.json');
check(
  'server.json (version)',
  srv.version === version,
  `expected "${version}", found "${srv.version}"`
);
check(
  'server.json (packages[0].version)',
  srv.packages?.[0]?.version === version,
  `expected "${version}", found "${srv.packages?.[0]?.version}"`
);
check(
  'server.json (remotes[0].url)',
  srv.remotes?.[0]?.url === 'https://elementum-sage.vercel.app/mcp',
  `expected "https://elementum-sage.vercel.app/mcp", found "${srv.remotes?.[0]?.url}"`
);

// 3. CHANGELOG.md
const changelog = readText('CHANGELOG.md');
check(
  'CHANGELOG.md',
  changelog.includes(`## [${version}]`),
  `missing heading section "## [${version}]"`
);

// 4. README.md
const readme = readText('README.md');
check(
  'README.md',
  readme.includes(`\`v${version}\``),
  `missing version badge/header "\`v${version}\`"`
);

// 5. QUALITY.md (version + consistent counts)
const quality = readText('QUALITY.md');
check(
  'QUALITY.md (header)',
  quality.includes(`\`@wcomp/elementum@${version}\``),
  `missing summary header "\`@wcomp/elementum@${version}\`"`
);

const totalMatch = /- \*\*Total Registered Custom Elements\*\*: \*\*(\d+)\*\*/.exec(quality);
const pvMatch = /- \*\*🟢 Production Verified\*\*: \*\*(\d+)\*\*/.exec(quality);
const stableMatch = /- \*\*🔵 Stable\*\*: \*\*(\d+)\*\*/.exec(quality);
const expMatch = /- \*\*🟡 Experimental\*\*: \*\*(\d+)\*\*/.exec(quality);
if (!totalMatch || !pvMatch || !stableMatch || !expMatch) {
  check('QUALITY.md (counts)', false, 'missing one or more component tier count lines');
} else {
  const total = Number(totalMatch[1]);
  const pv = Number(pvMatch[1]);
  const stable = Number(stableMatch[1]);
  const exp = Number(expMatch[1]);
  check(
    'QUALITY.md (tier sum)',
    pv + stable + exp === total,
    `Production Verified (${pv}) + Stable (${stable}) + Experimental (${exp}) = ${pv + stable + exp}, expected ${total}`
  );
}

// 6. SECURITY.md
const security = readText('SECURITY.md');
check(
  'SECURITY.md',
  security.includes(`| \`${minorLine}\` |`),
  `missing active support table row "| \`${minorLine}\` |"`
);

// 7. docs/stability-and-1.0.md
const stability = readText('docs/stability-and-1.0.md');
check(
  'docs/stability-and-1.0.md',
  stability.includes(`\`${minorLine}\``),
  `missing active minor line reference "\`${minorLine}\`"`
);

// 8. HTML navbar badges
for (const htmlFile of ['index.html', 'showcase.html']) {
  const html = readText(htmlFile);
  check(
    htmlFile,
    html.includes(`badge="v${version}"`),
    `missing navbar badge attribute badge="v${version}"`
  );
}

// 9. Penpot MCP client metadata
for (const toolFile of ['tools/sync-penpot-mcp.js', 'tools/penpot-to-elementum.js']) {
  const src = readText(toolFile);
  check(
    toolFile,
    src.includes(`version: '${version}'`),
    `missing MCP clientInfo version: '${version}'`
  );
}

// 10. AUDITS.md
const audits = readText('AUDITS.md');
check(
  'AUDITS.md',
  audits.includes(`\`@wcomp/elementum@${version}\``),
  `missing package version reference "\`@wcomp/elementum@${version}\`"`
);

if (failures.length > 0) {
  console.error(`❌ Release sync check FAILED for @wcomp/elementum@${version}:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(
  `✔ Release sync check PASSED: @wcomp/elementum@${version} (${minorLine}) synced across lockfile, server.json, CHANGELOG, README, QUALITY, SECURITY, stability docs, HTML badges, and Penpot tools.`
);
