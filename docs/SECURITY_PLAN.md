# Plano de Seguranca e Privacidade

> **Documento histórico** — atualizado com o status das correções implementadas.
> Mantido para auditoria e rastreabilidade.

Auditoria e correcoes de seguranca para o FGTS Simulator, divididas em dois niveis de prioridade.

## Diagnostico — Situacao Atual

| # | Achado | Risco Original | Situacao Atual |
|---|--------|----------------|----------------|
| 1 | 5 vulnerabilidades em devDependencies (npm audit) | Baixo | ✅ Resolvido — `npm audit` (jun/2026): **0 vulnerabilidades moderadas ou altas** |
| 2 | Google Fonts duplicado (HTML + CSS @import) | Baixo | ✅ Resolvido — fontes self-hosted em `src/public/fonts/`, sem CDN |
| 3 | innerHTML no ThemeAdapter | Muito baixo | ✅ Resolvido no ThemeAdapter. ⚠️ Ainda ha 3 ocorrencias em `UIAdapter.ts` (linhas 673, 684, 825), todas com controle de input — risco aceito |
| 4 | CDNs externas expoem IP do visitante | Medio | ✅ Resolvido — Google Fonts self-hosted; Lucide migrado para pacote npm |
| 5 | Sem CSP ou headers de seguranca | Baixo | ❌ Nao implementado — app e client-side puro sem backend, risco aceito |

## Acoes Implementadas

| # | Acao | Status | Arquivos |
|---|------|--------|----------|
| 1 | npm audit fix | ✅ | package-lock.json |
| 2 | Remover @import duplicado de Google Fonts | ✅ | src/css/style.css |
| 3 | Trocar innerHTML por createElement no ThemeAdapter | ✅ | src/adapters/ThemeAdapter.ts |
| 4 | Baixar fontes woff2 e criar @font-face local | ✅ | src/css/fonts.css, src/public/fonts/ |
| 5 | Remover link CDN Google Fonts do HTML | ✅ | src/index.html |
| 6 | Migrar Lucide de CDN para pacote npm | ✅ | package.json, src/main.ts, src/adapters/ |

## Verificacao

```bash
npm run typecheck && npm test -- --run && npm run lint && npm run build
grep -c 'fonts.googleapis.com\|unpkg.com' dist/index.html  # Esperado: 0
npm audit --audit-level=moderate  # Esperado: 0 vulnerabilidades
```

Resultado (jun/2026): 0 referencias CDN, 0 vulnerabilidades moderadas/altas. ✅

## Commits

| # | Commit | Escopo |
|---|--------|--------|
| 1 | chore: remove font duplicate and harden innerHTML usage | N1 completo |
| 2 | perf: self-host google fonts | N2a |
| 3 | perf: migrate lucide icons from CDN to npm package | N2b |
