# Projeto FGTS: Simulador de Rescisão e FGTS

[![GitHub AndersonTavares0](https://img.shields.io/badge/GitHub-AndersonTavares0-181717?style=flat-square&logo=github)](https://github.com/AndersonTavares0)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Software Version](https://img.shields.io/badge/version-2.0.0-green?style=flat-square)](#)
![TypeScript](https://img.shields.io/badge/TypeScript-%233178C6.svg?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-%23646CFF.svg?style=flat-square&logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-%236E9F18.svg?style=flat-square&logo=vitest&logoColor=white)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=flat-square&logo=css3&logoColor=white)

## Sumário

- [Contexto Acadêmico](#contexto-acadêmico)
- [Descrição do Projeto](#descrição-do-projeto)
- [Arquitetura TypeScript (DDD)](#arquitetura-typescript-ddd)
- [Motor de Regras Avançado](#motor-de-regras-avançado-clt--stf)
- [Referência de Fórmulas](#referência-de-fórmulas)
- [Testes Automatizados](#testes-automatizados)
- [Instalação e Uso](#instalação-e-uso)
- [Estrutura do Repositório](#estrutura-do-repositório)
- [Proteções contra Inputs Inválidos](#proteções-contra-inputs-inválidos)
- [Roadmap](#roadmap-futuras-melhorias)
- [Aviso Legal](#aviso-legal)

## Contexto Acadêmico

Este projeto foi desenvolvido como atividade de **Extensão Universitária** para o curso de **Engenharia de Software** do Centro Universitário Internacional **UNINTER**. O objetivo central é utilizar o desenvolvimento de software como instrumento de promoção da justiça social, focando na literacia financeira e na inclusão digital de trabalhadores regidos pela CLT.

## Descrição do Projeto

O sistema consiste em uma ferramenta de simulação trabalhista que permite ao usuário calcular estimativas de verbas rescisórias e saldo de FGTS de forma autônoma e ágil. A v2.0 implementa:

### Funcionalidades (v2.0)

* **TypeScript com Domain-Driven Design** — Arquitetura de camadas com Entities, Services e Adapters
* **Precisão financeira com Decimal.js** — Eliminação completa de erros IEEE 754 via Value Object `Money`
* **Correção Monetária TR/IPCA** — Motor de indexação com conformidade ADI 5090 (STF)
* **8 Modalidades de Rescisão** — Enum exaustivo com multas diferenciadas (40%, 20%, 0%)
* **Saque por Doença Grave** — Liberação integral de 100% do saldo (Lei 8.036/90)
* **Saque-Aniversário** — Tabela oficial de 7 faixas com parcela fixa
* **43 Testes Automatizados** — Suíte Vitest cobrindo cálculos financeiros e validações
* **Acessibilidade WCAG 2.1 AA** — ARIA labels, live regions, navegação por teclado

---

## Arquitetura TypeScript (DDD)

O projeto segue **Domain-Driven Design** com separação em 3 camadas:

```
src/
├── core/                         # 🏛️ DOMAIN LAYER (Regras de negócio puras)
│   ├── types.ts                  # Enums, Interfaces, Value Object Money
│   ├── entities/
│   │   └── ContratoTrabalho.ts   # Entity: validação e cálculo de meses CLT
│   └── services/
│       ├── FGTSCalculatorService.ts       # Orquestrador central
│       ├── CorrecaoMonetariaService.ts    # Motor TR/IPCA + ADI 5090
│       ├── MultaService.ts               # Multas por tipo de rescisão
│       ├── SaqueAniversarioService.ts     # Faixas oficiais Caixa
│       └── DoencaGraveService.ts          # Saque integral 100%
├── adapters/                     # 🔌 ADAPTER LAYER (UI / Formatação)
│   ├── UIAdapter.ts              # Manipulação do DOM
│   ├── FormatAdapter.ts          # Formatação BRL, parsing de datas
│   └── ThemeAdapter.ts           # Tema claro/escuro com persistência
├── main.ts                       # Entry point (bootstrapper)
├── index.html                    # UI Dashboard
├── css/                          # Estilos (inalterado)
└── js/                           # JS legado (mantido para referência)
```

### Hierarquia de Classes

| Camada | Classe | Responsabilidade |
|--------|--------|------------------|
| **Value Object** | `Money` | Encapsula valores monetários com `Decimal.js` — operações imutáveis |
| **Entity** | `ContratoTrabalho` | Valida dados do contrato, calcula meses CLT |
| **Service** | `FGTSCalculatorService` | Orquestra todos os serviços → `ResultadoRescisao` |
| **Service** | `CorrecaoMonetariaService` | Juros compostos + TR/IPCA com piso ADI 5090 |
| **Service** | `MultaService` | `Record<TipoRescisao, {percentual, fundamento}>` exaustivo |
| **Service** | `SaqueAniversarioService` | 7 faixas oficiais + impacto na rescisão |
| **Service** | `DoencaGraveService` | 100% de liberação para doenças qualificadas |
| **Adapter** | `UIAdapter` | DOM binding, renderização de resultados |
| **Adapter** | `FormatAdapter` | `Money → BRL string`, parsing de inputs |
| **Adapter** | `ThemeAdapter` | localStorage + prefers-color-scheme |

### Enum Exaustivo: `TipoRescisao`

```typescript
enum TipoRescisao {
  DISPENSA_SEM_JUSTA_CAUSA  // Art. 477 CLT → Multa 40%
  DEMISSAO_VOLUNTARIA       // Pedido do empregado → Multa 0%
  JUSTA_CAUSA               // Art. 482 CLT → Multa 0%
  ACORDO_COMUM              // Art. 484-A CLT (Reforma 2017) → Multa 20%
  DOENCA_GRAVE              // Lei 8.036/90, Art. 20 XIII → Multa 40%
  APOSENTADORIA             // Lei 8.036/90, Art. 20 III → Multa 40%
  FALECIMENTO               // Lei 8.036/90, Art. 20 IV → Multa 40%
  CULPA_RECIPROCA           // Art. 484 CLT → Multa 20%
}
```

---

## Motor de Regras Avançado (CLT & STF)

### Correção Monetária: TR + 3% a.a. com piso IPCA

O saldo do FGTS é corrigido mensalmente pelo motor `CorrecaoMonetariaService`:

1. **Taxa legal**: Juros de 3% ao ano (Art. 13, Lei 8.036/1990) + TR mensal
2. **Conversão mensal**: `taxaMensal = (1 + 0.03)^(1/12) - 1 + TR`
3. **Piso ADI 5090**: Se `(TR + 3%) anual < IPCA anual`, aplica-se o IPCA como indexador substituto
4. **Série de pagamentos**: `FV = Depósito × [((1 + i)^n - 1) / i]`

### Saque por Doença Grave

Conforme Lei 8.036/90, Art. 20, inciso XIII — liberação de **100% do saldo** para:
- Neoplasia maligna (Câncer)
- HIV/AIDS
- Doença em estágio terminal
- Doenças graves conforme portaria ministerial vigente

### Saque-Aniversário (Tabela Oficial Caixa)

| Faixa de Saldo | Alíquota | Parcela Adicional |
|:---|:---:|:---|
| Até R$ 500,00 | 50% | R$ 0,00 |
| R$ 500,01 – R$ 1.000,00 | 40% | R$ 50,00 |
| R$ 1.000,01 – R$ 5.000,00 | 30% | R$ 150,00 |
| R$ 5.000,01 – R$ 10.000,00 | 20% | R$ 650,00 |
| R$ 10.000,01 – R$ 15.000,00 | 15% | R$ 1.150,00 |
| R$ 15.000,01 – R$ 20.000,00 | 10% | R$ 1.900,00 |
| Acima de R$ 20.000,00 | 5% | R$ 2.900,00 |

Na rescisão, o optante **não saca o saldo** (fica retido), mas **recebe a multa rescisória integralmente**.

---

## Referência de Fórmulas

| Cálculo | Fórmula | Base Legal |
|---------|---------|------------|
| **Depósito Mensal** | `Salário × 8%` (CLT) ou `× 2%` (Aprendiz) | Art. 15, Lei 8.036/1990 |
| **Saldo com Correção** | `FV = P × [((1+i)^n - 1) / i]` | Art. 13, Lei 8.036/1990 |
| **Taxa Mensal (TR)** | `(1 + 0.03)^(1/12) - 1 + TR` | Art. 13 + BCB |
| **Piso IPCA (ADI 5090)** | `max(taxaTR, taxaIPCA)` aplicado mensalmente | STF, ADIs 5090 |
| **Multa 40%** | `Saldo × 40%` | Art. 18, §1º, Lei 8.036/1990 |
| **Multa 20% (Acordo)** | `Saldo × 20%` | Art. 484-A, §1º, CLT |
| **13º Proporcional** | `Salário × (meses / 12)` — máx. 12 avos | Art. 1º, Lei 4.090/1962 |
| **Férias + 1/3** | `Salário × (meses / 12) × (4/3)` | Art. 7º, XVII, CF/88 |
| **Saque-Aniversário** | `Saldo × alíquota + parcela fixa` | Lei 13.932/2019 |
| **Doença Grave** | `100% do saldo` | Art. 20, XIII, Lei 8.036/90 |

---

## Testes Automatizados

O projeto inclui **43 testes automatizados** executados com **Vitest**:

```bash
npm test          # Executa todos os testes
npm run test:watch  # Modo watch (desenvolvimento)
```

### Cobertura de Cenários

| Suite | Testes | Validação |
|-------|--------|-----------|
| Money Value Object | 6 | Precisão centesimal, IEEE 754, formatação BRL |
| Depósito Mensal | 3 | Alíquota 8% CLT, 2% Aprendiz, input zero |
| Juros Compostos | 3 | Acumulação 12 e 60 meses, meses zero |
| Multa Rescisória | 7 | 40%, 20%, 0% para cada tipo de rescisão |
| Doença Grave | 4 | 100% liberação para câncer, HIV, terminal |
| ADI 5090 (TR/IPCA) | 2 | IPCA substituto quando TR=0, TR dominante |
| Saque-Aniversário | 4 | Faixas extremas, impacto na rescisão |
| Integração Completa | 4 | Rescisão com verbas, saque-aniv., doença grave |
| Validação de Inputs | 6 | Salário zero, datas invertidas, período >50 anos |
| Verbas Proporcionais | 4 | 13º, férias+1/3, limites, negativos |

---

## Instalação e Uso

### Pré-requisitos

- Node.js ≥ 18
- npm ≥ 9

### Setup

```bash
git clone https://github.com/AndersonTavares0/PROJETO-FGTS.git
cd PROJETO-FGTS
npm install
```

### Scripts Disponíveis

```bash
npm run dev           # Inicia servidor Vite com HMR
npm run build         # Type-check + build para produção (dist/)
npm run preview       # Preview do build de produção
npm test              # Executa testes (Vitest)
npm run test:watch    # Testes em modo watch
npm run typecheck     # Verificação de tipos (tsc --noEmit)
```

---

## Estrutura do Repositório

```text
PROJETO-FGTS/
├── .github/workflows/       # CI/CD — GitHub Actions
├── src/                     # Código-fonte
│   ├── index.html           # UI Dashboard
│   ├── main.ts              # Entry point TypeScript
│   ├── core/                # Domain Layer (DDD)
│   │   ├── types.ts         # Enums, Money, Interfaces
│   │   ├── entities/        # Entities
│   │   └── services/        # Services (cálculos puros)
│   ├── adapters/            # Adapter Layer (UI/Formato)
│   ├── css/                 # Estilos (CSS Variables)
│   └── js/                  # JS legado (referência)
├── tests/unit/              # Testes automatizados
│   ├── calculator.test.ts   # Suíte TS (43 testes)
│   └── calculator.test.js   # Suíte JS legado
├── docs/                    # Documentação técnica
├── tsconfig.json            # Configuração TypeScript (strict)
├── vite.config.ts           # Configuração Vite + Vitest
├── package.json             # Scripts e dependências
└── README.md                # Este documento
```

---

## Proteções contra Inputs Inválidos

O sistema implementa múltiplas camadas de validação:

| Proteção | Implementação | Camada |
|----------|---------------|--------|
| **Salário zero ou negativo** | `Money.isPositive()` retorna false → cálculo retorna zero | Service |
| **Salário acima de R$ 1M** | `ContratoTrabalho.validar()` rejeita com mensagem de erro | Entity |
| **Datas futuras inválidas** | `FormatAdapter.parseDate()` valida componentes da data | Adapter |
| **Período invertido** | `dataTermino < dataInicio` → validação rejeita | Entity |
| **Período > 50 anos** | Limite de 18.250 dias → proteção contra overflow | Entity |
| **Input não-numérico** | `FormatAdapter.parseMonetaryInput()` sanitiza e valida | Adapter |
| **IEEE 754 float errors** | `Money(Decimal.js)` — todas as operações em centavos | Value Object |
| **Tipo de rescisão inválido** | `Record<TipoRescisao, ...>` — TypeScript garante exaustividade | Type System |
| **Arredondamento** | `Decimal.ROUND_HALF_EVEN` (Banker's rounding) — norma contábil | Config |
| **XSS / Injection** | Input sanitizado: `replace(/[R$\s]/g, '')` antes de parse | Adapter |

---

## Roadmap (Futuras Melhorias)

* [ ] **Integração com API de cotação da TR em tempo real** (BCB/SGS API)
* [ ] **API de séries históricas do IPCA** (IBGE SIDRA)
* [ ] **Exportação de Relatórios em PDF** com resumo detalhado
* [ ] **PWA (Progressive Web App)** — Instalação offline e cache
* [ ] **Persistência de Histórico** — IndexedDB para simulações anteriores
* [ ] **Visualização Avançada** — Gráfico de evolução temporal do saldo
* [ ] **Cálculo de INSS** — Contribuição previdenciária sobre rescisão
* [ ] **i18n** — Suporte multilíngue para expansão

---

## Aviso Legal

Os cálculos fornecidos são **estimativas educativas** e servem como ferramenta de conscientização sobre direitos vigentes. Eles não substituem o cálculo oficial e recomenda-se sempre consultar um **advogado trabalhista** ou sindicato para validação legal.

---

## Documentação Técnica

Para detalhes sobre arquitetura de dados, regras de negócio CLT, segurança, acessibilidade e manutenibilidade, consulte a documentação técnica completa:

📄 **[Acessar Documentação Técnica (technical_doc.md)](docs/technical_doc.md)**

---

**Projeto de Extensão Universitária — UNINTER**
Curso de Engenharia de Software | v2.0.0 (TypeScript + DDD)