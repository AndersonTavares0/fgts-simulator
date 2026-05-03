# Projeto FGTS: Simulador de Rescisão e FGTS

[![GitHub AndersonTavares0](https://img.shields.io/badge/GitHub-AndersonTavares0-181717?style=flat-square&logo=github)](https://github.com/AndersonTavares0)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Software Version](https://img.shields.io/badge/version-1.0.0--alpha-green?style=flat-square)](#)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=flat-square&logo=javascript&logoColor=black)

## Contexto Acadêmico
Este projeto foi desenvolvido como atividade de **Extensão Universitária** para o curso de **Engenharia de Software** do Centro Universitário Internacional **UNINTER**. O objetivo é aplicar conceitos de desenvolvimento de software para solucionar problemas reais de literacia financeira e inclusão digital.

## Descrição do Projeto
O sistema consiste em uma ferramenta de simulação trabalhista que permite ao usuário calcular estimativas de verbas rescisórias e saldo de FGTS. A aplicação foca na privacidade e no **Desenho Universal**, garantindo que a interface seja operável por pessoas com diferentes níveis de habilidade tecnológica.

### Funcionalidades Atuais (v1.0)
*   **Cálculo Automatizado**: Processamento de meses trabalhados baseado em datas de início e término.
*   **Regras de Negócio CLT**: Aplicação de depósitos mensais (8%) e multa rescisória condicional (40%).
*   **Gerenciamento de Temas**: Suporte nativo a Light e Dark Mode via variáveis CSS e persistência em local storage.
*   **Acessibilidade**: Contraste otimizado e componentes amigáveis para tecnologias assistivas.

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
├── README.md         # Documentação técnica.
└── src/              # Código-fonte da aplicação funcional.
    ├── index.html    # Estrutura e semântica.
    ├── style.css     # Estilização e temas.
    └── script.js     # Lógica e cálculos em Vanilla JS.
```

## Roadmap (Futuras Melhorias)
Este projeto é evolutivo e servirá como base para estudos futuros durante o curso. Estão previstas as seguintes atualizações:
*   [ ] **Refatoração para Frameworks**: Migração do Vanilla JS para React ou Vue.js.
*   [ ] **Persistência de Dados**: Implementação de Back-end para salvar simulações (Node.js/Python).
*   [ ] **Gráficos Avançados**: Implementação de bibliotecas como D3.js ou Chart.js para visualização complexa.
*   [ ] **Módulo de Exportação**: Opção de gerar relatórios detalhados em PDF.

## Aviso Legal
Os cálculos fornecidos são **estimativas simplificadas** e não substituem o cálculo oficial realizado por profissionais competentes. Recomenda-se sempre consultar um **advogado trabalhista** ou sindicato para validação de direitos.
