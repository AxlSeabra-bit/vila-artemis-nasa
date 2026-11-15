# Menu, Centro Científico e expedição polar

Revisão de 15/11/2026, versão 0.2.1AH-simulador_de_missao_da_NASA. A cientista agora se chama **Dra. Bruna**.

## Percurso para demonstração

1. Termine a primeira missão. A recompensa permanece em 350 moedas e 5 de conhecimento, além dos 20 obtidos na transmissão.
2. Clique em **Voltar ao menu**. O menu apresenta Missões, Meu perfil e Centro Científico.
3. No perfil, confira missões concluídas, nível, moedas, conhecimento total, progresso para o próximo nível e equipamentos. O nome de explorador pode ser alterado sem mudar o login. Prefira um apelido.
4. Bruna orienta a visita ao Centro Científico. No nível 2, compre estufa, extrator de água e placas solares por 30 moedas cada. O saldo passa de 350 para 260. A compra libera o equipamento para as missões; montar na Lua ainda usa energia e oxigênio.
5. Cada equipamento pode receber uma melhoria no nível 3 por 30 moedas. O modelo 2 produz 50% a mais no jogo. Não é possível comprar novamente o mesmo modelo.
6. Volte ao menu e abra Missões. Marte continua custando 400 moedas e é uma aventura futura. A pesquisa das crateras polares custa 120 moedas. O saldo restante será 140.
7. O mapa NASA LRO reaparece. A missão exige o polo sul por causa do objetivo de pesquisa. O equador pode ser consultado, mas não permite partir nesta missão. Confirmar o polo não cobra taxa adicional.
8. Escolha de 1 a 6 astronautas. A tela mostra o tempo de construção e os consumos antes da decolagem. A escolha fica salva se recarregar.
9. A cena do foguete leva a um novo tabuleiro polar, com sete crateras maiores e seis pedras. Todos esses obstáculos impedem construção e passagem. A equipe calcula caminhos ao redor deles.
10. Escolha o local da base. Depois, monte placas solares, extrator perto da bandeira azul e estufa. Ao escolher o extrator, a câmera mostra a área de pesquisa. Cada construção exige a chegada de todos os tripulantes.
11. Os equipamentos produzem recursos conforme suas condições. Construa as antenas, transmita dados, mantenha a equipe protegida e retorne. Os 20 pontos da transmissão se somam ao perfil. Nesta continuação não foi definido um novo prêmio em moedas; o saldo de 140 é preservado ao voltar.

## Tripulação e recursos

O trabalho de cada construção corresponde a 45 segundos de trabalho de um astronauta. O tempo real de construção é `45 / tripulantes`, sem incluir a caminhada. Assim, 1 pessoa leva 45 segundos, 3 levam 15 segundos e 6 levam 7,5 segundos.

Por minuto, cada astronauta consome 1 unidade de oxigênio, 0,8 de água e 0,4 de comida. Dobrar a equipe dobra esses três consumos. São unidades educativas, não litros, quilogramas ou recomendações médicas. O consumo básico de energia da instalação é 0,08 por segundo.

| Equipamento, modelo 1 | Produção por segundo | Condição |
| --- | --- | --- |
| Placas solares | +0,30 energia | Montadas no terreno iluminado da maquete |
| Extrator experimental | +0,20 água | Área da bandeira azul e 0,10 energia por segundo |
| Estufa | +0,12 comida | 0,04 energia e 0,01 água por segundo |

As taxas e melhorias são regras autorais. Não foram inferidas dos dados NASA. O mapa bloqueia o interior das crateras; não permite colocar placas solares em regiões de sombra permanente. A água inicial é trazida da Terra.

## Evidência científica

A missão se baseia na descoberta de gelo em material escavado pelo impacto da **NASA LCROSS em Cabeus, em 9 de outubro de 2009**. A presença de gelo não equivale a um poço de água líquida, a uma reserva já quantificada para o jogo ou a um sistema operacional de mineração. Frio, energia, acesso e tratamento da água permanecem dificuldades reais. [NASA LCROSS](https://www.nasa.gov/general/what-is-lcross-the-lunar-crater-observation-and-sensing-satellite/)

O instrumento M³ também confirmou gelo superficial distribuído de forma irregular nos polos. O atlas original continua disponível como referência. O marcador da bandeira azul e os obstáculos do tabuleiro são ilustrações, sem georreferenciamento ou certificação de pouso. [NASA M³](https://www.jpl.nasa.gov/news/ice-confirmed-at-the-moons-poles/)

O registro de procedência e dos limites está em `data/derived/polar-mission.json`, copiado para `public/data/polar-mission.json`. O mapa global NASA LRO, o atlas M³, o modelo NTRS, DONKI e RadLab mantêm suas atribuições. O modelo polar de dose não é aplicado como dose medida em Cabeus.

## Refazer tutorial

O botão **Refazer tutorial** aparece no resultado e no menu. Ele abre uma prática separada da primeira missão. Nome, moedas, equipamentos, conhecimento e diário principal são guardados. Repetir a prática não multiplica os prêmios da conta principal.

É possível recarregar durante a prática. **Sair do treino** restaura o progresso principal a qualquer momento. Ao concluir, **Voltar ao menu** também restaura esse progresso. A escolha de repetir não apaga as conquistas anteriores.

## Persistência e acesso

Saves anteriores ganham um registro único da primeira missão concluída. O tutorial inicial permanece disponível. Perfil, compras, tripulação e prática são salvos no mesmo sistema de persistência.

Na rede Wi-Fi, o servidor Node continua sincronizando contas entre navegadores. Na hospedagem estática Vercel e no APK, o progresso fica no aparelho. O site não mostra um formulário de login indisponível. Limpar o armazenamento do navegador apaga o progresso local.

## Verificação

`scripts/verify_campaign.ts` cobre compras, saldo, restrições de nível e destino, tripulações de 1, 3 e 6 pessoas, construção proporcional, consumos, produção, caminhos entre obstáculos, retomada, conclusão e isolamento do replay. `tests/campaign.spec.ts` cobre menu, perfil, loja, preparação, segunda expedição e replay em computador e celular, além da sincronização pelo servidor local.
