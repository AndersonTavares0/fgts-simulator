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

**Versão Atual**: 1.0 (Refatorada com foco em simplicidade pragmática)
**Última Atualização**: 03/05/2026
**Status**: Produção - Projeto de Extensão Universitária

---

## Arquitetura de Dados

### Estratégia de Manipulação Monetária com Inteiros

Para evitar as imprecisões inerentes ao padrão de ponto flutuante IEEE 754, o sistema adota uma arquitetura baseada em **aritmética inteira** para todas as operações monetárias. Esta decisão técnica elimina erros de arredondamento cumulativos que poderiam comprometer a exatidão dos cálculos trabalhistas.

#### Implementação Técnica

Todos os valores monetários são convertidos e armazenados como **inteiros representando centavos**. Por exemplo:

| Valor Real (BRL) | Representação Interna (centavos) |
|------------------|----------------------------------|
| R$ 1.250,50      | `125050`                         |
| R$ 3.000,00      | `300000`                         |
| R$ 0,99          | `99`                             |

#### Funções de Conversão

```javascript
/**
 * Converte valor monetário (string ou float) para inteiro em centavos.
 * Ex: "1250.50" -> 125050, 1250.5 -> 125050
 */
function toCents(value) {
  if (typeof value === 'string') {
    const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    value = parseFloat(cleaned);
  }
  if (isNaN(value)) return 0;
  return Math.round(value * 100);
}

/**
 * Formata inteiro em centavos para string monetária BRL
 * Ex: 125050 -> "R$ 1.250,50"
 */
function formatBRLFromCents(cents) {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  return formatter.format(cents / 100);
}
```

#### Vantagens desta Abordagem

- **Precisão Garantida**: Elimina erros como `0.1 + 0.2 !== 0.3` comuns em ponto flutuante
- **Arredondamento Controlado**: Uso explícito de `Math.round()` em cada operação crítica
- **Consistência**: Todas as funções de cálculo retornam inteiros em centavos
- **Compatibilidade**: A formatação final utiliza `Intl.NumberFormat` para exibição correta no padrão brasileiro

---

## Organização do Código

### Estrutura de Módulos

O projeto adota uma organização por responsabilidade, com módulos independentes que facilitam a manutenção e o teste isolado:

```
src/js/
├── script.js         # Orquestrador principal (UI e eventos)
├── calculator.js     # Módulo de cálculos (regras CLT puras)
├── validation.js     # Validação e sanitização de entradas
└── theme-manager.js  # Gerenciamento de temas (persistência)
```

### Responsabilidades por Módulo

#### 1. `calculator.js` - Módulo de Cálculo FGTS
**Função**: Concentra exclusivamente lógica matemática de cálculos trabalhistas

```javascript
const FGTSCalculator = {
  calcularDepositoMensal(salarioCents),
  calcularSaldoFGTS(salarioCents, meses),
  calcularMultaRescisoria(saldoCents, motivo),
  calcularDecimoTerceiro(salarioCents, meses),
  calcularFeriasProporcionais(salarioCents, meses)
};
```

**Características**:
- Funções puras (sem efeitos colaterais)
- Sem dependência de DOM ou elementos HTML
- Testável isoladamente
- Documentação JSDoc completa

#### 2. `validation.js` - Módulo de Validação
**Função**: Validação, sanitização e normalização de dados de entrada

```javascript
const ValidationModule = {
  validarSalario(valor),
  validarData(data),
  validarPeriodo(inicio, fim),
  sanitizarEntrada(texto),
  calcularMesesTrabalhados(inicio, termino)
};
```

**Validações Implementadas**:
- Salário: R$ 0,01 a R$ 1.000.000,00 (limite técnico)
- Datas: Formato YYYY-MM-DD válido
- Período: Data de início anterior à data de fim
- Campos obrigatórios preenchidos

#### 3. `theme-manager.js` - Gerenciador de Temas
**Função**: Gerenciamento de temas com persistência em localStorage

```javascript
const ThemeManager = {
  iniciar(toggleButton),
  aplicarTema(tema),
  getTemaAtual()
};
```

**Recursos**:
- Persistência entre sessões
- Detecção de preferência do sistema operacional
- Transições suaves CSS
- Acessibilidade (focus visible)

#### 4. `script.js` - Orquestrador Principal
**Função**: Coordenação entre módulos e manipulação do DOM

```javascript
// Importa módulos especializados
import { FGTSCalculator } from './calculator.js';
import { ValidationModule } from './validation.js';
import { ThemeManager } from './theme-manager.js';

// Orquestra fluxos sem conter lógica de negócio
function inicializarApp() {
  ThemeManager.iniciar();
  configurarEventListeners();
}
```

### Benefícios desta Organização

| Benefício | Descrição |
|-----------|-----------|
| **Testabilidade** | Cada módulo pode ser testado isoladamente |
| **Manutenibilidade** | Alterações localizadas não afetam outros módulos |
| **Reusabilidade** | Módulos podem ser importados em outros projetos |
| **Legibilidade** | Código organizado por responsabilidade |
| **Escalabilidade** | Novas funcionalidades adicionadas sem refatoração massiva |

---

## Regras de Negócio (CLT)

A lógica algorítmica implementa fielmente os percentuais estabelecidos pela legislação trabalhista brasileira para cálculo do Fundo de Garantia do Tempo de Serviço (FGTS) e verbas rescisórias.

### Depósito Mensal do FGTS (8%)

Conforme Artigo 15 da Lei nº 8.036/1990, o empregador deve depositar mensalmente **8% do salário básico** do trabalhador na conta vinculada do FGTS.

**Importante**: Não há teto para o depósito do FGTS. O percentual de 8% incide sobre 100% do salário bruto, independentemente do valor.

```javascript
/**
 * Calcula depósito mensal do FGTS (8%) usando aritmética inteira.
 * @param {number} salarioCents - Salário em centavos
 * @returns {number} - Depósito mensal em centavos
 */
function calcularDepositoMensal(salarioCents) {
  return Math.round((salarioCents * 8) / 100);
}
```

**Fluxo de Cálculo:**
1. Recebe o salário bruto convertido para centavos
2. Aplica o percentual de 8% usando multiplicação inteira: `(salarioCents * 8) / 100`
3. Arredonda o resultado para o centavo mais próximo
4. Retorna o valor do depósito mensal

### Multa Rescisória (40%)

Em casos de dispensa sem justa causa, o empregador deve pagar uma multa equivalente a **40% do saldo total do FGTS** acumulado durante o contrato de trabalho, conforme Artigo 18 da Lei nº 8.036/1990.

```javascript
/**
 * Calcula multa rescisória de 40% sobre o saldo do FGTS.
 * @param {number} saldoCents - Saldo do FGTS em centavos
 * @returns {number} - Multa em centavos
 */
function calcularMulta(saldoCents) {
  return Math.round((saldoCents * 40) / 100);
}
```

### Verbas Proporcionais Adicionais

O sistema também calcula verbas rescisórias complementares quando solicitado pelo usuário:

#### 13º Salário Proporcional

```javascript
/**
 * Calcula 13º salário proporcional em centavos.
 * @param {number} salarioCents - Salário em centavos
 * @param {number} meses - Meses trabalhados no ano
 * @returns {number} - 13º proporcional em centavos
 */
function calcularDecimoTerceiro(salarioCents, meses) {
  return Math.round((salarioCents * meses) / 12);
}
```

#### Férias Proporcionais + 1/3 Constitucional

```javascript
/**
 * Calcula férias proporcionais + 1/3 constitucional em centavos.
 * @param {number} salarioCents - Salário em centavos
 * @param {number} meses - Meses trabalhados
 * @returns {number} - Férias + 1/3 em centavos
 */
function calcularFerias(salarioCents, meses) {
  return Math.round((salarioCents * meses * 4) / 36);
}
```

### Regra Especial: Saque Aniversário

Quando optante pelo **Saque Aniversário**, o sistema aplica regras específicas:

- O trabalhador mantém **60% do saldo** na conta vinculada
- A multa rescisória é reduzida para **50% do valor original**, pois incide apenas sobre o montante disponível para saque imediato

```javascript
if (saqueAniversarioEl.checked) {
  saldoFinalCents = Math.round(saldoBaseCents * 60 / 100);
  multaFinalCents = Math.round(multaBaseCents * 50 / 100);
}
```

---

## Segurança e Privacidade

### Processamento Client-Side

O sistema opera exclusivamente no navegador do usuário (**client-side**), garantindo que **nenhum dado pessoal seja transmitido para servidores externos**. Esta arquitetura oferece:

- **Privacidade Total**: Salários, datas e informações contratuais permanecem no dispositivo do usuário
- **Funcionamento Offline**: Após o carregamento inicial, todos os cálculos são realizados localmente
- **Ausência de Backend**: Não há banco de dados, API ou armazenamento em nuvem que possa ser comprometido

### Conformidade com Proteção de Dados

A implementação está alinhada aos princípios da **Lei Geral de Proteção de Dados (LGPD)**:

| Princípio LGPD | Implementação no Projeto |
|----------------|--------------------------|
| Minimização de Dados | Apenas dados estritamente necessários para o cálculo são solicitados |
| Finalidade Específica | Dados usados exclusivamente para simulação educativa |
| Segurança | Processamento local elimina riscos de vazamento em transmissão |
| Transparência | Avisos claros sobre a natureza educativa dos resultados |

### Validação e Sanitização de Entradas

O módulo `validation.js` implementa proteções contra entradas maliciosas ou inconsistentes:

```javascript
/**
 * Sanitiza entrada de texto removendo caracteres potencialmente perigosos
 * @param {string} input - Texto a ser sanitizado
 * @returns {string} - Texto limpo
 */
function sanitizarEntrada(input) {
  return input
    .replace(/[<>\"\'&]/g, '')
    .trim();
}
```

**Validações Implementadas**:
- Intervalos numéricos válidos (salário positivo, dentro de limites técnicos)
- Datas em formato correto e cronologicamente consistentes
- Prevenção contra XSS via sanitização de strings
- Tratamento de erros com feedback amigável ao usuário

### Isolamento de Escopo

O código JavaScript utiliza módulos com escopo próprio (IIFE pattern), prevenindo poluição do escopo global e conflitos com outras bibliotecas:

```javascript
const FGTSCalculator = (function() {
  'use strict';
  // Código do módulo com escopo isolado
  return { /* API pública */ };
})();
```

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
- Gráfico donut com variáveis CSS atualizadas em tempo real
- Modal explicativo para contextualização dos cálculos
- Validações com mensagens claras em caso de erro de preenchimento

---

## Manutenibilidade

### Princípios de Clean Code Aplicados

O código segue boas práticas de desenvolvimento para facilitar a manutenção futura:

#### Funções Puras e Especializadas

Cada função tem responsabilidade única e bem definida:

| Módulo | Função | Responsabilidade | Entrada | Saída |
|--------|--------|------------------|---------|-------|
| `calculator` | `toCents()` | Conversão monetária | String ou Number | Integer (centavos) |
| `calculator` | `formatBRLFromCents()` | Formatação BRL | Integer (centavos) | String formatada |
| `calculator` | `calcularDepositoMensal()` | Depósito 8% | Centavos | Centavos |
| `calculator` | `calcularMulta()` | Multa 40% | Centavos | Centavos |
| `calculator` | `calcularDecimoTerceiro()` | 13º proporcional | Centavos, meses | Centavos |
| `calculator` | `calcularFerias()` | Férias + 1/3 | Centavos, meses | Centavos |
| `validation` | `validarSalario()` | Validação salário | Valor | Boolean + erros |
| `validation` | `validarData()` | Validação data | String | Boolean + erros |
| `validation` | `sanitizarEntrada()` | Sanitização | String | String limpa |
| `theme-manager` | `alternarTema()` | Toggle tema | - | - |
| `theme-manager` | `aplicarTema()` | Aplicar tema | String | - |

#### Separação de Responsabilidades

A separação das funções de cálculo permite:

- **Testabilidade Individual**: Cada função pode ser testada isoladamente
- **Reusabilidade**: Funções podem ser importadas em outros módulos
- **Manutenção Facilitada**: Alterações em uma regra não afetam outras
- **Documentação Inline**: JSDoc comments descrevem parâmetros e retorno

```javascript
/**
 * Calcula depósito mensal do FGTS (8%) usando aritmética inteira.
 * @param {number} salarioCents - Salário em centavos
 * @returns {number} - Total depositado em centavos
 */
function calcularDepositoMensal(salarioCents) { ... }
```

---

## Considerações Finais

Esta documentação reflete a arquitetura simplificada do Simulador FGTS, com foco em:

1. **Eficiência**: CSS Variables centralizadas, código organizado por responsabilidade
2. **Precisão**: Aritmética de centavos para evitar erros de ponto flutuante
3. **Acessibilidade**: Conformidade WCAG 2.1 AA com recursos de tecnologia assistiva
4. **Manutenibilidade**: Funções puras, documentação clara e separação de concerns

O projeto continua evoluindo como ferramenta educacional de extensão universitária, mantendo o equilíbrio entre simplicidade pragmática e rigor técnico necessário para cálculos trabalhistas precisos.

### Separação de Camadas

O projeto adota separação clássica de camadas:

- **HTML**: Estrutura semântica e conteúdo
- **CSS**: Estilização e temas (variáveis CSS)
- **JavaScript**: Lógica de negócio e manipulação do DOM (módulos separados)

### Código Comentado e Documentado

Todas as funções críticas possuem comentários explicativos em português, facilitando:

- Onboarding de novos desenvolvedores
- Revisão de código por pares
- Auditoria de conformidade legal
- Extensão futura das funcionalidades

### Integração Contínua (CI/CD)

O projeto inclui esteira automatizada no GitHub Actions:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run ESLint
        run: npm run lint
      - name: Run Unit Tests
        run: npm test
      - name: Accessibility Check
        run: npm run axe
```

**Benefícios**:
- Detecção precoce de erros
- Garantia de qualidade antes do deploy
- Documentação executável dos padrões do projeto

---

## Considerações Finais

Este projeto demonstra como requisitos legais complexos podem ser traduzidos em implementações de software precisas e confiáveis. A combinação de:

1. **Arquitetura de dados baseada em inteiros** para precisão monetária absoluta
2. **Arquitetura modular SOLID** para manutenibilidade e testabilidade
3. **Implementação fiel das regras da CLT** com validação jurídica implícita
4. **Compromisso com privacidade** através de processamento client-side
5. **Acessibilidade inclusiva WCAG 2.1 AA** seguindo padrões internacionais
6. **Código manutenível** com documentação abrangente e CI/CD

Resulta em uma ferramenta educacional robusta que serve tanto como recurso de aprendizado para estudantes quanto como referência de boas práticas de desenvolvimento para projetos de engenharia de software.

### Contribuições Acadêmicas

Este projeto de extensão universitária contribui para:
- **Literacia Financeira**: Democratização do acesso a informações trabalhistas
- **Inclusão Digital**: Ferramenta acessível para pessoas com deficiência
- **Ensino de Engenharia**: Estudo de caso prático de aplicação de princípios SOLID
- **Responsabilidade Social**: Software gratuito para conscientização de direitos

---

**Projeto de Extensão Universitária - UNINTER**
Curso de Engenharia de Software
Documento Técnico Versão 1.0 (Refatorada)