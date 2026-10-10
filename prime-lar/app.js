(function () {
'use strict';
const API='https://dlynbiplzruxdhgwinyn.supabase.co/functions/v1/lara-chat';
const VERSION='prime-lar-2.3';
const SESSION_KEY='lara_prime_credentials_v2', HISTORY_KEY='lara_prime_tab_v2';
const $=id=>document.getElementById(id);
const field=$('message'),log=$('messages'),feedback=$('feedback');
const greeting='Olá! Eu sou a Lara, assistente virtual da Prime Lar Imobiliária. Vou ajudar você a organizar sua busca e continuar com um especialista. Como posso chamar você?';
let credentials=null,history=[],perfil={},etapa='nome',protocolo='',busy=false,recording=false,requestingMic=false,audioBusy=false,lastFailure=null;
let recorder=null,stream=null,chunks=[],audioBlob=null,audioUrl=null,ticker=null,recordStarted=0,cancelRecording=false;
try{credentials=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch{}
try{const saved=JSON.parse(sessionStorage.getItem(HISTORY_KEY)||'null');if(saved&&saved.sessao===credentials?.sessao&&Array.isArray(saved.history)){history=saved.history.slice(-40);perfil=saved.perfil||{};etapa=saved.etapa||'livre';protocolo=saved.protocolo||'';}}catch{}
function save(){try{sessionStorage.setItem(HISTORY_KEY,JSON.stringify({sessao:credentials?.sessao,history:history.slice(-40),perfil,etapa,protocolo}));}catch{}}
function saveCredentials(data){if(data.sessao&&data.token){credentials={sessao:data.sessao,token:data.token};try{localStorage.setItem(SESSION_KEY,JSON.stringify(credentials));}catch{}}}
function bubble(text,mine=false,loading=false){
 const item=document.createElement('div');item.className='msg '+(mine?'me':'assistant');
 if(!mine){const portrait=document.createElementNS('http://www.w3.org/2000/svg','svg');portrait.setAttribute('class','mini');portrait.setAttribute('viewBox','420 240 700 700');portrait.setAttribute('aria-hidden','true');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#laraPhoto');portrait.appendChild(use);item.appendChild(portrait);}
 const body=document.createElement('div');body.className='bubble'+(loading?' loading':'');body.textContent=text;item.appendChild(body);log.appendChild(item);log.scrollTop=log.scrollHeight;return {item,body};
}
function fit(){field.style.height='24px';field.style.height=Math.min(field.scrollHeight,112)+'px';}
function syncControls(){
 const block=busy||recording||requestingMic||audioBusy;
 $('send').disabled=block;field.disabled=recording||requestingMic||audioBusy;
 document.querySelectorAll('[data-message]').forEach(x=>x.disabled=block);
 $('guideOptions').children&&Array.from($('guideOptions').children).forEach(x=>x.disabled=block);
 $('microphone').disabled=busy||requestingMic||audioBusy;
 $('newChat').disabled=block;$('specialist').disabled=block;
 $('startRecord').disabled=busy||requestingMic||audioBusy;
 $('stopRecord').disabled=audioBusy;$('transcribe').disabled=busy||audioBusy;
 $('discardAudio').disabled=audioBusy;
}
function normalizarTelefone(value) {
 if (typeof value !== 'string' || /\b(?:cpf|rg|documento)\b/i.test(value) || /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/.test(value)) return '';
 if (/prefiro n[ãa]o|n[ãa]o (?:quero|vou) informar/i.test(value)) return 'prefiro não informar';
 let digits=value.replace(/\D/g,'');
 if (/^55/.test(digits) && [12,13].includes(digits.length)) digits=digits.slice(2);
 if (!/^[1-9]\d(?:9\d{8}|[2-5]\d{7})$/.test(digits)) return '';
 const local=digits.slice(2),split=local.length===9?5:4;
 return '('+digits.slice(0,2)+') '+local.slice(0,split)+'-'+local.slice(split);
}
function omitirDocumentos(value) {
 return value.replace(/\bCPF\s*(?:[:=]|[ée])?\s*\d[\d.\s-]{8,17}\d\b/gi,'[CPF omitido]').replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,'[CPF omitido]').replace(/\bRG\s*(?:[:=]|[ée])?\s*\d[\d.\s-]{4,15}[\dxX]\b/gi,'[documento omitido]');
}

function optionsFor(stage,p){
 const pick=(label,value=label)=>({label,value});
 switch(stage){
 case 'finalidade':return [pick('Comprar','Quero comprar um imóvel'),pick('Alugar','Quero alugar um imóvel')];
 case 'tipo':return [pick('Casa','Tenho interesse em casa'),pick('Apartamento','Tenho interesse em apartamento')];
 case 'localizacao':return [pick('Teresina'),pick('Altos'),pick('Demerval Lobão'),pick('Timon'),pick('Outra região','Quero informar outra cidade ou região')];
 case 'bairro':return [pick('Sem preferência de bairro'),pick('Prefiro não informar')];
 case 'estado_civil':return [pick('Solteiro(a)'),pick('Casado(a)'),pick('União estável'),pick('Divorciado(a)'),pick('Viúvo(a)'),pick('Prefiro não informar')];
 case 'telefone':return [pick('Prefiro não informar')];
 case 'oferta_especialista':return [pick('Falar com especialista','Quero falar diretamente com um especialista'),pick('Continuar com a Lara','Quero continuar com a Lara para organizar minha busca')];
 case 'orcamento':return p.finalidade==='alugar'?[pick('Até R$ 1 mil/mês'),pick('R$ 1 a 2 mil/mês'),pick('Acima de R$ 2 mil/mês'),pick('Preciso de orientação')]:[pick('Até R$ 200 mil'),pick('R$ 200 a 300 mil'),pick('R$ 300 a 500 mil'),pick('Acima de R$ 500 mil'),pick('Preciso de orientação')];
 case 'ocupacao':return [pick('CLT / carteira assinada','Trabalho com carteira assinada (CLT)'),pick('Servidor / concursado','Sou servidor público ou concursado'),pick('Autônomo','Sou autônomo'),pick('MEI','Sou microempreendedor individual (MEI)'),pick('Empresário','Sou empresário'),pick('Aposentado / pensionista','Sou aposentado ou pensionista'),pick('Sem trabalho no momento'),pick('Prefiro não informar')];
 case 'vinculo_publico':return [pick('Municipal','Meu vínculo é municipal'),pick('Estadual','Meu vínculo é estadual'),pick('Federal','Meu vínculo é federal'),pick('Outro vínculo'),pick('Prefiro não informar')];
 case 'atividade':return [pick('Prefiro não informar')];
 case 'renda':return [pick('Até R$ 2 mil/mês','Minha renda bruta mensal é até R$ 2 mil'),pick('R$ 2 a 4 mil/mês','Minha renda bruta mensal é de R$ 2 a 4 mil'),pick('R$ 4 a 7 mil/mês','Minha renda bruta mensal é de R$ 4 a 7 mil'),pick('Acima de R$ 7 mil/mês','Minha renda bruta mensal é acima de R$ 7 mil'),pick('Prefiro não informar')];
 case 'intencao':return [pick('Sim, se fizer sentido','Sim, se as condições fizerem sentido para mim'),pick('Quero avaliar'),pick('Ainda estou pesquisando')];
 case 'revisao':return [pick('Confirmar e gerar protocolo','Confirmo o resumo; pode gerar meu protocolo'),pick('Quero corrigir')];
 default:return [];
 }
}
function choose(value){
 if(busy||recording||audioBusy||requestingMic)return;
 if(field.value.trim()){field.value=[field.value.trim(),value].join('\n').slice(0,1500);fit();field.focus();feedback.textContent='A opção foi incluída no seu rascunho. Revise antes de enviar.';}else send(value);
}
function renderGuide(){
 const options=optionsFor(etapa,perfil),host=$('guideOptions');host.replaceChildren();$('guide').hidden=!options.length;
 $('guideTitle').textContent=etapa==='revisao'?'Confira antes de continuar':'Você pode escolher uma opção ou escrever';
 for(const o of options){const b=document.createElement('button');b.type='button';b.className='shortcut';b.textContent=o.label;b.addEventListener('click',()=>choose(o.value));host.appendChild(b);}
 const valid=/^(?:DEMO-)?PL-\d{8}-[A-Fa-f0-9]{32}$/.test(protocolo);
 $('protocolBox').hidden=!valid;$('protocolValue').textContent=valid?protocolo:'';syncControls();
}
function showDialog(id){const d=$(id);if(typeof d.showModal==='function')d.showModal();else{d.setAttribute('open','');d.hidden=false;}}
function closeDialog(id){const d=$(id);if(typeof d.close==='function')d.close();else d.removeAttribute('open');}
function renderHistory(){
 log.replaceChildren();const cap=document.createElement('p');cap.className='caption';cap.textContent='Um novo começo pode começar aqui';log.appendChild(cap);
 bubble(greeting);history.forEach(m=>{if(m&&typeof m.text==='string')bubble(m.text,m.role==='me');});
}
async function call(payload){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),55000);
 try{
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...credentials,...payload}),signal:ctrl.signal});
  let d;try{d=await r.json();}catch{throw Error('O atendimento retornou uma resposta inesperada. Tente novamente.');}
  saveCredentials(d);
  if(!r.ok){const e=Error(d.erro||'Não foi possível concluir o atendimento.');e.code=d.codigo;throw e;}
  if(d.versao&&d.versao!==VERSION)throw Error('A atualização ainda está sendo disponibilizada. Aguarde um momento e tente novamente.');
  return d;
 }finally{clearTimeout(timer);}
}
async function ensureSession(){if(!credentials){const d=await call({acao:'iniciar'});perfil=d.perfil||{};save();}}
async function send(text){
 if(busy||recording||audioBusy||requestingMic)return;
 const mensagem=(text||'').trim();if(!mensagem)return;
 if(mensagem.length>1500){feedback.textContent='Sua mensagem pode ter até 1.500 caracteres.';return;}
 feedback.textContent='';busy=true;syncControls();
 const requestId=lastFailure?.text===mensagem?lastFailure.requestId:crypto.randomUUID();
 const mine=bubble(mensagem,true),reply=bubble('A Lara está respondendo...',false,true);field.value='';fit();
 try{
  await ensureSession();const d=await call({acao:'chat',mensagem,request_id:requestId});
  if(typeof d.resposta!=='string'||!d.resposta.trim())throw Error('Não recebi uma resposta. Tente novamente.');
  reply.body.classList.remove('loading');reply.body.textContent=d.resposta;
  perfil=d.perfil||perfil;etapa=d.etapa||'livre';if(d.protocolo)protocolo=d.protocolo;history.push({role:'me',text:mensagem},{role:'lara',text:d.resposta});renderGuide();save();lastFailure=null;
 }catch(e){
  mine.item.remove();reply.item.remove();if(!field.value.trim())field.value=mensagem;fit();lastFailure={text:mensagem,requestId};
  feedback.textContent=e.name==='AbortError'?'O atendimento demorou. Sua mensagem foi preservada; toque em Enviar para tentar novamente.':e.message;
 }finally{busy=false;syncControls();field.focus();log.scrollTop=log.scrollHeight;}
}
function summaryText(){
 const names={nome:'Nome',finalidade:'Interesse',tipo:'Tipo de imóvel',localizacao:'Cidade / região',bairro:'Bairro desejado',estado_civil:'Estado civil',telefone:'WhatsApp para retorno',orcamento:'Orçamento',ocupacao:'Ocupação',vinculo_publico:'Vínculo público',atividade:'Atividade',renda_bruta:'Renda bruta mensal',intencao:'Momento de decisão',necessidades:'Preferências',prazo:'Prazo',pagamento:'Forma de pagamento',empreendimento:'Empreendimento'};
 const entries=Object.entries(names).filter(([k])=>typeof perfil[k]==='string'&&perfil[k].trim()).map(([k,label])=>label+': '+perfil[k].trim());
 return 'Olá, equipe Prime Lar! Conversei com a Lara e gostaria de continuar com um corretor especialista.\n'+(protocolo?'Protocolo da conversa: '+protocolo+'\n':'')+'\n'+(entries.length?entries.join('\n'):'Meu interesse: [descreva o imóvel que procura]');
}
function openSpecialist(){$('summary').value=summaryText();$('copyStatus').textContent='';showDialog('specialistDialog');}
function resetAudio(){
 if(ticker)clearInterval(ticker);ticker=null;
 if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
 if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null;}
 audioBlob=null;chunks=[];recorder=null;recording=false;
 $('audioPreview').removeAttribute('src');$('audioPreview').hidden=true;
 $('audioStatus').textContent='Gravar uma mensagem';$('recordTime').textContent='00:00 / 01:00';
 $('startRecord').hidden=false;$('startRecord').textContent='Gravar áudio';$('stopRecord').hidden=true;$('transcribe').hidden=true;$('microphone').classList.remove('recording');syncControls();
}
function discardAudio(){if(recorder?.state==='recording'){cancelRecording=true;recorder.stop();}else resetAudio();$('audioBox').hidden=true;}
async function startRecording(){
 if(busy||audioBusy||requestingMic||recording)return;
 feedback.textContent='';resetAudio();cancelRecording=false;requestingMic=true;syncControls();
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:true});
  if($('audioBox').hidden){stream.getTracks().forEach(t=>t.stop());stream=null;return;}
  const mime=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
  recorder=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:64000}:undefined);
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onerror=()=>{cancelRecording=true;feedback.textContent='Não consegui gravar o áudio. Tente novamente ou digite.';resetAudio();};
  recorder.onstop=()=>{
   if(ticker)clearInterval(ticker);ticker=null;stream?.getTracks().forEach(t=>t.stop());stream=null;recording=false;$('microphone').classList.remove('recording');
   if(cancelRecording){resetAudio();return;}
   audioBlob=new Blob(chunks,{type:recorder.mimeType});
   if(!audioBlob.size){feedback.textContent='O áudio ficou vazio. Grave novamente.';resetAudio();return;}
   audioUrl=URL.createObjectURL(audioBlob);$('audioPreview').src=audioUrl;$('audioPreview').hidden=false;
   $('audioStatus').textContent='Áudio pronto para transcrever';$('stopRecord').hidden=true;$('startRecord').hidden=false;$('startRecord').textContent='Gravar novamente';$('transcribe').hidden=false;syncControls();
  };
  recorder.start();recordStarted=Date.now();recording=true;$('audioStatus').textContent='Gravando sua mensagem...';$('startRecord').hidden=true;$('stopRecord').hidden=false;$('microphone').classList.add('recording');
  ticker=setInterval(()=>{const n=Math.min(60,Math.floor((Date.now()-recordStarted)/1000));$('recordTime').textContent=String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')+' / 01:00';if(n>=60&&recorder?.state==='recording')recorder.stop();},250);
 }catch(e){resetAudio();feedback.textContent=e.name==='NotAllowedError'?'O acesso ao microfone não foi permitido. Libere o microfone no navegador ou digite sua mensagem.':'Não consegui acessar o microfone. Você pode continuar digitando.';}
 finally{requestingMic=false;syncControls();}
}
function encodeWav(samples,rate){
 const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
 const word=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};
 word(0,'RIFF');view.setUint32(4,36+samples.length*2,true);word(8,'WAVE');word(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);word(36,'data');view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){const s=Math.max(-1,Math.min(1,samples[i]));view.setInt16(44+i*2,s<0?s*32768:s*32767,true);}return buffer;
}
async function wavBase64(blob){
 const AC=window.AudioContext||window.webkitAudioContext,OC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 const ctx=new AC();let decoded;try{decoded=await ctx.decodeAudioData(await blob.arrayBuffer());}finally{await ctx.close();}
 if(decoded.duration>61)throw Error('O áudio pode ter até 60 segundos. Grave novamente.');
 const offline=new OC(1,Math.ceil(Math.min(decoded.duration,60)*16000),16000),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();
 const rendered=await offline.startRendering();const bytes=new Uint8Array(encodeWav(rendered.getChannelData(0),16000));
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);
}
async function transcribe(){
 if(!audioBlob||busy||audioBusy||recording)return;audioBusy=true;syncControls();feedback.textContent='';$('audioStatus').textContent='Transcrevendo seu áudio...';
 try{
  await ensureSession();const audio=await wavBase64(audioBlob);const d=await call({acao:'transcrever',audio,mime_type:'audio/wav'});
  if(typeof d.texto!=='string'||!d.texto.trim())throw Error('Não identifiquei uma fala clara. Grave novamente.');
  const combined=[field.value.trim(),d.texto.trim()].filter(Boolean).join(' ');if(combined.length>1500)throw Error('O texto ficou maior que 1.500 caracteres. Envie o rascunho ou grave uma mensagem mais curta.');
  field.value=combined;fit();resetAudio();$('audioBox').hidden=true;feedback.textContent='Texto transcrito. Revise e toque em Enviar quando estiver pronto.';
 }catch(e){$('audioStatus').textContent='Áudio pronto para tentar novamente';feedback.textContent=e.name==='AbortError'?'A transcrição demorou. Seu áudio foi preservado; tente novamente.':e.message;}
 finally{audioBusy=false;syncControls();field.focus();}
}
$('form').addEventListener('submit',e=>{e.preventDefault();send(field.value);});
field.addEventListener('input',fit);
field.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send(field.value);}});
document.querySelectorAll('[data-message]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.message)));
$('specialist').addEventListener('click',openSpecialist);
$('about').addEventListener('click',()=>showDialog('aboutDialog'));
$('privacy').addEventListener('click',()=>showDialog('privacyDialog'));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.dataset.close)));
$('newChat').addEventListener('click',()=>{if(!busy&&!recording&&!audioBusy&&!requestingMic)showDialog('resetDialog');});
$('confirmReset').addEventListener('click',()=>{if(busy||recording||audioBusy||requestingMic)return;credentials=null;history=[];perfil={};etapa='nome';protocolo='';lastFailure=null;try{localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(HISTORY_KEY);}catch{}discardAudio();renderHistory();renderGuide();field.value='';feedback.textContent='';fit();closeDialog('resetDialog');field.focus();});
$('copySummary').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('summary').value);$('copyStatus').textContent='Resumo copiado. Agora abra o Instagram e envie para a Prime Lar.';}catch{$('summary').focus();$('summary').select();$('copyStatus').textContent='Selecione e copie o texto acima para enviar no Instagram.';}});
$('microphone').addEventListener('click',()=>{
 if(recording){recorder?.stop();return;}if(busy||audioBusy||requestingMic)return;
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'||!(window.AudioContext||window.webkitAudioContext)||!(window.OfflineAudioContext||window.webkitOfflineAudioContext)){feedback.textContent='Este navegador não oferece gravação aqui. Abra o site em um navegador atualizado com HTTPS ou digite sua mensagem.';return;}
 $('audioBox').hidden=!$('audioBox').hidden;
});
$('startRecord').addEventListener('click',startRecording);
$('stopRecord').addEventListener('click',()=>{if(recorder?.state==='recording')recorder.stop();});
$('discardAudio').addEventListener('click',discardAudio);
$('transcribe').addEventListener('click',transcribe);
window.addEventListener('pagehide',()=>{cancelRecording=true;if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());if(ticker)clearInterval(ticker);if(audioUrl)URL.revokeObjectURL(audioUrl);});
renderHistory();renderGuide();syncControls();fit();
})();
