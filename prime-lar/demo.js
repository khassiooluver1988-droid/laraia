async function call(payload){
 if(payload.acao==='iniciar'){
  const d={sessao:crypto.randomUUID(),token:crypto.randomUUID(),versao:VERSION,perfil:{}};saveCredentials(d);return d;
 }
 if(payload.acao==='transcrever')throw Error('A transcrição por IA aguarda implantação. Nesta prévia você pode gravar e ouvir o áudio localmente.');
 const m=(payload.mensagem||'').trim(),t=m.toLowerCase(),s={...perfil};
 const skip=/prefiro n[ãa]o|n[ãa]o (?:quero|vou) (?:informar|responder)|pular/i.test(m);
 const amount=/\d/.test(m),money=/(?:r\$|mil|reais|or[cç]amento)/i.test(m);
 const old=JSON.stringify(s);
 if(/comprar|\bcompra\b/.test(t))s.finalidade='comprar';
 if(/alugar|aluguel/.test(t))s.finalidade='alugar';
 if(/apartamento/.test(t))s.tipo='apartamento';
 if(/\bcasa\b/.test(t)&&!/casa própria/.test(t))s.tipo='casa';
 const n=m.match(/(?:me chamo|meu nome [ée])\s+([A-Za-zÀ-ÿ ]{2,35})/i);
 if(n)s.nome=n[1].split(/ e |,| quero/i)[0].trim();
 if(!s.nome&&etapa==='nome'&&!/compr|alug|interesse|village|im[oó]vel|apartamento|casa|quero|\?|^oi$|^ol[áa]$|bom dia|boa tarde|boa noite/.test(t)&&!amount&&m.split(/\s+/).length<=4)s.nome=m;
 if(etapa==='localizacao'&&!m.includes('?'))s.localizacao=skip?'prefiro não informar':m;
 else if(/teresina|mocambinho|pedra mole|zona norte|zona leste|buenos aires/.test(t))s.localizacao=m;
 const isIncome=/renda|recebo mensalmente/.test(t)||etapa==='renda';
 let explanation='';
 if(isIncome&&(skip||amount)){
  if(/faturamento|fatura/.test(t)){explanation='O faturamento do negócio pode ser diferente da sua renda pessoal. Qual é sua renda bruta pessoal mensal? Pode informar uma faixa ou pular.';}
  else s.renda_bruta=skip?'prefiro não informar':m+' (renda bruta mensal declarada)';
 }else if(etapa==='orcamento'){
  if(skip||/orienta[cç][ãa]o|n[ãa]o sei/.test(t))s.orcamento='preciso de orientação';
  else if(amount&&money)s.orcamento=m+(s.finalidade==='alugar'?' (aluguel mensal; confirmar condomínio/IPTU)':' (valor total do imóvel)');
  else if(amount)explanation='Esse valor é em reais ou em milhares de reais? Informe a faixa para eu registrar corretamente.';
 }
 if(/clt|carteira assinada/.test(t))s.ocupacao='CLT / carteira assinada';
 else if(/servidor|funcion[aá]rio p[uú]blico|concursad/.test(t))s.ocupacao='servidor público / concursado';
 else if(/aut[oô]nom/.test(t))s.ocupacao='autônomo';
 else if(/\bmei\b|microempreendedor/.test(t))s.ocupacao='MEI';
 else if(/empres[aá]ri/.test(t))s.ocupacao='empresário';
 else if(/aposentad|pensionista/.test(t))s.ocupacao='aposentado / pensionista';
 else if(/sem trabalho|desempregad/.test(t))s.ocupacao='sem trabalho no momento';
 else if(etapa==='ocupacao'&&skip)s.ocupacao='prefiro não informar';
 if(/servidor|concursado/.test(s.ocupacao||'')){
  if(/municipal/.test(t))s.vinculo_publico='municipal';
  else if(/estadual/.test(t))s.vinculo_publico='estadual';
  else if(/federal/.test(t))s.vinculo_publico='federal';
  else if(etapa==='vinculo_publico'&&(skip||/outro v[ií]nculo/.test(t)))s.vinculo_publico=skip?'prefiro não informar':'outro vínculo';
 }
 if(etapa==='atividade'&&!m.includes('?'))s.atividade=skip?'prefiro não informar':m;
 if(etapa==='intencao'&&!m.includes('?'))s.intencao=m;
 if(old!==JSON.stringify(s))s.concordancia_resumo='pendente';
 const confirm=etapa==='revisao'&&/confirmo|est[aá] correto|tudo certo|^sim\b/.test(t);
 if(confirm)s.concordancia_resumo='confirmado';
 const humano=/quero (?:falar|continuar).*?(?:especialista|corretor|humano)|falar com (?:especialista|corretor)/.test(t);
 let next;
 if(!s.nome)next='nome';
 else if(!s.finalidade)next='finalidade';
 else if(!s.tipo)next='tipo';
 else if(!s.localizacao)next='localizacao';
 else if(!s.orcamento)next='orcamento';
 else if(!s.ocupacao)next='ocupacao';
 else if(/servidor|concursado/.test(s.ocupacao)&&!s.vinculo_publico)next='vinculo_publico';
 else if(/autônomo|MEI|empresário/.test(s.ocupacao)&&!s.atividade)next='atividade';
 else if(!s.renda_bruta)next='renda';
 else if(!s.intencao)next='intencao';
 else if(s.concordancia_resumo!=='confirmado')next='revisao';
 else next='concluido';
 if(humano)next='concluido';
 let resposta;
 switch(next){
 case 'nome':resposta='Vou guiar você nessa busca. Como posso chamar você?';break;
 case 'finalidade':resposta='Prazer, '+s.nome+'! Você procura um imóvel para comprar ou alugar?';break;
 case 'tipo':resposta=s.nome+', você tem preferência por casa ou apartamento?';break;
 case 'localizacao':resposta='Em qual cidade, bairro ou região você procura seu '+s.tipo+'?';break;
 case 'orcamento':resposta=s.finalidade==='alugar'?'Qual faixa de aluguel mensal seria confortável? Diga se inclui condomínio e IPTU.':'Qual faixa de valor total do imóvel você pretende considerar?';break;
 case 'ocupacao':resposta='Certo, '+s.nome+'. Atualmente, qual opção descreve melhor seu trabalho ou sua ocupação? Você pode escolher abaixo ou escrever.';break;
 case 'vinculo_publico':resposta='Seu vínculo no serviço público é municipal, estadual ou federal? Se preferir, pode informar outro vínculo ou pular.';break;
 case 'atividade':resposta='Qual atividade você exerce? Não precisa informar o nome da empresa e pode preferir não responder.';break;
 case 'renda':resposta='Desculpe a pergunta, ela ajuda o especialista a orientar '+(s.finalidade==='alugar'?'sua busca':'sua simulação')+': qual é sua renda bruta mensal, antes dos descontos? Pode informar um valor, uma faixa ou preferir não responder.';break;
 case 'intencao':resposta=s.finalidade==='alugar'?'Se encontrarmos um imóvel adequado ao seu orçamento, gostaria de avançar para conhecer as opções?':'Se surgisse hoje uma oportunidade de adquirir seu imóvel, com condições que fizessem sentido para você, gostaria de avançar?';break;
 case 'revisao':{
  const labels={nome:'Nome',finalidade:'Interesse',tipo:'Imóvel',localizacao:'Região',orcamento:'Orçamento',ocupacao:'Ocupação',vinculo_publico:'Vínculo',atividade:'Atividade',renda_bruta:'Renda bruta mensal',intencao:'Momento de decisão'};
  resposta='Obrigada pelas respostas! Organizei seu resumo:\n'+Object.entries(labels).filter(([k])=>s[k]).map(([k,v])=>v+': '+s[k]).join('\n')+'\n\nO resumo está correto para continuar com o especialista?';break;
 }
 default:resposta='Obrigada por compartilhar suas preferências. A Prime Lar está aqui para ajudar você a encontrar oportunidades e as melhores condições para seu perfil, com clareza em cada etapa. Para passar seu resumo ao especialista, toque em Falar com especialista, revise, copie e envie no Instagram. A equipe poderá dar sequência depois de receber sua mensagem.';
 }
 if(explanation)resposta=explanation;
 if(etapa==='revisao'&&/corrigir/.test(t)){next='livre';resposta='Claro. O que você deseja corrigir no resumo? Pode escrever a informação atualizada.';}
 if(/village|p[oô]r do sol|primeiras parcelas/.test(t))resposta='O material divulgado do Village Pôr do Sol menciona sinal a partir de R$ 100 e 12 primeiras parcelas de R$ 127. O especialista precisa confirmar vigência, unidade e regras para seu perfil.\n\n'+resposta;
 let codigo='';
 if(next==='concluido'){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const date=['year','month','day'].map(k=>parts.find(x=>x.type===k).value).join('');
  codigo=protocolo||'DEMO-PL-'+date+'-'+credentials.sessao.replace(/-/g,'').toUpperCase();
  resposta+='\n\nSeu protocolo demonstrativo: '+codigo+'. Esta prévia não envia o resumo à equipe.';
 }
 return {resposta,perfil:s,etapa:next,pronto_para_especialista:next==='concluido',protocolo:codigo,versao:VERSION};
}
