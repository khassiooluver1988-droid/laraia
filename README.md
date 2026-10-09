# Lara — Prime Lar Imobiliária

A versão 2.3 prepara a Lara para esclarecer dúvidas de compra e aluguel no site da Prime Lar, reunir as respostas em um resumo revisável e permitir o retorno do especialista pelo WhatsApp informado. O botão “Fale com a Lara” abre o painel; as opções de resposta ficam acima da caixa de mensagem.

## Identidade e roteiro

Por solicitação do gestor, o perfil e a capa usam a imagem antiga da Lara, já existente no index.html público da branch main deste repositório. legacy-avatar.txt preserva esse avatar 3D. A identidade da Prime Lar utiliza sua logomarca azul e dourada. A nova arte com uniforme não integra esta revisão.

O atendimento pergunta nome, intenção de comprar ou alugar, tipo de imóvel, cidade, bairro e orçamento. Pode continuar com ocupação, vínculo ou atividade, renda bruta mensal, estado civil e intenção de avançar. Renda, estado civil e contato são voluntários; o cliente pode pular perguntas ou pedir um especialista. Orçamento de compra ou aluguel é distinto da renda pessoal. CPF e documentos não são solicitados; a Lara não aprova crédito.

CLT/carteira assinada é uma opção. Servidor público/concursado pode indicar vínculo municipal, estadual ou federal. Autônomo, MEI e empresário podem informar atividade; faturamento do negócio pede esclarecimento antes de ser tratado como renda pessoal. A cobertura inclui Teresina, Altos, Demerval Lobão e Timon.

Village Pôr do Sol tem destaque próprio, benefícios e condições de campanha fornecidas pelo gestor. Valores e regras dependem de confirmação de vigência, unidade e perfil pelo especialista. As primeiras parcelas de R$ 127 não são apresentadas como prestação permanente do financiamento.

## Resumo e distribuição manual

A Lara pede WhatsApp com DDD para o retorno do especialista. O resumo reúne informações declaradas e pode ser corrigido antes da confirmação. O servidor gera PL-AAAAMMDD-UUID com a data da sessão em Brasília e o UUID completo; reenvios preservam a referência. A prévia usa DEMO-PL.

O resultado confirmado será registrado no Supabase para o gestor consultar e distribuir manualmente. CONSULTAR_ATENDIMENTOS.sql seleciona os resumos confirmados com telefone a partir das mensagens efetivamente salvas. O especialista retornará após essa distribuição. Nenhum prazo em instantes ou 24 horas foi definido. https://www.instagram.com/primelarimobiliaria/ permanece como alternativa de contato e compartilhamento manual de cópia.

## Áudio e dados propostos

A gravação é limitada a 60 segundos. O cliente pode ouvir, solicitar transcrição, revisar e enviar o texto separadamente. Em produção, o áudio será enviado via servidor ao Gemini para transcrição; o arquivo não é salvo nas tabelas de histórico desta aplicação. Mensagens e texto enviado são processados pelo Gemini e registrados no banco. Dados declarados voluntariamente podem compor o perfil.

As tabelas lara_prime_sessoes e lara_prime_mensagens já existem no projeto dlynbiplzruxdhgwinyn, com RLS habilitado e acesso direto de anon/authenticated revogado. O acesso ocorre pelo servidor; cada sessão usa token cujo hash é armazenado. CPF no formato usual ou texto identificado como CPF/RG é omitido antes do envio da mensagem de texto ao provedor e do histórico. Essa detecção não cobre todo dado pessoal que alguém possa informar nem remove dados do áudio antes da transcrição.

O navegador usa localStorage para a referência de acesso e sessionStorage para o histórico da aba. Nova conversa limpa o estado local sem apagar registros do servidor. O limite existente de 100 chamadas diárias ao provedor inclui transcrições.

## Arquivos e reprodução

- index.html na raiz: interface compilada.
- assets/prime-lar-logo.jpg: logomarca.
- prime-lar/template.html e app.js: fontes da interface.
- prime-lar/legacy-avatar.txt: avatar antigo incorporado.
- prime-lar/PROMPT_LARA_PRIME_LAR.txt: roteiro e instruções da IA.
- prime-lar/index.ts e schema.sql: função proposta e estrutura de dados.
- prime-lar/demo.js e widget-preview-template.html: respostas e botão demonstrativos.
- prime-lar/build_local.cjs: compilação e sincronização das instruções.
- prime-lar/test_local.cjs e validacao_local.json: verificações locais.
- prime-lar/widget.js e EMBED_LARA.html: botão e modelo de inclusão no site.
- prime-lar/CONSULTAR_ATENDIMENTOS.sql: consulta para distribuição pelo gestor.

Execute `cd prime-lar`, `node --no-warnings build_local.cjs` e `node --no-warnings test_local.cjs` em Node com stripTypeScriptTypes. A compilação gera a interface na raiz e as prévias autossuficientes em prime-lar. Em uma pasta isolada de trabalho, usa o index.html local.

## Validação e implantação

As 27 verificações locais passaram com simulações de navegador, banco e provedor. Cobrem sessão/token, origem, cota, histórico, reenvio, falhas, transcrição separada do envio, resumo, protocolo estável, correção, recusa, compra, aluguel, renda versus orçamento, campanha e identidade. widget.js também recebeu verificação de sintaxe.

A prévia serve para a dona da Prime Lar avaliar identidade e sequência de atendimento. Respostas demonstrativas não validam respostas livres do Gemini. Faltam testes com Gemini real, navegador e microfone físico.

A função ativa lara-chat permanece na versão 8. A substituição foi rejeitada pela revisão automática por falta de autorização explícita para mensagens/áudios no Gemini e conversa/perfil registrados em produção. O rascunho não foi mesclado; o workflow publica apenas mudanças na main. A implantação deve coordenar função e interface compatíveis, validar o atendimento real e só então publicar a interface.

O widget abre um iframe com permissão de microfone delegada e descarrega o painel ao fechar. HTTPS e autorização do navegador são necessários para áudio. O site que receberá o botão ainda não foi informado; nenhuma página externa foi alterada. A integração futura com WhatsApp não foi implementada.

A equipe ainda deve confirmar contato oficial, responsável pela distribuição, horário, aviso de privacidade, endereço e vigência/regras da campanha. A base recebida contém endereços divergentes; a Lara não deve escolher um endereço definitivo sem confirmação.
