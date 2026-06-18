import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

import { patientCreateSchema, type PatientCreateInput } from '../schemas';
import { useCreatePatient, useUpdatePatient } from '../api';
import PatientSymptomSelector from './PatientSymptomSelector';
import PatientAllergyInput from './PatientAllergyInput';
import DatePicker from '@/components/ui/DatePicker'

type ApiFieldErrors = Record<string, string[]>;

interface ApiError {
  response?: {
    data?: {
      error?: {
        code?: string;
        message?: string;
        details?: ApiFieldErrors;
      };
    };
  };
}

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'response' in error;
}

// Campos do formulário que o backend pode retornar como detalhes de erro
const BACKEND_FIELD_MAP: Record<string, keyof PatientCreateInput> = {
  nome: 'nome',
  data_nascimento: 'dataNascimento',
  genero: 'genero',
  telefone: 'telefone',
  peso: 'peso',
  altura: 'altura',
  cidade: 'cidade',
  nome_responsavel: 'nomeResponsavel',
};

// Campos que pertencem à primeira etapa do wizard (Identificação).
const STEP_1_FIELDS: ReadonlyArray<keyof PatientCreateInput> = [
  'nome',
  'dataNascimento',
  'telefone',
  'genero',
  'cidade',
  'nomeResponsavel',
];

const EMPTY_DEFAULTS: PatientCreateInput = {
  nome: '',
  dataNascimento: '',
  genero: 'M',
  nomeResponsavel: '',
  cidade: '',
  telefone: '',
  peso: '',
  altura: '',
  alergias: [],
  sintomas: [],
};

type Step = 1 | 2;

/** Indicador de progresso de 2 etapas no estilo do protocolo guiado. */
function StepIndicator({ step }: { step: Step }) {
  const dotBase =
    'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 motion-reduce:transition-none';

  return (
    <nav
      aria-label="Progresso do cadastro"
      className="flex flex-col items-center gap-2"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-arca-blue-700">
        Etapa {step} de 2
      </p>
      <ol className="flex w-full max-w-xs items-center">
        <li
          className="flex flex-1 items-center"
          aria-current={step === 1 ? 'step' : undefined}
        >
          <span
            className={cn(
              dotBase,
              step > 1
                ? 'bg-arca-blue-600 text-white shadow-sm'
                : 'bg-arca-blue-700 text-white ring-4 ring-arca-blue-100',
            )}
          >
            {step > 1 ? <Check className="size-4" aria-hidden="true" /> : '1'}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'h-0.5 min-w-2 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none',
              step > 1 ? 'bg-arca-blue-600' : 'bg-neutral-200',
            )}
          />
        </li>
        <li
          className="flex shrink-0 items-center"
          aria-current={step === 2 ? 'step' : undefined}
        >
          <span
            className={cn(
              dotBase,
              step === 2
                ? 'bg-arca-blue-700 text-white ring-4 ring-arca-blue-100'
                : 'border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-400',
            )}
          >
            2
          </span>
        </li>
      </ol>
      <div className="flex w-full max-w-xs justify-between text-[11px] font-medium text-muted-foreground">
        <span className={cn(step === 1 && 'font-semibold text-arca-blue-700')}>
          Identificação
        </span>
        <span className={cn(step === 2 && 'font-semibold text-arca-blue-700')}>
          Avaliação
        </span>
      </div>
    </nav>
  );
}

interface PatientFormProps {
  mode?: 'create' | 'edit';
  defaultValues?: Partial<PatientCreateInput>;
  patientId?: string | number;
  patientName?: string;
}

export default function PatientForm({
  mode = 'create',
  defaultValues,
  patientId,
  patientName,
}: PatientFormProps) {
  const navigate = useNavigate();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient(patientId ?? '');
  const isEdit = mode === 'edit';
  const mutation = isEdit ? updatePatient : createPatient;

  const [step, setStep] = useState<Step>(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<PatientCreateInput | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    trigger,
    control,
    formState: { errors },
  } = useForm<PatientCreateInput>({
    resolver: zodResolver(patientCreateSchema),
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
  });

  const labelClass =
    "text-xs font-bold text-arca-blue-700 uppercase tracking-wider";

  const alergias = useWatch({ name: 'alergias', control });
  const sintomas = useWatch({ name: 'sintomas', control });
  const genero = useWatch({ name: 'genero', control });
  const dataNascimento = useWatch({ name: 'dataNascimento', control });

  const goNext = async () => {
    const ok = await trigger(['nome', 'dataNascimento', 'telefone']);
    if (ok) setStep(2);
  };

  const handleError = (error: unknown) => {
    if (!isApiError(error)) {
      toast.error('Erro inesperado. Tente novamente.');
      return;
    }

    const apiError = error.response?.data?.error;
    const code = apiError?.code;
    const details = apiError?.details;

    // Se o backend devolveu erros por campo, seta cada um no formulário
    if (code === 'validation_error' && details && typeof details === 'object') {
      let hasFieldError = false;
      let hasStep1Error = false;

      for (const [backendField, messages] of Object.entries(details)) {
        const formField = BACKEND_FIELD_MAP[backendField];
        if (formField && Array.isArray(messages) && messages.length > 0) {
          setError(formField, {
            type: 'server',
            message: messages[0],
          });
          hasFieldError = true;
          if (STEP_1_FIELDS.includes(formField)) {
            hasStep1Error = true;
          }
        }
      }

      // Leva o usuário de volta à etapa onde o campo destacado está visível.
      if (hasStep1Error) {
        setStep(1);
      }

      if (hasFieldError) {
        toast.error('Corrija os campos destacados antes de continuar.');
      } else {
        toast.error(apiError?.message ?? 'Dados inválidos. Verifique os campos.');
      }
      return;
    }

    switch (code) {
      case 'idempotency_conflict':
        toast.error('Este registro já foi criado.');
        break;
      default:
        toast.error(apiError?.message ?? 'Erro inesperado. Tente novamente.');
    }
  };

  const submitCreate = (data: PatientCreateInput) => {
    createPatient.mutate(data, {
      onSuccess: () => {
        toast.success('Paciente cadastrado com sucesso!');
        navigate('/dashboard');
      },
      onError: handleError,
    });
  };

  const submitEdit = (data: PatientCreateInput) => {
    updatePatient.mutate(data, {
      onSuccess: () => {
        toast.success('Paciente atualizado com sucesso!');
        navigate('/dashboard');
      },
      onError: handleError,
    });
  };

  const onSubmit = (data: PatientCreateInput) => {
    const sanitized = {
      ...data,
      telefone: data.telefone.replace(/\D/g, ''),
    };

    if (isEdit) {
      // Prevenção de erros: confirma antes de aplicar a edição.
      setPendingData(sanitized);
      setConfirmOpen(true);
      return;
    }

    submitCreate(sanitized);
  };

  const confirmEdit = () => {
    if (!pendingData) return;
    setConfirmOpen(false);
    submitEdit(pendingData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          {isEdit ? 'Editar Paciente' : 'Novo Registro de Paciente'}
        </h1>
        <StepIndicator step={step} />
      </header>

      {step === 1 && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg font-semibold">
              Identificação do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="nome" className={labelClass}>
                Nome Completo *
              </label>
              <Input id="nome" {...register('nome')} placeholder="Ex: Ariel Cavalcanti" aria-invalid={!!errors.nome} />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="dataNascimento" className={labelClass}>
                Data de Nasc. *
              </label>
              <DatePicker
                id="dataNascimento"
                value={dataNascimento}
                onChange={(v) => setValue('dataNascimento', v, { shouldValidate: true })}
                aria-invalid={!!errors.dataNascimento}
              />
              {errors.dataNascimento && (
                <p className="text-xs text-destructive">
                  {errors.dataNascimento.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="genero" className={labelClass}>
                Gênero
              </label>
              <Select
                value={genero}
                onValueChange={(v: 'M' | 'F' | 'O') =>
                  setValue('genero', v, { shouldValidate: true })
                }
              >
                <SelectTrigger id="genero" className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="O">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="telefone" className={labelClass}>
                Telefone *
              </label>
              <Input
                id="telefone"
                type="tel"
                placeholder="Ex: 5581999999999"
                {...register('telefone')}
                aria-invalid={!!errors.telefone}
              />
              {errors.telefone ? (
                <p className="text-xs text-destructive">
                  {errors.telefone.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Inclua o código do país e DDD (ex: 5581999999999)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="cidade" className={labelClass}>
                Cidade
              </label>
              <Input id="cidade" placeholder="Recife" {...register('cidade')} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label htmlFor="nomeResponsavel" className={labelClass}>
                Nome do Responsável (Opcional)
              </label>
              <Input id="nomeResponsavel" placeholder="Ex: Alice Cavalcanti" {...register('nomeResponsavel')} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg font-semibold">
              Avaliação Inicial
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="peso" className={labelClass}>
                  Peso (kg) *
                </label>
                <Input
                  id="peso"
                  placeholder="Ex: 54"
                  inputMode="decimal"
                  {...register('peso')}
                  aria-invalid={!!errors.peso}
                />
                {errors.peso && (
                  <p className="text-xs text-destructive">
                    {errors.peso.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="altura" className={labelClass}>
                  Altura (cm) *
                </label>
                <Input
                  id="altura"
                  placeholder="Ex: 160"
                  inputMode="decimal"
                  {...register('altura')}
                  aria-invalid={!!errors.altura}
                />
                {errors.altura && (
                  <p className="text-xs text-destructive">
                    {errors.altura.message}
                  </p>
                )}
              </div>
            </div>

            <PatientSymptomSelector
              value={sintomas ?? []}
              onChange={(v) =>
                setValue('sintomas', v, { shouldValidate: true })
              }
            />

            <PatientAllergyInput
              value={alergias ?? []}
              onChange={(v) =>
                setValue('alergias', v, { shouldValidate: true })
              }
            />
          </CardContent>
        </Card>
      )}

      {step === 1 ? (
        <Button
          type="button"
          onClick={goNext}
          className="w-full font-bold h-14"
          size="xl"
        >
          Avançar
          <ArrowRight className="ml-2" />
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(1)}
            className="font-bold h-14"
            size="xl"
          >
            <ArrowLeft className="mr-2" />
            Voltar
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 font-bold h-14"
            size="xl"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 animate-spin" /> Salvando...
              </>
            ) : isEdit ? (
              'Salvar Alterações'
            ) : (
              'Concluir Cadastro'
            )}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar edição"
        description={`Você irá editar ${patientName ?? 'este paciente'}. Deseja continuar?`}
        confirmLabel="Sim, editar"
        isPending={updatePatient.isPending}
        onConfirm={confirmEdit}
      />
    </form>
  );
}
