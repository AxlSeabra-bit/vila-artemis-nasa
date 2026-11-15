# Histórico de versões

## 0.2.1AH-simulador_de_missao_da_NASA

Início da versão em 15/11/2026, a partir do tutorial funcional aprovado para testes. Esta transição registra a versão, preserva o estado anterior em backup e cria um resumo de continuidade. A primeira revisão de gameplay desta versão incorpora os ajustes de tutorial solicitados pelo proprietário.

- Nome completo em `VERSION` e `public/version.json`.
- Versão npm compatível com SemVer: `0.2.1-AH`.
- Android: versionCode 2 e versionName com o identificador completo.
- Tutorial mantido: investimento, pouso, base, antenas, conhecimento, tempestade, retorno e recompensa.
- Login local, progresso individual e acesso Wi-Fi mantidos.
- Resumo do objetivo, decisões e limites em `docs/CONTEXTO_ATUAL.md`.
- Backup anterior: `../backups/Vila-Artemis_pre-0.2.1AH_20261115_131251.zip`, com manifesto, SHA-256 e banco SQLite consistente.

### Revisão do tutorial em 15/11/2026

- Marte custa 400 moedas; concluir o tutorial concede 350 moedas e 5 de conhecimento.
- Barra de conhecimento junto ao nível, com ícone e valor: 1 ponto por segundo de transmissão e 20 pontos por nível. Mensagem da cientista ao alcançar o nível 2.
- Alerta vermelho com contagem aparece antes da explicação da tempestade.
- Duas crateras nos extremos bloqueiam construções; rotas contornam as bordas, inclusive após retomar um save.
- Água e oxigênio separados, com consumo contínuo. Pedras amarelas retiradas da missão.
- Saves anteriores adaptados sem duplicar recompensas ou perder construções que ocupavam os locais das crateras.
- Simulação, build e testes de navegador em computador e celular aprovados.

O snapshot anterior tinha os identificadores técnicos `1.0.0` no npm e `1.0` no Android. Esses valores foram preservados no backup; não foi inventada uma versão histórica 0.2.0.

### Menu e continuação polar

- Cientista renomeada para Dra. Bruna.
- Menu com missões, perfil editável e Centro Científico.
- Equipamentos de nível 2 por 30 moedas cada; melhorias de nível 3 pelo mesmo preço.
- Expedição polar por 120 moedas, com destino obrigatório e sem taxa adicional.
- Escolha de 1 a 6 astronautas, construção e consumo proporcionais.
- Sete crateras maiores, seis pedras, rotas de desvio e equipamentos funcionais no novo mapa.
- Referência NASA LCROSS em Cabeus, com limites da extração explicados.
- Refazer tutorial com progresso separado e restauração do perfil principal.
- Hospedagem estática apresenta salvamento local, sem oferecer login indisponível.
