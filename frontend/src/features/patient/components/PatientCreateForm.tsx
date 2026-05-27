import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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

import { patientCreateSchema, type PatientCreateInput } from '../schemas';
import { useCreatePatient } from '../api';
import PatientSymptomSelector from './PatientSymptomSelector';
import PatientAllergyInput from './PatientAllergyInput';

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

export default function PatientCreateForm() {
  const navigate = useNavigate();
  const createPatient = useCreatePatient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<PatientCreateInput>({
    resolver: zodResolver(patientCreateSchema),
    defaultValues: {
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
    },
  });

  const labelClass =
    "text-xs font-bold text-arca-blue-700 uppercase tracking-wider";
  
  const alergias = watch('alergias');
  const sintomas = watch('sintomas');
  const genero = watch('genero');

  const onSubmit = (data: PatientCreateInput) => {
    const sanitized = {
      ...data,
      telefone: data.telefone.replace(/\D/g, ''),
    };

    createPatient.mutate(sanitized, {
      onSuccess: () => {
        toast.success('Paciente cadastrado com sucesso!');
        navigate('/dashboard');
      },
      onError: (error: unknown) => {
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

          for (const [backendField, messages] of Object.entries(details)) {
            const formField = BACKEND_FIELD_MAP[backendField];
            if (formField && Array.isArray(messages) && messages.length > 0) {
              setError(formField, {
                type: 'server',
                message: messages[0],
              });
              hasFieldError = true;
            }
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
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Novo Registro de Paciente
        </h1>
      </header>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg font-semibold">
            Identificação do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <Input
              id="dataNascimento"
              type="date"
              {...register('dataNascimento')}
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
              <SelectTrigger id="genero">
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

          <div className="md:col-span-3 space-y-2">
            <label htmlFor="nomeResponsavel" className={labelClass}>
              Nome do Responsável (Opcional)
            </label>
            <Input id="nomeResponsavel" placeholder="Ex: Alice Cavalcanti" {...register('nomeResponsavel')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg font-semibold">
            Avaliação Inicial
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="peso" className={labelClass}>
                Peso (kg)
              </label>
              <Input
                id="peso"
                placeholder="Ex: 54kg"
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
                Altura (cm)
              </label>
              <Input
                id="altura"
                placeholder="Ex: 160cm"
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

      <Button
        type="submit"
        disabled={createPatient.isPending}
        className="w-full font-bold h-14"
        size="xl"
      >
        {createPatient.isPending ? (
          <>
            <Loader2 className="mr-2 animate-spin" /> Salvando...
          </>
        ) : (
          'Concluir Cadastro'
        )}
      </Button>
    </form>
  );
}