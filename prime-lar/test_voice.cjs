const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/app.js','utf8').split('// __VOICE_START__')[1].split('// __VOICE_END__')[0];
const factory=vm.runInNewContext(source+';createLaraVoice');
const checks=[];
function setup(supported=true){
 const elements={},events={},queue=[];let blocked=false,cancelled=0;
 const element=id=>elements[id]??={textContent:'',disabled:false,listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(k,v){this[k]=v;},click(){if(!this.disabled)this.listeners.click?.();}};
 const synth={getVoices:()=>[{name:'English',lang:'en-US'},{name:'Luciana',lang:'pt-BR'}],cancel(){cancelled++;},speak(item){queue.push(item);},addEventListener(){}};
 const window=supported?{speechSynthesis:synth,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}}:{};
 const document={hidden:false,getElementById:element,addEventListener:(name,fn)=>events[name]=fn};
 const voice=factory({window,document,lastReply:()=> 'Olá! Eu sou a Lara, assistente da Prime Lar.',isBlocked:()=>blocked});
 return{element,queue,voice,document,events,blocked(value){blocked=value;},cancels:()=>cancelled};
}
const t=setup();assert.equal(t.queue.length,0);t.voice.onReply('Resposta sem ativar');assert.equal(t.queue.length,0);
checks.push('Abrir o aplicativo e receber respostas não inicia áudio sem ativar a voz.');
t.element('readReply').click();assert.equal(t.queue.length,1);assert.equal(t.queue[0].voice.lang,'pt-BR');assert.equal(t.element('toggleVoice')['aria-pressed'],undefined);t.queue[0].onstart();assert.match(t.element('voiceStatus').textContent,/está lendo/);
checks.push('Ouvir resposta lê a última mensagem em português sem ativar a leitura automática.');
t.element('toggleVoice').click();assert.equal(t.element('toggleVoice')['aria-pressed'],'true');const before=t.queue.length;t.voice.onReply('Nova resposta da Lara.');assert.equal(t.queue.length,before+1);
checks.push('Ativar voz permite leitura das novas respostas, e o botão muda para Desativar.');
const long='Uma resposta longa e simples para explicar financiamento com calma. '.repeat(20);t.voice.onReply(long);const first=t.queue.at(-1),start=t.queue.length;first.onend();assert.equal(t.queue.length,start+1);t.element('stopVoice').click();const stopped=t.queue.length;t.queue.at(-1).onend();assert.equal(t.queue.length,stopped);assert.equal(t.element('stopVoice').disabled,true);
checks.push('Respostas longas são lidas em partes; Parar cancela a sequência sem reiniciá-la.');
t.blocked(true);const blocked=t.queue.length;t.element('readReply').click();assert.equal(t.queue.length,blocked);assert.match(t.element('voiceStatus').textContent,/finalize o áudio/);t.blocked(false);
t.document.hidden=true;t.voice.onReply('Resposta em segundo plano');assert.equal(t.queue.length,blocked);t.document.hidden=false;
t.element('toggleVoice').click();assert.equal(t.element('toggleVoice')['aria-pressed'],'false');t.voice.onReply('Voz desligada');assert.equal(t.queue.length,blocked);
checks.push('Gravação/resposta em andamento, tela oculta e voz desligada impedem novas leituras.');
t.element('readReply').click();t.queue.at(-1).onerror();assert.match(t.element('voiceStatus').textContent,/Não foi possível/);assert.equal(t.element('stopVoice').disabled,true);
const unavailable=setup(false);assert.equal(unavailable.element('toggleVoice').disabled,true);assert.equal(unavailable.element('readReply').disabled,true);unavailable.voice.stop();assert.match(unavailable.element('voiceStatus').textContent,/continuar pelo texto/);
checks.push('Falha de reprodução e falta de suporte informam o limite sem impedir o atendimento por texto.');
console.log(JSON.stringify({status:'aprovado',checks},null,2));
