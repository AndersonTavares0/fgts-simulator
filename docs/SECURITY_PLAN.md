# Plano de Seguranca e Privacidade

Auditoria e correcoes de seguranca para o FGTS Simulator, divididas em dois niveis de prioridade.

## Diagnostico

| # | Achado | Risco | Impacto |
|---|--------|-------|---------|
| 1 | 5 vulnerabilidades em devDependencies (npm audit) | Baixo | Apenas ferramentas de build/test/lint |
| 2 | Google Fonts duplicado (HTML + CSS @import) | Baixo | Performance, requisicao redundante |
| 3 | innerHTML com template string no ThemeAdapter | Muito baixo | Nao ha input de usuario, mas e boa pratica evitar |
| 4 | CDNs externas expoem IP do visitante | Medio | Google Fonts + Unpkg (Lucide) |
| 5 | Sem CSP ou headers de seguranca | Baixo | App e client-side puro, sem backend |

## Nivel 1 — Baixo Impacto

| Acao | Arquivos |
|------|----------|
| npm audit fix | package-lock.json |
| Remover @import duplicado de Google Fonts | src/css/style.css |
| Trocar innerHTML por createElement no ThemeAdapter | src/adapters/ThemeAdapter.ts |

## Nivel 2 — Privacidade (Self-Host)

| Acao | Arquivos |
|------|----------|
| Baixar fontes woff2 e criar @font-face local | src/css/fonts.css, src/css/fonts/ |
| Remover link CDN Google Fonts do HTML | src/index.html |
| Migrar Lucide de CDN para pacote npm | package.json, src/main.ts, src/adapters/*.ts, src/index.html |

## Verificacao

```bash
npm run typecheck && npm test -- --run && npm run lint && npm run build
grep -c 'fonts.googleapis.com\|unpkg.com' dist/index.html  # Esperado: 0
npm audit --audit-level=moderate  # Esperado: 0 vulnerabilidades
```

## Commits

| # | Commit | Escopo |
|---|--------|--------|
| 1 | chore: remove font duplicate and harden innerHTML usage | N1 completo |
| 2 | perf: self-host google fonts | N2a |
| 3 | perf: migrate lucide icons from CDN to npm package | N2b |
