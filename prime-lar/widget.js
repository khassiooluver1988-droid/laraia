(function(){
'use strict';
if(document.getElementById('prime-lar-widget'))return;
const script=document.currentScript;
const page=script?.dataset.src||new URL('../index.html',script.src).href;
const root=document.createElement('div');root.id='prime-lar-widget';
root.innerHTML='<style>#prime-lar-widget{position:fixed;right:22px;bottom:22px;z-index:2147483000;font:15px system-ui,sans-serif}#prime-lar-widget button{font:inherit;cursor:pointer}#prime-lar-widget .pl-launch{background:#073260;color:white;border:1px solid #e2bc75;border-radius:999px;padding:15px 21px;box-shadow:0 8px 28px #05285044;font-weight:700}#prime-lar-widget .pl-window{position:absolute;right:0;bottom:66px;width:min(455px,calc(100vw - 32px));height:min(780px,calc(100dvh - 110px));background:#fff;border:1px solid #c4d3e3;border-radius:20px;box-shadow:0 16px 60px #06284f44;overflow:hidden;display:flex;flex-direction:column}#prime-lar-widget [hidden]{display:none!important}#prime-lar-widget .pl-top{display:flex;align-items:center;justify-content:space-between;background:#052950;color:white;padding:7px 13px;font-size:12px}#prime-lar-widget .pl-close{background:transparent;color:white;border:0;font-size:25px;line-height:1;padding:3px 8px}#prime-lar-widget iframe{width:100%;height:100%;flex:1;border:0;min-height:0}#prime-lar-widget button:focus-visible{outline:3px solid #c5a061;outline-offset:3px}@media(max-width:540px){#prime-lar-widget{right:12px;bottom:12px}#prime-lar-widget .pl-window{position:fixed;inset:8px;width:auto;height:calc(100dvh - 16px)}#prime-lar-widget .pl-launch{padding:13px 18px}}</style><section class="pl-window" id="prime-lar-panel" role="dialog" aria-modal="false" aria-label="Atendimento Lara da Prime Lar" hidden><div class="pl-top"><strong>Lara · Prime Lar Imobiliária</strong><button class="pl-close" type="button" aria-label="Fechar atendimento">×</button></div><iframe title="Converse com a Lara" allow="microphone" referrerpolicy="strict-origin-when-cross-origin"></iframe></section><button class="pl-launch" type="button" aria-controls="prime-lar-panel" aria-expanded="false">Fale com a Lara</button>';
document.body.appendChild(root);
const panel=root.querySelector('.pl-window'),launcher=root.querySelector('.pl-launch'),close=root.querySelector('.pl-close'),frame=root.querySelector('iframe');
function show(){panel.hidden=false;launcher.setAttribute('aria-expanded','true');frame.src=page;close.focus();}
function hide(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');frame.src='about:blank';launcher.focus();}
launcher.addEventListener('click',()=>panel.hidden?show():hide());
close.addEventListener('click',hide);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)hide();});
})();