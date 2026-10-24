// Publicação: respeita edições diretas no index e recompila fontes quando alteradas.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
let fromSources = process.argv.includes('--from-sources');
if (process.env.GITHUB_EVENT_PATH && process.env.GITHUB_EVENT_NAME === 'push') {
 const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
 if (!/^[a-f0-9]{40}$/.test(event.before || '') || /^0+$/.test(event.before)) throw Error('Não foi possível verificar a base da publicação.');
 const changed = execFileSync('git',['diff','--name-only',event.before,'HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n');
 const sources = new Set(['prime-lar/template.html','prime-lar/app.js','prime-lar/build_local.cjs']);
 fromSources = changed.some(file => sources.has(file));
 // Evita sobrescrever silenciosamente uma edição da interface compilada.
 if (fromSources && changed.includes('index.html')) {
  console.log('Fontes e index alterados: usando as fontes como versão canônica.');
 }
}
if (fromSources) execFileSync(process.execPath,['build_local.cjs'],{cwd:__dirname,stdio:'inherit'});
else require('./build_android.cjs');
