# Demonstração da primeira missão lunar

Roteiro funcional completo: investimento, pouso, base, antenas, conhecimento, proteção e retorno. A Dra. Bruna usa a imagem pixel art enviada pelo proprietário. É uma personagem fictícia educativa, sem endosso da NASA. Crie uma conta no servidor da rede para continuar em outro aparelho, ou jogue como visitante.

1. Abra o jogo. A Dra. Bruna, cientista fictícia da aventura, explica as missões e o investimento. Receba as 100 moedas douradas com o símbolo da Lua.
2. Compare Lua, por 100 moedas, e Marte, por 400. Marte está indisponível com o investimento atual. Inicie a missão lunar: o saldo passa de 100 para zero.
3. Explore o mapa plano NASA LRO. Selecione a região do polo sul para ver informações sobre gelo, relevo, proteção e comunicação. A logística extra custa 50 moedas, portanto o pouso polar não pode ser confirmado nesta missão.
4. Escolha a planície equatorial. Ela está incluída no preço da viagem. O planejamento conta com água trazida da Terra e ligação direta de rádio mais simples. A equipe ainda precisa de abrigo contra radiação.
5. Confirme o local. A cena pixel art mostra contagem, decolagem, viagem e pouso. A animação dura 12 segundos, com indicação de que uma viagem real leva dias. A economia e o relógio da base ficam parados durante a preparação e o voo.
6. Entre no terreno lunar. Arraste o mapa, aproxime e afaste. A equipe está dentro do foguete e não há prédios prontos. Há duas crateras, no canto superior esquerdo e no inferior direito. Não é possível construir nelas; os astronautas contornam suas bordas. Não há pedras amarelas. Água e oxigênio aparecem em reservas separadas, ao lado de energia e comida, e diminuem com o tempo. Escolha o local da base. A confirmação mostra 30 de energia e 20 de oxigênio. Cancelar não gasta recursos. Os três astronautas saem do foguete, caminham e trabalham por 15 segundos. Depois entram na base.
7. Escolha o local das antenas. A confirmação mostra 25 de energia e 15 de oxigênio. A equipe sai da base, caminha e trabalha por mais 15 segundos.
8. Toque nas antenas prontas e clique em Enviar informações. A transmissão dura 20 segundos. O medidor junto ao nível aumenta 1 de conhecimento por segundo, de 0/20 até completar 20. O nível passa de 1 para 2. A cientista apresenta uma mensagem de parabéns; clique em Continuar a missão para a equipe voltar à base. O novo medidor começa em 0/20 para o nível 3.
9. Após o retorno da equipe à base, veja primeiro o aviso vermelho de tempestade com contagem regressiva de 8 segundos. A cientista só começa a explicar 3 segundos depois que o aviso aparece. A tempestade educativa dura 12 segundos e aparece como uma onda amarela e laranja sem flashes. A equipe deve permanecer abrigada. O indicador não diminui no abrigo.
10. Ao encerrar a tempestade, prepare o retorno. Os astronautas caminham até o foguete. A cena mostra decolagem lunar e chegada à Terra. A cientista parabeniza e a conta recebe exatamente 350 moedas e mais 5 de conhecimento, mesmo após recarregar. O total é 25 de conhecimento, com 5/20 para alcançar o nível 3.
11. Se desejar apresentar os dados, abra o atlas científico e DONKI antes do retorno. O mapa M³ e o modelo de radiação são polares, apresentados como referência, sem aplicar seus pontos ou doses ao pouso equatorial. RadLab conserva as leituras históricas da ISS.

O percurso costuma levar poucos minutos, além do tempo de leitura e escolha. A caminhada depende da distância. Os diálogos de confirmação pausam a simulação.

Radiação em 100%, água em zero, oxigênio em zero, comida em zero ou energia em zero encerra a missão com uma explicação curta e a opção de tentar novamente. A exposição recebida não diminui; o valor do grupo registra a maior exposição individual acumulada. O limite percentual é uma regra pedagógica, não um limiar clínico. Uma nova tentativa cria uma nova missão; recarregar a página conserva a falha.

## Coerência científica

A imagem do CGI Moon Kit da NASA LRO fornece aparência e orientação geográfica. Não serve para deduzir reservas de gelo ou doses. Os marcadores indicam regiões ilustrativas, não coordenadas validadas para um pouso real. As moedas e os preços são regras do jogo.

O polo não garante menor radiação: blindagem, relevo e condições solares importam. O relevo polar pode interromper a visibilidade da Terra, provocando esperas ou necessidade de retransmissão. Isso é diferente de afirmar que a latitude, sozinha, aumenta o tempo de propagação do sinal. A água na planície vem dos suprimentos da missão.

## Verificação

Os testes cobrem investimento único, custos, movimento, duração, bloqueio de ações fora de ordem, retomada das construções e do envio, conhecimento por segundo, aviso de nível, radiação cumulativa, abrigo, falhas, retorno e recompensa única. Também verificam desvio das duas crateras sem atravessar suas bordas, construção bloqueada, consumos separados e migração de saves sem repetir bônus. Os testes científicos anteriores permanecem ativos. Playwright percorre o roteiro em desktop e celular, testa o atlas offline, criação de contas, entrada, saída, isolamento, retomada entre navegadores e conflitos entre aparelhos.

Capturas ficam em artifacts/screenshots/mission-*.png e artifacts/screenshots/tutorial-*.png. Não foi produzido vídeo com crianças ou com o time. Nenhum site ou pacote foi publicado externamente.

## Continuação e replay

Após o resultado, clique em Voltar ao menu para visitar perfil, loja e nova missão. A continuação polar, a escolha da tripulação, os equipamentos e o botão Refazer tutorial estão descritos em [CONTINUACAO_POLAR.md](CONTINUACAO_POLAR.md).
