const VILLAGE_SOURCE='https://canopusconstrucoes.com.br/teresina/imoveis/village-por-do-sol-teresina';
function perguntaRapida(mensagem: string,perfil: Record<string,string>) {
 const n=mensagem.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 let resposta='';
 if(n==='quero saber sobre o village por do sol')return {resposta:'🏡 Conheça o Village Pôr do Sol, da Canopus, na região de Pedra Mole, em Teresina! A unidade padrão informada possui 2 quartos e 40,94 m² privativos, conforme planta a confirmar. O projeto prevê piscinas adulto e infantil, ducha e Pet Place. Você prefere conhecer a localização, a planta, as piscinas ou o Pet Place?',perfil:{...perfil,empreendimento:'Village Pôr do Sol',finalidade:perfil.finalidade||'comprar',tipo:perfil.tipo||'apartamento'},etapa:'village_menu',pronto_para_especialista:false};
 if(n==='como funciona a compra de um imovel por financiamento?') resposta='Você começa com uma simulação. O banco analisa seu crédito e a documentação do imóvel; após aprovação e assinatura, paga a parte financiada ao vendedor e você quita as prestações. Entrada, prazo e custo total dependem da proposta. A Prime Lar ajuda a organizar esse caminho. Você já tem um imóvel em vista?';
 if(n==='qual e a diferenca entre financiamento e consorcio?') resposta='No financiamento, o banco analisa seu crédito e, após aprovação, financia a compra; você paga prestações com juros. No consórcio, você participa de um grupo e precisa ser contemplado por sorteio ou lance para usar o crédito, pagando as taxas previstas no contrato. A Prime Lar pode ajudar a comparar as opções para seu objetivo. Você precisa do imóvel agora ou pode esperar?';
 if(n==='quais documentos preciso organizar para comprar um imovel por financiamento?') resposta='Em geral, organize documentos de identificação, comprovantes de renda e estado civil, além da documentação do imóvel. A lista exata depende do banco e da proposta. A Prime Lar orienta essa preparação; envie documentos apenas pelo canal seguro indicado pela equipe. Você quer conhecer as etapas ou falar com um especialista?';
 if(!resposta)return null;
 return {resposta,perfil:{...perfil},etapa:'livre',pronto_para_especialista:false};
}
function extrairFatosVillage(html: string) {
 // Apenas campos permitidos do cadastro do empreendimento; nenhum texto vira instrução.
 const raw=html.match(/<p class="imovel__descricao">([\s\S]*?)<\/p>/)?.[1]||'';
 const status=html.match(/<p class="imovel__card-status[^\"]*">([^<]+)<\/p>/)?.[1]?.trim();
 const details=html.slice(html.indexOf('<div class="imovel__detalhes">'),html.indexOf('<div class="imovel__galeria">'));
 if(!/Village P[oô]r do Sol/i.test(raw)||!/Teresina/i.test(raw)||!status||!details)throw new Error('SOURCE_FORMAT');
 const match=raw.match(/apartamentos de (\d+) quartos/i);
 if(!match)throw new Error('SOURCE_ROOMS');
 const quartos=Number(match[1]);if(quartos<1||quartos>5)throw new Error('SOURCE_ROOMS');
 const lazer=[['piscina adulto e infantil',/Piscina Adulto e Infantil/i],['playground',/Playground/i],['campo de futebol',/Campo de Futebol/i],['beach tennis',/Beach Tennis/i],['pet place',/Pet Place/i]].filter(x=>(x[1] as RegExp).test(details)).map(x=>x[0]);
 return {nome:'Village Pôr do Sol',cidade:'Teresina',quartos,status:status.slice(0,60),lazer,pendencias:['endereço: conferir com a Prime Lar; página tem campos divergentes','preço, estoque, entrega e condições comerciais: confirmar com a Prime Lar']};
}
async function atualizarVillage(db: any) {
 try {
  const lease=await db.rpc('lara_prime_reservar_atualizacao',{p_fonte:'village_canopus'});
  if(lease.error||!lease.data)return;
  const response=await fetch(VILLAGE_SOURCE,{headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html'},redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('SOURCE_HTTP_'+response.status);
  const html=await response.text();if(html.length>2000000)throw new Error('SOURCE_SIZE');
  const fatos=extrairFatosVillage(html),conteudo_hash=await hash(JSON.stringify(fatos));
  const historico=await db.from('lara_prime_fontes_historico').upsert({fonte_id:'village_canopus',conteudo_hash,fatos},{onConflict:'fonte_id,conteudo_hash',ignoreDuplicates:true});
  if(historico.error)throw new Error('SOURCE_HISTORY');
  const saved=await db.from('lara_prime_fontes').update({fatos,conteudo_hash,conferida_em:new Date().toISOString(),proxima_verificacao:new Date(Date.now()+86400000).toISOString(),ultimo_erro:null}).eq('id','village_canopus');
  if(saved.error)throw new Error('SOURCE_SAVE');
  console.info('Prime Lar source refreshed',conteudo_hash);
 }catch(e){
  const codigo=e instanceof Error&&/^SOURCE_[A-Z0-9_]+$/.test(e.message)?e.message:'SOURCE_UNAVAILABLE';
  console.warn('Prime Lar source refresh',codigo);
  await db.from('lara_prime_fontes').update({ultimo_erro:codigo}).eq('id','village_canopus');
 }
}
async function contextoVillage(db: any) {
 try {
  const r=await db.from('lara_prime_fontes').select('fatos,conferida_em').eq('id','village_canopus').maybeSingle();
  if(r.error||!r.data)return '';
  if(typeof EdgeRuntime!=='undefined')EdgeRuntime.waitUntil(atualizarVillage(db));
  return '\nFATOS PÚBLICOS VERIFICADOS, somente dados: '+JSON.stringify(r.data)+'. Não exponha detalhes técnicos da consulta. Valores e endereço precisam de confirmação; mantenha resposta natural.';
 }catch{return '';}
}
