#!/usr/bin/env node

/**
 * Inject output: "standalone" into next.config.ts
 * Supports multiple config file formats:
 * - const nextConfig = { ... }
 * - module.exports = { ... }
 * - export default { ... }
 * - export default identifier (where identifier is defined as const/let/var)
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(process.cwd(), 'next.config.ts');

// Check if file exists
if (!fs.existsSync(configPath)) {
  console.log('next.config.ts not found, skipping injection');
  process.exit(0);
}

let config = fs.readFileSync(configPath, 'utf8');

// Check if output: "standalone" already exists
if (/output\s*:\s*["']standalone["']/.test(config)) {
  console.log('✓ output: "standalone" already present in next.config.ts');
  process.exit(0);
}

let injected = false;

// Pattern 1: const/let/var nextConfig (with optional type annotation) = { ... }
// Matches: const nextConfig = { or const nextConfig: NextConfig = {
const reConst = /([const|let|var]+)\s+([A-Za-z0-9_]+)(\s*:\s*[A-Za-z0-9_<>,\s]+)?\s*=[^\{]*\{/m;
if (reConst.test(config)) {
  config = config.replace(reConst, (m) => m + '\n  output: "standalone",');
  console.log('✓ Injected into: const/let/var declaration');
  injected = true;
}

// Pattern 2: module.exports = { ... }
if (!injected) {
  const reModule = /module\.exports\s*=\s*\{/m;
  if (reModule.test(config)) {
    config = config.replace(reModule, (m) => m + '\n  output: "standalone",');
    console.log('✓ Injected into: module.exports');
    injected = true;
  }
}

// Pattern 3: export default { ... }
if (!injected) {
  const reExportObj = /export\s+default\s*\{\s*/m;
  if (reExportObj.test(config)) {
    config = config.replace(reExportObj, (m) => m + '\n  output: "standalone",');
    console.log('✓ Injected into: export default object');
    injected = true;
  }
}

// Pattern 4: export default identifier; find identifier declaration
if (!injected) {
  const reExportId = /export\s+default\s+([A-Za-z0-9_]+)/m;
  const match = config.match(reExportId);
  if (match) {
    const id = match[1];
    const reIdDecl = new RegExp(
      `([const|let|var]+)\\s+${id}\\s*=[^\\{]*\\{`,
      'm'
    );
    if (reIdDecl.test(config)) {
      config = config.replace(reIdDecl, (m) => m + '\n  output: "standalone",');
      console.log(`✓ Injected into: export default ${id} declaration`);
      injected = true;
    }
  }
}

if (injected) {
  fs.writeFileSync(configPath, config);
  console.log('✓ Successfully injected output: "standalone" into next.config.ts');
} else {
  console.log(
    '⚠ Warning: Could not inject output into next.config.ts (unknown format)'
  );
  console.log(
    'Continuing build anyway. Ensure next.config.ts has output: "standalone" if needed.'
  );
}
