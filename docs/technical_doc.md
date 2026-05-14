# Documentação Técnica: Simulador de Rescisão e FGTS

## Sumário

- [Visão Geral do Projeto](#visão-geral-do-projeto)
- [Arquitetura de Dados](#arquitetura-de-dados)
- [Organização do Código](#organização-do-código)
- [Regras de Negócio (CLT)](#regras-de-negócio-clt)
- [Segurança e Privacidade](#segurança-e-privacidade)
- [Acessibilidade e UX (WCAG 2.1 AA)](#acessibilidade-e-ux-wcag-21-aa)
- [Manutenibilidade](#manutenibilidade)
- [Considerações Finais](#considerações-finais)

---

## Visão Geral do Projeto

Este documento descreve a arquitetura técnica e as decisões de implementação do **Simulador de Rescisão e FGTS**, uma ferramenta educacional desenvolvida como parte de um projeto de extensão universitária do curso de **Engenharia de Software da UNINTER**. O sistema tem como objetivo demonstrar a tradução precisa de requisitos legais da Consolidação das Leis do Trabalho (CLT) em código funcional, mantendo rigor técnico e conformidade com boas práticas de desenvolvimento.

**Versão Atual**: 2.0 (TypeScript + DDD)
**Última Atualização**: 14/05/2026
**Status**: Produção - Projeto de Extensão Universitária

---

## Arquitetura de Dados

### Estratégia de Manipulação Monetária com Money (Decimal.js)

Para evitar as imprecisões inerentes ao padrão de ponto flutuante IEEE 754, o sistema utiliza o Value Object `Money` que encapsula `Decimal.js` com precisão 20 dígitos e arredondamento `ROUND_HALF_EVEN` (Banker's rounding). Esta decisão elimina erros de arredondamento cumulativos que poderiam comprometer a exatidão dos cálculos trabalhistas.

#### Implementação Técnica

O Value Object `Money` em `src/core/types.ts` oferece:

```typescript
// Construtores seguros — preferir fromReais para inputs humanos
Money.fromReais(1250.50);   // R$ 1.250,50  → Decimal 1250.5
Money.fromCents(125050);    // 125050 centavos → Decimal 1250.5

// Operações imutáveis — retornam nova instância Money
money.add(outro);           // Soma
money.subtract(outro);      // Subtração
money.multiply(fator);      // Multiplicação por escalar
money.percentage(40);       // 40% do valor
money.divide(3);            // Divisão

// Consultas
money.toBRL();              // "R$ 1.250,50"
money.isPositive();         // Validação de positividade
money.cents;                // Número de centavos (125050)
```

#### Vantagens desta Abordagem

- **Precisão Garantida**: Decimal.js opera com inteiros internamente, eliminando erros IEEE 754
- **Imutabilidade**: Cada operação retorna nova instância, prevenindo efeitos colaterais
- **Type Safety**: TypeScript garante que apenas `Money` trafega entre serviços
- **Arredondamento Padronizado**: `ROUND_HALF_EVEN` (norma contábil brasileira) em todas as operações
- **Consistência**: Todos os serviços recebem e retornam `Money`, nunca `number`

---

## Organização do Código

A v2.0 foi reescrita em TypeScript seguindo Domain-Driven Design (DDD). A arquitetura separa o código em três camadas:

```
src/
├── core/                    # DOMAIN LAYER — regras de negócio puras
│   ├── types.ts             # Enums, interfaces, Value Object Money
│   ├── entities/
│   │   └── ContratoTrabalho.ts
│   └── services/
│       ├── FGTSCalculatorService.ts
│       ├── CorrecaoMonetariaService.ts
│       ├── MultaService.ts
│       ├── SaqueAniversarioService.ts
│       └── DoencaGraveService.ts
├── adapters/                # ADAPTER LAYER — UI, formatação, tema
│   ├── UIAdapter.ts
│   ├── FormatAdapter.ts
│   └── ThemeAdapter.ts
├── main.ts                  # Entry point
├── index.html               # Dashboard
├── css/                     # Estilos (CSS variables + modules)
└── types/                   # Declarações de tipos
    └── lucide.d.ts
```

### Camadas e Responsabilidades

| Camada | Classe | Responsabilidade |
|--------|--------|------------------|
| **Value Object** | `Money` | Precisão centesimal com Decimal.js, operações imutáveis |
| **Entity** | `ContratoTrabalho` | Validação de contrato, cálculo de meses |
| **Service** | `FGTSCalculatorService` | Orquestrador central |
| **Service** | `CorrecaoMonetariaService` | Juros TR/IPCA + ADI 5090 |
| **Service** | `MultaService` | Multas por tipo de rescisão |
| **Service** | `SaqueAniversarioService` | 7 faixas oficiais |
| **Service** | `DoencaGraveService` | Saque integral 100% |
| **Adapter** | `UIAdapter` | Binding DOM + eventos |
| **Adapter** | `FormatAdapter` | Formatação BRL, parsing |
| **Adapter** | `ThemeAdapter` | Tema claro/escuro (localStorage) |

---

## Regras de Negócio (CLT)

A lógica algorítmica implementa fielmente os percentuais estabelecidos pela legislação trabalhista brasileira para cálculo do Fundo de Garantia do Tempo de Serviço (FGTS) e verbas rescisórias.

### Depósito Mensal do FGTS (8%)

Conforme Artigo 15 da Lei nº 8.036/1990, o empregador deve depositar mensalmente **8% do salário básico** do trabalhador na conta vinculada do FGTS.

**Importante**: Não há teto para o depósito do FGTS. O percentual de 8% incide sobre 100% do salário bruto, independentemente do valor.

```typescript
// Pseudocódigo conceitual — implementação real usa Money (Decimal.js)
function calcularDepositoMensal(salario: Money): Money {
  return salario.percentage(8); // 8% do salário bruto
}
```

**Fluxo de Cálculo:**
1. Recebe o salário bruto convertido para centavos
2. Aplica o percentual de 8% usando multiplicação inteira: `(salarioCents * 8) / 100`
3. Arredonda o resultado para o centavo mais próximo
4. Retorna o valor do depósito mensal

### Multa Rescisória (40%, 20% ou 0%)

A multa varia conforme a modalidade de rescisão:
- **40%** — Dispensa sem justa causa (Art. 18, §1º, Lei 8.036/1990)
- **20%** — Acordo comum (Art. 484-A, §1º, CLT) e culpa recíproca (Art. 484 CLT)
- **0%** — Demissão voluntária, justa causa, aposentadoria, falecimento e doença grave (saques integrais sem multa patronal)

```typescript
// Pseudocódigo conceitual — implementação real usa Money (Decimal.js)
function calcularMulta(saldo: Money, tipo: TipoRescisao): Money {
  return saldo.percentage(MultaService.percentualPara(tipo)); // 40%, 20% ou 0%
}
```

### Verbas Proporcionais Adicionais

O sistema também calcula verbas rescisórias complementares quando solicitado pelo usuário:

#### 13º Salário Proporcional

```typescript
// Pseudocódigo conceitual — implementação real usa Money (Decimal.js)
function calcularDecimoTerceiro(salario: Money, meses: number): Money {
  return salario.multiply(meses).divide(12);
}
```

#### Férias Proporcionais + 1/3 Constitucional

```typescript
// Pseudocódigo conceitual — implementação real usa Money (Decimal.js)
function calcularFerias(salario: Money, meses: number): Money {
  return salario.multiply(meses).multiply(4).divide(36); // + 1/3 constitucional
}
```

### Regra Especial: Saque Aniversário

Quando optante pelo **Saque Aniversário**, o sistema aplica as regras oficiais da Caixa Econômica Federal:

1.  **Cálculo da Parcela Anual**: Baseado em faixas de saldo com alíquota progressiva e parcela adicional.
    
    | Faixa de Saldo | Alíquota | Parcela Adicional |
    | :--- | :---: | :--- |
    | Até R$ 500,00 | 50% | R$ 0,00 |
    | R$ 500,01 a R$ 1.000,00 | 40% | R$ 50,00 |
    | R$ 1.000,01 a R$ 5.000,00 | 30% | R$ 150,00 |
    | R$ 5.000,01 a R$ 10.000,00 | 20% | R$ 650,00 |
    | R$ 10.000,01 a R$ 15.000,00 | 15% | R$ 1.150,00 |
    | R$ 15.000,01 a R$ 20.000,00 | 10% | R$ 1.900,00 |
    | Acima de R$ 20.000,00 | 5% | R$ 2.900,00 |

2.  **Impacto na Rescisão**:
    *   O trabalhador **mantém o saldo retido** na conta (saldoFinal = 0 no saque imediato).
    *   A **Multa Rescisória** (40% ou 20% conforme o tipo) é paga integralmente sobre o total de depósitos.
    *   O sistema exibe o valor da próxima parcela anual estimada.

### Regra Especial: Trabalhador Doméstico (LC 150/2015)

O trabalhador doméstico possui regras distintas:

1. **Depósito mensal FGTS**: 8% do salário (igual CLT padrão)
2. **Reserva de indenização mensal**: 3,2% adicionais (Art. 22, LC 150/2015)
3. **Multa na rescisão**: Calculada sobre o *saldo acumulado da reserva de 3,2%*, não pelo `MultaService`:
   - Dispensa sem justa causa → 100% da reserva acumulada
   - Acordo comum → 50% da reserva acumulada
   - Demais modalidades → R$ 0,00 (reserva retorna ao empregador, §2º, Art. 22)

### Juros e Correção Monetária (Art. 13 da Lei 8.036/1990)

O saldo do FGTS deve ser atualizado mensalmente. O simulador agora considera:
- **Juros de 3% ao ano**: Calculados de forma composta mensalmente (~0,246% a.m.).
- **TR (Taxa Referencial)**: Utiliza-se uma estimativa conservadora para simular o crescimento real do fundo.

---

## Segurança e Privacidade

### Processamento Client-Side

O sistema opera exclusivamente no navegador do usuário (**client-side**), garantindo que **nenhum dado pessoal seja transmitido para servidores externos**. Esta arquitetura oferece:

- **Privacidade Total**: Salários, datas e informações contratuais permanecem no dispositivo do usuário
- **Funcionamento Offline**: Após o carregamento inicial, todos os cálculos são realizados localmente
- **Ausência de Backend**: Não há banco de dados, API ou armazenamento em nuvem que possa ser comprometido

### Conformidade com a LGPD (Lei nº 13.709/2018)

O projeto implementa medidas específicas de conformidade com a Lei Geral de Proteção de Dados:

| Princípio LGPD | Implementação no Projeto |
|----------------|--------------------------|
| **Minimização de Dados** (Art. 6, III) | Apenas dados estritamente necessários para o cálculo são solicitados |
| **Finalidade Específica** (Art. 6, I) | Dados usados exclusivamente para simulação educativa |
| **Transparência** (Art. 6, VI) | Banner de privacidade + modal com política completa |
| **Segurança** (Art. 6, VII) | Processamento local elimina riscos de vazamento em transmissão |
| **Consentimento** (Art. 7, I) | Consentimento explícito para dados sensíveis de saúde (Art. 11) |
| **Direitos do Titular** (Art. 18) | Política de privacidade detalha todos os direitos e como exercê-los |

### Implementações Técnicas LGPD

1. **Banner de Privacidade** — Aviso fixo no rodapé informando sobre processamento local
2. **Modal de Política de Privacidade** — Documento completo acessível via link "Saiba mais"
3. **Consentimento para Dados Sensíveis** — Checkbox explícito obrigatório para simulação de doença grave (dados de saúde, Art. 5, II)
4. **Bloqueio de Cálculo sem Consentimento** — O sistema impede cálculos com dados de saúde sem consentimento prévio
5. **Arquivo POLICY-LGPD.md** — Política de privacidade completa no repositório

### Dados Coletados

| Dado | Categoria | Finalidade | Base Legal |
|------|-----------|------------|------------|
| Salário bruto | Pessoal | Cálculo FGTS/verbas | Consentimento (Art. 7, I) |
| Datas de contrato | Pessoal | Cálculo de meses | Consentimento (Art. 7, I) |
| Motivo da rescisão | Pessoal | Multa correta | Consentimento (Art. 7, I) |
| **Doença grave** | **Sensível** (Art. 5, II) | Saque integral | **Consentimento específico** (Art. 11, I) |
| Preferência de tema | Preferência | UX | Legítimo interesse (Art. 7, IX) |

### Validação e Sanitização de Entradas

O projeto implementa validação em múltiplas camadas:

| Proteção | Implementação | Camada |
|----------|---------------|--------|
| Salário zero ou negativo | `Money.isPositive()` retorna false → cálculo retorna zero | Service |
| Salário acima de R$ 1M | `ContratoTrabalho.validar()` rejeita com mensagem de erro | Entity |
| Datas futuras inválidas | `FormatAdapter.parseDate()` valida componentes da data | Adapter |
| Período invertido | `dataTermino < dataInicio` → validação rejeita | Entity |
| Período > 50 anos | Limite de 18.250 dias → proteção contra overflow | Entity |
| Input não-numérico | `FormatAdapter.parseMonetaryInput()` sanitiza e valida | Adapter |
| IEEE 754 float errors | `Money(Decimal.js)` — todas as operações em Decimal | Value Object |
| Tipo de rescisão inválido | `Record<TipoRescisao, ...>` — TypeScript garante exaustividade | Type System |
| XSS / Injection | Input sanitizado: `replace(/[R$\s]/g, '')` antes de parse | Adapter |

### Isolamento de Escopo

O código TypeScript utiliza módulos ES nativos com `verbatimModuleSyntax: true`, prevenindo poluição do escopo global e garantindo que apenas tipos sejam importados como tipo:

---

## Acessibilidade e UX (WCAG 2.1 AA)

### Aplicação dos Princípios do Desenho Universal

A interface foi projetada seguindo os princípios do **Desenho Universal** e as diretrizes **WCAG 2.1 Nível AA**, garantindo acesso equitativo a todos os usuários:

#### Estrutura Semântica HTML5

- Uso apropriado de elementos `<header>`, `<main>`, `<section>` e `<form>`
- Títulos hierárquicos (`<h1>` a `<h4>`) para navegação por leitores de tela
- Labels explícitos associados a todos os campos de formulário via atributo `for`

#### Atributos ARIA Implementados

```html
<!-- Live regions para announce dinâmico -->
<div aria-live="polite" aria-atomic="true" id="resultado-fgts"></div>

<!-- Rótulos descritivos -->
<button aria-label="Alternar tema claro/escuro" id="btn-tema"></button>

<!-- Roles semânticos -->
<main role="main" aria-labelledby="titulo-app"></main>
<section role="region" aria-labelledby="formulario-simulacao"></section>
```

#### Recursos de Acessibilidade

| Recurso | Implementação |
|---------|---------------|
| **Skip Link** | Link "Pular para conteúdo principal" no início da página |
| **Foco Visível** | Outline personalizado com alto contraste em todos os elementos focáveis |
| **Contraste de Cores** | Todas as cores atendem ratio mínimo de 4.5:1 (WCAG AA) |
| **Navegação por Teclado** | Todos os elementos interativos acessíveis via Tab/Enter/Esc |
| **Live Regions** | Resultados anunciados automaticamente para leitores de tela |
| **Texto Alternativo** | Ícones e imagens decorativas marcados como `aria-hidden="true"` |
| **Formulários Acessíveis** | Labels associados, mensagens de erro claras e `aria-invalid` |

#### Contraste e Legibilidade

- Cores selecionadas para atender aos requisitos de contraste WCAG AA
- Tamanhos de fonte responsivos que se adaptam a diferentes dispositivos
- Indicadores visuais claros para estados interativos (hover, focus, active)

### Gerenciamento de Temas com CSS Variables

O sistema de temas utiliza **CSS Variables centralizadas em `:root`**, proporcionando:

- **Eficiência**: Uma única definição de variáveis para todo o projeto
- **Manutenibilidade**: Alterações de cores em um único local
- **Performance**: Sem repetição desnecessária de regras CSS

```css
:root {
  /* Tema Claro (Padrão) */
  --bg: #F3F4F6;
  --surface: #FFFFFF;
  --fg: #111827;
  --accent: #1E6B52;
}

[data-theme="dark"] {
  /* Sobrescrita para Tema Escuro */
  --bg: #0B0F14;
  --surface: #141A20;
  --fg: #E9F0F5;
  --accent: #4DDC9A;
}
```

### Feedback Visual Imediato

- Atualização dinâmica dos resultados sem recarregamento da página
- Gráfico donut interativo com variáveis CSS atualizadas em tempo real
- Accordion explicativo inline para contextualização dos cálculos
- Validações com mensagens claras em caso de erro de preenchimento

---

## Manutenibilidade

### Princípios de Clean Code Aplicados

O código segue boas práticas de desenvolvimento para facilitar a manutenção futura:

#### Serviços Especializados

Cada serviço tem responsabilidade única e bem definida, seguindo o princípio Single Responsibility (SOLID):

| Serviço | Método Principal | Responsabilidade | Entrada | Saída |
|---------|-----------------|------------------|---------|-------|
| `FGTSCalculatorService` | `calcular()` | Orquestração completa | `ContratoTrabalho`, opções | `ResultadoRescisao` |
| `CorrecaoMonetariaService` | `calcularSaldoComCorrecao()` | Juros TR+3% com piso IPCA | `Money`, meses, taxas | `Money` (saldo corrigido) |
| `MultaService` | `calcular()` | Multa por tipo de rescisão | `Money` (saldo), `TipoRescisao`, `Money` (total depósitos) | `ResultadoMulta` |
| `SaqueAniversarioService` | `calcularParcela()` | Parcela por faixa oficial | `Money` (saldo) | `ResultadoSaqueAniversario` |
| `DoencaGraveService` | `avaliar()` | Elegibilidade + saque integral | `Money` (saldo), doença | `Money`, elegibilidade |
| `ContratoTrabalho` | `validar()` | Validação de contrato | Dados do formulário | Erros ou contrato válido |
| `FormatAdapter` | `parseMonetaryInput()` | Sanitização e parsing BRL | String do input | `Money` |
| `FormatAdapter` | `parseDate()` | Validação de data | String YYYY-MM-DD | `Date` |
| `ThemeAdapter` | `aplicarTema()` | Tema claro/escuro persistente | String | - |

#### Separação de Responsabilidades

A arquitetura DDD em camadas permite:

- **Testabilidade Individual**: Cada serviço pode ser testado isoladamente (61 testes)
- **Reusabilidade**: `Money` é o único Value Object que transita entre todas as camadas
- **Manutenção Facilitada**: Alterações em uma regra não afetam outras — ex: adicionar novo tipo de rescisão requer apenas atualizar `MultaService`
- **Type Safety**: TypeScript com `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` previne erros em tempo de compilação

---

## Considerações Finais

Este projeto demonstra como requisitos legais complexos podem ser traduzidos em implementações de software precisas e confiáveis. A combinação de:

1. **Value Object `Money` com Decimal.js** para precisão monetária absoluta
2. **Arquitetura DDD com serviços especializados** para manutenibilidade e testabilidade
3. **Implementação fiel das regras da CLT** com enum exaustivo de 8 tipos de rescisão
4. **Compromisso com privacidade** através de processamento client-side
5. **Acessibilidade inclusiva WCAG 2.1 AA** seguindo padrões internacionais
6. **TypeScript strict** com cobertura de 80% em 61 testes automatizados

Resulta em uma ferramenta educacional robusta que serve tanto como recurso de aprendizado para estudantes quanto como referência de boas práticas de desenvolvimento para projetos de engenharia de software.

### Contribuições Acadêmicas

Este projeto de extensão universitária contribui para:
- **Literacia Financeira**: Democratização do acesso a informações trabalhistas
- **Inclusão Digital**: Ferramenta acessível para pessoas com deficiência
- **Ensino de Engenharia**: Estudo de caso prático de DDD, Decimal.js e SOLID
- **Responsabilidade Social**: Software gratuito para conscientização de direitos

---

**Projeto de Extensão Universitária - UNINTER**
Curso de Engenharia de Software
Documento Técnico Versão 2.0 (TypeScript + DDD)

### Integração Contínua (CI/CD)

O projeto inclui esteira automatizada no GitHub Actions (`.github/workflows/static.yml`):

```yaml
jobs:
  build-and-deploy:
    steps:
      - name: Type Check
        run: npm run typecheck
      - name: Unit Tests (Vitest)
        run: npm test
      - name: Production Build
        run: npm run build
      - name: Deploy to GitHub Pages
        ...
```

**Pipeline**: `npm ci` → `typecheck` → `test` → `build` → deploy para GitHub Pages

**Benefícios**:
- Detecção precoce de erros de tipo e lógica
- Garantia de qualidade antes do deploy
- Deploy automático ao dar push em `main`
- Threshold de cobertura: 80% (lines, branches, functions, statements)
