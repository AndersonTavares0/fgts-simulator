import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { TipoContrato, TipoRescisao } from '../core/types';
import type { Draft, FieldErrors } from './form';
import { Button } from './components/ui/button';
import { Checkbox } from './components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select } from './components/ui/select';

const CONTRACTS: Array<[TipoContrato, string]> = [
  [TipoContrato.CLT_PADRAO, 'Carteira assinada (CLT)'],
  [TipoContrato.APRENDIZ, 'Aprendiz'],
  [TipoContrato.DOMESTICO, 'Empregado doméstico'],
];

// Plain-language labels: the audience may not know CLT jargon or "avos".
const REASONS: Record<TipoRescisao, string> = {
  [TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA]: 'Fui demitido sem justa causa',
  [TipoRescisao.DEMISSAO_VOLUNTARIA]: 'Eu pedi demissão',
  [TipoRescisao.JUSTA_CAUSA]: 'Fui demitido por justa causa',
  [TipoRescisao.ACORDO_COMUM]: 'Fiz acordo com a empresa',
  [TipoRescisao.DOENCA_GRAVE]: 'Saque por doença grave',
  [TipoRescisao.APOSENTADORIA]: 'Saque por aposentadoria',
  [TipoRescisao.FALECIMENTO]: 'Saque por falecimento',
  [TipoRescisao.CULPA_RECIPROCA]: 'A culpa foi das duas partes',
};

interface Props {
  draft: Draft;
  errors: FieldErrors;
  consentProcessing: boolean;
  onDraft: (patch: Partial<Draft>) => void;
  onConsent: (value: boolean) => void;
  onSubmit: () => void;
}

/** Label, control and message with the id/aria wiring in one place. */
function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3 grid gap-1.5">
      <Label htmlFor={`field-${name}`}>{label}</Label>
      {children}
      {error ? (
        <p id={`error-${name}`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`hint-${name}`} className="help">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SimulationForm({
  draft,
  errors,
  consentProcessing,
  onDraft,
  onConsent,
  onSubmit,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const fields = Object.entries(errors).filter(
    ([key]) => key !== 'consentProcessing' && key !== 'form',
  );
  const advancedError = Boolean(
    errors.thirteenthMonths ||
    errors.thirteenthEntries ||
    errors.vacationMonths ||
    errors.trMonthly ||
    errors.ipcaMonthly,
  );

  useEffect(() => {
    // Validation reported errors inside the closed dialog: reveal them.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (advancedError) setAdvancedOpen(true);
  }, [advancedError]);

  const firstError = fields[0]?.[0];

  useEffect(() => {
    // Submit only reports errors; the caret must land on the first invalid control.
    if (firstError) focusField(firstError);
  }, [firstError]);

  function focusField(key: string): void {
    const field = document.getElementById(`field-${key}`);
    if (!field) {
      setAdvancedOpen(true);
      window.setTimeout(() => document.getElementById(`field-${key}`)?.focus(), 0);
      return;
    }
    field.focus();
  }

  const describedBy = (name: keyof Draft, hint?: string): string | undefined =>
    errors[name] ? `error-${name}` : hint ? `hint-${name}` : undefined;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
      aria-label="Dados do trabalho"
    >
      {errors.form && (
        <p role="alert" className="notice bg-destructive/10 text-destructive mt-3">
          {errors.form}
        </p>
      )}

      {fields.length > 0 && (
        <div role="alert" className="notice bg-destructive/10 text-destructive mt-3">
          <strong>Falta preencher</strong>
          <ul className="mt-1 list-disc pl-5">
            {fields.map(([key, value]) => (
              <li key={key}>
                <a href={`#field-${key}`} className="underline" onClick={() => focusField(key)}>
                  {value}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-muted-foreground mb-3 text-[12px] font-medium tracking-[-0.01em]">
          Trabalho
        </p>

        <Field
          name="salary"
          label="Quanto você ganha por mês?"
          hint="O salário antes dos descontos."
          error={errors.salary}
        >
          <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute top-3.5 left-3 text-base">
              R$
            </span>
            <Input
              id="field-salary"
              className="pl-10"
              inputMode="decimal"
              placeholder="0,00"
              autoComplete="off"
              required
              value={draft.salary}
              aria-invalid={errors.salary ? true : undefined}
              aria-describedby={describedBy('salary', 'hint')}
              onChange={(event) => onDraft({ salary: event.target.value })}
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ['startDate', 'Começou em'],
              ['endDate', 'Saiu em'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} name={key} label={label} error={errors[key]}>
              <Input
                id={`field-${key}`}
                type="date"
                className="px-2"
                required
                value={draft[key]}
                aria-invalid={errors[key] ? true : undefined}
                aria-describedby={describedBy(key)}
                onChange={(event) => onDraft({ [key]: event.target.value })}
              />
            </Field>
          ))}
        </div>

        <p className="text-muted-foreground mt-7 mb-3 text-[12px] font-medium tracking-[-0.01em]">
          Saída ou saque
        </p>

        <Field name="terminationType" label="Qual é a situação?">
          <Select
            id="field-terminationType"
            value={draft.terminationType}
            onChange={(event) => {
              const terminationType = event.target.value as TipoRescisao;
              const semVerbas =
                terminationType === TipoRescisao.JUSTA_CAUSA ||
                terminationType === TipoRescisao.DOENCA_GRAVE;
              onDraft({
                terminationType,
                ...(semVerbas
                  ? {
                      include13: false,
                      includeVacation: false,
                      thirteenthMonths: '0',
                      vacationMonths: '0',
                    }
                  : {}),
              });
            }}
          >
            {Object.values(TipoRescisao).map((value) => (
              <option key={value} value={value}>
                {REASONS[value]}
              </option>
            ))}
          </Select>
        </Field>

        {draft.terminationType === TipoRescisao.DOENCA_GRAVE && (
          <div className="notice bg-muted mt-2">
            <p>Doença grave é um dado de saúde. Não escreva diagnóstico nem laudo.</p>
            <div className="mt-2 flex items-start gap-2.5">
              <Checkbox
                id="consent-processing"
                className="mt-0.5"
                checked={consentProcessing}
                aria-describedby={errors.consentProcessing ? 'error-consent' : undefined}
                onCheckedChange={(checked) => onConsent(checked === true)}
              />
              <Label htmlFor="consent-processing" className="text-[14px] font-normal">
                Autorizo usar esta informação só neste cálculo. Não autoriza salvar.
              </Label>
            </div>
            {errors.consentProcessing && (
              <p id="error-consent" className="field-error mt-1">
                {errors.consentProcessing}
              </p>
            )}
          </div>
        )}

        <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="border-border mt-2 flex w-full items-center justify-between gap-3 rounded-none border-x-0 border-b-0 border-t px-0 pt-4 text-left hover:bg-transparent"
            >
              <span className="text-[16px] font-medium">
                Mais opções
                <span className="help block">Contrato, 13º, férias e taxas</span>
              </span>
              <AdjustmentsHorizontalIcon
                className="text-muted-foreground size-5 shrink-0"
                aria-hidden="true"
              />
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <div className="max-h-[85dvh] overflow-y-auto p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogTitle>Mais opções</DialogTitle>
                  <DialogDescription>
                    Se não souber, deixe como está. Já usamos os valores mais comuns.
                  </DialogDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground -mt-1 -mr-1"
                  onClick={() => setAdvancedOpen(false)}
                  aria-label="Fechar opções"
                >
                  <XMarkIcon className="size-5" aria-hidden="true" />
                </Button>
              </div>
              <div className="mt-3">
                <Field name="contractType" label="Tipo de trabalho">
                  <Select
                    id="field-contractType"
                    value={draft.contractType}
                    onChange={(event) =>
                      onDraft({ contractType: event.target.value as TipoContrato })
                    }
                  >
                    {CONTRACTS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="bg-muted flex min-h-12 items-start gap-3 rounded-lg px-3 py-2.5">
                  <Checkbox
                    id="field-birthdayWithdrawal"
                    className="mt-0.5"
                    checked={draft.birthdayWithdrawal}
                    onCheckedChange={(checked) => onDraft({ birthdayWithdrawal: checked === true })}
                  />
                  <div>
                    <Label htmlFor="field-birthdayWithdrawal" className="text-[16px] font-normal">
                      Recebo pelo saque-aniversário
                    </Label>
                    <span className="help block">É o dinheiro que a Caixa libera todo ano.</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Field name="thirteenthMode" label="FGTS sobre o 13º">
                    <Select
                      id="field-thirteenthMode"
                      value={draft.thirteenthMode}
                      onChange={(event) =>
                        onDraft({ thirteenthMode: event.target.value as Draft['thirteenthMode'] })
                      }
                    >
                      <option value="estimate">Estimar pelo salário fixo (padrão)</option>
                      <option value="actual">Informar remunerações reais por competência</option>
                    </Select>
                  </Field>
                  {draft.thirteenthMode === 'estimate' ? (
                    <p className="help mb-3">
                      Cada mês com pelo menos 15 dias conta um avo. Quando novembro e dezembro estão
                      no período, dividimos o 13º entre esses meses; nas rescisões cabíveis,
                      estimamos o proporcional no término. O adiantamento pode não aparecer em
                      períodos encerrados antes de dezembro.
                    </p>
                  ) : (
                    <div className="mb-3">
                      <p className="help mb-2">
                        Informe a remuneração bruta de 13º efetivamente paga em cada competência,
                        não o depósito de FGTS. Parcelas do mesmo mês são somadas. Esses valores não
                        comprovam depósitos nem reproduzem índices históricos ou um extrato.
                      </p>
                      {draft.thirteenthEntries.map((entry, index) => (
                        <fieldset
                          key={index}
                          className="border-border mb-3 grid gap-2 rounded-lg border p-3"
                        >
                          <legend className="px-1 text-sm font-medium">Parcela {index + 1}</legend>
                          <div>
                            <Label
                              htmlFor={
                                index === 0
                                  ? 'field-thirteenthEntries'
                                  : `thirteenth-month-${index}`
                              }
                            >
                              Competência
                            </Label>
                            <Input
                              id={
                                index === 0
                                  ? 'field-thirteenthEntries'
                                  : `thirteenth-month-${index}`
                              }
                              type="month"
                              value={entry.competencia}
                              aria-invalid={errors.thirteenthEntries ? true : undefined}
                              aria-describedby={
                                errors.thirteenthEntries ? 'error-thirteenthEntries' : undefined
                              }
                              onChange={(event) =>
                                onDraft({
                                  thirteenthEntries: draft.thirteenthEntries.map((item, i) =>
                                    i === index
                                      ? { ...item, competencia: event.target.value }
                                      : item,
                                  ),
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`thirteenth-amount-${index}`}>
                              Remuneração bruta (R$)
                            </Label>
                            <Input
                              id={`thirteenth-amount-${index}`}
                              inputMode="decimal"
                              value={entry.remuneracao}
                              aria-invalid={errors.thirteenthEntries ? true : undefined}
                              aria-describedby={
                                errors.thirteenthEntries ? 'error-thirteenthEntries' : undefined
                              }
                              onChange={(event) =>
                                onDraft({
                                  thirteenthEntries: draft.thirteenthEntries.map((item, i) =>
                                    i === index
                                      ? { ...item, remuneracao: event.target.value }
                                      : item,
                                  ),
                                })
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              onDraft({
                                thirteenthEntries: draft.thirteenthEntries.filter(
                                  (_, i) => i !== index,
                                ),
                              })
                            }
                          >
                            Remover parcela {index + 1}
                          </Button>
                        </fieldset>
                      ))}
                      {errors.thirteenthEntries && (
                        <p id="error-thirteenthEntries" className="field-error mb-2">
                          {errors.thirteenthEntries}
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          onDraft({
                            thirteenthEntries: [
                              ...draft.thirteenthEntries,
                              { competencia: '', remuneracao: '' },
                            ],
                          })
                        }
                      >
                        Adicionar parcela de 13º
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-2.5">
                  {(draft.terminationType === TipoRescisao.JUSTA_CAUSA ||
                    draft.terminationType === TipoRescisao.DOENCA_GRAVE) && (
                    <p className="notice bg-muted mb-2">
                      {draft.terminationType === TipoRescisao.JUSTA_CAUSA
                        ? 'Na justa causa, 13º e férias proporcionais não são devidos.'
                        : 'Doença grave libera o saldo, mas não é rescisão: 13º e férias não entram.'}
                    </p>
                  )}
                  {(
                    [
                      ['include13', 'thirteenthMonths', '13º salário'],
                      ['includeVacation', 'vacationMonths', 'Férias + 1/3'],
                    ] as const
                  )
                    .filter(
                      () =>
                        draft.terminationType !== TipoRescisao.JUSTA_CAUSA &&
                        draft.terminationType !== TipoRescisao.DOENCA_GRAVE,
                    )
                    .map(([toggle, avos, label]) => (
                      <div key={toggle} className="mb-2">
                        <div className="bg-muted flex min-h-12 items-center gap-3 rounded-lg px-3">
                          <Checkbox
                            id={`field-${toggle}`}
                            checked={draft[toggle]}
                            onCheckedChange={(checked) => onDraft({ [toggle]: checked === true })}
                          />
                          <Label htmlFor={`field-${toggle}`} className="flex-1 text-[16px]">
                            {label}
                          </Label>
                          {draft[toggle] && (
                            <span className="flex items-center gap-1.5">
                              <Input
                                id={`field-${avos}`}
                                type="number"
                                min={0}
                                max={12}
                                step={1}
                                className="h-10 min-h-10! w-16 px-2 text-center"
                                value={draft[avos]}
                                aria-label={`Meses de ${label.toLowerCase()} que ainda faltam receber`}
                                aria-invalid={errors[avos] ? true : undefined}
                                onChange={(event) => onDraft({ [avos]: event.target.value })}
                              />
                              <span className="text-muted-foreground text-[13px]">de 12</span>
                            </span>
                          )}
                        </div>
                        {errors[avos] && <p className="field-error mt-1">{errors[avos]}</p>}
                      </div>
                    ))}
                </div>
                <p className="help mb-2">
                  Cada mês com 15 dias ou mais conta como avo inteiro; férias também exigem mais de
                  14 dias no mês.
                </p>

                <p className="help mb-2">
                  Taxas de exemplo (nov/2026). Ajuste com a TR e o IPCA do mês que você quer
                  simular.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      ['trMonthly', 'TR ao mês (%)'],
                      ['ipcaMonthly', 'IPCA ao mês (%)'],
                    ] as const
                  ).map(([key, label]) => (
                    <Field key={key} name={key} label={label} error={errors[key]}>
                      <Input
                        id={`field-${key}`}
                        inputMode="decimal"
                        value={draft[key]}
                        aria-invalid={errors[key] ? true : undefined}
                        aria-describedby={describedBy(key)}
                        onChange={(event) => onDraft({ [key]: event.target.value })}
                      />
                    </Field>
                  ))}
                </div>

                <Field name="scenario" label="Como corrigir o dinheiro">
                  <Select
                    id="field-scenario"
                    value={draft.scenario}
                    onChange={(event) => onDraft({ scenario: event.target.value as 'TR' | 'IPCA' })}
                  >
                    <option value="TR">Pela TR + 3% ao ano (padrão)</option>
                    <option value="IPCA">Pela inflação (IPCA)</option>
                  </Select>
                </Field>
              </div>
              <Button type="button" className="mt-4 w-full" onClick={() => setAdvancedOpen(false)}>
                Pronto
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button type="submit" className="mt-4 w-full text-[17px]">
          Ver quanto posso receber
        </Button>
        <p className="help mt-2 text-center">É uma estimativa. Não substitui o extrato da Caixa.</p>
      </div>
    </form>
  );
}
