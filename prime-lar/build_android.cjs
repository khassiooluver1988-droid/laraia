// Executado pelo build principal. Apenas a interface real recebe instalação PWA.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let html = read('index.html').replace(/<!-- LARA_ANDROID_HEAD -->[\s\S]*?<!-- FIM_LARA_ANDROID_HEAD -->\n?/g, '').replace(/<!-- LARA_ANDROID_BODY -->[\s\S]*?<!-- FIM_LARA_ANDROID_BODY -->\n?/g, '');
const head = `<!-- LARA_ANDROID_HEAD -->
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="assets/android/lara-192.png">
<link rel="apple-touch-icon" href="assets/android/lara-192.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Lara">
<link rel="stylesheet" href="android.css">
<script src="android.js" defer></script>
<!-- FIM_LARA_ANDROID_HEAD -->`;
const body = `<!-- LARA_ANDROID_BODY -->
<dialog id="installDialog" aria-labelledby="installTitle">
 <div class="dialog-head"><h2 id="installTitle">Lara no seu Android</h2><button class="close" id="closeInstall" type="button" aria-label="Fechar instruções de instalação">×</button></div>
 <div class="dialog-body">
  <div class="install-identity"><img src="assets/android/lara-192.png" width="72" height="72" alt="Ícone da Lara"><div><strong>Lara · Prime Lar</strong><p>Seu novo lar começa com uma conversa.</p></div></div>
  <p>Tenha a Lara na tela inicial do celular ou tablet, com acesso direto ao atendimento da Prime Lar.</p>
  <button class="btn primary" id="confirmInstall" type="button" hidden>Instalar aplicativo</button>
  <p id="installStatus" role="status"></p>
  <ol><li>Abra este link no <strong>Chrome do Android</strong>.</li><li>Toque em <strong>Instalar aplicativo</strong>. Se essa opção não aparecer aqui, abra o menu <strong>⋮</strong> do Chrome e procure <strong>Adicionar à tela inicial</strong> ou <strong>Instalar aplicativo</strong>.</li><li>Confirme a instalação e abra o ícone <strong>Lara</strong>.</li></ol>
  <p>Recebeu pelo Instagram ou WhatsApp? Use a opção de abrir no navegador para instalar.</p>
  <small>O atendimento por inteligência artificial e a transcrição de áudio precisam de internet. A instalação é feita pelo navegador, sem download de APK ou publicação na Play Store.</small>
 </div>
</dialog>
<dialog id="updateDialog" aria-labelledby="updateTitle">
 <div class="dialog-head"><h2 id="updateTitle">Atualizar Lara</h2><button class="close" id="closeUpdate" type="button" aria-label="Fechar atualização">×</button></div>
 <div class="dialog-body">
  <p>Verifique se há uma nova versão da Lara para este aparelho.</p>
  <p id="updateStatus" role="status" aria-live="polite">Toque em verificar para buscar atualizações.</p>
  <div class="dialog-actions"><button class="btn" id="checkUpdate" type="button">Verificar novamente</button><button class="btn primary" id="applyUpdate" type="button" hidden>Atualizar agora</button></div>
  <small>Antes de atualizar, termine de enviar sua mensagem ou áudio e aguarde a resposta. Não é necessário reinstalar o aplicativo.</small>
 </div>
</dialog>
<!-- FIM_LARA_ANDROID_BODY -->`;
html = html.replace('</head>', head+'\n</head>').replace('</body>', body+'\n</body>');
fs.writeFileSync(path.join(root, 'index.html'), html);
const core = ['index.html','android.js','android.css','manifest.webmanifest','assets/lara-prime-lar.webp','assets/prime-lar-logo.jpg','assets/village-por-do-sol.webp','assets/android/lara-192.png','assets/android/lara-512.png','assets/android/lara-maskable-512.png'];
const digest = crypto.createHash('sha256');
for (const file of core) digest.update(fs.readFileSync(path.join(root, file)));
digest.update(read('prime-lar/sw-template.js'));
const revision = digest.digest('hex').slice(0, 16);
const worker = read('prime-lar/sw-template.js').replace('__REVISION__', revision).replace('__CORE_FILES__', JSON.stringify(core));
fs.writeFileSync(path.join(root, 'sw.js'), worker);
console.log('Android PWA compilado. Revisão: '+revision);
