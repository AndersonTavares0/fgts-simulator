# Premissas do simulador

Este aplicativo produz estimativas informativas. Não é um extrato CAIXA, cálculo de folha completo, laudo ou parecer jurídico. Leve o relatório e seus comprovantes a advogado ou sindicato para avaliação.

## Depósitos e cenários

O salário informado é constante no período. Os depósitos são modelados por competência, proporcionalmente aos dias do contrato no mês, ao fim de cada competência. CLT e doméstico usam 8%; aprendizagem, 2%. Não reconstruímos salários anteriores, depósitos atrasados, saques nem o FGTS efetivamente recolhido.

O FGTS sobre 13º tem dois modos, independentes dos avos de verbas rescisórias: na estimativa padrão, calcula-se o 13º pelo salário fixo, considerando um avo por mês civil com pelo menos 15 dias. Quando novembro e dezembro estão no período, o valor é dividido entre essas competências; em término antecipado, inclui-se o proporcional apenas nas rescisões distintas de justa causa. Doença grave e aposentadoria não presumem término em ano incompleto. No modo avançado, informam-se as remunerações brutas de 13º efetivamente pagas por competência dentro do período; parcelas do mesmo mês são somadas. Sobre essas bases aplicam-se 8% para CLT/doméstico ou 2% para aprendiz e, para doméstico, também 3,2% de reserva.

O crédito é aproximado ao fim da competência. Em períodos encerrados antes de dezembro, o adiantamento pode não aparecer; a estimativa não reproduz adiantamentos em outros meses, atrasos ou distribuição de lucros. Valores reais de remuneração não comprovam depósitos efetuados e não reconstituem índices históricos nem extrato. A [Nota Orientativa FGTS Digital nº 11/2025](https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/manual-e-documentacao-tecnica/nota-orientativa-fd-11-2025-13-e-rescisao.pdf) descreve prazos e ajustes efetivos de 13º, inclusive na rescisão, que não são reproduzidos por esse calendário simplificado.

A reserva doméstica de 3,2% é corrigida pela mesma série do saldo (no cenário padrão, TR + 3% efetivo ao ano), como estimativa. No acordo comum, o [eSocial orienta a liberação de metade da reserva ao trabalhador](https://www.gov.br/esocial/pt-br/empregador-domestico/orientacoes/saque-fgts).

As taxas mensais de TR e IPCA são premissas informadas, constantes no período. Os valores iniciais (0,16% e 0,37% ao mês) são exemplos de novembro de 2026, não séries oficiais. O cenário TR soma a taxa mensal equivalente a 3% ao ano à TR mensal informada, tratando os 3% como taxa efetiva anual. Essa soma simplificada não reproduz necessariamente a combinação histórica oficial de TR e juros. O cenário IPCA é uma comparação econômica. Não somamos TR e IPCA nem escolhemos automaticamente o maior como se fosse um crédito judicial.

O gráfico representa saldo acumulado da conta simulada, incluindo FGTS sobre 13º quando modelado. Não inclui multa, férias ou verba rescisória de 13º. Indisponibilidade de saque não elimina saldo: o resumo mostra saldo disponível e retido separadamente. Resultado, série, relatório e histórico usam a mesma simulação e política de arredondamento Decimal/Money.

## Limites de entrada

Datas: a data de início deve ser 01/01/1967 ou posterior. O FGTS foi criado pela [Lei 5.107/1966](https://www2.camara.leg.br/legin/fed/lei/1960-1969/lei-5107-13-setembro-1966-368498-norma-pl.html) e começou a valer em 01/01/1967 ([Decreto 59.820/1966](https://www.planalto.gov.br/ccivil_03/decreto/1950-1969/d59820.htm)); não há depósito anterior. O período vai até 60 anos, que cobre toda a história do FGTS; é um limite do simulador, não da lei.

Antes de 01/02/1991 a correção do FGTS não usava a TR ([Lei 8.177/1991](https://www.planalto.gov.br/ccivil_03/leis/L8177.htm)), e quem optou antes de 22/09/1971 pode ter juros progressivos de 3% a 6% ao ano (Lei 5.107/1966, mantidos pela [Lei 8.036/1990](https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm), art. 13). O simulador usa só as regras atuais (TR + 3%): para início anterior a 1991 o resultado é uma referência, e a tela avisa isso.

Salário: até R$ 10.000.000,00 por mês. Esse limite não vem de lei: o depósito é 8% (2% para aprendiz) da remuneração paga ou devida (Lei 8.036, art. 15), sem teto. Ele existe para evitar erros de digitação. A estimativa é linear no salário; quem recebe mais pode simular com metade e dobrar o resultado, salvo diferença de arredondamento de centavos.

Alterar esses limites não muda fórmula, mas muda o que a validação aceita: mantenha `src/core/limites.ts` como fonte única e os testes de fronteira.

## Verbas selecionadas

Informe separadamente os avos ainda não pagos de 13º e de férias (0 a 12). Eles não são a duração total do contrato. O usuário deve conferir o ano civil do 13º, o período aquisitivo de férias, pagamentos e afastamentos. Férias proporcionais incluem 1/3. O aplicativo não calcula férias vencidas, aviso prévio, rescisão indireta, força maior, término de contrato a termo, IRRF nem o líquido integral da rescisão.

Na justa causa, 13º e férias proporcionais não são devidos (Súmula 171/TST; CLT, art. 146, parágrafo único); o app zera essas verbas mesmo que tenham sido marcadas. Doença grave é hipótese de saque, não causa de rescisão: o saldo é liberado, mas 13º e férias não entram nesse cenário. Aposentadoria não encerra o contrato automaticamente; as verbas proporcionais só existem se houver rescisão. Falecimento encerra o vínculo e permite as verbas cabíveis aos sucessores.

A multa é estimada pela hipótese apresentada no relatório. Para conhecer a base efetiva, confira depósitos atualizados e os eventos do extrato: a distribuição de resultados possui tratamento próprio. Domésticos têm reserva mensal de indenização de 3,2%, separada da multa padrão e corrigida como FGTS; a culpa recíproca libera metade ao empregado (LC 150/2015, art. 22, §2º). Não há garantia individual de direito ao saque.

Valores são brutos. O app não retém IRRF nem INSS: o 13º é tributável, as férias rescisórias com 1/3 são isentas de IRRF e não sofrem INSS, e a multa do FGTS não é retida na fonte. O saque-aniversário bloqueia o saldo da dispensa e do acordo, mas preserva a multa e as hipóteses do art. 20, III, IV, XI, XIII, XIV, XV, XVI, XVIII e XXII da Lei 8.036; o app modela apenas doença grave, aposentadoria e falecimento. A regra extraordinária da MP 1.331/2025 perdeu eficácia em 01/06/2026 e não é simulada.

## ADI 5090

Em 18/02/2026 o STF reafirmou a tese no ARE 1.573.884 (Tema 1.444, rel. Min. Fachin, Plenário Virtual, unânime): a fórmula TR + 3% ao ano + distribuição de resultados é constitucional se o órgão gestor assegurar, no mínimo, correção equivalente à inflação oficial; não se aplica retroativamente e não autoriza trocar a TR pelo IPCA isoladamente. Por isso o cenário IPCA deste app é só comparação.

A decisão mantém TR + 3% ao ano e distribuição de resultados. Quando a remuneração anual não alcançar o IPCA, cabe ao Conselho Curador determinar a compensação. Sua eficácia é prospectiva, a partir da publicação da ata em 17/06/2024. Uma comparação mensal TR/IPCA não reproduz esse procedimento nem determina diferenças retroativas recuperáveis.

O modelo não inclui distribuição de resultados efetivamente creditada nem eventual compensação anual. Usar índices oficiais sem depósitos e eventos reais também não transforma uma simulação em extrato oficial.

## Conferência de 13/11/2026

Revisão do código e destas premissas contra as fontes abaixo, sem alterar nenhuma fórmula: multa de 40% e 20% (Lei 8.036, art. 18, §§ 1º e 2º), alíquotas de 8% e 2% (arts. 15 e 15, §7º), incisos III, IV, XI, XIII, XIV, XV, XVI, XVIII e XXII do art. 20, saque-aniversário (arts. 20-A a 20-D, com multa preservada na dispensa) e a tabela de faixas da Lei 13.932/2019. A culpa recíproca (20%) depende de reconhecimento pela Justiça do Trabalho (art. 18, §2º); o app a oferece como hipótese. As taxas iniciais são só exemplos: no Banco Central (SGS 226 e 433) a TR estava em cerca de 0,169% ao mês em 12/11/2026, e o IPCA mensal de jul a out/2026 foi 0,07%, −0,32%, 0,82% e 0,14%. O padrão de IPCA do app (0,37%) está acima dessa média recente; ajuste-o ao período simulado. Antecipação do saque-aniversário (Res. CCFGTS 1.130/2025: 3 saques e R$ 1.500 a partir de 01/11/2026) não é simulada. A MP 1.331/2025 (saque de saldo bloqueado de demitidos de 2020 a 23/12/2025) perdeu eficácia em 01/06/2026, conforme noticiado; confirme no Diário Oficial antes de relatar a um usuário.

## Fontes

- [STF: Tema 1.444, ARE 1.573.884 (18/02/2026)](https://noticias.stf.jus.br/postsnoticias/saldos-do-fgts-devem-ser-corrigidos-no-minimo-pelo-indice-da-inflacao-reafirma-stf/)
- [Banco Central: SGS 226 (TR) e 433 (IPCA)](https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/4?formato=json)

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
