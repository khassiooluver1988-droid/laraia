const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f));
const checks=[];
const manifest=JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.display,'standalone');assert.equal(manifest.id,'./');assert.equal(manifest.scope,'./');
assert.equal(new URL(manifest.start_url,'https://test.example/laraia/').pathname,'/laraia/');
for(const icon of manifest.icons){const bytes=read(icon.src);const size=icon.sizes.split('x').map(Number);assert.equal(bytes.readUInt32BE(16),size[0]);assert.equal(bytes.readUInt32BE(20),size[1]);}
checks.push('Manifesto com início no subdiretório correto e ícones PNG de dimensões reais.');
assert.match(read('index.html').toString(),/rel="manifest"/);assert.doesNotMatch(read('prime-lar/LARA_PRIME_LAR_PREVIA.html').toString(),/rel="manifest"/);
checks.push('Somente a interface real oferece o aplicativo; a prévia não é instalável como produção.');

async function workerTests(){
 const handlers={},stores=new Map();let networkCalls=0,online=true,claimed=false,skipped=false;
 const scope='https://test.example/laraia/';
 const cacheApi={keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async name=>{
  if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);
  return {addAll:async urls=>{const responses=await Promise.all(urls.map(url=>network(url)));urls.forEach((url,i)=>data.set(url,responses[i]));},match:async url=>data.get(typeof url==='string'?url:url.url)?.clone()};
 }};
 async function network(input){networkCalls++;if(!online)throw Error('offline');const url=new URL(typeof input==='string'?input:input.url);const name=url.pathname.replace('/laraia/','');return new Response(read(name));}
 const self={registration:{scope},clients:{claim:async()=>{claimed=true;}},skipWaiting:()=>{skipped=true;},addEventListener:(type,fn)=>handlers[type]=fn};
 vm.runInNewContext(read('sw.js').toString(),{self,caches:cacheApi,URL,fetch:network});
 async function lifecycle(type){let promise;handlers[type]({waitUntil:p=>promise=p});await promise;}
 async function request(url,method='GET',mode='cors'){let result;handlers.fetch({request:{url,method,mode},respondWith:p=>result=p});return result?{handled:true,response:await result}:{handled:false};}
 await lifecycle('install');assert(networkCalls>=10);assert.equal(skipped,false);
 const name=[...stores.keys()][0];stores.set(name.replace(/[^-]+$/,'old'),new Map());stores.set('outro-projeto-cache',new Map());
 await lifecycle('activate');assert(claimed);assert(stores.has('outro-projeto-cache'));assert.equal(stores.size,2);
 checks.push('Instalação baixa o pacote completo; ativação limpa só as revisões da Lara e preserva cache de outros projetos.');
 online=false;const before=networkCalls;
 for(const url of [scope,scope+'?origem=app',scope+'index.html']){const response=await request(url,'GET','navigate');assert(response.handled);assert.match(await response.response.text(),/id="messages"/);}
 const icon=await request(scope+'assets/android/lara-512.png');assert(icon.handled);assert.equal((await icon.response.arrayBuffer()).byteLength,read('assets/android/lara-512.png').length);
 assert.equal(networkCalls,before);
 checks.push('Interface e ícone abrem sem rede após instalação, inclusive pelo start_url com parâmetros.');
 for(const [url,method,mode] of [
  ['https://dlynbiplzruxdhgwinyn.supabase.co/functions/v1/lara-chat','POST','cors'],
  ['https://dlynbiplzruxdhgwinyn.supabase.co/functions/v1/lara-chat','GET','cors'],
  [scope+'index.html','POST','navigate'],
  [scope+'angela-casa-do-hamburguer/','GET','navigate'],
  [scope+'previa-prime-lar/index.html','GET','navigate'],
  [scope+'assets/privado.json','GET','cors']
 ])assert.equal((await request(url,method,mode)).handled,false,url);
 checks.push('API, POST, recursos desconhecidos e páginas de outros projetos nunca são interceptados pelo cache.');
 handlers.message({data:{type:'OTHER'}});assert.equal(skipped,false);
 handlers.message({data:{type:'LARA_APPLY_UPDATE'}});assert.equal(skipped,true);
 checks.push('Atualização só é ativada quando solicitada explicitamente.');
}

async function installTests(){
 class Element{
  constructor(){this.listeners={};this.hidden=false;this.value='';this.disabled=false;this.style={setProperty(){}};}
  setAttribute(){} prepend(){} append(){} insertBefore(){} showModal(){this.open=true;} close(){this.open=false;}
  addEventListener(type,fn){this.listeners[type]=fn;}
  async fire(type,event={}){return this.listeners[type]?.(event);}
 }
 const elements=new Map(),events={},swEvents={},created=[];let reloads=0;
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 get('audioBox').hidden=true;
 const document={getElementById:get,createElement:()=>{const e=new Element();created.push(e);return e;},querySelector:get,documentElement:new Element()};
 const workerMessages=[],registration={waiting:{postMessage:m=>workerMessages.push(m)},addEventListener(){}};
 const navigator={onLine:true,serviceWorker:{controller:{},register:async()=>registration,addEventListener:(type,fn)=>swEvents[type]=fn}};
 const window={isSecureContext:true,addEventListener:(type,fn)=>events[type]=fn,location:{reload:()=>reloads++}};window.self=window;window.top=window;
 vm.runInNewContext(read('android.js').toString(),{window,navigator,document,matchMedia:()=>({matches:false})});
 await new Promise(resolve=>setImmediate(resolve));
 // beforeinstallprompt recebido depois de abrir as instruções deve atualizar o mesmo diálogo.
 const installButton=get('.header-tools');assert(installButton);
 const event={preventDefault(){},prompt:async()=>{},userChoice:Promise.resolve({outcome:'dismissed'})};
 events.beforeinstallprompt(event);assert.equal(get('confirmInstall').hidden,false);
 await get('confirmInstall').fire('click');assert.match(get('installStatus').textContent,/mais tarde/);
 events.beforeinstallprompt({...event,userChoice:Promise.resolve({outcome:'accepted'})});
 await get('confirmInstall').fire('click');assert.match(get('installStatus').textContent,/solicitada/);
 events.appinstalled();assert.match(get('installStatus').textContent,/instalada/);
 checks.push('Instalação aceita, recusada e confirmada pelo navegador tem estados distintos e permite nova tentativa.');
 const apply=created.find(e=>e.textContent==='Atualizar');assert(apply);
 get('message').value='Meu rascunho';await apply.fire('click');assert.equal(workerMessages.length,0);
 get('message').value='';get('audioBox').hidden=false;await apply.fire('click');assert.equal(workerMessages.length,0);
 get('audioBox').hidden=true;get('send').disabled=true;await apply.fire('click');assert.equal(workerMessages.length,0);
 get('send').disabled=false;swEvents.controllerchange();assert.equal(reloads,0);
 await apply.fire('click');assert.equal(workerMessages[0].type,'LARA_APPLY_UPDATE');swEvents.controllerchange();assert.equal(reloads,1);
 checks.push('Rascunho, áudio e resposta em andamento bloqueiam a atualização; só uma confirmação sem pendências ativa e recarrega.');
 const sent=workerMessages.length;
 navigator.onLine=false;events.offline();navigator.onLine=true;events.online();
 assert.equal(workerMessages.length,sent);assert.equal(reloads,1);checks.push('Reconectar não envia mensagens nem recarrega a conversa automaticamente.');
}

(async()=>{await workerTests();await installTests();const result={status:'aprovado',checks};fs.writeFileSync(path.join(__dirname,'validacao_android.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));})().catch(error=>{console.error(error);process.exitCode=1;});
