# Entrega Android da Vila Artemis

O projeto Capacitor 8 foi sincronizado e compilado em 15/11/2026 para a versão `0.2.1AH-simulador_de_missao_da_NASA`, com versionCode 2. Os ícones e a abertura usam a arte pixel v3 e o fundo de madeira. Mapas, arquivos científicos e fontes acompanham o aplicativo.

## Pacotes

- `android/app/build/outputs/apk/debug/app-debug.apk`: APK com assinatura de desenvolvimento, destinado a testes.
- `android/app/build/outputs/bundle/release/app-release.aab`: bundle de release. Não foi configurada assinatura de distribuição; é necessário assinar com a chave do proprietário antes da publicação.

O APK não foi instalado em um aparelho físico nesta tarefa. A interface web equivalente foi verificada em 1280 por 800 e 390 por 844. A compilação inclui a verificação `lintVitalRelease`, mas isso não substitui um teste de instalação, toque e retomada no Android.

`scripts/verify-android.py` conferiu integridade dos ZIPs e igualdade dos 35 arquivos web dentro de ambos os pacotes, incluindo o tutorial revisado, os novos ícones de oxigênio e conhecimento, a cientista fornecida e a identificação de versão. `apksigner verify --verbose` valida a assinatura de teste do APK. Os hashes SHA-256 desta entrega são:

```text
APK 706ff757cc9ef489dbe74ccec55f4b9cc4b40cf4ba20e631091b18f81ab87dfa
AAB 092e8df8d8dfe8d54a5eff96f37d20707bc3ad6467f3abc7a7bbe199a4f1eacd
```

## Ambiente utilizado

| Componente | Versão |
| --- | --- |
| Capacitor | 8.6.2 |
| Java | Temurin JDK 21.0.13 |
| Gradle wrapper | 8.14.3 |
| Android Gradle Plugin | 8.13.0 |
| Android compile e target SDK | 36 |
| Android mínimo | API 24 |
| Android Build Tools | 35.0.0 |

O Capacitor CLI exige Node 22 ou superior. O SDK existente recebeu Platform 36 e Build Tools 35. A compilação encontrou licenças já aceitas no SDK. O JDK 21 foi baixado da distribuição oficial Adoptium e extraído apenas em `artifacts/jdk21`; não alterou o Java padrão do computador.

## Recompilar no PowerShell

```powershell
npm ci
npm run test:sim
npm run build
npx cap sync android
$env:JAVA_HOME=(Resolve-Path -LiteralPath 'artifacts/jdk21/jdk-21.0.13+9').Path
$env:ANDROID_HOME='C:/Users/Axl O S/AppData/Local/Android/Sdk'
.\android\gradlew.bat -p android assembleDebug bundleRelease --no-daemon --console=plain
```

Em outro computador, ajuste `JAVA_HOME` e `ANDROID_HOME` para instalações locais. O JDK em `artifacts` é ignorado pelo Git. Não execute `cap add android` novamente, pois o projeto nativo já existe.

Este projeto não usa NDK. A opção `android.overridePathCheck=true` permite compilar na pasta atual, que contém acentos. Se alguma ferramenta Android falhar por causa do caminho, use uma cópia em uma pasta sem acentos e espaços e repita a compilação. Gradle 9 não deve substituir o wrapper desta versão, pois o plugin Android utilizado depende de APIs do Gradle 8.

O script `scripts/android-icons.py`, com Pillow, atualiza ícones e imagens de abertura a partir do PNG do jogo. `scripts/create-icons.mjs` gera os PNGs web a partir dos sprites v3. As licenças Fredoka e Silkscreen estão em `public/licenses` e são copiadas para o aplicativo.

## Publicação

O aplicativo empacotado usa visitante e salvamento local. O servidor de contas SQLite roda no computador anfitrião, separado do pacote Android. Para testar login e continuação entre aparelhos, abra o endereço Wi-Fi no navegador, conforme `TESTE_WIFI.md`. Não foi embutido um IP particular no aplicativo nem desabilitada a proteção contra conteúdo HTTP misto.

Nenhum pacote foi enviado à Play Store. Assinatura de distribuição, ficha da loja, classificação etária, políticas aplicáveis e publicação dependem da conta e dos dados do proprietário. Não foi criada chave privada de distribuição.
