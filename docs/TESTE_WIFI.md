# Testes pelo Wi-Fi e contas

O servidor local usa a porta TCP 4176. No computador desta entrega, o endereço Wi-Fi observado em 15/11/2026 foi `192.168.150.120`. Abra `http://192.168.150.120:4176` no celular ou computador do Hiroki conectado à mesma rede. No computador anfitrião, `http://127.0.0.1:4176` também funciona.

O servidor foi iniciado em segundo plano e o endpoint de saúde respondeu pelo IP do Wi-Fi. O Windows já possui uma regra de entrada que permite o Node instalado em `C:\Program Files\nodejs\node.exe` no perfil público usado por essa conexão. Não foi aberto acesso no roteador nem criado túnel público. O acesso em outro aparelho físico precisa ser conferido pelo time; redes de convidados podem bloquear comunicação entre aparelhos.

## Iniciar novamente

Na pasta do projeto, execute:

```powershell
npm run build
npm run lan
```

Mantenha o computador ligado e o servidor em execução. O endereço pode mudar ao trocar de Wi-Fi ou renovar o IP. Reinicie o servidor ao mudar de rede; ele imprime os endereços locais disponíveis. Caso a porta esteja ocupada pela instância em segundo plano desta entrega, não inicie uma segunda cópia. O PID fica em `artifacts/lan-server.pid` e os logs em `artifacts/lan-server.log` e `artifacts/lan-server-error.log`.

Para verificar a instância antes de pará-la, confira o PID e a linha de comando com `Get-CimInstance Win32_Process -Filter "ProcessId = NUMERO"`. Pare somente o processo cujo comando seja este `server/index.mjs` na porta 4176.

## Progresso

Cada jogador cria um apelido de 3 a 20 caracteres e uma senha de pelo menos 8 caracteres. Não são pedidos nome real, e-mail ou data de nascimento. Use uma senha exclusiva do jogo. A conta funciona nos aparelhos que acessam este servidor; não é um cadastro na NASA.

Senhas são derivadas com scrypt e sal aleatório. Sessões usam tokens aleatórios, cookie HttpOnly e SameSite=Strict; o banco guarda somente o hash do token. O servidor verifica a origem nas gravações, limita tentativas de login e serve apenas a pasta `dist`. O banco não fica acessível pela web.

O jogo salva localmente a cada segundo de simulação e sincroniza a conta em intervalos de 2,5 segundos e nas ações de saída. O estado inclui moedas, local, construções, astronautas, recursos, radiação, XP e etapa atual. Fechar o navegador antes da sincronização pode deixar os últimos segundos somente naquele aparelho. A etiqueta superior informa onde o progresso foi salvo.

As revisões impedem que dois aparelhos sobrescrevam a mesma conta silenciosamente. Ao detectar conflito, o jogo pausa e oferece carregar o progresso do servidor. A cópia divergente permanece guardada no armazenamento local com o sufixo `-conflict`. Recomendamos uma conta por jogador e apenas uma sessão ativa por conta.

Visitantes salvam só no aparelho. No navegador com PWA em origem segura, uma conta já usada também guarda a última cópia offline e sincroniza ao reconectar. HTTP por IP de rede não permite Service Worker nos navegadores comuns, portanto o teste por Wi-Fi depende de o servidor permanecer acessível. Dados e fontes são locais, sem depender de chamadas NASA para concluir o tutorial.

## Banco e limites desta entrega

O banco está em `.local-data/artemis.sqlite`. Essa pasta está excluída do Git e da publicação web. Para copiar o banco com segurança, pare o servidor e copie a pasta `.local-data` inteira. Não exclua a pasta ao atualizar o jogo.

Esta é uma autenticação para demonstração em rede local, servida por HTTP. HTTPS, recuperação de senha, hospedagem persistente em nuvem e publicação externa não fazem parte deste servidor. O APK empacotado usa visitante e salvamento local; o login entre aparelhos é testado pelo link Wi-Fi no navegador. A versão web estática, sozinha, não hospeda o banco de contas.
