export function HelpPage() {
  return (
    <div className="max-w-[74ch]">
      <h1 className="text-[30px] leading-[1.1] font-semibold tracking-[-0.025em] md:text-[38px]">
        Ajuda
      </h1>
      <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed">
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
              13º e férias usam os avos ainda devidos que você informar. O total não apura
              integralmente tributos, descontos, aviso-prévio e todas as verbas de uma rescisão.
            </p>
          </div>
          <div>
            <h3 className="text-[14px] font-medium">Taxas transparentes</h3>
            <p className="text-muted-foreground mt-2 text-[14px] leading-relaxed">
              O cenário padrão aplica TR mensal estimada e juros de 3% ao ano. O IPCA é referência
              econômica alternativa, não crédito judicial ou garantia de remuneração.
            </p>
            <p className="text-muted-foreground mt-3 text-[14px] leading-relaxed">
              A ADI 5090 não é troca automática pela maior taxa mensal: envolve remuneração anual,
              distribuição de resultados e eventual compensação. Esta projeção não reproduz esse
              mecanismo nem recomposição retroativa.
            </p>
            <a
              className="text-foreground mt-3 inline-block text-[13.5px] underline underline-offset-2"
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
              className="text-foreground mt-3 inline-block text-[13.5px] underline underline-offset-2"
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
