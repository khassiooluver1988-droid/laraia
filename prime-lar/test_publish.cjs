// Confere o fluxo real de publicação, inclusive edições feitas direto no GitHub.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lara-publish-'));
const run=(args,env={})=>execFileSync(args[0],args.slice(1),{cwd:temp,env:{...process.env,...env},stdio:'pipe'}).toString();
const checks=[];
try{
 for(const file of ['index.html','android.js','android.css','manifest.webmanifest'])fs.copyFileSync(path.join(root,file),path.join(temp,file));
 fs.cpSync(path.join(root,'assets'),path.join(temp,'assets'),{recursive:true});
 fs.cpSync(path.join(root,'prime-lar'),path.join(temp,'prime-lar'),{recursive:true,filter:file=>!file.includes('LARA_PRIME_LAR_')});
 run(['git','init','-b','main']);run(['git','config','user.name','Lara Test']);run(['git','config','user.email','test@example.invalid']);run(['git','add','.']);run(['git','commit','-m','base']);
 const revision=()=>fs.readFileSync(path.join(temp,'sw.js'),'utf8').match(/const REVISION = '([^']+)'/)[1];
 const node=process.execPath,script='prime-lar/build_publish.cjs',event=path.join(temp,'event.json');
 const publish=()=>run([node,script],{GITHUB_EVENT_NAME:'push',GITHUB_EVENT_PATH:event});
 const before=()=>run(['git','rev-parse','HEAD']).trim();
 let base=before();
 const index=path.join(temp,'index.html');
 fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace('Um novo começo pode começar aqui','Teste de edição direta no GitHub'));
 run(['git','add','index.html']);run(['git','commit','-m','edicao direta']);fs.writeFileSync(event,JSON.stringify({before:base}));
 publish();assert.match(fs.readFileSync(index,'utf8'),/Teste de edição direta no GitHub/);const direct=revision();
 publish();assert.equal(revision(),direct);
 checks.push('Editar index.html diretamente preserva a alteração e gera versão estável em recompilações.');
 base=before();const app=path.join(temp,'prime-lar/app.js');
 fs.appendFileSync(app,'\n/* TESTE_FONTES_COMPILE */\n');run(['git','add','prime-lar/app.js']);run(['git','commit','-m','fontes']);fs.writeFileSync(event,JSON.stringify({before:base}));
 publish();assert.match(fs.readFileSync(index,'utf8'),/TESTE_FONTES_COMPILE/);assert.notEqual(revision(),direct);
 checks.push('Editar as fontes da interface recompila a aplicação e gera nova revisão para os instalados.');
 base=before();fs.appendFileSync(path.join(temp,'prime-lar/app-design.css'),'\n/* TESTE_VISUAL_COMPILADO */\n');run(['git','add','prime-lar/app-design.css']);run(['git','commit','-m','visual']);fs.writeFileSync(event,JSON.stringify({before:base}));publish();assert.match(fs.readFileSync(index,'utf8'),/TESTE_VISUAL_COMPILADO/);
 checks.push('Editar o estilo do aplicativo também recompila a interface automaticamente.');
 const compiled=revision();fs.appendFileSync(path.join(temp,'prime-lar/sw-template.js'),'\n// TESTE_WORKER_REVISAO\n');
 run([node,'prime-lar/build_android.cjs']);assert.notEqual(revision(),compiled);
 checks.push('Alterar o service worker também muda o nome do cache, mantendo revisões isoladas.');
 console.log(JSON.stringify({status:'aprovado',checks},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
