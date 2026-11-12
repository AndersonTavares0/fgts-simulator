# Alterações

## 2.1.0-beta.2 (beta)

- Gráfico cobre as duas séries: quando o IPCA supera a TR, a linha de referência e o eixo deixam de sair da área; o eixo passa a acompanhar o cenário selecionado.
- Atualização do PWA: o rodapé oferece **Atualizar agora** e ativa a versão baixada sem recarregar formulário pendente. Recarregar a página sozinho não aplicava a versão nova.
- Histórico: um registro inválido ou de outra versão deixou de esconder os válidos; a tela informa quantos ficaram fora da lista e nada é apagado. Corrigida a abertura que ficava pendente quando outra aba pedia migração do banco.
- Datas iguais no início e no fim passam a ser recusadas com a mesma regra e a mesma mensagem do cálculo, no campo correspondente.
- Contraste: série IPCA de 2,64 para 4,13:1 no tema claro; bordas de campo de 1,38 para 3,31:1 no claro e de 2,05 para 3,49:1 no escuro.
- CSP por meta tag no build, com hash do script de tema; o modo de desenvolvimento continua sem a regra.
- Cache offline de 21 para 12 entradas: dependências do `html()` do jsPDF não são mais baixadas na instalação; PDF e uso offline continuam funcionando.
- Formatação de moeda com uma única implementação para tela, gráfico, histórico e PDF; a comparação não exibe mais o formato interno do registro.
- Notas da 2.1.0-beta.1 corrigidas: a interface usa Heroicons e SVG local, não Recharts nem lucide-react.

## 2.1.0-beta.1 (beta)

- FGTS sobre 13º passa a oferecer estimativa por salário fixo ou remunerações brutas reais por competência; valores informados não comprovam recolhimento nem reproduzem índices históricos. O calendário simplificado divide o 13º entre novembro e dezembro quando ambos estão no período e estima o proporcional nas rescisões cabíveis; adiantamentos anteriores, atrasos e lucros não são reproduzidos.
- Preservados históricos anteriores sem recálculo; reabrir para novo cálculo usa a regra atual. TR soma a taxa mensal equivalente a 3% efetivos ao ano, aproximação que não necessariamente reproduz a combinação histórica oficial.
- Interface responsiva reorganizada em simulação, histórico e metodologia.
- Interface migrada para React 19 + TypeScript, Tailwind CSS v4, Heroicons e ícones SVG locais; gráfico e PDF carregam sob demanda.
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
