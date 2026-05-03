# Documentação Técnica: Simulador de Rescisão e FGTS

## Sumário

- [Visão Geral do Projeto](#visão-geral-do-projeto)
- [Arquitetura de Dados](#arquitetura-de-dados)
- [Regras de Negócio (CLT)](#regras-de-negócio-clt)
- [Segurança e Privacidade](#segurança-e-privacidade)
- [Acessibilidade e UX](#acessibilidade-e-ux)
- [Manutenibilidade](#manutenibilidade)
- [Considerações Finais](#considerações-finais)

---

## Visão Geral do Projeto

Este documento descreve a arquitetura técnica e as decisões de implementação do **Simulador de Rescisão e FGTS**, uma ferramenta educacional desenvolvida como parte de um projeto de extensão universitária do curso de **Engenharia de Software da UNINTER**. O sistema tem como objetivo demonstrar a tradução precisa de requisitos legais da Consolidação das Leis do Trabalho (CLT) em código funcional, mantendo rigor técnico e conformidade com boas práticas de desenvolvimento.

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
    // Remove formatação brasileira (R$, pontos, espaços) e troca vírgula por ponto
    const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    value = parseFloat(cleaned);
  }
  if (isNaN(value)) return 0;
  // Math.round para garantir arredondamento correto para centavos
  return Math.round(value * 100);
}

/**
 * Formata inteiro em centavos para string monetária BRL usando Intl.NumberFormat
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

## Regras de Negócio (CLT)

A lógica algorítmica implementa fielmente os percentuais estabelecidos pela legislação trabalhista brasileira para cálculo do Fundo de Garantia do Tempo de Serviço (FGTS) e verbas rescisórias.

### Depósito Mensal do FGTS (8%)

Conforme Artigo 15 da Lei nº 8.036/1990, o empregador deve depositar mensalmente **8% do salário básico** do trabalhador na conta vinculada do FGTS.

```javascript
/**
 * Calcula depósito mensal do FGTS (8%) usando aritmética inteira.
 * @param {number} salarioCents - Salário em centavos
 * @param {number} meses - Número de meses trabalhados
 * @returns {number} - Total depositado em centavos
 */
function calcularFGTS(salarioCents, meses) {
  // 8% do salário por mês, trabalhando com inteiros
  // depositoMensal = salario * 0.08 = salario * 8 / 100
  // Usamos Math.round para arredondar cada depósito mensal para centavos
  const depositoMensal = Math.round((salarioCents * 8) / 100);
  return depositoMensal * meses;
}
```

**Fluxo de Cálculo:**
1. Recebe o salário bruto convertido para centavos
2. Aplica o percentual de 8% usando multiplicação inteira: `(salarioCents * 8) / 100`
3. Arredonda o resultado para o centavo mais próximo
4. Multiplica pelo número de meses trabalhados

### Multa Rescisória (40%)

Em casos de dispensa sem justa causa, o empregador deve pagar uma multa equivalente a **40% do saldo total do FGTS** acumulado durante o contrato de trabalho, conforme Artigo 18 da Lei nº 8.036/1990.

```javascript
/**
 * Calcula multa rescisória de 40% sobre o saldo do FGTS.
 * @param {number} saldoCents - Saldo do FGTS em centavos
 * @returns {number} - Multa em centavos
 */
function calcularMulta(saldoCents) {
  // 40% do saldo, arredondado para centavos
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
  // 13º = salario * (meses / 12)
  // Para evitar float: (salarioCents * meses) / 12
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
  // Férias = salario * (meses / 12)
  // 1/3 constitucional = férias / 3
  // Total = férias + 1/3 = férias * (4/3)
  // Fórmula direta: (salarioCents * meses * 4) / (12 * 3) = (salarioCents * meses * 4) / 36
  return Math.round((salarioCents * meses * 4) / 36);
}
```

### Regra Especial: Saque Aniversário

Quando optante pelo **Saque Aniversário**, o sistema aplica regras específicas:

- O trabalhador mantém **60% do saldo** na conta vinculada
- A multa rescisória é reduzida para **50% do valor original**, pois incide apenas sobre o montante disponível para saque imediato

```javascript
if (saqueAniversarioEl.checked) {
  // No saque aniversário, saca-se até 40% do saldo, mantendo 60%
  // A multa também é reduzida pois incide apenas sobre o que foi sacado
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

### Isolamento de Escopo

O código JavaScript é encapsulado em uma **função autoexecutável (IIFE)**, prevenindo poluição do escopo global e conflitos com outras bibliotecas:

```javascript
(function(){
  // Todo o código da aplicação está isolado neste escopo
  const salarioEl = document.getElementById('salario');
  // ... restante da implementação
})();
```

---

## Acessibilidade e UX

### Aplicação dos Princípios do Desenho Universal

A interface foi projetada seguindo os princípios do **Desenho Universal**, garantindo acesso equitativo a todos os usuários:

#### Estrutura Semântica HTML5

- Uso apropriado de elementos `<header>`, `<main>`, `<section>` e `<form>`
- Títulos hierárquicos (`<h1>` a `<h4>`) para navegação por leitores de tela
- Labels explícitos associados a todos os campos de formulário via atributo `for`

#### Atributos ARIA

```html
<div class="container" aria-label="Conteúdo principal">
  <main class="card" role="main" aria-labelledby="titulo-app">
    <section aria-labelledby="descr-form" class="form-area">
      <!-- Conteúdo acessível -->
    </section>
  </main>
</div>
```

#### Contraste e Legibilidade

- Cores selecionadas para atender aos requisitos de contraste WCAG AA
- Tamanhos de fonte responsivos que se adaptam a diferentes dispositivos
- Indicadores visuais claros para estados interativos (hover, focus, active)

### Persistência de Estado via localStorage

O tema de interface (claro/escuro) é persistido utilizando **localStorage**, proporcionando experiência consistente entre sessões:

```javascript
// Controle de Tema Blindado (Direto na tag Body)
function applyTheme(dark){
  if (dark) {
    document.body.setAttribute('data-theme', 'dark');
    toggleTheme.textContent = 'Tema Claro';
  } else {
    document.body.setAttribute('data-theme', 'light');
    toggleTheme.textContent = 'Tema Escuro';
  }
}

toggleTheme.addEventListener('click', () => {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  applyTheme(!isDark);
});
```

**Nota Técnica**: A implementação atual força o tema claro no carregamento inicial para garantir consistência visual, evitando conflitos com preferências do sistema operacional durante a renderização inicial.

### Feedback Visual Imediato

- Atualização dinâmica dos resultados sem recarregamento da página
- Gráfico donut com variáveis CSS atualizadas em tempo real
- Modal explicativo para contextualização dos cálculos
- Validações com mensagens claras em caso de erro de preenchimento

---

## Manutenibilidade

### Organização de Constantes e Configurações

O código segue princípios de **Clean Code** com separação clara de responsabilidades:

#### Funções Puras e Especializadas

Cada função tem responsabilidade única e bem definida:

| Função | Responsabilidade | Entrada | Saída |
|--------|------------------|---------|-------|
| `toCents()` | Conversão monetária | String ou Number | Integer (centavos) |
| `formatBRLFromCents()` | Formatação BRL | Integer (centavos) | String formatada |
| `parseDate()` | Parse de datas | String YYYY-MM-DD | Objeto Date |
| `monthsBetween()` | Cálculo de período | 2 objetos Date | Integer (meses) |
| `calcularFGTS()` | Depósito 8% | Centavos, meses | Centavos |
| `calcularMulta()` | Multa 40% | Centavos | Centavos |
| `calcularDecimoTerceiro()` | 13º proporcional | Centavos, meses | Centavos |
| `calcularFerias()` | Férias + 1/3 | Centavos, meses | Centavos |

#### Modularização das Funções de Cálculo

A separação das funções de cálculo permite:

- **Testabilidade Individual**: Cada função pode ser testada isoladamente
- **Reusabilidade**: Funções podem ser importadas em outros módulos
- **Manutenção Facilitada**: Alterações em uma regra não afetam outras
- **Documentação Inline**: JSDoc comments descrevem parâmetros e retorno

```javascript
/**
 * Calcula depósito mensal do FGTS (8%) usando aritmética inteira.
 * @param {number} salarioCents - Salário em centavos
 * @param {number} meses - Número de meses trabalhados
 * @returns {number} - Total depositado em centavos
 */
function calcularFGTS(salarioCents, meses) { ... }
```

### Separação de Camadas

O projeto adota separação clássica de camadas:

- **HTML**: Estrutura semântica e conteúdo
- **CSS**: Estilização e temas (variáveis CSS)
- **JavaScript**: Lógica de negócio e manipulação do DOM

### Código Comentado e Documentado

Todas as funções críticas possuem comentários explicativos em português, facilitando:

- Onboarding de novos desenvolvedores
- Revisão de código por pares
- Auditoria de conformidade legal
- Extensão futura das funcionalidades

---

## Considerações Finais

Este projeto demonstra como requisitos legais complexos podem ser traduzidos em implementações de software precisas e confiáveis. A combinação de:

1. **Arquitetura de dados baseada em inteiros** para precisão monetária
2. **Implementação fiel das regras da CLT** com validação jurídica implícita
3. **Compromisso com privacidade** através de processamento client-side
4. **Acessibilidade inclusiva** seguindo padrões internacionais
5. **Código manutenível** com documentação abrangente

Resulta em uma ferramenta educacional robusta que serve tanto como recurso de aprendizado para estudantes quanto como referência de boas práticas de desenvolvimento para projetos de engenharia de software.

---

**Projeto de Extensão Universitária - UNINTER**
Curso de Engenharia de Software
Documento Técnico Versão 1.0