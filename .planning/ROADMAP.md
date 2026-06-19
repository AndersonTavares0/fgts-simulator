# Roadmap: Projeto FGTS

**N=8 phases** | **35 new requirements** | **25 validated requirements**

---

### Phase 1: INSS sobre Rescisão
**Goal:** Calcular contribuição INSS sobre verbas rescisórias com tabela 2026
**Mode:** mvp
**Success Criteria:**
1. Serviço INSS calcula aliquota correta por faixa salarial (7,5%-14%)
2. Teto do INSS é aplicado corretamente
3. Valor retido e valor líquido são exibidos no breakdown
4. FormatAdapter testado com jsdom

**Requirements:** INSS-01, INSS-02, INSS-03, QUAL-04

---

### Phase 2: IRRF sobre Rescisão
**Goal:** Calcular IRRF sobre verbas rescisórias com tabela 2026
**Mode:** mvp
**Success Criteria:**
1. Serviço IRRF calcula aliquota correta (0%-27,5%) sobre base líquida (salário - INSS)
2. Dedução por dependente é aplicada
3. ThemeAdapter testado com jsdom

**Requirements:** IRRF-01, IRRF-02, IRRF-03, QUAL-05

---

### Phase 3: Aviso Prévio e Horas Extras
**Goal:** Calcular aviso prévio (trabalhado/indenizado) e horas extras (50%/100%)
**Mode:** mvp
**Success Criteria:**
1. Aviso prévio indenizado calcula valor + médias
2. Aviso prévio proporcional (Lei 12.506/2011) aplica 3 dias/ano até 90 dias
3. Hora extra a 50% (dias úteis) e 100% (domingos/feriados) calculadas
4. DSR sobre horas extras é calculado

**Requirements:** AVISO-01, AVISO-02, AVISO-03, HORA-01, HORA-02, HORA-03

---

### Phase 4: Adicional Noturno e Salário Maternidade
**Goal:** Calcular adicional noturno (20%) e salário maternidade (120 dias)
**Mode:** mvp
**Success Criteria:**
1. Adicional noturno de 20% calculado sobre horas entre 22h-5h
2. Hora reduzida noturna (52min30s) considerada
3. Salário maternidade de 120 dias calculado
4. Integração com INSS durante licença maternidade

**Requirements:** NOTUR-01, NOTUR-02, MATER-01, MATER-02

---

### Phase 5: Convenção Coletiva e Refatoração UIAdapter
**Goal:** Estrutura de percentuais configuráveis + UIAdapter modular
**Mode:** mvp
**Success Criteria:**
1. Estrutura para percentuais configuráveis por categoria implementada
2. Valores padrão CLT (50% HE, 20% noturno) como fallback
3. Lógica de formulário extraída do UIAdapter em adapter próprio
4. Lógica de resultados/gráfico extraída em adapter próprio
5. Lógica LGPD extraída em adapter próprio
6. UIAdapter original vira fachada ou é eliminado

**Requirements:** CONV-01, CONV-02, REFAC-01, REFAC-02, REFAC-03, REFAC-04

---

### Phase 6: Exportação PDF + CSV
**Goal:** Exportar resultados em PDF formatado e CSV analítico
**Mode:** mvp
**Success Criteria:**
1. Relatório PDF com breakdown completo de todos os valores
2. CSV exportável com breakdown analítico
3. Botão de download na interface de resultados
4. UIAdapter (resultados) testado com jsdom

**Requirements:** EXPORT-01, EXPORT-02, EXPORT-03, QUAL-06

---

### Phase 7: PWA + SRI + IndexedDB
**Goal:** Aplicação instalável, offline, com histórico de simulações
**Mode:** mvp
**Success Criteria:**
1. Service worker cacheia todos os assets (Google Fonts, Lucide, CSS, JS)
2. Manifest.json com ícones e theme-color configurado
3. Aplicação funcional offline (sem rede)
4. Histórico de simulações persistido no IndexedDB
5. Botão "Instalar app" captura beforeinstallprompt
6. CDNs protegidos com Subresource Integrity (SRI)

**Requirements:** PWA-01, PWA-02, PWA-03, PWA-04, PWA-05, SEG-01

---

### Phase 8: Qualidade Final e Testes de Integração
**Goal:** Elevar cobertura para ≥ 90% com testes de integração e adapter
**Mode:** mvp
**Success Criteria:**
1. Testes de integração do fluxo completo (formulário → cálculo → resultado)
2. Cobertura mínima de 90% (lines, branches, functions, statements)
3. Nenhum regresso nos 61 testes existentes

**Requirements:** QUAL-07, QUAL-08
