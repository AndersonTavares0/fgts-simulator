# Simulador FGTS

Simule o saldo do FGTS e parcelas trabalhistas, compare cenários salvos no navegador e baixe um relatório para discutir com advogado ou sindicato.

**[Abrir o simulador](https://andersontavares0.github.io/fgts-simulator/)** · [Premissas financeiras](docs/legal/assumptions.md) · [Privacidade](docs/legal/privacy.md)

Os resultados são estimativas. O aplicativo não consulta seu extrato CAIXA, não apura uma rescisão completa e não garante valores devidos ou direito de saque. A comparação com IPCA não calcula crédito judicial retroativo.

## Funcionalidades

- Contratos CLT, aprendizagem e doméstico; modalidades de saída e saque-aniversário.
- Avos ainda não pagos de 13º e férias informados separadamente da duração do contrato.
- FGTS sobre 13º: estimativa padrão pelo salário fixo ou remunerações brutas reais por competência em **Mais opções**, sem confundir com as verbas rescisórias.
- Evolução mensal do saldo: depósitos, cenário TR + 3% a.a. e comparação pelo IPCA, com tabela acessível.
- Histórico opcional em IndexedDB: reabrir, comparar duas simulações e excluir registros.
- Relatório **PDF** monocromático (A4) gerado no próprio app: total, grupos FGTS/rescisão, dados contratuais, memória de cálculo, premissas, avisos e série mensal. Funciona offline.
- PWA instalável nos navegadores compatíveis, com cálculo, gráfico, histórico e PDF offline após a preparação inicial.
- Interface responsiva, temas claro/escuro e fontes locais.

No modo estimado, cada mês civil com ao menos 15 dias conta um avo. Quando novembro e dezembro estão no período, o 13º estimado é dividido entre esses meses; nas rescisões cabíveis, estima-se o proporcional no término antecipado. Doença grave e aposentadoria não presumem término em ano incompleto. O crédito é situado no fim da competência; em períodos encerrados antes de dezembro o adiantamento pode não aparecer, e atrasos e distribuição de lucros ficam fora do modelo. No modo real, parcelas de 13º pagas no mesmo mês são somadas. Informar remunerações reais não comprova depósitos e não reproduz índices históricos ou extrato. Veja a [Nota FGTS Digital nº 11/2025](https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/manual-e-documentacao-tecnica/nota-orientativa-fd-11-2025-13-e-rescisao.pdf) e a orientação do [eSocial doméstico](https://www.gov.br/esocial/pt-br/empregador-domestico/orientacoes/saque-fgts).

O cenário padrão soma TR mensal à taxa mensal equivalente a 3% efetivos ao ano; essa simplificação não reproduz necessariamente a combinação histórica oficial. Históricos antigos foram mantidos e não são recalculados automaticamente.

## Uso e armazenamento

Preencha o contrato e escolha **Calcular**, ou clique em **Usar exemplo** para preencher e calcular um caso fictício sem salvar nada. Parcelas e taxas ficam em seções expansíveis. No celular, alterne entre **Dados** e **Resultado**; **Histórico** e **Ajuda** são áreas separadas, não seções de uma página longa. Alterar as entradas invalida as ações do resultado anterior até novo cálculo. **Salvar simulação** é uma decisão explícita; não registramos cada edição.

O histórico fica neste navegador/dispositivo, sem conta ou sincronização. Limpeza de dados, sessão privada ou políticas do navegador podem removê-lo. Não é backup. A modalidade de doença grave exige consentimento de cálculo e uma autorização separada para salvar. Excluir o histórico não apaga PDFs já baixados.

Para usar offline, abra o aplicativo com internet e aguarde a indicação de disponibilidade. Instalação depende do navegador; no iOS, use Compartilhar → Adicionar à Tela de Início. Não há primeira instalação sem conexão. Quando houver atualização, conclua/salve o trabalho e feche todas as abas do simulador antes de reabrir. Não forçamos recarga dos formulários.

## Desenvolvimento

Use **Node.js 24 LTS e npm 11**. O limite técnico declarado é Node 22.12 ou posterior; CI usa Node 24.

```sh
npm ci
npm run dev
```

Abra a URL exibida pelo Vite, incluindo `/fgts-simulator/`. Configurações de publicação usam esse subdiretório do Pages.

```sh
npm run typecheck
npm test
npm run lint
npm run build
npm run preview
```

`npm run test:coverage` executa a cobertura; `npm run format` aplica Prettier. As opções do formatador ficam em `package.json`, sem `.prettierrc` separado.

## Arquitetura

**React 19 + TypeScript + Vite**, **Tailwind CSS v4**, **shadcn/ui + Radix** e **Heroicons**, sem backend. `decimal.js`/`Money` preservam precisão em centavos; `idb` gerencia IndexedDB, jsPDF gera o relatório e `vite-plugin-pwa` prepara os arquivos offline. O PDF é carregado sob demanda.

```text
src/core/          regras financeiras e Money
src/application/   simulação validada e snapshot compartilhado
src/ui/            componentes React: formulário, resultado, gráfico, histórico e ajuda
src/adapters/      formatação, histórico e PDF
src/styles/        tokens e camadas Tailwind
src/pwa/           hook de instalação e atualização
public/            fontes e ícones locais
index.html         entrada do Vite (somente #root)
tests/             contratos financeiros e persistência
.github/           CI, releases e regras declarativas
```

Tela, gráfico, PDF e histórico consomem a mesma simulação. Um registro preserva suas premissas e versão de cálculo; atualizar o aplicativo não recalcula o passado. Consulte [arquitetura](docs/architecture.md) e [desenvolvimento](docs/development.md).

## Contribuição e releases

Use branches curtas e PR para `main`. Tipos, testes, lint e build devem passar; o deploy não pode ignorar falhas. O fluxo individual mantém zero aprovações obrigatórias, sem dispensar CI. Configurar o check obrigatório remoto exige que o novo workflow já esteja publicado e tenha executado: veja [governança e releases](docs/releases.md).

Publicação é deliberada, separada de cada push na `main`. O fluxo guarda o pacote compilado, SHA e checksum antes de implantar; rollback usa os mesmos arquivos, não uma recompilação presumidamente idêntica. Detalhes operacionais, permissões e recuperação estão em [releases](docs/releases.md).

Reporte problemas sem anexar salários, datas pessoais, extratos ou PDFs sensíveis em issues públicas. Para vulnerabilidades, veja [SECURITY.md](SECURITY.md).

## Contexto acadêmico e licença

Projeto de extensão universitária de Engenharia de Software da UNINTER, voltado à educação financeira trabalhista. Preserve atribuição acadêmica; não apresente o trabalho de terceiros como autoria própria.

Código sob [licença MIT](LICENSE). Documentos em `docs/archive/` registram versões anteriores; não descrevem o comportamento atual.
