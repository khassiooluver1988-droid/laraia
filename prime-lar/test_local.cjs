const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
const {webcrypto}=require('node:crypto');
const checks=[];
const check=(s)=>checks.push(s);
const tick=()=>new Promise(r=>setImmediate(r));

async function backend(){
 let providerCalls=0,quotaCalls=0,quotaEnabled=true,providerFail=false,modelEmpty=false,modelOverride=null;
 const sessions=[],messages=[],payloads=[];
 class Query{
  constructor(table){this.table=table;this.filters=[];this.operation='select';}
  select(){return this;} eq(k,v){this.filters.push([k,v]);return this;} order(k,o){this.ordering=[k,o];return this;} limit(n){this.maximum=n;return this;}
  insert(data){this.operation='insert';this.input=data;return this;} update(data){this.operation='update';this.input=data;return this;}
  async single(){const r=await this.run();return {...r,data:Array.isArray(r.data)?r.data[0]:r.data};}
  async maybeSingle(){return this.single();}
  then(ok,no){return this.run().then(ok,no);}
  async run(){
   const rows=this.table==='lara_prime_sessoes'?sessions:messages;
   if(this.operation==='insert'){
    const data=Array.isArray(this.input)?this.input:[this.input];
    if(this.table==='lara_prime_mensagens'&&data.some(v=>rows.some(r=>r.sessao_id===v.sessao_id&&r.request_id===v.request_id&&r.papel===v.papel)))return {error:{code:'23505'}};
    const inserted=data.map((v,i)=>({id:webcrypto.randomUUID(),ordem:rows.length+1+i,criada_em:"2026-10-10T01:30:00Z",perfil:{},...v}));rows.push(...inserted);return {data:inserted,error:null};
   }
   const matches=rows.filter(r=>this.filters.every(([k,v])=>r[k]===v));
   if(this.operation==='update'){matches.forEach(r=>Object.assign(r,this.input));return {data:matches,error:null};}
   let found=matches.slice();if(this.ordering){const [k,o]=this.ordering;found.sort((a,b)=>(a[k]>b[k]?1:-1)*(o.ascending?1:-1));}if(this.maximum)found=found.slice(0,this.maximum);return {data:found,error:null};
  }
 }
 const db={from:t=>new Query(t),rpc:async()=>{quotaCalls++;return {data:quotaEnabled,error:null};}};
 const context={console,Response,Request,AbortSignal,TextEncoder,Uint8Array,crypto:webcrypto,atob,URL,setTimeout:(fn)=>{fn();return 0;},Deno:{env:{get:()=> 'fixture-key'}},withSupabase:(config,handler)=>(req)=>handler(req,{supabaseAdmin:db}),fetch:async(url,init)=>{
  providerCalls++;const p=JSON.parse(init.body);payloads.push(p);if(providerFail)return new Response('{}',{status:503});
  const isAudio=p.contents[0]?.parts?.[0]?.inlineData;
  const obj=isAudio?{texto:modelEmpty?'':'Meu nome é Ana e quero alugar um apartamento.'}:(modelOverride||{resposta:'Ana, você procura alugar um apartamento em Teresina. Qual é seu orçamento mensal?',perfil:{nome:'Ana',finalidade:'alugar',tipo:'apartamento',localizacao:'Teresina',orcamento:'R$ 1.500 por mês',necessidades:'',prazo:'',pagamento:'',empreendimento:'',extra:'não deve sair'},etapa:'ocupacao',pronto_para_especialista:false});
  return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(obj)}]}}]});
 }};
 vm.createContext(context);const code=stripTypeScriptTypes(fs.readFileSync('index.ts','utf8')).replace(/^import .*;$/mg,'').replace('export default ','globalThis.edge = ');vm.runInContext(code,context);
 const call=async(data,origin)=>{const req=new Request('https://fixture.local',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(data)});const r=await context.edge.fetch(req);return {status:r.status,data:await r.json(),headers:r.headers};};
 const status=await context.edge.fetch(new Request('https://fixture.local'));assert.equal((await status.json()).marca,'Prime Lar Imobiliária');
 assert.equal((await call({},'https://unknown.example')).status,403);
 assert.equal((await call({mensagem:'oi'})).status,400);
 const init=await call({acao:'iniciar'},'https://khassiooluver1988-droid.github.io');assert.equal(init.status,200);assert.equal(init.headers.get('Access-Control-Allow-Origin'),'https://khassiooluver1988-droid.github.io');
 const cred={sessao:init.data.sessao,token:init.data.token};assert.ok(sessions[0].token_hash!==cred.token);assert.equal(quotaCalls,0);
 check('Servidor: origem, validação de entrada e criação da conversa sem consumir IA.');
 assert.equal((await call({...cred,token:webcrypto.randomUUID(),mensagem:'oi',request_id:webcrypto.randomUUID()})).status,401);
 check('Servidor: identificador sem token correto não acessa a conversa.');
 const rid=webcrypto.randomUUID();const first=await call({...cred,mensagem:'Sou Ana, quero alugar um apartamento em Teresina até R$ 1500 mensais.',request_id:rid});assert.equal(first.status,200);assert.equal(messages.length,2);assert.equal(first.data.perfil.finalidade,'alugar');assert.equal(first.data.perfil.extra,undefined);assert.ok(sessions[0].perfil.nome==='Ana');
 const before=providerCalls;assert.equal((await call({...cred,mensagem:'reenvio',request_id:rid})).status,200);assert.equal(providerCalls,before);assert.equal(messages.length,2);
 check('Servidor: mensagens salvas em par e reenvio sem duplicar resposta, histórico ou chamada de IA.');
 await call({...cred,mensagem:'Preciso de dois quartos',request_id:webcrypto.randomUUID()});const last=payloads.at(-1);assert.deepEqual(last.contents.map(m=>m.role),['user','model','user']);assert.ok(last.systemInstruction.parts[0].text.includes('R$ 1.500 por mês'));
 check('Servidor: ordem das mensagens e perfil anterior preservam o contexto.');
 quotaEnabled=false;assert.equal((await call({...cred,mensagem:'mais uma',request_id:webcrypto.randomUUID()})).status,429);quotaEnabled=true;
 const msgBefore=messages.length;providerFail=true;assert.equal((await call({...cred,mensagem:'teste de falha',request_id:webcrypto.randomUUID()})).status,502);assert.equal(messages.length,msgBefore);providerFail=false;
 check('Servidor: cota e falha do provedor retornam erro sem histórico parcial.');
 const wav=Buffer.alloc(16044);wav.write('RIFF',0);wav.write('WAVE',8);const audio=wav.toString('base64');
 const t=await call({...cred,acao:'transcrever',audio,mime_type:'audio/wav'});assert.equal(t.status,200);assert.ok(t.data.texto.includes('Ana'));assert.equal(messages.length,msgBefore);assert.equal(payloads.at(-1).contents[0].parts[0].inlineData.mimeType,'audio/wav');
 modelEmpty=true;assert.equal((await call({...cred,acao:'transcrever',audio,mime_type:'audio/wav'})).status,422);
 assert.equal((await call({...cred,acao:'transcrever',audio:'eA==',mime_type:'audio/wav'})).status,400);
 check('Servidor: transcrição separada do chat, áudio inválido e fala vazia tratados.');
 const sanitized=vm.runInContext('sanitizarPerfil({nome:"CPF 123.456.789-00",extra:"x"})',context);assert.ok(!sanitized.nome.includes('123.456'));assert.equal(sanitized.extra,undefined);
 check('Servidor: perfil limitado aos campos previstos e CPF removido do resumo.');
 const phone=vm.runInContext('sanitizarPerfil({telefone:"(86) 99999-9999",estado_civil:"casado"})',context);
 assert.equal(phone.telefone,'(86) 99999-9999');assert.equal(phone.estado_civil,'casado');
 const document=vm.runInContext('sanitizarPerfil({telefone:"CPF 123.456.789-00"})',context);assert.equal(document.telefone,'');
 await call({...cred,mensagem:'Meu CPF é 123.456.789-00',request_id:webcrypto.randomUUID()});
 assert.ok(!payloads.at(-1).contents.at(-1).parts[0].text.includes('123.456.789-00'));
 assert.ok(!messages.at(-2).conteudo.includes('123.456.789-00'));
 check('Servidor: WhatsApp preservado como contato; CPF identificado omitido antes do provedor e do histórico.');

 const base={...first.data.perfil,finalidade:'comprar',orcamento:'R$ 200 mil (valor total)',ocupacao:'servidor público',vinculo_publico:'estadual',renda_bruta:'R$ 5.000 por mês',intencao:'quero avaliar',concordancia_resumo:'confirmado'};
 modelOverride={resposta:'Qual é sua renda bruta?',perfil:{...base,concordancia_resumo:'pendente'},etapa:'renda',pronto_para_especialista:false};
 await call({...cred,mensagem:'Sou servidor estadual',request_id:webcrypto.randomUUID()});
 modelOverride={resposta:'Atendimento concluído',perfil:base,etapa:'concluido',pronto_para_especialista:true,protocolo:'FAKE'};
 const premature=await call({...cred,mensagem:'Sim',request_id:webcrypto.randomUUID()});assert.equal(premature.data.protocolo,'');assert.equal(premature.data.etapa,'revisao');assert.equal(premature.data.perfil.concordancia_resumo,'pendente');
 check('Servidor: confirmação inventada pelo modelo não gera protocolo nem encerra a revisão.');
 const closeId=webcrypto.randomUUID();const closed=await call({...cred,mensagem:'Confirmo o resumo; pode gerar meu protocolo',request_id:closeId});assert.equal(closed.status,200);assert.match(closed.data.protocolo,/^PL-20261009-[A-F0-9]{32}$/);assert.ok(closed.data.resposta.includes(closed.data.protocolo));assert.equal(closed.data.pronto_para_especialista,true);assert.equal(closed.data.perfil.renda_bruta,'R$ 5.000 por mês');
 const repeated=await call({...cred,mensagem:'Confirmo',request_id:closeId});assert.equal(repeated.data.protocolo,closed.data.protocolo);
 modelOverride={resposta:'Posso esclarecer suas dúvidas.',perfil:base,etapa:'livre',pronto_para_especialista:false};const later=await call({...cred,mensagem:'Como funciona uma visita?',request_id:webcrypto.randomUUID()});assert.equal(later.data.protocolo,closed.data.protocolo);
 check('Servidor: protocolo usa a sessão e a data de Brasília, fica no histórico e permanece em reenvios e continuidade.');
 const another=await call({acao:'iniciar'});modelOverride={resposta:'Vamos continuar com o especialista.',perfil:{nome:'Bia'},etapa:'concluido',pronto_para_especialista:true};
 const human=await call({sessao:another.data.sessao,token:another.data.token,mensagem:'Quero falar com um corretor especialista',request_id:webcrypto.randomUUID()});assert.match(human.data.protocolo,/^PL-/);assert.notEqual(human.data.protocolo,closed.data.protocolo);assert.equal(human.data.perfil.renda_bruta,'');
 check('Servidor: pedido direto de humano permite protocolo sem exigir renda ou cadastro completo.');

}

async function frontend(){
 class Element{
  constructor(id){this.id=id;this.events={};this.children=[];this.value='';this.textContent='';this.style={};this.hidden=false;this.disabled=false;this.dataset={};this.className='';this.scrollHeight=24;this.classList={add:(c)=>{this.className+=' '+c;},remove:(c)=>{this.className=this.className.replace(c,'');}};}
  addEventListener(n,f){(this.events[n]??=[]).push(f);} dispatch(n,event={}){for(const fn of this.events[n]??[])fn({preventDefault(){},...event});}
  appendChild(c){c.parent=this;this.children.push(c);return c;} replaceChildren(){this.children=[];} remove(){if(this.parent)this.parent.children=this.parent.children.filter(v=>v!==this);}
  focus(){this.focused=true;} select(){this.selected=true;} setAttribute(k,v){this[k]=v;} removeAttribute(k){delete this[k];} showModal(){this.open=true;} close(){this.open=false;}
 }
 const html=fs.readFileSync('template.html','utf8'),nodes={};for(const m of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){nodes[m[1]]=new Element(m[1]);nodes[m[1]].hidden=/\bhidden(?:\s|>|=)/.test(m[0]);}
 const shortcuts=[...html.matchAll(/data-message="([^"]+)"/g)].map((m,i)=>{const n=new Element('shortcut'+i);n.dataset.message=m[1];return n;});
 const closes=[...html.matchAll(/data-close="([^"]+)"/g)].map(m=>{const n=new Element();n.dataset.close=m[1];return n;});
 const storage=()=>({data:{},getItem(k){return this.data[k]??null;},setItem(k,v){this.data[k]=v;},removeItem(k){delete this.data[k];}});
 const localStorage=storage(),sessionStorage=storage(),calls=[];let fail=false,tracksStopped=0,denied=false,mediaRecorders=[];
 class Recorder{
  static isTypeSupported(){return true;}constructor(s,o){this.mimeType=o.mimeType;this.state='inactive';mediaRecorders.push(this);}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['fixture'])});this.onstop();}
 }
 class AC{async decodeAudioData(){return {duration:1};}async close(){}}
 class OC{createBufferSource(){return {connect(){},start(){}};}async startRendering(){return {getChannelData:()=>new Float32Array([0,-1,1])};}}
 const window={isSecureContext:true,AudioContext:AC,OfflineAudioContext:OC,addEventListener(){}};
 const document={getElementById:id=>nodes[id],querySelector:()=>({src:'avatar-fixture'}),querySelectorAll:s=>s==='[data-message]'?shortcuts:closes,createElement:()=>new Element(),createElementNS:()=>new Element()};
 const context={console,document,window,navigator:{mediaDevices:{getUserMedia:async()=>{if(denied)throw Object.assign(Error(),{name:'NotAllowedError'});return {getTracks:()=>[{stop(){tracksStopped++;}}]};}},clipboard:{writeText:async()=>{}}},localStorage,sessionStorage,crypto:webcrypto,MediaRecorder:Recorder,Blob,DataView,ArrayBuffer,Uint8Array,Float32Array,btoa,AbortController,URL:{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}},Date,setTimeout,clearTimeout,setInterval,clearInterval,fetch:async(url,options)=>{
  const d=JSON.parse(options.body);calls.push(d);if(fail)throw Error('Conexão de teste indisponível');
  if(d.acao==='iniciar')return Response.json({sessao:webcrypto.randomUUID(),token:webcrypto.randomUUID(),versao:'prime-lar-2.3',perfil:{}});
  if(d.acao==='transcrever')return Response.json({texto:'Quero alugar um apartamento.',versao:'prime-lar-2.3'});
  return Response.json({resposta:'Qual é sua ocupação?',etapa:'ocupacao',versao:'prime-lar-2.3',perfil:{finalidade:'alugar',tipo:'apartamento'}});
 }};
 vm.createContext(context);vm.runInContext(fs.readFileSync('app.js','utf8'),context);
 assert.ok(nodes.messages.children[1].children.at(-1).textContent.includes('Prime Lar'));shortcuts[1].dispatch('click');await tick();await tick();
 assert.equal(calls.at(-1).mensagem,'Quero alugar um imóvel');assert.equal(nodes.send.disabled,false);
 check('Interface: abertura da Prime Lar, botão Alugar, envio e desbloqueio após resposta.');
 nodes.message.value='Mensagem em rascunho';const n=calls.length;shortcuts[3].dispatch('click');await tick();assert.equal(calls.length,n);assert.ok(nodes.message.value.includes('casa'));
 check('Interface: atalhos preservam o rascunho existente e exigem revisão.');
 nodes.message.value='Meu orçamento mensal é R$ 1500';fail=true;nodes.form.dispatch('submit');await tick();await tick();assert.equal(nodes.message.value,'Meu orçamento mensal é R$ 1500');const failedRequest=calls.at(-1).request_id;
 fail=false;nodes.form.dispatch('submit');await tick();await tick();assert.equal(calls.at(-1).request_id,failedRequest);
 check('Interface: falha preserva a mensagem e usa o mesmo identificador no reenvio.');
 nodes.specialist.dispatch('click');assert.ok(nodes.specialistDialog.open);assert.ok(nodes.summary.value.includes('alugar'));nodes.copySummary.dispatch('click');await tick();assert.ok(nodes.copyStatus.textContent.includes('copiado'));
 check('Interface: resumo revisável, cópia e canal manual para especialista.');
 nodes.microphone.dispatch('click');assert.equal(nodes.audioBox.hidden,false);nodes.startRecord.dispatch('click');await tick();assert.equal(mediaRecorders[0].state,'recording');assert.equal(nodes.send.disabled,true);
 nodes.stopRecord.dispatch('click');await tick();assert.equal(tracksStopped,1);assert.equal(nodes.audioPreview.hidden,false);
 const chatCount=calls.filter(c=>c.acao==='chat').length;nodes.transcribe.dispatch('click');await tick();await tick();assert.ok(nodes.message.value.includes('alugar um apartamento'));assert.equal(calls.filter(c=>c.acao==='chat').length,chatCount);assert.equal(nodes.audioBox.hidden,true);
 const wav=Buffer.from(calls.at(-1).audio,'base64');assert.equal(wav.subarray(0,4).toString(),'RIFF');assert.equal(wav.readUInt32LE(24),16000);assert.equal(wav.readUInt16LE(22),1);
 check('Interface: gravação local, encerramento do microfone, WAV mono 16 kHz e texto revisável sem envio automático.');
 denied=true;nodes.microphone.dispatch('click');nodes.startRecord.dispatch('click');await tick();assert.ok(nodes.feedback.textContent.includes('não foi permitido'));assert.equal(nodes.send.disabled,false);
 check('Interface: permissão negada mantém o atendimento por texto disponível.');
 nodes.newChat.dispatch('click');assert.equal(nodes.resetDialog.open,true);assert.ok(localStorage.getItem('lara_prime_credentials_v2'));nodes.confirmReset.dispatch('click');assert.equal(localStorage.getItem('lara_prime_credentials_v2'),null);assert.equal(nodes.message.value,'');
 check('Interface: nova conversa exige confirmação e limpa apenas o estado do navegador.');
 const preview=fs.readFileSync('LARA_PRIME_LAR_PREVIA.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
 const loadPreview=()=>{for(const node of [...Object.values(nodes),...shortcuts,...closes])node.events={};vm.runInContext(preview,context);};
 const say=async text=>{nodes.message.value=text;nodes.form.dispatch('submit');await tick();await tick();assert.equal(nodes.feedback.textContent,'');};
 const select=async label=>{const b=nodes.guideOptions.children.find(x=>x.textContent===label);assert.ok(b,'Opção ausente: '+label);b.dispatch('click');await tick();await tick();};
 const reset=()=>{nodes.newChat.dispatch('click');nodes.confirmReset.dispatch('click');};
 const lastReply=()=>nodes.messages.children.at(-1).children.at(-1).textContent;
 const beforePreviewCalls=calls.length;loadPreview();
 await say('Oi');assert.ok(lastReply().includes('Como posso chamar'));
 await say('Ana');await select('Comprar');await select('Casa');await say('Teresina');await say('Mocambinho');await say('200');assert.ok(lastReply().includes('reais ou em milhares'));
 await say('200mil');assert.ok(lastReply().includes('ocupação'));assert.ok(nodes.guideOptions.children.some(x=>x.textContent==='CLT / carteira assinada'));
 await select('Servidor / concursado');assert.ok(lastReply().includes('municipal, estadual ou federal'));await select('Estadual');assert.ok(lastReply().includes('renda bruta mensal'));await say('5000');await select('Casado(a)');assert.ok(lastReply().includes('oportunidade de adquirir'));
 await select('Sim, se fizer sentido');assert.ok(lastReply().includes('WhatsApp'));await say('(86) 99999-9999');assert.ok(lastReply().includes('200mil'));assert.ok(lastReply().includes('5000'));assert.ok(lastReply().includes('estadual'));assert.equal(nodes.protocolBox.hidden,true);
 check('Prévia: compra continua após orçamento com opções de trabalho, vínculo estadual, renda separada e revisão antes do protocolo.');
 await select('Quero corrigir');await say('Minha renda bruta é R$ 4500');assert.ok(lastReply().includes('4500'));assert.ok(!lastReply().includes('5000'));await select('Confirmar e gerar protocolo');assert.match(nodes.protocolValue.textContent,/^DEMO-PL-\d{8}-[A-F0-9]{32}$/);assert.ok(lastReply().includes('não envia o resumo'));
 nodes.specialist.dispatch('click');assert.ok(nodes.summary.value.includes('R$ 4500'));assert.ok(nodes.summary.value.includes('(86) 99999-9999'));assert.ok(nodes.summary.value.includes('Casado(a)'));assert.ok(nodes.summary.value.includes('Mocambinho'));assert.ok(nodes.summary.value.includes('Protocolo da conversa'));const firstCode=nodes.protocolValue.textContent;
 check('Prévia: correção da renda atualiza o resumo e confirmação gera protocolo demonstrativo copiável.');
 check('Prévia: bairro, estado civil e WhatsApp incluídos na revisão; recusa de contato não bloqueia o protocolo.');
 loadPreview();assert.equal(nodes.protocolValue.textContent,firstCode);assert.equal(nodes.protocolBox.hidden,false);nodes.specialist.dispatch('click');assert.ok(nodes.summary.value.includes('R$ 4500'));
 check('Prévia: recarregar a mesma aba preserva a qualificação e o protocolo da conversa.');
 reset();await say('Carlos');await select('Alugar');await select('Apartamento');await say('Teresina');await select('Sem preferência de bairro');await say('R$ 1500');await select('Autônomo');assert.ok(lastReply().includes('atividade'));await say('Eletricista');await select('Prefiro não informar');await select('Prefiro não informar');assert.ok(lastReply().includes('conhecer as opções'));assert.ok(!lastReply().includes('adquirir'));await select('Quero avaliar');await select('Prefiro não informar');assert.ok(lastReply().includes('Eletricista'));assert.ok(lastReply().includes('prefiro não informar'));await select('Confirmar e gerar protocolo');assert.notEqual(nodes.protocolValue.textContent,firstCode);
 check('Prévia: aluguel pergunta a atividade do autônomo, aceita recusa de renda e respeita a intenção de alugar.');
 reset();await say('Maria');await select('Comprar');await select('Apartamento');await say('Teresina');await select('Sem preferência de bairro');await select('Preciso de orientação');await select('MEI');await say('Comércio de roupas');await say('Meu faturamento é R$ 10 mil');assert.ok(lastReply().includes('diferente da sua renda pessoal'));assert.ok(nodes.guideOptions.children.some(x=>x.textContent==='Até R$ 2 mil/mês'));await say('Minha renda bruta é R$ 3000');await select('Prefiro não informar');assert.ok(lastReply().includes('oportunidade'));await select('Ainda estou pesquisando');await select('Prefiro não informar');assert.ok(lastReply().includes('Ainda estou pesquisando'));
 check('Prévia: MEI informa atividade e esclarece faturamento antes de registrar renda pessoal, sem pressionar quem pesquisa.');
 reset();await say('Quero falar com um corretor especialista');assert.ok(!nodes.protocolBox.hidden);assert.ok(lastReply().includes('envie no Instagram'));assert.equal(calls.length,beforePreviewCalls);
 check('Prévia: contato humano interrompe a triagem e toda a demonstração funciona sem enviar mensagens ao servidor.');
 reset();shortcuts[4].dispatch('click');await tick();await tick();assert.ok(lastReply().includes('grande novidade em Teresina'));assert.ok(lastReply().includes('2 quartos'));assert.ok(lastReply().includes('piscina'));assert.ok(!lastReply().includes('material divulgado'));assert.ok(nodes.guideOptions.children.some(x=>x.textContent==='Falar com especialista'));
 await select('Continuar com a Lara');assert.ok(lastReply().includes('Como posso chamar'));await say('Bia');await select('Comprar');await select('Apartamento');assert.ok(nodes.guideOptions.children.some(x=>x.textContent==='Altos'));assert.ok(nodes.guideOptions.children.some(x=>x.textContent==='Demerval Lobão'));assert.ok(nodes.guideOptions.children.some(x=>x.textContent==='Timon'));await select('Timon');await select('Sem preferência de bairro');await select('Preciso de orientação');await say('Tenho pressa');assert.ok(lastReply().includes('especialista'));await select('Falar com especialista');assert.ok(!nodes.protocolBox.hidden);nodes.specialist.dispatch('click');assert.ok(nodes.summary.value.includes('Timon'));assert.ok(nodes.summary.value.includes('Village Pôr do Sol'));assert.ok(!nodes.summary.value.includes('Renda bruta mensal'));assert.equal(calls.length,beforePreviewCalls);
 check('Prévia: Village apresenta benefícios e campanha, regiões ampliadas e contato direto sem exigir renda.');
 const built=fs.readFileSync(fs.existsSync('../index.html')?'../index.html':'index.html','utf8');assert.ok(built.includes('id="laraPhoto"'));assert.ok(built.includes('data:image/webp;base64,'));assert.ok(built.includes('href="assets/prime-lar-logo.jpg"'));assert.ok(built.includes('class="brand-panel"'));assert.ok(built.includes('viewBox="0 0 360 360"'));assert.ok(built.includes('campaign-badge'));assert.ok(built.includes('Novidade'));assert.ok(!built.includes('__LARA_IMAGE__'));
 const standalone=fs.readFileSync('LARA_PRIME_LAR_PREVIA.html','utf8');assert.ok(standalone.includes('data:image/webp;base64,'));assert.ok(standalone.includes('data:image/jpeg;base64,'));assert.ok(standalone.includes('data:image/jpeg;base64,'));assert.ok(!standalone.includes('Mensagens processadas por IA e registradas'));assert.ok(!/\bfetch\(/.test(standalone));
 check('Interface: imagem antiga da Lara e marca Prime Lar incorporadas, perfil enquadrado e destaque de campanha; prévia sem dependência das imagens externas.');


}
(async()=>{await backend();await frontend();fs.writeFileSync('validacao_local.json',JSON.stringify({status:'aprovado_localmente',checks,limite:'Mocks locais; sem teste de produção, microfone físico, renderização em navegador ou resposta real do Gemini.'},null,2));for(const c of checks)console.log('OK:',c);console.log('Total:',checks.length);})().catch(e=>{console.error(e);process.exitCode=1;});
