# Vila Artemis NASA

Versão ativa: **0.2.1AH-simulador_de_missao_da_NASA**. Para retomar o trabalho com pouco contexto, leia [o resumo de continuidade](docs/CONTEXTO_ATUAL.md). As mudanças de versão estão em [CHANGELOG.md](CHANGELOG.md).

Protótipo educacional em pixel art para 7 a 13 anos, baseado no desafio Build a Junior Astronaut Mission Trainer de 2026. A revisão integra fontes NASA rastreáveis e mantém a arte v3.

```powershell
npm ci
npm run build
npm run lan
```

Abra o endereço exibido pelo servidor. `npm run lan` serve o jogo e as contas na porta 4176, acessível pelo Wi-Fi. Use Node 22.13 ou superior, com SQLite integrado. Para editar o frontend, `npm run dev` continua disponível; contas precisam do servidor Node. O jogo começa com a cientista fornecida pelo proprietário, o investimento de 100 moedas lunares e a compra da missão da Lua. Escolha a planície equatorial no mapa NASA LRO e acompanhe a decolagem, a viagem e o pouso. Marte custa 400 moedas e fica indisponível neste tutorial; a região polar exige mais 50 moedas de logística.

Crie uma conta com apelido e senha para continuar em outro aparelho conectado ao mesmo servidor. O progresso é salvo automaticamente e as contas são independentes. Visitantes usam armazenamento do aparelho. O banco fica em `.local-data/artemis.sqlite`, fora do Git e do conteúdo servido. Consulte `docs/TESTE_WIFI.md` para acesso, limites e cópia de segurança. Para a turma: `/?mode=classroom&seed=TURMA-4A`. Saves das revisões anteriores permanecem intactos e não pulam a nova abertura.

As fases, quizzes e antigas missões de construção foram removidos. O tutorial conduz uma única expedição: escolher e construir a base, montar antenas, transmitir dados por 20 segundos, alcançar o nível 2, abrigar a equipe na tempestade de treinamento e voltar à Terra para receber 350 moedas e mais 5 de conhecimento. Construções levam 15 segundos após a chegada dos astronautas. Radiação é acumulativa; 100% ou falta de água, comida, oxigênio ou energia encerra a missão com uma explicação. Não há dano gráfico à tripulação. Água e oxigênio têm reservas separadas, ambas consumidas com o tempo. As pedras amarelas foram retiradas. Duas crateras nos extremos impedem construções e são contornadas pelos astronautas.

O medidor junto ao nível mostra conhecimento: cada segundo de transmissão rende 1 ponto, e 20 pontos completam um nível. Uma mensagem da cientista anuncia o nível 2. O alerta vermelho da tempestade surge primeiro, com contagem regressiva; a explicação começa depois. A conclusão deixa 25 de conhecimento total, sendo 5/20 para o nível 3. Saves anteriores são adaptados sem repetir recompensas.

Após a conclusão, o menu oferece Missões, Meu perfil e Centro Científico. No nível 2, estufa, extrator de água e placas solares custam 30 moedas cada. A segunda missão custa 120 moedas e exige o polo sul, com base na descoberta LCROSS em Cabeus. Escolha de 1 a 6 astronautas: construção mais rápida e consumo proporcional de água, comida e oxigênio. O tabuleiro polar tem sete crateras maiores e seis pedras. Consulte `docs/CONTINUACAO_POLAR.md`.

O botão Refazer tutorial abre uma prática separada e preserva o progresso principal. É possível sair do treino ou voltar ao menu após concluir. Repetir não multiplica as recompensas da conta principal.

O botão de mapa abre o atlas científico. Como o pouso é equatorial, não há cristais polares junto da base nem aplicação do modelo polar como dose local. A água inicial veio da Terra. DONKI e RadLab continuam disponíveis para consulta. Não é necessária chave pessoal.

```powershell
npm run test:sim
npm run build
npm run test:e2e
npm run preview
```

O teste visual usa Microsoft Edge por padrão. Para usar Chrome no PowerShell, defina `$env:ARTEMIS_BROWSER_CHANNEL="chrome"` antes de `npm run test:e2e`. A versão de produção salva mapas, fontes e código para uso offline após uma primeira visita completa. O relatório completo `docs/INTEGRACAO_DADOS.md` descreve fontes, transformações, dados descartados, limitações e adequação ao desafio. A versão de autoria em Word ainda aguarda revisão visual, conforme registrado no relatório.

O projeto Android está em `android/`. Consulte `docs/ENTREGA_ANDROID.md` para requisitos e situação da compilação. O roteiro completo está em `docs/DEMONSTRACAO.md`. O servidor de contas é local; não foi publicada uma versão online.
