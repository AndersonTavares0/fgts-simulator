# Premissas do simulador

Este aplicativo produz estimativas informativas. Não é um extrato CAIXA, cálculo de folha completo, laudo ou parecer jurídico. Leve o relatório e seus comprovantes a advogado ou sindicato para avaliação.

## Depósitos e cenários

O salário informado é constante no período. Os depósitos são modelados por competência, proporcionalmente aos dias do contrato no mês, ao fim de cada competência. CLT e doméstico usam 8%; aprendizagem, 2%. Não reconstruímos salários anteriores, depósitos atrasados, saques nem o FGTS efetivamente recolhido.

O FGTS sobre 13º tem dois modos, independentes dos avos de verbas rescisórias: na estimativa padrão, calcula-se o 13º pelo salário fixo, considerando um avo por mês civil com pelo menos 15 dias. Quando novembro e dezembro estão no período, o valor é dividido entre essas competências; em término antecipado, inclui-se o proporcional apenas nas rescisões distintas de justa causa. Doença grave e aposentadoria não presumem término em ano incompleto. No modo avançado, informam-se as remunerações brutas de 13º efetivamente pagas por competência dentro do período; parcelas do mesmo mês são somadas. Sobre essas bases aplicam-se 8% para CLT/doméstico ou 2% para aprendiz e, para doméstico, também 3,2% de reserva.

O crédito é aproximado ao fim da competência. Em períodos encerrados antes de dezembro, o adiantamento pode não aparecer; a estimativa não reproduz adiantamentos em outros meses, atrasos ou distribuição de lucros. Valores reais de remuneração não comprovam depósitos efetuados e não reconstituem índices históricos nem extrato. A [Nota Orientativa FGTS Digital nº 11/2025](https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/manual-e-documentacao-tecnica/nota-orientativa-fd-11-2025-13-e-rescisao.pdf) descreve prazos e ajustes efetivos de 13º, inclusive na rescisão, que não são reproduzidos por esse calendário simplificado.

A reserva doméstica de 3,2% é corrigida pela mesma série do saldo (no cenário padrão, TR + 3% efetivo ao ano), como estimativa. No acordo comum, o [eSocial orienta a liberação de metade da reserva ao trabalhador](https://www.gov.br/esocial/pt-br/empregador-domestico/orientacoes/saque-fgts).

As taxas mensais de TR e IPCA são premissas informadas, constantes no período. Os valores iniciais (0,16% e 0,37% ao mês) são exemplos de novembro de 2026, não séries oficiais. O cenário TR soma a taxa mensal equivalente a 3% ao ano à TR mensal informada, tratando os 3% como taxa efetiva anual. Essa soma simplificada não reproduz necessariamente a combinação histórica oficial de TR e juros. O cenário IPCA é uma comparação econômica. Não somamos TR e IPCA nem escolhemos automaticamente o maior como se fosse um crédito judicial.

O gráfico representa saldo acumulado da conta simulada, incluindo FGTS sobre 13º quando modelado. Não inclui multa, férias ou verba rescisória de 13º. Indisponibilidade de saque não elimina saldo: o resumo mostra saldo disponível e retido separadamente. Resultado, série, relatório e histórico usam a mesma simulação e política de arredondamento Decimal/Money.

## Verbas selecionadas

Informe separadamente os avos ainda não pagos de 13º e de férias (0 a 12). Eles não são a duração total do contrato. O usuário deve conferir o ano civil do 13º, o período aquisitivo de férias, pagamentos e afastamentos. Férias proporcionais incluem 1/3. O aplicativo não calcula férias vencidas, aviso prévio, rescisão indireta, força maior, término de contrato a termo, IRRF nem o líquido integral da rescisão.

Na justa causa, 13º e férias proporcionais não são devidos (Súmula 171/TST; CLT, art. 146, parágrafo único); o app zera essas verbas mesmo que tenham sido marcadas. Doença grave é hipótese de saque, não causa de rescisão: o saldo é liberado, mas 13º e férias não entram nesse cenário. Aposentadoria não encerra o contrato automaticamente; as verbas proporcionais só existem se houver rescisão. Falecimento encerra o vínculo e permite as verbas cabíveis aos sucessores.

A multa é estimada pela hipótese apresentada no relatório. Para conhecer a base efetiva, confira depósitos atualizados e os eventos do extrato: a distribuição de resultados possui tratamento próprio. Domésticos têm reserva mensal de indenização de 3,2%, separada da multa padrão e corrigida como FGTS; a culpa recíproca libera metade ao empregado (LC 150/2015, art. 22, §2º). Não há garantia individual de direito ao saque.

Valores são brutos. O app não retém IRRF nem INSS: o 13º é tributável, as férias rescisórias com 1/3 são isentas de IRRF e não sofrem INSS, e a multa do FGTS não é retida na fonte. O saque-aniversário bloqueia o saldo da dispensa e do acordo, mas preserva a multa e as hipóteses do art. 20, III, IV, XI, XIII, XIV, XV, XVI, XVIII e XXII da Lei 8.036; o app modela apenas doença grave, aposentadoria e falecimento. A regra extraordinária da MP 1.331/2025 perdeu eficácia em 01/06/2026 e não é simulada.

## ADI 5090

A decisão mantém TR + 3% ao ano e distribuição de resultados. Quando a remuneração anual não alcançar o IPCA, cabe ao Conselho Curador determinar a compensação. Sua eficácia é prospectiva, a partir da publicação da ata em 17/06/2024. Uma comparação mensal TR/IPCA não reproduz esse procedimento nem determina diferenças retroativas recuperáveis.

O modelo não inclui distribuição de resultados efetivamente creditada nem eventual compensação anual. Usar índices oficiais sem depósitos e eventos reais também não transforma uma simulação em extrato oficial.

## Fontes

- [STF: resumo da ADI 5090](https://www.stf.jus.br/arquivo/cms/noticiaNoticiaStf/anexo/ADI5090Infoasociedade.pdf)
- [STF: ARE 1.569.824 AgR](https://redir.stf.jus.br/paginadorpub/paginador.jsp?docID=792781594&docTP=TP)
- [LC 150/2015](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm)
- [eSocial: saque de FGTS do empregado doméstico](https://www.gov.br/esocial/pt-br/empregador-domestico/orientacoes/saque-fgts)
- [MTE: Nota Orientativa FGTS Digital nº 11/2025](https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/manual-e-documentacao-tecnica/nota-orientativa-fd-11-2025-13-e-rescisao.pdf)
- [CLT](https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm)
- [Lei 13.932/2019](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/L13932.htm)
- [Portaria MPS/MF 13/2026](https://www.in.gov.br/web/dou/-/portaria-interministerial-mps/mf-n-13-de-9-de-janeiro-de-2026-680382603)
- [Lei 8.036/1990](https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm)
- [Lei 4.090/1962](https://www.planalto.gov.br/ccivil_03/leis/l4090.htm)
- [CAIXA: distribuição de resultados](https://www.fgts.gov.br/Paginas/trabalhador/distribuicao-de-resultados-do-fgts.aspx)
- [IBGE: IPCA, tabela 1737](https://sidra.ibge.gov.br/tabela/1737)

Alterar fórmula, calendário ou arredondamento exige nova versão de cálculo. Simulações salvas não são recalculadas automaticamente.
