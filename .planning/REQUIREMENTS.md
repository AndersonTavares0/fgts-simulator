# Requirements: Projeto FGTS

**Defined:** 2026-05-14
**Core Value:** Trabalhadores brasileiros CLT podem calcular estimativas confiáveis de seus direitos trabalhistas de graça, sem sair do navegador, sem enviar dados pessoais a servidores externos.

## v1 Requirements (Validated — Existing)

### FGTS

- [x] **FGTS-01**: Depósito mensal de 8% (CLT padrão), 2% (Aprendiz), 8% (Doméstico)
- [x] **FGTS-02**: Correção monetária TR + 3% a.a. com piso IPCA (ADI 5090)
- [x] **FGTS-03**: Saque integral por doença grave (câncer, HIV/AIDS, terminal)
- [x] **FGTS-04**: Saque-Aniversário (7 faixas oficiais Caixa, alíquota + parcela fixa)

### Rescisão

- [x] **RESC-01**: Multa rescisória (40% sem justa causa, 20% acordo/culpa recíproca, 0% demais)
- [x] **RESC-02**: 13º proporcional (salário × meses ÷ 12, máx. 12 avos)
- [x] **RESC-03**: Férias proporcionais + 1/3 constitucional
- [x] **RESC-04**: Doméstico (LC 150/2015) — reserva 3,2%, multa 100%/50%/0%

### Validação

- [x] **VALD-01**: Salário > 0 e < R$ 1.000.000
- [x] **VALD-02**: Datas válidas, término > início
- [x] **VALD-03**: Período máximo 50 anos
- [x] **VALD-04**: Regra CLT dos 15 dias (≥ 15 dias = +1 avo)

### UI/UX

- [x] **UI-01**: Tema claro/escuro com persistência (localStorage + prefers-color-scheme)
- [x] **UI-02**: SVG donut chart com texturas WCAG
- [x] **UI-03**: Skip links, navegação por teclado, ARIA live regions
- [x] **UI-04**: Touch targets ≥ 48px (WCAG 2.5.5)
- [x] **UI-05**: Alto contraste WCAG AAA (prefers-contrast: more)
- [x] **UI-06**: Design responsivo (desktop, tablet, mobile)
- [x] **UI-07**: Animações respeitam prefers-reduced-motion
- [x] **UI-08**: Glassmorphism sidebar, modal de privacidade

### LGPD

- [x] **LGPD-01**: Banner de privacidade com dismiss persistente
- [x] **LGPD-02**: Modal com política completa (10 seções)
- [x] **LGPD-03**: Consentimento explícito para dados de saúde (checkbox)
- [x] **LGPD-04**: Bloqueio de cálculo sem consentimento para doença grave

### Qualidade

- [x] **QUAL-01**: 61 testes unitários (Vitest)
- [x] **QUAL-02**: Cobertura 80% (lines, branches, functions, statements)
- [x] **QUAL-03**: ESLint + Prettier + Husky (pre-commit)

---

## v1 Requirements (New — To Build)

### INSS

- [ ] **INSS-01**: Calcular contribuição INSS sobre salário bruto mensal (alíquotas 7,5%-14%, tabela 2026)
- [ ] **INSS-02**: Aplicar teto do INSS no cálculo
- [ ] **INSS-03**: Destacar valor retido e valor líquido no resultado

### IRRF

- [ ] **IRRF-01**: Calcular IRRF sobre verbas rescisórias (alíquotas 0%-27,5%, tabela 2026)
- [ ] **IRRF-02**: Aplicar dedução por dependente
- [ ] **IRRF-03**: Considerar base já reduzida pelo INSS

### Aviso Prévio

- [ ] **AVISO-01**: Calcular aviso prévio indenizado (salário + médias)
- [ ] **AVISO-02**: Calcular aviso prévio trabalhado (dispensa de horário, integração ao tempo de serviço)
- [ ] **AVISO-03**: Aplicar proporcionalidade (3 dias/ano, Lei 12.506/2011, até 90 dias)

### Horas Extras

- [ ] **HORA-01**: Calcular hora extra a 50% (dias úteis)
- [ ] **HORA-02**: Calcular hora extra a 100% (domingos/feriados)
- [ ] **HORA-03**: Calcular DSR sobre horas extras

### Adicional Noturno

- [ ] **NOTUR-01**: Calcular adicional noturno de 20% (22h-5h)
- [ ] **NOTUR-02**: Considerar hora reduzida noturna (52min30s)

### Salário Maternidade

- [ ] **MATER-01**: Calcular salário maternidade (120 dias de licença)
- [ ] **MATER-02**: Integrar com INSS (contribuição durante licença)

### Convenção Coletiva

- [ ] **CONV-01**: Estrutura de percentuais configuráveis por categoria
- [ ] **CONV-02**: Valores padrão CLT (50% HE, 20% noturno)

### Refatoração

- [ ] **REFAC-01**: Extrair lógica de formulário do UIAdapter
- [ ] **REFAC-02**: Extrair lógica de resultados/gráfico do UIAdapter
- [ ] **REFAC-03**: Extrair lógica LGPD para adapter próprio
- [ ] **REFAC-04**: Garantir que UIAdapter original se torne fachada ou seja eliminado

### Exportação

- [ ] **EXPORT-01**: Gerar relatório PDF com breakdown completo
- [ ] **EXPORT-02**: Gerar CSV com breakdown dos valores
- [ ] **EXPORT-03**: Botão de download na interface de resultados

### PWA

- [ ] **PWA-01**: Service worker para cache de assets
- [ ] **PWA-02**: Manifest.json com ícones e tema
- [ ] **PWA-03**: Funcionamento offline completo
- [ ] **PWA-04**: Histórico de simulações no IndexedDB
- [ ] **PWA-05**: Botão "Instalar app" (beforeinstallprompt)

### Qualidade & Segurança

- [ ] **QUAL-04**: Testes de FormatAdapter com jsdom
- [ ] **QUAL-05**: Testes de ThemeAdapter com jsdom
- [ ] **QUAL-06**: Testes de UIAdapter (formulário) com jsdom
- [ ] **QUAL-07**: Testes de integração (fluxo completo formulário → resultado)
- [ ] **QUAL-08**: Cobertura ≥ 90%
- [ ] **SEG-01**: Adicionar SRI hash nos CDNs (Lucide, Google Fonts)

---

## v2 Requirements (Deferred)

- Personalização avançada de cenários (múltiplos contratos simultâneos)
- Gráfico de evolução temporal do saldo
- Exportação avançada com gráficos no PDF
- Temas customizáveis pelo usuário

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend/API | Projeto 100% client-side |
| Autenticação | Sem login, sem cadastro |
| eSocial / Conectividade Social | Integração governamental fora do escopo |
| i18n | Português apenas |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INSS-01 | Phase 1 | Pending |
| INSS-02 | Phase 1 | Pending |
| INSS-03 | Phase 1 | Pending |
| QUAL-04 | Phase 1 | Pending |
| IRRF-01 | Phase 2 | Pending |
| IRRF-02 | Phase 2 | Pending |
| IRRF-03 | Phase 2 | Pending |
| QUAL-05 | Phase 2 | Pending |
| AVISO-01 | Phase 3 | Pending |
| AVISO-02 | Phase 3 | Pending |
| AVISO-03 | Phase 3 | Pending |
| HORA-01 | Phase 3 | Pending |
| HORA-02 | Phase 3 | Pending |
| HORA-03 | Phase 3 | Pending |
| NOTUR-01 | Phase 4 | Pending |
| NOTUR-02 | Phase 4 | Pending |
| MATER-01 | Phase 4 | Pending |
| MATER-02 | Phase 4 | Pending |
| CONV-01 | Phase 5 | Pending |
| CONV-02 | Phase 5 | Pending |
| REFAC-01 | Phase 5 | Pending |
| REFAC-02 | Phase 5 | Pending |
| REFAC-03 | Phase 5 | Pending |
| REFAC-04 | Phase 5 | Pending |
| EXPORT-01 | Phase 6 | Pending |
| EXPORT-02 | Phase 6 | Pending |
| EXPORT-03 | Phase 6 | Pending |
| QUAL-06 | Phase 6 | Pending |
| PWA-01 | Phase 7 | Pending |
| PWA-02 | Phase 7 | Pending |
| PWA-03 | Phase 7 | Pending |
| PWA-04 | Phase 7 | Pending |
| PWA-05 | Phase 7 | Pending |
| SEG-01 | Phase 7 | Pending |
| QUAL-07 | Phase 8 | Pending |
| QUAL-08 | Phase 8 | Pending |

**Coverage:**
- v1 requirements (validated): 25 total
- v1 requirements (new): 35 total
- Mapped to phases: 35
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-14*
*Last updated: 2026-05-14 after initial definition*
