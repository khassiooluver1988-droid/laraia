# Lara — Prime Lar Imobiliária

A revisão 2.5 aplica a imagem digital atualizada da Lara e preserva o contrato de atendimento prime-lar-2.3. O atendimento preparado permite à Lara para esclarecer dúvidas de compra e aluguel no site da Prime Lar, reunir as respostas em um resumo revisável e permitir o retorno do especialista pelo WhatsApp informado. O botão “Fale com a Lara” abre o painel; as opções de resposta ficam acima da caixa de mensagem.

## Identidade e roteiro

O perfil, as miniaturas e a capa usam a nova imagem digital da Lara, com camisa azul-marinho e headset. O gestor confirmou que a personagem é fictícia, produzida no Illustrator e no Photoshop, com iluminação trabalhada no ChatGPT. assets/lara-prime-lar.png preserva o arquivo recebido; o rosto é enquadrado por SVG e a capa preserva a composição completa. A logomarca recebida utiliza azul-marinho e dourado. A revisão ajusta margens e enquadramento sem alterar o roteiro.

O atendimento pergunta nome, intenção de comprar ou alugar, tipo de imóvel, cidade, bairro e orçamento. Pode continuar com ocupação, vínculo ou atividade, renda bruta mensal, estado civil e intenção de avançar. Renda, estado civil e contato são voluntários; o cliente pode pular perguntas ou pedir um especialista. Orçamento de compra ou aluguel é distinto da renda pessoal. CPF e documentos não são solicitados; a Lara não aprova crédito.

CLT/carteira assinada é uma opção. Servidor público/concursado pode indicar vínculo municipal, estadual ou federal. Autônomo, MEI e empresário podem informar atividade; faturamento do negócio pede esclarecimento antes de ser tratado como renda pessoal. A cobertura inclui Teresina, Altos, Demerval Lobão e Timon.

Village Pôr do Sol tem destaque próprio, benefícios e condições de campanha fornecidas pelo gestor. Valores e regras dependem de confirmação de vigência, unidade e perfil pelo especialista. As primeiras parcelas de R$ 127 não são apresentadas como prestação permanente do financiamento.

## Resumo e distribuição manual

A Lara pede WhatsApp com DDD para o retorno do especialista. O resumo reúne informações declaradas e pode ser corrigido antes da confirmação. Novos atendimentos confirmados recebem PL/AAAA/00000001, com oito dígitos mínimos e sequência anual de Brasília. A emissão, o par de mensagens e o perfil são salvos numa transação. Reenvios e códigos antigos já entregues preservam a referência. O assunto acompanha o código. A prévia usa DEMO-PL.

O resultado confirmado será registrado no Supabase para o gestor consultar e distribuir manualmente. CONSULTAR_ATENDIMENTOS.sql seleciona os resumos confirmados com telefone a partir das mensagens efetivamente salvas. O especialista retornará após essa distribuição. Nenhum prazo em instantes ou 24 horas foi definido. https://www.instagram.com/primelarimobiliaria/ permanece como alternativa de contato e compartilhamento manual de cópia.

## Áudio e dados propostos

A gravação é limitada a 60 segundos. O cliente pode ouvir, solicitar transcrição, revisar e enviar o texto separadamente. Em produção, o áudio será enviado via servidor ao Gemini para transcrição; o arquivo não é salvo nas tabelas de histórico desta aplicação. Mensagens e texto enviado são processados pelo Gemini e registrados no banco. Dados declarados voluntariamente podem compor o perfil.

As tabelas lara_prime_sessoes e lara_prime_mensagens já existem no projeto dlynbiplzruxdhgwinyn, com RLS habilitado e acesso direto de anon/authenticated revogado. O acesso ocorre pelo servidor; cada sessão usa token cujo hash é armazenado. CPF no formato usual ou texto identificado como CPF/RG é omitido antes do envio da mensagem de texto ao provedor e do histórico. Essa detecção não cobre todo dado pessoal que alguém possa informar nem remove dados do áudio antes da transcrição.

O navegador usa localStorage para a referência de acesso e sessionStorage para o histórico da aba. Nova conversa limpa o estado local sem apagar registros do servidor. O limite existente de 100 chamadas diárias ao provedor inclui transcrições.

## Arquivos e reprodução

- index.html na raiz: interface compilada.
- assets/prime-lar-logo.jpg: logomarca recebida.
- assets/lara-prime-lar.png: imagem digital atualizada.
- prime-lar/template.html e app.js: fontes da interface.
- prime-lar/legacy-avatar.txt: arquivo histórico do avatar antigo; não é usado na revisão 2.5.
- prime-lar/PROMPT_LARA_PRIME_LAR.txt: roteiro e instruções da IA.
- prime-lar/index.ts e schema.sql: função proposta e estrutura de dados.
- prime-lar/demo.js e widget-preview-template.html: respostas e botão demonstrativos.
- prime-lar/build_local.cjs: compilação e sincronização das instruções.
- prime-lar/test_local.cjs e validacao_local.json: verificações locais.
- prime-lar/widget.js e EMBED_LARA.html: botão e modelo de inclusão no site.
- prime-lar/CONSULTAR_ATENDIMENTOS.sql: consulta para distribuição pelo gestor.

Execute `cd prime-lar`, `node --no-warnings build_local.cjs` e `node --no-warnings test_local.cjs` em Node com stripTypeScriptTypes. A compilação gera a interface na raiz e as prévias autossuficientes em prime-lar.

## Validação e implantação

As 33 verificações locais passaram com simulações de navegador, banco e provedor. Cobrem sessão/token, origem, cota, histórico, reenvio, falhas, transcrição separada do envio, resumo, protocolo estável, correção, recusa, compra, aluguel, renda versus orçamento, campanha e identidade. widget.js também recebeu verificação de sintaxe.

A função lara-chat foi atualizada para a versão 10, com autorização explícita do gestor para processamento de mensagens/áudios pelo Gemini e registro do atendimento no Supabase. A interface preserva o contrato prime-lar-2.3. Testes reais anteriores confirmaram respostas e gravação no banco; as validações locais não substituem teste de microfone físico.

A revisão acrescenta Tenho dúvidas com três perguntas frequentes, bloqueia finalidade e tipo já escolhidos, mostra a imagem oficial do Village antes da resposta e adapta controles e tipografia ao celular. Dúvidas frequentes usam respostas revisadas sem esperar uma geração nova. Outras perguntas continuam pelo Gemini com tentativa adicional em falhas transitórias e prazo máximo por tentativa; isso não garante disponibilidade dos fornecedores.

O Village usa uma imagem da Canopus convertida para WebP. A base consulta apenas a página oficial aprovada, guarda fatos permitidos, fonte, data e histórico, e revalida em segundo plano no primeiro uso após 24 horas. Falhas de atualização conservam a última base válida e são registradas; preços, disponibilidade e endereço divergente exigem confirmação pela Prime Lar. Não existe pesquisa aberta automática do Gemini nem aprendizado a partir de conversas dos clientes.

O widget abre um iframe com permissão de microfone delegada e descarrega o painel ao fechar. HTTPS e autorização do navegador são necessários para áudio. O site que receberá o botão ainda não foi informado; nenhuma página externa foi alterada. A integração futura com WhatsApp não foi implementada.

A equipe ainda deve confirmar contato oficial, responsável pela distribuição, horário, aviso de privacidade, endereço e vigência/regras da campanha. A base recebida contém endereços divergentes; a Lara não deve escolher um endereço definitivo sem confirmação.

