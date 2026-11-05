const fs = require('node:fs');
const path = require('node:path');
const zip = require('bestzip');
(async () => {
  const root = path.resolve(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'dist/manifest.json'), 'utf8'));
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(manifest.repoUrl || '')) {
    throw new Error('Set repoUrl to the actual public GitHub repository before packaging for review.');
  }
  if (manifest.unlisted !== true) throw new Error('Personal release must set unlisted: true.');
  const required = ['manifest.json','App.css','README.md','LICENSE','logo.svg','index.html','index.js','index-sandbox.js','inline_tree.js','inline_tree-sandbox.js','inline_tree.css','inline_tree-sandbox.css'];
  for (const name of required) if (!fs.existsSync(path.join(root,'dist',name))) throw new Error(`Missing build asset: ${name}`);
  await zip({cwd:path.join(root,'dist'),source:required,destination:path.join(root,'PluginZip.zip')});
  console.log('PluginZip.zip created (unlisted; review required).');
})().catch(error => { console.error(error.message); process.exitCode=1; });
