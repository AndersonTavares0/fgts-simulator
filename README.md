# Projeto FGTS: Simulador de Rescisão e FGTS

[![GitHub AndersonTavares0](https://img.shields.io/badge/GitHub-AndersonTavares0-181717?style=flat-square&logo=github)](https://github.com/AndersonTavares0)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Software Version](https://img.shields.io/badge/version-1.0.0--alpha-green?style=flat-square)](#)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=flat-square&logo=javascript&logoColor=black)

## Contexto Acadêmico
Este projeto foi desenvolvido como atividade de **Extensão Universitária** para o curso de **Engenharia de Software** do Centro Universitário Internacional **UNINTER**. O objetivo central é utilizar o desenvolvimento de software como instrumento de promoção da justiça social, focando na literacia financeira e na inclusão digital de trabalhadores regidos pela CLT.

## Descrição do Projeto
O sistema consiste em uma ferramenta de simulação trabalhista que permite ao usuário calcular estimativas de verbas rescisórias e saldo de FGTS de forma autônoma e ágil. A aplicação segue rigorosamente os princípios do **Desenho Universal**, eliminando barreiras tecnológicas para atender usuários com diferentes níveis de familiaridade digital.

### Funcionalidades Atuais (v1.0)
* **Cálculo Automatizado**: Processamento do tempo de contrato e saldo acumulado baseado em alíquotas oficiais.
* **Regras de Negócio CLT**: Aplicação da alíquota de 8% para depósitos mensais e cálculo da multa rescisória de 40%.
* **Gerenciamento de Temas**: Interface adaptável com suporte a Light e Dark Mode via variáveis CSS.
* **Privacidade e Segurança**: Processamento *client-side* que dispensa o cadastro de dados sensíveis ou armazenamento externo.

## Automação e Deploy (CI/CD)
O projeto utiliza **GitHub Actions** para gerenciar o ciclo de vida da aplicação. Atualmente, o workflow realiza o deploy automatizado para o **GitHub Pages** a partir da pasta `/src`.
* **Futuras Implementações de CI**: Planeja-se a integração de esteiras de teste (Continuous Integration) para validar a precisão dos cálculos matemáticos e a integridade da UI antes de cada publicação.

## Instalação e Uso
Como o projeto é uma SPA (Single Page Application) pura, não requer instaladores:
1. Clone o repositório: `git clone [https://github.com/AndersonTavares0/PROJETO-FGTS.git](https://github.com/AndersonTavares0/PROJETO-FGTS.git)`
2. Abra o arquivo `src/index.html` em qualquer navegador moderno.

## Estrutura do Repositório
```text
PROJETO-FGTS/
├── .github/
│   └── workflows/    # Automação para deploy via GitHub Actions.
├── .gitignore        # Definições de arquivos ignorados pelo Git.
├── LICENSE           # Licença MIT.
├── README.md         # Documentação técnica e acadêmica.
└── src/              # Código-fonte da aplicação funcional.
    ├── index.html    # Estrutura semântica e acessibilidade.
    ├── style.css     # Design responsivo e temas.
    └── script.js     # Lógica algorítmica das regras da CLT.
```

## Roadmap (Futuras Melhorias)
Este projeto é evolutivo e servirá como base para as próximas etapas da atividade extensionista:
* [ ] **Testes Automatizados (CI)**: Implementação de testes unitários para garantir a precisão das regras de negócio (CLT).
* [ ] **Refatoração para Frameworks**: Migração para React ou Vue.js para maior modularidade.
* [ ] **Persistência de Dados**: Implementação de Back-end para histórico de simulações.
* [ ] **Visualização Avançada**: Uso de bibliotecas gráficas (D3.js) para detalhamento de rendimentos.
* [ ] **Exportação de Relatórios**: Geração de documentos síntese em formato PDF.

## Aviso Legal
Os cálculos fornecidos são **estimativas educativas** e servem como ferramenta de conscientização sobre direitos vigentes. Eles não substituem o cálculo oficial e recomenda-se sempre consultar um **advogado trabalhista** ou sindicato para validação legal.