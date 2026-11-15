# Contexto para continuar o projeto

Versão ativa: **0.2.1AH-simulador_de_missao_da_NASA**. Atualizado em 15/11/2026.

## Objetivo

Criar um tutorial jogável de missões espaciais para crianças de 7 a 13 anos, apresentado por Axl e Hiroki no NASA Space Apps. O diferencial é usar dados NASA reais, com fontes e limites claros, para ensinar planejamento, recursos, comunicação e proteção. Manter o pixel art v3 bonito e acessível. A prioridade atual é uma demonstração funcional, não um jogo completo.

## Regras e decisões do proprietário

- Escrever em português, sem travessão U+2014.
- Preservar a identidade visual v3 e a cientista fornecida pelo usuário, em `public/icons/scientist.png`.
- Missões são viagens. Fases, quizzes e antigas tarefas com prêmios foram removidos da interface.
- Manter `npm run test:sim` e `npm run build` verdes. Validar mudanças de interface em computador e celular.
- Não inserir a chave pessoal NASA no código. A integração atual funciona sem ela.
- Distinguir medições, modelos científicos e regras autorais do jogo. Não apresentar uma simulação como alerta real.

## O que já funciona

1. Cientista apresenta a missão e concede 100 moedas lunares. Lua custa 100; Marte custa 400 e é uma opção futura.
2. Mapa plano NASA LRO compara planície equatorial, sem custo extra, e região polar, com mais 50 moedas. A primeira missão pousa no equador e leva água da Terra.
3. Cena de 12 segundos mostra lançamento, viagem e pouso. O mapa lunar permite arrastar e aproximar. Duas crateras nos cantos superior esquerdo e inferior direito impedem construção e movimento direto; a equipe calcula uma rota ao redor.
4. O jogador escolhe onde construir a base, confirma 30 de energia e 20 de oxigênio. Três astronautas saem do foguete, caminham e trabalham por 15 segundos, depois entram na base.
5. Antenas custam 25 de energia e 15 de oxigênio, com mais 15 segundos de trabalho após a caminhada. Toque nas antenas para enviar informações.
6. A transmissão dura 20 segundos e entrega 1 de conhecimento por segundo, 20 ao todo. A barra junto ao nível completa e o jogador chega ao nível 2. Uma mensagem da cientista pausa a simulação até Continuar a missão. A equipe então volta à base.
7. O alerta vermelho aparece primeiro, com contagem de 8 segundos. A cientista começa a explicação após 3 segundos. A tempestade dura 12 segundos, com onda laranja transparente. O abrigo reduz a exposição futura sem apagar a passada.
8. Radiação acumulada em 100%, ou energia, água, oxigênio ou comida em zero, encerra a missão com explicação. Recarregar preserva a falha. O percentual é um limite educativo, não clínico.
9. A equipe embarca, retorna à Terra e recebe 350 moedas e mais 5 de conhecimento uma única vez, totalizando 25 de conhecimento e 5/20 para o nível 3. Construções, envio, voo e resultado podem ser retomados.
10. Água e oxigênio são separados e consumidos com o tempo, como energia e comida. Pedras amarelas e coleta de regolito foram removidas da missão.
11. Login por apelido e senha, contas separadas, sincronização e detecção de conflito entre aparelhos. Visitantes salvam localmente.

## Continuação implementada nesta revisão

A cientista se chama **Dra. Bruna**. O resultado tem Voltar ao menu e Refazer tutorial. O menu reúne missões, perfil e Centro Científico. Nome, diário, moedas, nível, conhecimento e equipamentos são persistidos.

No nível 2, estufa, extrator e placas solares custam 30 moedas cada. As três compras deixam 260 moedas e liberam a expedição polar de 120, restando 140. Melhorias de modelo 2 custam 30 e exigem nível 3. Marte permanece em 400 e é futuro.

A segunda missão exige o polo sul, sem sobretaxa, e usa LCROSS/Cabeus como referência. Escolha de 1 a 6 tripulantes. Cada construção exige 45 segundos de trabalho de um astronauta: 45/quantidade após a caminhada. Água, oxigênio e comida são proporcionais à equipe.

O mapa polar tem sete crateras de seis células e seis pedras bloqueantes. Após a base, montar placas solares, extrator perto da bandeira azul e estufa; depois antenas, envio, proteção e retorno. Os 20 de conhecimento do envio se somam ao perfil. A continuação não concede outra recompensa de 350 moedas.

Replay: uma cópia de nome, compras, moedas, conhecimento e diário fica em `state.replay`. A prática tem sua própria economia. Sair do treino ou voltar ao menu restaura o progresso principal, inclusive após recarregar. Não duplicar prêmios.

Arquivos centrais novos: `src/campaign.ts`, `src/campaignView.ts`, `data/derived/polar-mission.json`, `scripts/verify_campaign.ts` e `tests/campaign.spec.ts`. Roteiro, fórmulas e limites: `docs/CONTINUACAO_POLAR.md`.

## Ciência incorporada

NASA LRO: aparência e orientação do mapa. M³: evidências de gelo polar. NTRS 20240004047: modelo relativo de exposição no polo. DONKI: eventos reais com consulta e arquivo histórico. RadLab: leituras históricas DosTel da ISS. As camadas polares não determinam recursos ou doses do pouso equatorial. O polo não garante menor radiação. Custos, consumos, tempos, conhecimento, tempestade do tutorial e recompensa são regras educativas.

Fontes, transformações, arquivos descartados e conferência com o desafio: `docs/INTEGRACAO_DADOS.md`. O relatório Markdown está atualizado; o DOCX anterior não recebeu validação visual final.

## Arquivos e execução

- `src/engine.ts`: estado, persistência e regras gerais.
- `src/surfaceTutorial.ts` e `src/tutorialView.ts`: roteiro, tripulação e instruções.
- `src/missionFlow.ts` e `src/missionFlight.ts`: abertura, viagens e resultados.
- `src/renderer.ts`: mapa e animações pixeladas.
- `src/lunarTerrain.ts`: crateras, colisões e rotas que contornam obstáculos.
- `src/accounts.ts` e `server/index.mjs`: login e sincronização.
- `data/raw`, `data/derived`, `public/data`: fontes e produtos científicos.
- `docs/DEMONSTRACAO.md`, `docs/TESTE_WIFI.md`, `docs/ENTREGA_ANDROID.md`: demonstração, rede e pacotes.

Executar `npm ci`, `npm run test:sim`, `npm run build` e `npm run lan`. Servidor local na porta 4176, observado em `http://192.168.150.120:4176`. O computador anfitrião precisa ficar ligado. IP pode mudar. Banco privado em `.local-data/artemis.sqlite`. PID e logs ficam em `artifacts/lan-server.*`.

Login entre aparelhos funciona pelo navegador no servidor local. APK usa visitante e progresso local. Não há hospedagem pública de contas, recuperação de senha ou publicação em loja. APK de teste e AAB sem assinatura de distribuição estão em `artifacts/entrega`. Não houve teste em Android físico nem playtest com crianças.

## Estado da continuidade

A revisão do tutorial passou em `npm run test:sim`, `npm run build` e nos seis testes Playwright, incluindo percurso completo em computador e celular, falhas, dados científicos e contas. Os testes de simulação verificam rotas pelas duas crateras, consumo de água separado do oxigênio, conhecimento a cada segundo, ordem do alerta e migração de saves. APK e AAB incluem os 35 arquivos web do build, com versionCode 2. Detalhes e hashes em `docs/ENTREGA_ANDROID.md`.

Saves de regras antigas são migrados uma única vez: a escala de 100 pontos vira 20; missões já concluídas recebem a diferença de 150 moedas e o bônus de 5 de conhecimento. Água começa em 120 quando ausente. Construções antigas que coincidam com as novas crateras são deslocadas para o terreno livre mais próximo, preservando seu progresso.

Backup anterior à troca de versão: `../backups/Vila-Artemis_pre-0.2.1AH_20261115_131251.zip`, 507 arquivos verificados e cópia consistente das contas. SHA-256: `7a1f9cd521050a4234e5cedbf11019166bf201c3cf3d6cb0cf8d099806e9867c`. Pasta extraída, manifesto e instruções de restauração acompanham o ZIP. Dependências reinstaláveis e caches não foram duplicados.

**Próximo passo:** validar a publicação solicitada no projeto Vercel `age-of-artemis-nasa`, além do acesso Wi-Fi. A versão continua 0.2.1AH; o backup anterior foi preservado. Contas sincronizadas dependem do servidor local. A hospedagem estática e o APK guardam progresso no aparelho.
