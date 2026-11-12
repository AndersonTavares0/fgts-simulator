export function HelpPage() {
  return (
    <div className="max-w-[74ch]">
      <h1 className="text-[30px] leading-[1.1] font-semibold tracking-[-0.025em] md:text-[38px]">
        Ajuda
      </h1>
      <p className="text-muted-foreground mt-3 text-[14px] leading-relaxed">
        Como a estimativa é feita e o que acontece com seus dados.
      </p>

      <section aria-labelledby="method-title" className="border-border mt-10 border-t pt-8">
        <h2 id="method-title" className="text-[18px] font-semibold tracking-[-0.01em]">
          Como calculamos
        </h2>
        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-[14px] font-medium">Uma projeção, não um extrato</h3>
            <p className="text-muted-foreground mt-2 text-[14px] leading-relaxed">
              Usamos salário fixo e depósitos estimados por competência civil, proporcionais aos
              dias do vínculo nos meses incompletos. Não reconstruímos depósitos reais, saques
              anteriores, variações salariais, juros de atraso ou o extrato individual da CAIXA.
            </p>
            <p className="text-muted-foreground mt-3 text-[14px] leading-relaxed">
              Para o FGTS sobre o 13º, estimamos pelo salário fixo: meses com ao menos 15 dias
              contam como avo. Quando novembro e dezembro estão no período, dividimos o valor entre
              esses meses. Em rescisões cabíveis, estimamos o proporcional no término; doença grave
              e aposentadoria não presumem término no ano incompleto. O adiantamento pode não
              aparecer em períodos encerrados antes de dezembro; atrasos e lucros não são modelados.
              Como opção avançada, informe a remuneração bruta de 13º paga por competência. Ela não
              prova depósitos, não reproduz índices históricos e não reconstitui extrato.
            </p>
            <p className="text-muted-foreground mt-3 text-[14px] leading-relaxed">
              13º e férias usam os avos ainda devidos que você informar: mês com 15 dias ou mais
              conta como avo inteiro. Na justa causa e no saque por doença grave, essas verbas não
              entram: a primeira não as gera e a segunda é hipótese de saque, não de rescisão. O
              total não apura integralmente tributos, descontos, aviso-prévio, rescisão indireta,
              força maior, contrato a termo e todas as verbas de uma rescisão. O salário deve
              respeitar o piso legal; o app não valida esse limite.
            </p>
          </div>
          <div>
            <h3 className="text-[14px] font-medium">Taxas transparentes</h3>
            <p className="text-muted-foreground mt-2 text-[14px] leading-relaxed">
              O cenário padrão soma à TR mensal estimada a taxa mensal equivalente a 3% efetivos ao
              ano; essa soma simplificada não reproduz necessariamente a combinação histórica
              oficial. O IPCA é referência econômica alternativa, não crédito judicial ou garantia.
            </p>
            <p className="text-muted-foreground mt-3 text-[14px] leading-relaxed">
              A ADI 5090 não é troca automática pela maior taxa mensal: envolve remuneração anual,
              distribuição de resultados e eventual compensação. Esta projeção não reproduz esse
              mecanismo nem recomposição retroativa. As taxas do formulário são exemplos: confira a
              TR e o IPCA do mês.
            </p>
            <p className="text-muted-foreground mt-3 text-[14px] leading-relaxed">
              Trabalho doméstico: a reserva de 3,2% é corrigida como o FGTS. No acordo comum, metade
              da reserva é destinada ao trabalhador, conforme orientação do eSocial. A mesma reserva
              incide sobre o 13º estimado ou informado.
            </p>
            <p className="text-muted-foreground mt-3 text-[14px] leading-relaxed">
              Valores são brutos. Não descontamos IRRF nem INSS: o 13º é tributável, as férias
              rescisórias com 1/3 são isentas e a multa não sofre retenção.
            </p>
            <a
              className="text-foreground mt-3 inline-block text-[14px] underline underline-offset-2"
              href="https://www.stf.jus.br/arquivo/cms/noticiaNoticiaStf/anexo/ADI5090Infoasociedade.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Resumo do STF sobre a ADI 5090
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="privacy-title" className="border-border mt-10 border-t pt-8">
        <h2 id="privacy-title" className="text-[18px] font-semibold tracking-[-0.01em]">
          Seus dados e privacidade
        </h2>
        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-[14px] font-medium">O cálculo fica no seu dispositivo</h3>
            <p className="text-muted-foreground mt-2 text-[14px] leading-relaxed">
              As entradas não são enviadas pela aplicação a um servidor. O histórico só é gravado
              quando você escolhe salvar. Doença grave exige autorizações separadas para calcular e
              para guardar.
            </p>
            <p className="text-muted-foreground mt-3 text-[14px] leading-relaxed">
              Dados locais podem ser removidos pelo navegador. Não há conta, sincronização ou
              criptografia própria do histórico.
            </p>
          </div>
          <div>
            <h3 className="text-[14px] font-medium">Limites do armazenamento local</h3>
            <p className="text-muted-foreground mt-2 text-[14px] leading-relaxed">
              Projetos GitHub Pages deste proprietário compartilham a mesma origem. O nome do banco
              e o caminho do aplicativo não impedem que outro script dessa origem acesse os dados
              locais.
            </p>
            <p className="text-muted-foreground mt-3 text-[14px] leading-relaxed">
              O GitHub pode registrar seu IP para segurança. A primeira visita exige conexão; usar
              offline depende da instalação completa dos recursos.
            </p>
            <a
              className="text-foreground mt-3 inline-block text-[14px] underline underline-offset-2"
              href="https://github.com/AndersonTavares0/fgts-simulator/blob/main/docs/legal/privacy.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de privacidade completa
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
