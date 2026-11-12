# Releases e recuperação

## Estado remoto e política declarada

Em 11/11/2026, a migração via REST criou o ruleset ativo `main` (ID `27035196`) antes de remover a proteção legada. A conferência das respostas da API comprovou a cobertura de PR obrigatório com zero aprovações, administradores sem bypass, force push e exclusão bloqueados. A migração acrescentou conversas resolvidas e histórico linear; o repositório permite apenas squash merge. Não houve conversão pela interface nativa.

O ruleset de tags `release-tags` (`27035237`) bloqueia alteração/exclusão de `v*`, sem bypass. Ele permite criar tags a quem já tem escrita; não restringe criação a uma identidade exclusiva. O GitHub habilitou imutabilidade para releases futuras; isso não modifica releases antigas.[^1]

A sessão de implementação preservou as respostas anteriores em `local://governance-before.json` e a cobertura antes da exclusão em `local://governance-migration.json`. Esses arquivos são evidências locais, não backups versionados neste repositório.

**Estado confirmado:** `GET /rules/branches/main` responde `quality` (integração `15368`) com `strict_required_status_checks_policy: true`; PRs com o check pendente ou vermelho aparecem como bloqueados e o merge é squash-only. A execução do check real em PRs, inclusive fork e reabertura, e o merge bloqueado sem bypass ficaram comprovados nos PRs #43, #45, #48 e #49.

O environment `github-pages` continua autorizando somente a branch `main`. O fluxo abaixo não precisa de PAT, App adicional, push automático, aprovação de bot ou autorização para tags nesse environment.

## Qualidade e permissões

[quality.yml](../.github/workflows/quality.yml) atende PRs para `main` (`opened`, `synchronize`, `reopened`, `ready_for_review`), push em `main` e chamadas da release. O job de nome estável `quality` não tem filtros de caminhos nem condição que esconda verificações obrigatórias. Ele executa:

```bash
node scripts/check-release.mjs
npm ci
npm run format:check
npm run lint
npm run test:coverage
npm audit --audit-level=high
npm run build
```

O check `quality` usa cobertura com limite de 80% (linhas, branches, funções, statements), audita dependências de produção e desenvolvimento e falha para vulnerabilidades de severidade alta ou crítica; severidades baixa e moderada são reportadas, mas não bloqueiam. O build executa `tsc --noEmit` antes do Vite, evitando repetir o typecheck. Push em `main` e PRs cancelam execuções anteriores do mesmo grupo; chamadas da release não são canceladas.

Qualquer falha interrompe o job. O resumo usa `GITHUB_STEP_SUMMARY`, sem comentário em PR, `pull_request_target` ou permissão de escrita. Dependabot agrupa atualizações mensais das actions fixadas por SHA e atualizações npm minor/patch; majors continuam em PRs separados. `quality` audita todas as dependências em PRs, pushes e validações de release; `dependency-audit.yml` repete a auditoria semanalmente (segunda-feira, 04:47 UTC) e sob demanda. CodeQL analisa `main` semanalmente.

| Job | Permissões |
| --- | --- |
| Plano | `contents: write` (drafts e assets preservados só são visíveis com escrita) |
| Qualidade/build | `contents: read` |
| Publicador sem checkout/npm | `contents: write` |
| Deploy | `contents: read`, `deployments: read`, `pages: write`, `id-token: write` |

O plano preserva o script confiável do SHA de `main` em artefato separado antes de qualquer npm/build. Publicador e deploy usam esse script, não scripts contidos em pacotes de versões antigas.

Rollback pula o job publicador; seus jobs não recebem `contents: write`.

## Preparar e promover uma versão

### Changelog

`CHANGELOG.md` segue o formato do Keep a Changelog 1.1.0 com versionamento semântico: título `# Changelog`, `## Unreleased` sempre no topo e uma seção por versão publicada no formato `## MAJOR.MINOR.PATCH[-beta.N] - AAAA-MM-DD`, da mais recente para a mais antiga. As seções permitidas são `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` e `Security`; o texto é em português e não usa emojis.

O mesmo PR que altera a versão move os itens de `Unreleased` para a nova seção. `node scripts/check-release.mjs` valida título, `Unreleased`, data real, ordem decrescente, seções permitidas, presença de itens e ausência de emojis; ele roda em todo PR e no job de release. O corpo da release no GitHub é montado pelo publicador com a seção dessa versão do `CHANGELOG.md` (preservado no artefato das ferramentas, não no pacote), mais o SHA validado e a instrução de recuperação.

1. Em PR humano, atualize `package.json`, a versão raiz e a entrada raiz de `package-lock.json`, e as notas da mudança. Para beta use `MAJOR.MINOR.PATCH-beta.N`; para produção estável use `MAJOR.MINOR.PATCH`, ambos sem zeros à esquerda.
2. Passe `quality` e faça squash em `main`. Push/merge executa qualidade, **sem implantar produção** depois que estes workflows substituírem os antigos.
3. Para beta, despache `Release and Pages` na branch `main`, operação `beta`, versão exata e SHA completo do `main`. O fluxo publica uma GitHub prerelease imutável com os três assets e **pula o job Pages**; é somente para download, sem URL de staging. Se falhar após criar draft/tag, repita `beta` com a mesma versão e o SHA gravado na draft; não use `resume` para beta.
4. Para produção estável, em **Actions → Release and Pages → Run workflow**, selecione `main`, operação `release`, versão sem `v` e o SHA completo de `main` capturado para essa publicação. Uma versão **nova** gera o pacote a partir do SHA de `github.sha` no dispatch e `pack` recusa SHA diferente; só a retomada de draft/release existente aceita o SHA gravado nela, e `approvedSource` exige que ele pertença ao histórico de `main` do dispatch. Se `main` avançou antes do dispatch, use seu novo SHA e confira a versão; não mova tags para corrigir divergências.
5. Na release estável, confira os estados separados: pacote publicado na release e implantação concluída no environment. O último passo consulta `release.json` público para confirmar versão/SHA no Pages.
O canal é explícito: `release` aceita somente versão estável e publica/implanta no Pages; `beta` aceita somente `MAJOR.MINOR.PATCH-beta.N`, marca a release como prerelease e não faz deploy. `resume` e `rollback` são somente estáveis. Reexecutar `beta` é a retomada da mesma draft/asset. Uma beta não é a confirmação de produção nem o endereço de uma instância de teste.

`release.yml` só atende `workflow_dispatch`. O script recusa outra branch/evento, SHA inválido, versão divergente entre pacote/lock/input, canal incompatível, tag conflitante e origem fora do histórico de `main` fixado no dispatch. O build valida novamente o commit do dispatch; o fluxo não resolve `main` de novo no meio da publicação. O job `deploy` é condicionado ao canal e permanece pulado para beta.

A exclusão mútua `pages` cobre plano, publicação, deploy, retomada e rollback. Ela não cancela runs em andamento e usa `queue: max` (até 100 pendentes); a ordem depende da entrada na espera, não da ordem dos cliques.[^2] Antes de implantar sem rollback, o script consulta a implantação Pages bem-sucedida mais recente e exige que o SHA candidato não seja anterior/divergente do SHA daquele workflow. Uma retomada depois de rollback pode exigir `rollback` explícito mesmo quando os bytes já estiverem no site: o registro Pages identifica o workflow autorizado, não o SHA antigo do conteúdo. Essa recusa conservadora evita rebaixamento silencioso.

O script também consulta a versão pública e recusa versão menor ou mesma versão com SHA diferente fora de `rollback`. Uma resposta 404 só permite o primeiro corte quando o último deploy veio de um commit sem o workflow moderno; indisponibilidade ou identidade ausente depois desse corte bloqueiam promoção.

## Pacote preservado

O build acrescenta `release.json` ao site e gera os três assets:

| Asset | Conteúdo |
| --- | --- |
| `site.tar.gz` | Arquivos do build, sem links, e manifesto interno |
| `manifest.json` | Versão, SHA, repositório, hash do lockfile, Node, run/attempt/URL |
| `SHA256SUMS` | SHA-256 do pacote e do manifesto externo |

O checksum fica fora do arquivo que valida. O pacote não pode exceder 100 MiB na recuperação. O publicador cria a tag no SHA validado, cria uma draft, anexa primeiro o pacote e depois manifesto/checksums, confere os bytes e publica. Ele exige a confirmação de release imutável antes do deploy. Em conflitos, ele falha sem mover tag ou usar clobber.

`GET /immutable-releases` exige permissão de administração, que o `GITHUB_TOKEN` do workflow não possui (403). Nesse caso o script ignora a pré-checagem e, depois de publicar, exige que a release reporte `immutable: true` antes de qualquer deploy; com imutabilidade desativada, a release sai publicada e mutável, o run falha antes do Pages e a release/tag precisa ser removida manualmente.

O deploy baixa os assets publicados, confere hashes, versão, SHA, manifesto interno/externo e caminhos/tipos de arquivo. Depois extrai os mesmos arquivos e prepara o artefato Pages; não recompila. Artefatos Actions/Pages ficam por sete dias para operação; os assets da release são a fonte de recuperação após essa expiração. Imutabilidade depende também da permanência da release/repositório; mantenha uma cópia externa desses assets se precisar de backup independente.

## Falhas parciais e retomada

| Falha | Procedimento |
| --- | --- |
| Qualidade/build antes do pacote | Corrigir em PR; nenhuma tag/release/deploy deve ter ocorrido |
| Tag/draft criada, sem pacote | Reexecutar `release` no run/SHA original; não mover a tag |
| Pacote presente na draft, demais uploads incompletos | `resume` recupera o pacote; deriva o mesmo manifesto/checksum e envia apenas assets ausentes |
| Asset de mesmo nome com bytes diferentes | Inspecionar conflito; o fluxo recusa sobrescrita e publicação |
| Release imutável publicada, deploy falhou/artefato expirou | Novo dispatch em `main`, operação `resume`, versão e SHA daquela release |
| Release publicada sem pacote completo, ou hash divergente | Recuperação bloqueada; não substituir por rebuild silencioso |
| Pages terminou, confirmação pública falhou | Inspecionar environment e `release.json`; pacote publicado não equivale a produção confirmada |
| Uma versão mais recente já chegou à produção | `resume` recusa; use `rollback` somente se pretende rebaixar |

`resume` aceita somente SHA explicitamente informado e pertencente ao histórico do `main` usado pelo workflow atual. Uma draft com pacote preservado permite completar uploads; uma release publicada exige imutabilidade e os três assets íntegros. Se a falha ocorreu antes do primeiro pacote, retome o run original de `release`; um dispatch de `resume` não inventa bytes ausentes.

Release e Pages não formam uma transação: uma falha de deploy conserva a release publicada e o site anterior. Não apague a release/tag para ocultar essa situação.

## Rollback

1. Escolha uma release publicada pelo novo fluxo, com `site.tar.gz`, `manifest.json` e `SHA256SUMS`; confira versão e SHA no manifesto.
2. Execute o workflow **atual**, selecionando branch `main`, operação `rollback`, versão e SHA daquela release.
3. O fluxo valida origem, imutabilidade e integridade, prepara novo artefato Pages e implanta os arquivos preservados. Nenhum script do código antigo roda; tag e `main` permanecem intactos.
4. Confira o resumo, o environment e `release.json` público. Depois corrija o defeito em PR e prepare uma nova versão.

As releases antigas sem assets não oferecem rollback dos mesmos bytes. O novo fluxo estabelece a primeira versão recuperável; reconstruir um commit antigo não prova identidade com o site que foi publicado.

Rollback não diminui schema do IndexedDB, apaga histórico nem revoga a aplicação em clientes offline. Antes da primeira promoção estável ao Pages, o aceite deve exercitar A → B → A com histórico salvo e duas abas; confira compatibilidade dos dados e recebimento da correção ao reconectar. A beta GitHub-only não altera clientes nem Pages.

## Validação e limites operacionais

Os checks automatizados confirmam qualidade e integridade do pacote; não demonstram a recuperação completa de cada falha do GitHub Pages. Confirme cada publicação pelo run de Actions e por `release.json` público. Em ambiente autorizado, exercite falhas após criação da draft, publicação e durante deploy, checksum corrompido, conflito de SHA/asset, retomada sem artefato temporário e rollback; a aceitação A → B → A com histórico salvo e duas abas é pré-requisito de promoção.

## Referências

[^1]: GitHub, [Immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases).
[^2]: GitHub, [Control workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
