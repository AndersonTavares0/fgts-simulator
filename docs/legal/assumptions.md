# Premissas do simulador

Este aplicativo produz estimativas informativas. Não é um extrato CAIXA, cálculo de folha completo, laudo ou parecer jurídico. Leve o relatório e seus comprovantes a advogado ou sindicato para avaliação.

## Depósitos e cenários

O salário informado é constante no período. Os depósitos são modelados por competência, proporcionalmente aos dias do contrato no mês, ao fim de cada competência. CLT e doméstico usam 8%; aprendizagem, 2%. Não reconstruímos salários anteriores, depósitos atrasados, saques, antecipações ou FGTS efetivamente recolhido sobre o 13º.

As taxas mensais de TR e IPCA são premissas informadas, constantes no período. Os valores iniciais são estimativas, não séries oficiais. O cenário TR soma a taxa mensal equivalente a 3% ao ano à TR mensal informada. O cenário IPCA é uma comparação econômica. Não somamos TR e IPCA nem escolhemos automaticamente o maior como se fosse um crédito judicial.

O gráfico representa saldo acumulado da conta simulada. Não inclui multa, férias ou 13º. Indisponibilidade de saque não elimina saldo: o resumo mostra saldo disponível e retido separadamente. Resultado, série, relatório e histórico usam a mesma simulação e política de arredondamento Decimal/Money.

## Verbas selecionadas

Informe separadamente os avos ainda não pagos de 13º e de férias (0 a 12). Eles não são a duração total do contrato. O usuário deve conferir o ano civil do 13º, o período aquisitivo de férias, pagamentos e afastamentos. Férias proporcionais incluem 1/3. O aplicativo não calcula férias vencidas, aviso prévio, IRRF nem o líquido integral da rescisão.

A multa é estimada pela hipótese apresentada no relatório. Para conhecer a base efetiva, confira depósitos atualizados e os eventos do extrato: a distribuição de resultados possui tratamento próprio. Domésticos têm reserva mensal de indenização de 3,2%, separada da multa padrão; culpa recíproca usa interpretação analógica indicada pelo motor. Não há garantia individual de direito ao saque.

## ADI 5090

A decisão mantém TR + 3% ao ano e distribuição de resultados. Quando a remuneração anual não alcançar o IPCA, cabe ao Conselho Curador determinar a compensação. Sua eficácia é prospectiva, a partir da publicação da ata em 17/06/2024. Uma comparação mensal TR/IPCA não reproduz esse procedimento nem determina diferenças retroativas recuperáveis.

O modelo não inclui distribuição de resultados efetivamente creditada nem eventual compensação anual. Usar índices oficiais sem depósitos e eventos reais também não transforma uma simulação em extrato oficial.

## Fontes

- [STF: resumo da ADI 5090](https://www.stf.jus.br/arquivo/cms/noticiaNoticiaStf/anexo/ADI5090Infoasociedade.pdf)
- [STF: ARE 1.569.824 AgR](https://redir.stf.jus.br/paginadorpub/paginador.jsp?docID=792781594&docTP=TP)
- [Lei 8.036/1990](https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm)
- [Lei 4.090/1962](https://www.planalto.gov.br/ccivil_03/leis/l4090.htm)
- [CAIXA: distribuição de resultados](https://www.fgts.gov.br/Paginas/trabalhador/distribuicao-de-resultados-do-fgts.aspx)
- [IBGE: IPCA, tabela 1737](https://sidra.ibge.gov.br/tabela/1737)

Alterar fórmula, calendário ou arredondamento exige nova versão de cálculo. Simulações salvas não são recalculadas automaticamente.
