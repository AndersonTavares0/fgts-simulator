import {
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  PercentBadgeIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, ReactNode, SVGProps } from 'react';

function Card({
  id,
  icon: Icon,
  title,
  items,
  wide,
  children,
}: {
  id?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  items: string[];
  /** Cartão de largura total, com os itens em duas colunas. */
  wide?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-label={title}
      className={`border-border bg-card rounded-3xl border p-4 ${wide ? 'md:col-span-2' : ''}`}
    >
      <div className="mb-2.5 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-accent text-accent-foreground grid size-8 shrink-0 place-items-center rounded-full"
        >
          <Icon className="size-[18px]" />
        </span>
        <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{title}</h2>
      </div>
      <ul
        className={`text-muted-foreground text-[13.5px] leading-[1.5] ${wide ? 'md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-1.5' : 'space-y-1.5'}`}
      >
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="bg-primary/50 mt-[9px] size-1.5 shrink-0 rounded-full"
            />
            {item}
          </li>
        ))}
      </ul>
      {children}
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      className="text-primary mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium underline-offset-2 hover:underline"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowTopRightOnSquareIcon className="size-4" aria-hidden="true" />
    </a>
  );
}

export function HelpPage() {
  return (
    <div>
      <h1 className="text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] md:text-[32px]">
        Ajuda
      </h1>
      <p className="text-muted-foreground mt-1.5 text-[14.5px]">
        Em poucas palavras: como a conta é feita e o que acontece com os seus dados.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Card
          id="metodologia"
          icon={CalculatorIcon}
          title="O que é esta estimativa"
          items={[
            'É uma projeção, não o extrato da Caixa. Para o valor exato, consulte o app do FGTS.',
            'Usamos o salário que você informar, igual em todos os meses.',
            'Não entram depósitos atrasados, saques antigos nem mudanças de salário.',
            'Os valores são brutos: não descontamos imposto de renda nem INSS.',
          ]}
        />
        <Card
          icon={BanknotesIcon}
          title="O que entra no total"
          items={[
            'O saldo do FGTS que você pode sacar. O que ficar retido aparece à parte.',
            'A multa da empresa, quando o motivo da saída dá direito a ela.',
            '13º e férias proporcionais, pelos meses que você informar. Na justa causa e no saque por doença grave, eles não entram.',
            'Ficam de fora: aviso-prévio, rescisão indireta, contrato com prazo e outras verbas.',
          ]}
        />
        <Card
          icon={PercentBadgeIcon}
          title="Como o saldo rende"
          items={[
            'O padrão é TR mais 3% ao ano, como no FGTS. As taxas que mostramos são exemplos: confira a TR e o IPCA do mês.',
            'O IPCA é só uma comparação com a inflação, não um valor garantido.',
            'Para empregado doméstico, a reserva de 3,2% rende como o FGTS. No acordo com a empresa, metade dela vai para o trabalhador.',
          ]}
        >
          <ExternalLink href="https://www.stf.jus.br/arquivo/cms/noticiaNoticiaStf/anexo/ADI5090Infoasociedade.pdf">
            Entenda a decisão do STF sobre a correção
          </ExternalLink>
        </Card>
        <Card
          id="privacidade"
          icon={LockClosedIcon}
          title="Seus dados"
          items={[
            'A conta é feita no seu aparelho. Nada é enviado a um servidor.',
            'O histórico só é guardado quando você escolhe salvar. Não há conta nem login.',
            'No saque por doença grave, pedimos uma autorização para calcular e outra, separada, para salvar.',
            'O navegador pode apagar dados locais a qualquer momento. Se quiser guardar, baixe o PDF.',
            'Este site fica no GitHub Pages, que pode registrar seu IP. Outros projetos do mesmo dono compartilham o armazenamento local do navegador. A primeira visita precisa de internet.',
          ]}
        >
          <ExternalLink href="https://github.com/AndersonTavares0/fgts-simulator/blob/main/docs/legal/privacy.md">
            Política de privacidade completa
          </ExternalLink>
        </Card>
        <Card
          wide
          icon={CalendarDaysIcon}
          title="Limites do simulador"
          items={[
            'Datas: vale de 01/01/1967 (quando o FGTS começou) em diante, por até 60 anos de trabalho.',
            'Antes de 1991 o FGTS funcionava de outro jeito, então o resultado é só uma ideia aproximada.',
            'Salário: até R$ 10.000.000,00. Esse limite é nosso, não da lei: serve para evitar erro ao digitar.',
            'Se o seu salário for maior, simule com a metade e dobre o resultado.',
          ]}
        />
      </div>
    </div>
  );
}
