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
 if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
 const update = document.createElement('div');update.className = 'android-notice';update.hidden = true;update.setAttribute('role','status');
 const text = document.createElement('span');text.textContent = 'Nova versão da Lara disponível. Termine sua mensagem antes de atualizar.';
 const apply = document.createElement('button');apply.type = 'button';apply.textContent = 'Atualizar';update.append(text,apply);app.insertBefore(update,offline);
 let reloadRequested = false;
 apply.addEventListener('click', () => {
  const draft = document.getElementById('message').value.trim();
  const audioOpen = !document.getElementById('audioBox').hidden;
  const busy = document.getElementById('send').disabled;
  if (draft || audioOpen || busy) {
   text.textContent = 'Envie ou guarde seu rascunho, finalize o áudio e aguarde a resposta antes de atualizar.';return;
  }
  if (registration?.waiting) {reloadRequested = true;registration.waiting.postMessage({type:'LARA_APPLY_UPDATE'});}
 });
 navigator.serviceWorker.addEventListener('controllerchange', () => {if (reloadRequested) window.location.reload();});
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg => {
  registration = reg;
  const ready = () => {if (reg.waiting && navigator.serviceWorker.controller) update.hidden = false;};
  ready();reg.addEventListener('updatefound', () => {
   const worker = reg.installing;
   worker?.addEventListener('statechange', () => {if (worker.state === 'installed') ready();});
  });
 }).catch(() => { /* O atendimento online continua mesmo sem cache local. */ });
})();
