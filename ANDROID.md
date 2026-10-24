# Lara para Android — versão 1.0

Aplicativo web instalável (PWA) sobre a interface atual da Lara. A instalação usa o Chrome no Android, sem APK e sem loja. Não modifica a função de atendimento, as tabelas ou o roteiro existente.

## Instalar e compartilhar

Compartilhe https://khassiooluver1988-droid.github.io/laraia/ com o cliente. Abra no Chrome do Android, toque em **Instalar** no cabeçalho e confirme. Se o navegador ainda não oferecer o botão de confirmação, abra o menu ⋮ e escolha **Instalar aplicativo** ou **Adicionar à tela inicial**. O nome pode variar conforme o aparelho e navegador.

Após instalar, abra o ícone **Lara** na tela inicial ou na lista de aplicativos. Celular e tablet usam a mesma versão responsiva. Links abertos dentro de Instagram/WhatsApp devem ser abertos no navegador para instalar. A instalação depende da decisão do usuário e do suporte do navegador.

## Comportamento

- Mantém o avatar, a identidade Prime Lar, os botões, a jornada Village e o endpoint já existentes.
- Abre em janela independente com ícones de 192/512 pixels e ícone adaptável à máscara do Android.
- Após a primeira carga online bem-sucedida e ativação do cache, a interface pode abrir sem conexão; conversa e transcrição exigem internet. Não enfileira nem envia mensagens automaticamente ao reconectar.
- Somente arquivos públicos desta interface entram no Cache Storage. Requisições à API, mensagens, respostas e áudio não passam pelo service worker. O armazenamento da conversa já existente no navegador é preservado.
- Nova revisão tem cache próprio, avisa quando pronta e só recarrega após clicar em **Atualizar**. Rascunho, áudio aberto ou resposta em andamento impedem a atualização nessa aba. Outras abas recebem a revisão no próximo carregamento.
- A instalação não é apresentada dentro do iframe do widget ou nas prévias demonstrativas.

## Reproduzir

Os ícones exportados ficam versionados. Para recriá-los: `python prime-lar/build_android_icons.py` (Pillow). São recortes/redimensionamentos técnicos do retrato existente, sem geração de nova personagem.

Em `prime-lar`, rode `node build_local.cjs`. O build gera a interface real, injeta o manifesto/instalador e calcula uma revisão a partir de todos os arquivos do cache. Após qualquer alteração nos arquivos públicos do aplicativo, execute o build para atualizar `sw.js`.

Verificação: `node --no-warnings test_local.cjs` e `node test_android.cjs`, dentro de `prime-lar`.

## Limites de validação

Os testes locais verificam manifesto, recursos, ciclo de instalação/atualização, isolamento da API e funcionamento offline simulado. A instalação final e a permissão de microfone precisam ser verificadas em um Android físico. Nenhum APK foi gerado ou aplicativo publicado na Play Store.
