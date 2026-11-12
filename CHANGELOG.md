# Changelog

Formato do Keep a Changelog 1.1.0, versionamento semântico (SemVer 2.0.0) e texto em português.
Sem emojis. Cada release publicada tem uma seção com data; o trabalho aberto fica em **Unreleased** e vira
seção no PR que muda a versão. Seções permitidas: Added, Changed, Deprecated, Removed, Fixed, Security.
Versões anteriores a 2.0.0 não tinham `package.json` nem tag; o material histórico está em `docs/archive/`.

## Unreleased

Nada pendente.

## 2.1.0-beta.4 - 2026-11-12

Pré-release publicada como `v2.1.0-beta.4`. Reúne todo o conteúdo desde a v2.0.3: o redesenho da interface, o FGTS do 13º, histórico, PDF, gráfico, PWA, a esteira de release e as correções da auditoria. As pré-releases 2.1.0-beta.1 a 2.1.0-beta.3 foram substituídas por esta; o conteúdo delas está consolidado abaixo e permanece no histórico de commits.

### Added

- FGTS sobre o 13º em dois modos: estimativa por salário fixo com avos por mês de ao menos 15 dias, ou remunerações brutas informadas por competência.
- Histórico local em IndexedDB, com reabertura de resultados e comparação entre duas simulações.
- Relatório PDF monocromático com total em destaque, memória de cálculo, dados contratuais, evolução mensal, premissas e avisos.
- Gráfico de evolução do saldo em TR + 3% ao ano e referência IPCA, com os mesmos valores em tabela.
- PWA com instalação, uso offline e atualização aplicada por ação explícita do usuário.
- Auditoria semanal de CVEs, CodeQL e Dependabot agrupado por atualizações de actions e npm minor/patch.
- Canal beta protegido: publicação de pré-release imutável com três assets e sem implantação no GitHub Pages.
- Ruleset ativo em `main` com o check `quality` obrigatório, squash-only, histórico linear e sem bypass administrativo.
- Validação do `CHANGELOG.md` em todo PR e no job de release: título, `Unreleased` no topo, data real, ordem decrescente, seções permitidas, itens por versão e ausência de emojis.

### Changed

- Interface reescrita em React 19 + TypeScript + Tailwind CSS v4, com Heroicons e gráfico em SVG local.
- Fluxo de release recuperável em quatro etapas: plano, qualidade, publicação imutável e Pages com verificação pública.
- Corpo da release é montado com a seção desta versão no `CHANGELOG.md`, o SHA validado e a instrução de recuperação.
- Documentação reorganizada em `docs/` (arquitetura, desenvolvimento, releases, premissas legais e privacidade), com os documentos anteriores em `docs/archive/`.
- Cache offline reduzido de 21 para 12 entradas: dependências do `html()` do jsPDF não são mais baixadas na instalação.
- Comparação de simulações deixou de exibir o formato interno do registro.
- Formatação de moeda com uma única implementação para tela, gráfico, histórico e PDF.

### Removed

- Módulos legados `UIAdapter`, `ThemeAdapter`, `ContratoTrabalho`, `INSSService` e o CSS modular anterior.
- Cálculo de INSS próprio: o app declara explicitamente que não retém IRRF nem INSS.

### Fixed

- Escala do gráfico cobre IPCA e TR; a linha de referência não sai mais da área e o eixo acompanha o cenário selecionado.
- Atualização do PWA ativa a versão baixada pelo botão **Atualizar agora**; recarregar a página sozinho não aplicava a versão nova.
- Histórico: registro inválido ou de outra versão deixou de esconder os válidos; a tela informa quantos ficaram fora da lista e nada é apagado.
- Abertura do IndexedDB não fica mais pendente quando outra aba pede migração do banco.
- Datas iguais no início e no fim são recusadas com a mesma regra e a mesma mensagem do cálculo, no campo correspondente.
- Reserva doméstica de 3,2% passou a ser corrigida como FGTS; acordo doméstico libera metade da reserva.
- Justa causa e saque por doença grave não somam 13º nem férias proporcionais.
- Fundamentos legais de doença grave, aposentadoria e saque-aniversário alinhados ao art. 20 da Lei 8.036/1990.

### Security

- Contraste elevado: série IPCA de 2,64 para 4,13:1 no tema claro; bordas de campo de 1,38 para 3,31:1 no claro e de 2,05 para 3,49:1 no escuro.
- CSP por meta tag no build, com hash do script de tema; o modo de desenvolvimento continua sem a regra.

## 2.0.3 - 2026-06-19

### Changed

- Classes CSS refinadas, breakpoints consistentes e espaçamento compacto.

## 2.0.2 - 2026-06-19

### Added

- Cálculo de INSS (primeira fase do roadmap da época).

### Fixed

- Correções legais, de segurança e de interface consolidadas em uma única entrega de 24 commits.
- IDs de passos e proteção contra nulos no workflow de PR.
- Escala visual, banner LGPD, cabeçalho em telas pequenas, grade em tablet e o acordeão "Sobre o projeto".

## 2.0.1 - 2026-06-18

### Added

- Migração para TypeScript com arquitetura modular, estratégia de inteiros para valores financeiros e testes unitários.
- Política de privacidade LGPD, consentimento para dado de saúde, banner de transparência e divulgação de CDN de terceiros.
- Acessibilidade WCAG: foco visível, contraste, semântica e navegação por teclado.
- Tema claro e escuro com detecção do sistema e CSS modular com variáveis.
- Suporte a empregado doméstico (LC 150/2015) e contrato de aprendizagem.
- Pipeline de CI/CD com Vite, TypeScript e Node 24.

### Removed

- Teto artificial de FGTS aplicado ao cálculo.

### Fixed

- Multa indevida em eventos de saque e cálculo da reserva do empregado doméstico.
- Regra dos 15 dias em contratos mais curtos que um mês.
- Carregamento de assets no GitHub Pages com caminho base relativo.
- Fundamentos legais de doença grave e aposentadoria alinhados ao art. 20 da Lei 8.036/1990.

## 2.0.0 - 2026-05-07

Definição inicial de versão no `package.json`, sem tag de release.

### Added

- Aplicação estática migrada para TypeScript com Vite.
- Documentação técnica inicial e padronização do repositório.
