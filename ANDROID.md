# Lara para Android — versão 1.0

Aplicativo web instalável (PWA) sobre a interface atual da Lara. A instalação usa o Chrome no Android, sem APK e sem loja. Não modifica a função de atendimento, as tabelas ou o roteiro existente.

## Atualizar Lara

A opção **Atualizar Lara**, disponível no **Menu** do canto superior direito, abre a verificação de novas versões. Com internet, ele consulta a publicação e informa se há uma atualização pronta. Toque em **Atualizar agora** para aplicar. Rascunho, áudio aberto ou resposta em andamento impedem a recarga até terminar essa etapa.

Ao salvar alterações na branch `main`, o GitHub Actions gera automaticamente o aplicativo e a nova revisão do cache antes de publicar. Se a alteração foi feita diretamente no `index.html`, ela é preservada. Alterações nas fontes `prime-lar/template.html`, `prime-lar/app.js` , `prime-lar/app-design.css` ou `prime-lar/build_local.cjs` recompilam a interface a partir dessas fontes. Se o mesmo conjunto de commits alterar fontes e `index.html`, as fontes são a versão canônica.

As mudanças só ficam disponíveis após sucesso do workflow de publicação. Alterações em função de IA ou banco do Supabase continuam exigindo implantação própria; o botão atualiza a interface publicada.

## Instalar e compartilhar

Compartilhe https://khassiooluver1988-droid.github.io/laraia/ com o cliente. Abra no Chrome do Android, abra **Menu → Instalar** e confirme. Se o navegador ainda não oferecer o botão de confirmação, abra o menu ⋮ e escolha **Instalar aplicativo** ou **Adicionar à tela inicial**. O nome pode variar conforme o aparelho e navegador.

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

Verificação: `node --no-warnings test_local.cjs`, `node test_android.cjs` e `node test_publish.cjs`, dentro de `prime-lar`.

## Limites de validação

Os testes locais verificam manifesto, recursos, ciclo de instalação/atualização, isolamento da API e funcionamento offline simulado. A instalação final e a permissão de microfone precisam ser verificadas em um Android físico. Nenhum APK foi gerado ou aplicativo publicado na Play Store.

## Menu do atendimento

Comprar, Alugar, Apartamento, Casa, Lançamento Village Pôr do Sol, Tenho dúvidas e Falar com especialista ficam no menu superior direito. Nova conversa, informações, instalação e atualização também ficam nesse menu. A área inferior mantém a composição de mensagem, microfone e envio, com os avisos temporários e as respostas rápidas da etapa atual quando necessários.

## Visual 3.0

Interface para celular com cabeçalho único e compacto, avatar e identificação da assistente, conversa em cartões e barra de mensagem integrada. Menu superior com ícones; painéis de dúvidas e informações abrem como uma folha na parte inferior em telas pequenas. O arquivo `prime-lar/app-design.css` é a fonte visual e suas alterações geram a nova versão automaticamente na publicação. O retrato e a logomarca originais são preservados.

## Modelo enviado e voz — visual 4.0

Fundo azul-marinho, logomarca Prime Lar à esquerda, foto circular e menu à direita. Cartões brancos, controles de leitura azuis e Falar/Enviar verdes. A voz é desativada ao abrir; pode-se ativar a leitura das novas respostas ou ouvir somente a última. Parar interrompe a leitura. Microfone, envio, nova conversa e saída da tela encerram a leitura em andamento. O navegador escolhe uma voz em português disponível, preferindo pt-BR; timbre e disponibilidade variam por aparelho. Nenhum serviço pago ou nova função de servidor foi contratado.

## Resposta lenta e reenvio

Durante uma resposta demorada, a interface continua indicando que está aguardando. Se houver falha, o texto volta para a caixa e aparece Tentar novamente. O reenvio da mesma mensagem mantém o identificador para evitar respostas e registros duplicados. A atualização do serviço já foi implantada no Supabase; a interface recebe a nova versão pelo mecanismo Atualizar Lara.
