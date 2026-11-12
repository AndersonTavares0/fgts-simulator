# Alterações

## 2.1.0

- FGTS sobre 13º passa a oferecer estimativa por salário fixo ou remunerações brutas reais por competência; valores informados não comprovam recolhimento nem reproduzem índices históricos. O calendário simplificado divide o 13º entre novembro e dezembro quando ambos estão no período e estima o proporcional nas rescisões cabíveis; adiantamentos anteriores, atrasos e lucros não são reproduzidos.
- Preservados históricos anteriores sem recálculo; reabrir para novo cálculo usa a regra atual. TR soma a taxa mensal equivalente a 3% efetivos ao ano, aproximação que não necessariamente reproduz a combinação histórica oficial.
- Interface responsiva reorganizada em simulação, histórico e metodologia.
- Interface migrada para React 19 + TypeScript, Tailwind CSS v4, Recharts e lucide-react; gráfico e PDF carregam sob demanda.
- Área de trabalho compacta: histórico e ajuda separados, detalhes recolhidos, alternância Dados/Resultado no celular e botão Usar exemplo sem salvamento automático.
- Série temporal comparativa TR + 3%/IPCA, com dados equivalentes em tabela.
- Histórico local opcional e comparação de simulações com versões preservadas.
- Relatório PDF reformulado: cabeçalho com identificação, resumo em destaque, faixa de três saldos, dados do contrato em duas colunas, composição com total enfatizado e evolução mensal em tabela zebrada com cabeçalho repetido.
- Impressão do site mostra apenas resumo e gráfico, sem formulário, em uma página.
- PWA com recursos offline e atualização sem recarga forçada.
- Avos de 13º/férias informados separadamente da duração do contrato; cenários TR/IPCA explícitos, sem apresentação do máximo mensal como cumprimento da ADI 5090.
- Correções legais: reserva doméstica de 3,2% corrigida como FGTS; acordo doméstico libera metade da reserva; justa causa e doença grave não somam 13º/férias; avisos fiscais e de hipóteses de saque.
- Organização de arquivos, privacidade, CI bloqueante e publicação recuperável.
- Paleta verde discreta nos temas claro/escuro, sincronização de `theme-color`, cabeçalho sem overflow a 320 px, auditoria semanal de CVEs e atualização do lockfile para corrigir vulnerabilidades npm altas/críticas identificadas.

As séries usam premissas estimadas, não um extrato oficial ou apuração integral do passivo trabalhista. Publicação de código/workflow e ativação do check remoto são etapas operacionais separadas da edição local.
