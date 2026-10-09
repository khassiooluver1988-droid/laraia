# Lara — Prime Lar Imobiliária

A atualização transforma a conversa da Lara em atendimento da Prime Lar: nome preferido, compra ou aluguel, casa/apartamento, localização, orçamento e continuidade com corretor especialista. Os atalhos ficam acima da caixa de mensagem. A gravação é limitada a 60 segundos; após parar, o cliente pode ouvir, transcrever, revisar e enviar o texto.

## Estado da entrega

Implementação preparada e 14 verificações locais aprovadas com mocks de navegador, banco e provedor. A implantação da Edge Function foi rejeitada pela revisão automática de aprovação por envolver processamento externo de mensagens e áudios pelo Gemini e registro de conversas em produção. A função ativa e o site principal continuam com a versão anterior. Este rascunho não dispara a publicação, cujo fluxo existente roda apenas na branch main.

Foram criadas as tabelas vazias lara_prime_sessoes e lara_prime_mensagens no projeto existente. RLS foi habilitado e o acesso direto de anon/authenticated foi revogado. O serviço do servidor é quem fará o acesso. Isso ainda não ativou o atendimento da Prime Lar.

## Arquivos

- index.html na raiz: interface pronta para implantação.
- prime-lar/index.ts: função lara-chat proposta, usando a chave Gemini já configurada no servidor.
- prime-lar/schema.sql: estrutura de dados da Prime Lar, separada das sessões anteriores.
- prime-lar/PROMPT_LARA_PRIME_LAR.txt: identidade, base comercial, abordagem consultiva, dúvidas e limites.
- prime-lar/template.html e app.js: fontes da interface.
- prime-lar/test_local.cjs e validacao_local.json: testes e resultado local.

## Continuidade com especialista

O canal informado e configurado é https://www.instagram.com/primelarimobiliaria/. O cliente revisa e copia o resumo, abre o perfil e decide se envia uma mensagem privada. Não há transferência automática, notificação à equipe ou WhatsApp confirmado. O número oficial e uma integração de encaminhamento precisam ser definidos para acrescentar esses recursos.

## Dados e processamento propostos para produção

- Mensagem digitada ou texto transcrito: enviado pelo servidor ao Gemini para gerar a resposta e registrado no banco de atendimento.
- Áudio: gravado temporariamente no navegador e, somente ao tocar em Transcrever, enviado via servidor ao Gemini. O arquivo de áudio não é salvo nas tabelas de histórico desta aplicação.
- Texto transcrito: retorna ao rascunho. Só entra no chat depois de o cliente revisar e tocar em Enviar.
- Conversas: guardadas em tabelas próprias da Prime Lar. Cada sessão tem token de acesso, cujo hash é guardado no servidor.
- Navegador: identificador em localStorage e histórico exibido em sessionStorage. Nova conversa limpa o estado local, sem apagar os registros do servidor.
- Limite diário: reutiliza o limite existente de 100 chamadas ao provedor por dia, também consumido pelas transcrições. Não representa capacidade comercial ilimitada.

## Informações que precisam ser confirmadas

- WhatsApp oficial, corretor/equipe que recebe os leads, horário e aviso de privacidade oficial.
- Endereço de atendimento: os textos apresentam Av. Jerumenha, 5428 e Rua Eng. Miguel Furtado Bacelar, 3415, Sala B, além de bairros divergentes.
- Village Pôr do Sol: campanha com R$ 100, primeiras parcelas de R$ 127, entrada em até 72 vezes e benefícios de taxas precisa ter vigência, unidade, tabela e regras verificadas. A IA não pode dizer que R$ 127 é uma prestação permanente do financiamento.
- Logo e identidade oficial: o Instagram não pôde ser conferido integralmente. A interface usa azul e mantém o avatar anterior da Lara; a marca está escrita em texto, sem alegar reprodução de uma logo oficial.

## Validação

Executar `cd prime-lar && node --no-warnings test_local.cjs` em Node com stripTypeScriptTypes. Os testes verificam sessão, origem, entrada, cota, histórico, idempotência, falhas, transcrição separada do envio, rascunho, cópia de resumo, permissão do microfone e nova conversa.

Não houve teste em produção da versão proposta, resposta real do Gemini, microfone físico ou renderização em navegador. O ambiente não disponibiliza o controle de navegador exigido pelo fluxo de Sites. Depois da autorização, implantar primeiro a função, testar compra/aluguel/dúvidas/transcrição, publicar a interface e confirmar o resultado do GitHub Pages. Não mesclar este rascunho antes disso.
