/* Instalação e atualização independentes do fluxo de conversa e da API. */
(() => {
 'use strict';
 const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
 // A instalação deve acontecer na página completa, nunca dentro do widget.
 if (window.self !== window.top) return;
 const panel = document.getElementById('installDialog');
 const confirm = document.getElementById('confirmInstall');
 const status = document.getElementById('installStatus');
 const button = document.createElement('button');
 button.className = 'icon-btn install-button';
 button.type = 'button';button.id = 'installLara';
 button.setAttribute('aria-label', 'Instalar Lara no celular');
 button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg><span>Instalar</span>';
 document.querySelector('.header-tools').prepend(button);
 button.hidden = standalone();
 let installEvent = null, registration = null, installing = false;
 window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();installEvent = event;
  button.hidden = standalone();confirm.hidden = standalone();
  status.textContent = 'Pronto para instalar. Toque no botão e confirme no Android.';
 });
 window.addEventListener('appinstalled', () => {
  installEvent = null;button.hidden = true;confirm.hidden = true;
  status.textContent = 'Lara instalada. Procure o ícone na tela inicial ou na lista de aplicativos.';
 });
 button.addEventListener('click', () => {
  if (standalone()) return;
  confirm.hidden = !installEvent;
  if (!installEvent) status.textContent = 'Se o navegador não oferecer a instalação, siga o passo a passo abaixo.';
  panel.showModal();
 });
 document.getElementById('closeInstall').addEventListener('click', () => panel.close());
 confirm.addEventListener('click', async () => {
  if (!installEvent || installing) return;
  installing = true;confirm.disabled = true;
  const event = installEvent;installEvent = null;
  try {
   await event.prompt();const result = await event.userChoice;
   status.textContent = result.outcome === 'accepted' ? 'Instalação solicitada. Aguarde a confirmação do Android.' : 'Você pode instalar mais tarde pelo menu do navegador.';
  } catch {status.textContent = 'Abra o menu do navegador e escolha Instalar aplicativo ou Adicionar à tela inicial.';}
  finally {installing = false;confirm.disabled = false;confirm.hidden = true;}
 });
 const app = document.querySelector('.app');
 const offline = document.createElement('div');offline.className = 'android-notice';offline.setAttribute('role','status');
 offline.textContent = 'Você está sem internet. Reconecte para conversar com a Lara. Nenhuma mensagem é enviada automaticamente.';
 app.insertBefore(offline, document.getElementById('messages'));
 const connection = () => {offline.hidden = navigator.onLine !== false;};
 window.addEventListener('online',connection);window.addEventListener('offline',connection);connection();
 const resize = () => {if (window.visualViewport) document.documentElement.style.setProperty('--lara-viewport', Math.round(window.visualViewport.height)+'px');};
 window.visualViewport?.addEventListener('resize',resize);resize();
 const updatePanel = document.getElementById('updateDialog');
 const updateStatus = document.getElementById('updateStatus');
 const checkUpdate = document.getElementById('checkUpdate');
 const applyUpdate = document.getElementById('applyUpdate');
 const actions = document.createElement('div');actions.className = 'pwa-actions';
 const updateButton = document.createElement('button');updateButton.type = 'button';updateButton.id = 'updateLara';updateButton.className = 'update-lara';
 updateButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 7v5h-5M19 12a7 7 0 1 0-2 5"/></svg><span>Atualizar Lara</span>';
 actions.append(updateButton);document.querySelector('.bottom').insertBefore(actions,document.querySelector('.info'));
 document.getElementById('closeUpdate').addEventListener('click', () => updatePanel.close());
 updateButton.addEventListener('click', () => {updatePanel.showModal();void findUpdate();});
 checkUpdate.addEventListener('click', () => {void findUpdate();});
 let registrationPromise = Promise.resolve(null);
 const supported = 'serviceWorker' in navigator && window.isSecureContext;
 let checking = false;
 const report = message => {updateStatus.textContent = message;};
 function refreshUpdateState() {
  const waiting = !!registration?.waiting && !!navigator.serviceWorker?.controller;
  applyUpdate.hidden = !waiting;
  if (waiting) {
   update.hidden = false;
   report('Nova versão pronta. Toque em Atualizar agora para usar as novidades.');
  } else if (registration?.installing) report('Baixando a nova versão. Aguarde a conclusão.');
  else report('Sua Lara já está atualizada.');
 }
 async function findUpdate() {
  if (checking) return;
  if (navigator.onLine === false) {report('Você está sem internet. Conecte-se e toque em Verificar novamente.');return;}
  if (!supported) {report('Abra a Lara no Chrome com conexão segura para verificar as atualizações do aplicativo.');return;}
  checking = true;checkUpdate.disabled = true;report('Verificando atualizações…');
  try {
   registration = await registrationPromise;
   if (!registration) throw Error('registro indisponível');
   await registration.update();refreshUpdateState();
  } catch {report('Não foi possível verificar agora. Confira sua conexão e tente novamente.');}
  finally {checking = false;checkUpdate.disabled = false;}
 }
 if (!supported) return;
 const update = document.createElement('div');update.className = 'android-notice';update.hidden = true;update.setAttribute('role','status');
 const text = document.createElement('span');text.textContent = 'Nova versão da Lara disponível. Termine sua mensagem antes de atualizar.';
 const apply = document.createElement('button');apply.type = 'button';apply.textContent = 'Atualizar';update.append(text,apply);app.insertBefore(update,offline);
 let reloadRequested = false;
 function applyNewVersion() {
  const draft = document.getElementById('message').value.trim();
  const audioOpen = !document.getElementById('audioBox').hidden;
  const busy = document.getElementById('send').disabled;
  if (draft || audioOpen || busy) {
   const message = 'Envie ou guarde seu rascunho, finalize o áudio e aguarde a resposta antes de atualizar.';
   text.textContent = message;report(message);return;
  }
  if (registration?.waiting) {reloadRequested = true;report('Atualizando a Lara…');apply.disabled = true;applyUpdate.disabled = true;registration.waiting.postMessage({type:'LARA_APPLY_UPDATE'});}
  else {void findUpdate();}
 }
 apply.addEventListener('click', applyNewVersion);
 applyUpdate.addEventListener('click', applyNewVersion);
 navigator.serviceWorker.addEventListener('controllerchange', () => {if (reloadRequested) window.location.reload();});
 registrationPromise = navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg => {
  registration = reg;
  const watch = () => {
   const worker = reg.installing;
   worker?.addEventListener('statechange', () => {
    if (worker.state === 'redundant') {report('Não foi possível baixar a atualização. Tente verificar novamente.');return;}
    refreshUpdateState();
   });
   refreshUpdateState();
  };
  reg.addEventListener('updatefound',watch);watch();return reg;
 }).catch(() => {report('Não foi possível verificar agora. Confira sua conexão e tente novamente.');return null;});
})();
