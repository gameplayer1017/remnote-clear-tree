const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clear-tree-test-'));
esbuild.buildSync({ entryPoints: ['tests/spec.ts'], bundle: true, platform: 'node', outfile: path.join(dir,'test.cjs') });
require(path.join(dir,'test.cjs')).then(() => fs.rmSync(dir, { recursive:true, force:true })).catch(e => { console.error(e); process.exitCode=1; });
