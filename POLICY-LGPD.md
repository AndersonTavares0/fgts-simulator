# Política de Privacidade — Simulador FGTS

**Última atualização:** Maio de 2026
**Em conformidade com:** Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)

---

## 1. Identificação do Controlador

**Responsável:** Anderson Tavares
**Projeto:** Simulador de FGTS e Rescisão Trabalhista
**Contexto:** Projeto de Extensão Universitária — UNINTER (Curso de Engenharia de Software)
**Contato:** [Repositório GitHub](https://github.com/AndersonTavares0/Projeto-FGTS)

---

## 2. Dados Coletados e Finalidade

Este simulador processa os seguintes dados **exclusivamente para fins de cálculo educativo**:

| Dado | Categoria | Finalidade | Base Legal |
|------|-----------|------------|------------|
| Salário bruto | Dados pessoais | Cálculo de depósitos FGTS e verbas rescisórias | Consentimento (Art. 7, I) |
| Data de início do contrato | Dados pessoais | Cálculo de meses trabalhados | Consentimento (Art. 7, I) |
| Data de término do contrato | Dados pessoais | Cálculo de meses trabalhados | Consentimento (Art. 7, I) |
| Motivo da rescisão | Dados pessoais | Aplicação da multa rescisória correta | Consentimento (Art. 7, I) |
| Tipo de contrato (CLT/Aprendiz/Doméstico) | Dados pessoais | Definição da alíquota FGTS | Consentimento (Art. 7, I) |
| Opção Saque-Aniversário | Dados pessoais | Cálculo de impacto na rescisão | Consentimento (Art. 7, I) |
| **Doença grave (saúde)** | **Dado sensível** (Art. 5, II) | Liberação de 100% do saldo FGTS | **Consentimento específico** (Art. 11, I) |

### 2.1 Dados Sensíveis

A opção "Doença Grave" envolve o tratamento de **dados sensíveis de saúde**, nos termos do Art. 5, II da LGPD. O tratamento desses dados:

- Requer **consentimento explícito e específico** do titular (Art. 11, I)
- É realizado **exclusivamente no navegador** do usuário
- Não é armazenado, transmitido ou compartilhado com terceiros
- Pode ser **revogado a qualquer momento** (basta desmarcar a opção ou fechar a página)

---

## 3. Processamento de Dados

### 3.1 Arquitetura Client-Side

**Todos os cálculos são realizados exclusivamente no navegador do usuário (client-side).**

- **Nenhum dado é enviado** para servidores externos
- **Nenhum dado é armazenado** em banco de dados ou nuvem
- **Não há backend, API ou serviço de terceiros** que processe dados pessoais
- Após o fechamento da página, os dados de simulação são **descartados automaticamente**

### 3.2 Armazenamento Mínimo

A única persistência realizada é:

| Dado | Tecnologia | Finalidade | Duração |
|------|-----------|------------|---------|
| Preferência de tema (claro/escuro) | `localStorage` | Experiência do usuário | Até limpeza pelo usuário |

**Não são utilizados:**
- Cookies de rastreamento
- Analytics ou métricas de uso
- Pixels de rastreamento
- Serviços de publicidade

---

## 4. Base Legal para o Tratamento

| Finalidade | Base Legal (LGPD) |
|------------|-------------------|
| Simulação de FGTS e rescisão | Consentimento do titular (Art. 7, I) |
| Dados de saúde (doença grave) | Consentimento específico (Art. 11, I) |
| Preferência de tema | Legítimo interesse (Art. 7, IX) |

---

## 5. Direitos do Titular (Art. 18)

Você tem os seguintes direitos em relação aos seus dados pessoais:

| Direito | Descrição | Como exercer |
|---------|-----------|--------------|
| **Confirmação** | Confirmar a existência de tratamento | Inerente ao uso — todos os dados são visíveis na tela |
| **Acesso** | Acessar seus dados tratados | Os dados estão visíveis no formulário durante o uso |
| **Correção** | Corrigir dados incompletos ou desatualizados | Edite diretamente no formulário |
| **Eliminação** | Solicitar a exclusão dos dados | Feche a página — nenhum dado é armazenado em servidor |
| **Portabilidade** | Transferir dados a outro serviço | Não aplicável (dados não são armazenados) |
| **Revogação** | Revogar o consentimento | Desmarque as opções ou feche a página |

### 5.1 Revogação do Consentimento

O consentimento pode ser revogado a qualquer momento:

- **Dados de simulação:** Basta fechar a aba/navegador — nenhum dado persiste
- **Dados de saúde:** Desmarque a opção "Doença Grave" ou o checkbox de consentimento
- **Preferência de tema:** Limpe o `localStorage` do navegador

---

## 6. Segurança

A arquitetura do sistema oferece proteções inerentes:

- **Processamento local:** Elimina riscos de vazamento em transmissão
- **Sem backend:** Não há servidor ou banco de dados que possa ser comprometido
- **Sem terceiros:** Nenhum serviço externo recebe dados do usuário
- **Sanitização de inputs:** Todos os dados de entrada são validados e sanitizados
- **TypeScript strict:** Previne vulnerabilidades comuns em tempo de compilação

---

## 7. Compartilhamento de Dados

**Este simulador não compartilha dados pessoais com terceiros.**

Não há:
- Integração com APIs externas que recebam dados pessoais
- Serviços de analytics ou rastreamento
- Redes sociais ou pixels de conversão
- Serviços de publicidade

---

## 8. Cookies e Tecnologias Similares

| Tecnologia | Utilizada? | Finalidade |
|------------|-----------|------------|
| `localStorage` | Sim | Preferência de tema (claro/escuro) |
| `sessionStorage` | Não | — |
| Cookies | Não | — |
| Cookies de rastreamento | Não | — |
| IndexedDB | Não | — |

---

## 9. Retenção de Dados

| Tipo de Dado | Retenção |
|--------------|----------|
| Dados de simulação (salário, datas, etc.) | **Temporária** — descartados ao fechar a página |
| Preferência de tema | **Persistente** — até o usuário limpar o `localStorage` |
| Dados de saúde | **Temporária** — descartados ao desmarcar a opção ou fechar a página |

---

## 10. Alterações nesta Política

Esta política pode ser atualizada para refletir mudanças no projeto ou na legislação. A data da última atualização será sempre indicada no topo deste documento.

---

## 11. Contato

Para questões sobre privacidade, tratamento de dados ou exercício de direitos:

- **GitHub:** [AndersonTavares0/Projeto-FGTS](https://github.com/AndersonTavares0/Projeto-FGTS)
- **Contexto:** Projeto acadêmico de Extensão Universitária — UNINTER

---

## 12. Referências Legais

- **Lei nº 13.709/2018** — Lei Geral de Proteção de Dados Pessoais (LGPD)
- **Lei nº 8.036/1990** — Lei do FGTS
- **Consolidação das Leis do Trabalho (CLT)** — Decreto-Lei nº 5.452/1943
- **ADI 5090 (STF)** — Correção monetária do FGTS

---

*Este documento foi elaborado em conformidade com a Lei Geral de Proteção de Dados (LGPD) e reflete as práticas atuais do projeto.*
