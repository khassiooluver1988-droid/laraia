# Lara — Prime Lar Imobiliária

A versão 2.1 guia o cliente por nome, compra/aluguel, casa/apartamento, região e valor do imóvel; continua com ocupação, vínculo ou atividade, renda bruta mensal opcional, intenção de avançar e revisão do resumo. O fluxo respeita recusas e quem ainda pesquisa. Os botões de resposta acompanham a etapa acima da caixa de mensagem. A gravação é limitada a 60 segundos; o cliente pode ouvir, transcrever, revisar e enviar o texto.

## Estado da entrega

Implementação preparada e 23 verificações locais aprovadas com mocks de navegador, banco e provedor, incluindo a demonstração do roteiro completo. A implantação da Edge Function foi rejeitada pela revisão automática de aprovação por envolver processamento externo de mensagens e áudios pelo Gemini e registro de conversas em produção. A função ativa e o site principal continuam com a versão anterior. Este rascunho não dispara a publicação, cujo fluxo existente roda apenas na branch main.

Foram criadas as tabelas vazias lara_prime_sessoes e lara_prime_mensagens no projeto existente. RLS foi habilitado e o acesso direto de anon/authenticated foi revogado. O serviço do servidor é quem fará o acesso. Isso ainda não ativou o atendimento da Prime Lar.

## Arquivos

- index.html na raiz: interface pronta para implantação.
- prime-lar/index.ts: função lara-chat proposta, usando a chave Gemini já configurada no servidor.
- prime-lar/schema.sql: estrutura de dados da Prime Lar, separada das sessões anteriores.
- prime-lar/PROMPT_LARA_PRIME_LAR.txt: identidade, base comercial, abordagem consultiva, dúvidas e limites.
- prime-lar/template.html e app.js: fontes da interface.
- prime-lar/demo.js: respostas locais da prévia, sem chamar o servidor.
- prime-lar/build_local.cjs: compila a interface, a prévia e sincroniza as instruções da função.
- prime-lar/test_local.cjs e validacao_local.json: testes e resultado local.

## Ocupação, renda e protocolo

CLT/carteira assinada é uma só opção. Servidor público/concursado recebe opções municipal, estadual e federal; autônomo, MEI e empresário informam atividade. Aposentado/pensionista, sem trabalho no momento e recusa também são aceitos. Não se infere renda, elegibilidade ou aprovação pelo vínculo. A renda é pessoal, bruta e mensal; faturamento do negócio pede esclarecimento.

O resumo inclui somente informações declaradas e pode ser corrigido ou editado antes de copiar. O protocolo é gerado pelo servidor após confirmação do resumo ou pedido direto de humano. Usa a data de criação da sessão em Brasília e o UUID completo, no formato PL-AAAAMMDD-IDENTIFICADOR. O mesmo atendimento conserva a referência em reenvios; outra sessão recebe outra referência. Não é o número de uma análise de crédito nem comprovante de envio à equipe. Na prévia aparece com prefixo DEMO-PL.

## Continuidade com especialista

O canal informado e configurado é https://www.instagram.com/primelarimobiliaria/. O cliente revisa e copia o resumo, abre o perfil e decide se envia uma mensagem privada. Não há transferência automática, notificação à equipe ou WhatsApp confirmado. O número oficial e uma integração de encaminhamento precisam ser definidos para acrescentar esses recursos.

## Dados e processamento propostos para produção

- Mensagem digitada ou texto transcrito: enviado pelo servidor ao Gemini para gerar a resposta e registrado no banco de atendimento.
- Áudio: gravado temporariamente no navegador e, somente ao tocar em Transcrever, enviado via servidor ao Gemini. O arquivo de áudio não é salvo nas tabelas de histórico desta aplicação.
- Texto transcrito: retorna ao rascunho. Só entra no chat depois de o cliente revisar e tocar em Enviar.
- Conversas: guardadas em tabelas próprias da Prime Lar. Cada sessão tem token de acesso, cujo hash é guardado no servidor.
- Qualificação: ocupação, vínculo/atividade e renda bruta mensal voluntariamente declarados são processados junto da conversa e preservados no perfil. O cliente pode pular a pergunta e retirar dados do resumo que enviará à equipe.
- Navegador: identificador em localStorage e histórico exibido em sessionStorage. Nova conversa limpa o estado local, sem apagar os registros do servidor.
- Limite diário: reutiliza o limite existente de 100 chamadas ao provedor por dia, também consumido pelas transcrições. Não representa capacidade comercial ilimitada.

## Informações que precisam ser confirmadas

- WhatsApp oficial, corretor/equipe que recebe os leads, horário e aviso de privacidade oficial.
- Endereço de atendimento: os textos apresentam Av. Jerumenha, 5428 e Rua Eng. Miguel Furtado Bacelar, 3415, Sala B, além de bairros divergentes.
- Village Pôr do Sol: campanha com R$ 100, primeiras parcelas de R$ 127, entrada em até 72 vezes e benefícios de taxas precisa ter vigência, unidade, tabela e regras verificadas. A IA não pode dizer que R$ 127 é uma prestação permanente do financiamento.
- Logo e identidade oficial: o Instagram não pôde ser conferido integralmente. A interface usa azul e mantém o avatar anterior da Lara; a marca está escrita em texto, sem alegar reprodução de uma logo oficial.

## Validação

Executar `cd prime-lar && node --no-warnings build_local.cjs && node --no-warnings test_local.cjs` em Node com stripTypeScriptTypes. No checkout, o compilador lê e atualiza index.html da raiz, reaproveitando o avatar. Em uma pasta de trabalho isolada, usa o index.html local. O arquivo de prévia gerado serve somente para revisar respostas demonstrativas.

Os testes verificam sessão, origem, entrada, cota, histórico, idempotência, falhas, transcrição separada do envio, rascunho, resumo, permissão do microfone, reset, continuidade da triagem, renda distinta do orçamento, correção, recusa, aluguel, faturamento versus renda e protocolo estável. Um código inventado pelo modelo não é utilizado como referência do atendimento.

Não houve teste em produção da versão proposta, resposta real do Gemini, microfone físico ou renderização em navegador. O ambiente não disponibiliza o controle de navegador exigido pelo fluxo de Sites. Depois da autorização, implantar primeiro a função, testar compra/aluguel/dúvidas/transcrição, publicar a interface e confirmar o resultado do GitHub Pages. Não mesclar este rascunho antes disso.
