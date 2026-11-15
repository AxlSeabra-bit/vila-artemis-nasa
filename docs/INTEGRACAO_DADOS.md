# Integração científica da Vila Artemis

Revisão de 15/11/2026. A base visual v3 foi recuperada da pasta original indicada pelo handoff, pois esta cópia continha a v2. A versão anterior desta cópia permanece em `artifacts/baseline-v2`, ignorada pelo Git. A pasta original não foi alterada.

## Atualização do tutorial com investimento e pouso

Em uma revisão posterior no mesmo dia, o proprietário substituiu fases, quizzes e missões de construção por viagens espaciais. O novo início inclui uma cientista fictícia, investimento único de 100 moedas, Lua por 100, Marte por 400, mapa de pouso e uma cena de viagem de 12 segundos. O polo sul tem custo adicional autoral de 50 moedas; a planície equatorial não tem custo extra. Os valores são regras do jogo.

O mapa plano vem do [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/), produto colorido de 2025, com 2048 por 1024 pixels e longitude zero no centro. É uma visualização de aparência, não um raster para análise de gelo ou dose. Os pontos são regiões ilustrativas e não locais certificados para pouso. Fonte, hash e limites estão em `data/derived/mission-map.json` e `public/data/mission-map.json`.

A missão inicial pousa perto do equador e leva água da Terra. Ao concluir o pouso, o motor remove os depósitos polares da maquete. O atlas M³ continua disponível para estudo, com os marcadores de localização desativados nesta missão. O modelo polar de radiação também permanece como referência, sem alterar a exposição da equipe no equador. As descrições abaixo da primeira integração devem ser lidas com essa alteração: os oito pontos e três fatores são dados do catálogo polar, não recursos do pouso equatorial atual.

As informações de rádio seguem [NASA SCaN Lunar Surface Propagation](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/): a Terra baixa no horizonte e o relevo podem interromper a ligação no polo. A explicação diferencia interrupções e esperas do tempo de propagação de aproximadamente 1,3 segundo por sentido. Menor radiação não é garantida por latitude; relevo, blindagem e eventos solares importam.

O banco de 12 perguntas permanece apenas como conteúdo de referência no código. Não há quiz, recompensa por resposta nem parada obrigatória para escolher cartas durante os dias da partida. Os testes e o roteiro atual estão em `scripts/verify_mission.ts`, `tests/mission-journey.ts` e `docs/DEMONSTRACAO.md`. O relatório Word anterior descreve a primeira integração e não inclui esta nova revisão.

## Executar e verificar

```powershell
npm ci
npm run test:sim
npm run build
npm run test:e2e
npm run dev
```

O teste E2E usa Microsoft Edge e inicia um servidor com banco de testes na porta 4178. `npm run dev` usa a porta 5173. `npm run lan` serve o build e o login na porta 4176. A versão de produção inclui Service Worker com arquivos locais, mapas e fontes. Depois da primeira instalação em origem segura, pode recarregar offline. HTTP por IP de Wi-Fi não permite Service Worker nos navegadores comuns. O modo desenvolvimento não registra o Service Worker.

## Dados que entram na aplicação

| Fonte | Produto incorporado | Uso | Limite |
| --- | --- | --- | --- |
| NASA M³ / Chandrayaan-1 (ISRO), cópia USGS | Figura de distribuição de gelo superficial divulgada em 2018 | Oito células com pixels azuis originam os depósitos do tabuleiro e os marcadores do atlas | Figura de divulgação, sem georreferenciamento; quantidade de gelo não inferida |
| NASA NTRS 20240004047, Phipps et al. 2024 | Figura 3 do modelo de dose primária no polo sul | Três amostras de cores geram fatores relativos de exposição para a equipe nas tempestades de treino | Cenário de partículas solares de outubro de 1989, não medição atual; aproximação pela legenda |
| NASA CCMC DONKI | 33 notificações compatíveis de 10 a 12/05/2024, IDs e URLs preservados | Arquivo offline e replays SEP; consulta opcional dos últimos sete dias | Dificuldade 1 a 3 é regra autoral; não é dose ou classificação oficial NASA |
| NASA OSDR RadLab | 16 leituras DosTel1 e DosTel2 de 01/04/2022, 23:00 a 23:10 UTC | Painel comparativo de medições reais em µGy/h | Ambiente ISS, órbita terrestre; não determina risco lunar |
| NASA ECLSS e SCaN, CSA | Evidências sobre recuperação de água, rádio e cultivo | Perguntas, explicações e espera de comunicação | Valores de consumo, produção e tempo no jogo são simplificados |

O atlas tem links para os originais. `data/raw` preserva downloads públicos; `data/derived` contém os dados que o TypeScript importa; `public/data` fornece mapas e cópias exportáveis. `science-manifest.json` guarda hashes SHA-256, dimensões e pixels. Execute `scripts/prepare-science.py` com Python, Pillow e pypdfium2 para reproduzir a extração. As dependências de autoria usadas estão no runtime do Codex.

Os downloads iniciais tiveram uma falha na cadeia de confiança de certificados deste ambiente. Foi necessário usar curl com exceção de validação TLS somente para os documentos públicos, sem credenciais. A procedência foi conferida com páginas oficiais; os hashes registram os bytes recebidos, não autenticam por si só a origem. Em um ambiente com certificados funcionais, repita os downloads com HTTPS validado antes de uma auditoria científica formal.

## Regras de transformação

Gelo: pixels com G > R + 35, B > R + 35 e mínimo de G e B > 80 são marcas candidatas. A ilustração é reduzida a 28 x 28 células. Selecionam-se oito células separadas, fora da base inicial. O número de pixels serve apenas para seleção visual, nunca como concentração. Cada depósito guarda `sourceSiteId`. Saves antigos conservam suas posições simuladas e são identificados como tal.

Radiação: três pixels representativos da Figura 3 são comparados à legenda e arredondados a 100 cGy. O quociente pela escala de 4800 cGy gera um fator sem unidade. Trata-se de leitura aproximada de uma figura, não de raster científico calibrado. Os fatores só alteram a exposição de astronautas fora do abrigo em tempestades simuladas. A escolha custa energia e regolito. Os mapas de gelo e radiação não foram registrados na mesma grade geográfica, portanto não são sobrepostos.

DONKI: o endpoint público CCMC dispensa chave pessoal. Há timeout, validação de tipos e datas, URLs NASA com HTTPS, ordenação e cache com idade máxima de 24 horas. Falha de rede retorna o arquivo histórico. Uma resposta vazia não significa Lua segura. Eventos RBE e GST são exibidos como contexto terrestre, nunca usados como dose lunar. As turmas usam o mesmo arquivo SEP para manter a repetibilidade, mesmo quando há dados online.

RadLab: a resposta tem `columns` e `data`. Os nomes de instrumentos, instantes, valores e unidade são preservados. O gráfico mostra DosTel1 para evitar misturar duas séries como se fossem uma. Não se converte µGy/h para µSv/h ou risco clínico.

## Mecânicas e limites

O tutorial usa reservas trazidas da Terra: consome 0,08 de energia, 0,05 de oxigênio, 0,04 de água e 0,02 de comida por segundo simulado. Esses números e os custos das construções são parâmetros autorais. Não há produção automática de energia ou alimento na primeira missão. A continuação polar acrescenta equipamentos e produção simplificada, conforme a revisão abaixo. No motor livre preservado e testado separadamente, painéis dependem da iluminação didática, extratores precisam de gelo próximo e a produção depende de energia. Essas construções adicionais não aparecem no tutorial solicitado. Água e oxigênio agora são reservas independentes. As pedras amarelas e o regolito foram retirados do tutorial. O campo antigo de regolito permanece apenas para compatibilidade de saves e testes do motor livre, sem recurso coletável ou uso na missão atual. As duas crateras dos cantos são obstáculos autorais em pixel art, não posições extraídas de mapas NASA; impedem construção e exigem desvio da equipe.

A espera lunar de rádio de ida e volta é aproximadamente 2,6 segundos. Para Marte, a faixa real é de 4 a 24 minutos por sentido. A transmissão de 20 segundos do tutorial é uma regra de treinamento; o tempo para enviar um pacote não é apenas o atraso de propagação. Não há envio real à NASA. Troca de recursos e crescimento de plantas do motor livre são abstrações. O índice `radiationDose` agora é acumulativo e não diminui no abrigo. O percentual é um orçamento educativo de exposição, não uma dose em tecido humano nem limiar clínico.

Os locais mais vermelhos do modelo têm maior exposição que os azuis sob aquelas hipóteses. Isso não fornece uma lista de locais seguros para astronautas. Para planejamento real seriam necessários produtos georreferenciados, condições temporais, espectros, materiais e validação especializada.

## Fontes não usadas como dados lunares

Mars Trek foi analisado como recurso oficial e mantido para uma futura expedição marciana, indisponível neste tutorial. Não fornece o mapa lunar. As fases foram removidas. Metadados WMTS do Moon Trek foram arquivados, mas nenhuma porcentagem solar foi deduzida de um tile sem escala validada. O painel solar do motor livre usa um ciclo didático.

APOD e imagens de rovers não fornecem concentrações de gelo lunar ou doses. O repositório `nasa/api-docs` orienta acesso e não é um conjunto de medições. `bruffridge/nasawds` é uma referência de interface, não uma fonte científica; não substituiu a arte v3. O portal OSDR de estudos biológicos foi avaliado, mas não se extrapolaram resultados biológicos para dano médico no jogo. CSA foi usada como referência pedagógica, sem inventar rendimentos de cultivo.

## Segurança e próximos passos

A chave pessoal literal saiu do código. `VITE_*` é público no bundle e não protege segredo. O padrão é CCMC sem chave. `.env.example` não contém credenciais. Configuração privada da Vercel, publicação e assinatura da Play Store não foram executadas. O conteúdo baixado e o código antigo com a chave ficam apenas no backup local ignorado. Revogar a chave compartilhada e emitir outra depende da conta do proprietário.

O roteiro de quatro partes fornecido pelo proprietário está implementado: base, antenas e conhecimento, radiação e retorno. A construção leva 15 segundos de trabalho após a chegada da equipe; o envio leva 20 segundos e dá 1 de conhecimento por segundo, chegando ao nível 2 com 20 pontos. O medidor aparece junto ao nível e uma mensagem da cientista confirma a evolução. Após proteção e retorno, a recompensa única é de 350 moedas e 5 de conhecimento. O alerta vermelho surge 8 segundos antes da tempestade, e a explicação da cientista começa 3 segundos depois do alerta. Consumos, tempos, percentuais, custos e moedas são regras autorais. A tempestade é roteirizada e identificada como treinamento, separada dos alertas DONKI. A onda laranja representa partículas que não são visíveis assim na realidade. Gravação da equipe e playtest com crianças continuam pendentes. O jogo não constitui ferramenta operacional de segurança espacial.

A exposição acumula durante a missão e sobrevive à recarga. O abrigo reduz a exposição futura, mas não apaga a recebida, seguindo o princípio explicado pela [NASA sobre monitoramento de radiação](https://srag.jsc.nasa.gov/spaceradiation/how/how.cfm) e [proteção contra eventos solares](https://www.nasa.gov/humans-in-space/space-radiation-wont-stop-nasas-human-exploration/). As taxas do jogo, incluindo a pequena exposição abrigada, não são inferidas dos mapas ou das leituras da ISS. Aos 100% do orçamento educativo, ou ao zerar energia, água, oxigênio ou comida, a missão termina com explicação.

O login usa apelido e senha com scrypt, sessões HttpOnly e banco SQLite no computador anfitrião. Ele não depende de autenticação NASA. O servidor local sincroniza cada conta separadamente e detecta conflitos entre aparelhos. Os dados da conta não entram no Git nem na pasta pública. Consulte `TESTE_WIFI.md` para acesso e limitações.

## Conferência com o desafio oficial de 2026

O desafio Junior Astronaut Mission Trainer pede um protótipo interativo para 7 a 12 anos, com decisões sobre recursos, proteção e comunicação. A faixa de 7 a 13 anos do projeto inclui esse público. As instruções permitem dados ao vivo ou arquivados, com atribuição e limitações claras. A integração foi conferida com os detalhes e os recursos da página oficial.

| Critério do desafio | Evidência nesta revisão | Situação |
| --- | --- | --- |
| Suporte à vida e alimento | Reservas separadas de água, oxigênio e comida, consumo e encerramento quando acabam | Implementado no tutorial |
| Gestão de energia | Reserva, custos de construção e consumo contínuo | Implementado no tutorial |
| Produção solar e noite lunar | Mecânicas preservadas no motor livre | Fora do roteiro atual |
| Proteção com consequências | Exposição ao sair, abrigo, tempestade e limite acumulativo | Implementado no tutorial |
| Distância e comunicação | Comparação regional no mapa e envio educativo com duração explícita | Implementado; viagem a Marte futura |
| Dados NASA atribuídos | Mapas com fontes, registros DONKI e RadLab, manifesto com hashes | Implementado |
| Acesso para demonstração | Navegador sem conta e PWA com fontes e dados locais | Implementado |
| Tutorial completo | Investimento, pouso, base, antenas, conhecimento, radiação e retorno | Implementado |
| Compreensão pelo público infantil | Testes automáticos em celular e desktop | Playtest com crianças pendente |
| Vídeo e submissão do time | Capturas da versão atual disponíveis em artifacts/screenshots | Gravação e submissão pendentes |

A versão demonstra as decisões e a integração científica solicitadas. A avaliação não constitui aprovação oficial da NASA. A prioridade de energia permanece automática e equilibrada, sem acrescentar controles ao público mais novo. O Git foi inicializado com exclusões para dependências, builds, backups e credenciais; nenhum repositório remoto foi publicado.

## Fontes consultadas

Consulta realizada em 15/11/2026. As datas dos registros científicos estão preservadas e são distintas da data de consulta.

- [Desafio oficial de 2026](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=details)
- [NASA JPL sobre gelo nos polos da Lua](https://www.jpl.nasa.gov/news/ice-confirmed-at-the-moons-poles/)
- [USGS com a imagem original creditada à NASA](https://www.usgs.gov/media/images/moons-south-pole-image-water-icepng)
- [NASA NTRS com o modelo de radiação](https://ntrs.nasa.gov/citations/20240004047)
- [NASA CCMC DONKI e documentação](https://ccmc.gsfc.nasa.gov/tools/DONKI/)
- [NASA OSDR RadLab e campos da API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/)
- [NASA sobre recuperação de água na ISS](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/)
- [NASA sobre atrasos de comunicação](https://www.nasa.gov/missions/tech-demonstration/space-communications-7-things-you-need-to-know/)
- [NASA NTRS sobre latência Terra Lua](https://ntrs.nasa.gov/citations/20240007214)
- [NASA sobre demonstração de fissão Kilopower](https://www.nasa.gov/news-release/demonstration-proves-nuclear-fission-system-can-provide-space-exploration-power/)
- [CSA sobre produção de alimentos](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/)
- [NASA Mars Trek](https://trek.nasa.gov/mars/)
- [NASA APIs](https://api.nasa.gov/)
- [Repositório de documentação NASA](https://github.com/nasa/api-docs)
- [NASAWDS avaliado como referência de interface](https://github.com/bruffridge/nasawds)

## Validação da entrega

`npm run test:sim` e `npm run build` passaram após a integração. A suíte científica verifica hashes, pontos M³, registros históricos, leituras RadLab, cache, economia sem energia, exposição relativa, rádio, repetibilidade das turmas e rotação das 12 perguntas. A suíte Playwright verifica desktop e celular, idiomas, modais, ausência de overflow e recarga offline. Os testes de indisponibilidade DONKI provocam uma resposta HTTP 503 deliberada; isso não é uma falha do jogo.

A suíte Playwright cobre dados e offline em desktop e celular, as quatro partes do tutorial e autenticação entre navegadores. APK de teste e AAB sem assinatura de distribuição acompanham a entrega. A verificação compara todos os arquivos web dentro dos pacotes com o build final. Não houve teste em aparelho Android físico. Os detalhes e hashes estão em `docs/ENTREGA_ANDROID.md`.

O relatório completo e revisado está neste arquivo. Há uma versão de autoria em Word, mas sua revisão visual não foi concluída: o runtime não fornece LibreOffice e a ferramenta de controle de aplicativos recusou acesso ao Word. O DOCX não é apresentado como entrega visualmente validada.

## Continuação polar, menu e tripulação

A revisão acrescenta o menu, o perfil, o Centro Científico e uma segunda expedição ao polo sul, com a Dra. Bruna. A fonte específica é a descoberta de gelo da NASA LCROSS em Cabeus, observação de 9 de outubro de 2009. Fonte, data e limitações estão em `data/derived/polar-mission.json`, também distribuído em `public/data/polar-mission.json`. [NASA LCROSS](https://www.nasa.gov/general/what-is-lcross-the-lunar-crater-observation-and-sensing-satellite/)

A missão custa 120 moedas e não cobra sobretaxa polar. Cada equipamento inicial custa 30 moedas. A escolha de 1 a 6 astronautas controla a duração de trabalho, 45 segundos divididos pela equipe, e os consumos de água, comida e oxigênio. Nada disso foi calculado a partir das medições NASA.

O mapa de superfície contém sete crateras grandes e seis pedras como obstáculos autorais. O atlas LRO é real; o tabuleiro, os obstáculos e a bandeira de pesquisa não são um levantamento de Cabeus. O extrator simula obtenção e tratamento de água de gelo, sem afirmar tecnologia operacional, rendimento real ou existência de água líquida. O modelo NTRS permanece apenas como referência no tutorial polar.

Placas solares ficam em terreno representado como iluminado, fora das crateras bloqueadas. A estufa exige água e energia. As taxas completas e a mecânica de replay, que preserva o progresso principal, estão em `CONTINUACAO_POLAR.md`.
