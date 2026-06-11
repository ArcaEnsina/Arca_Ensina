import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
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
import PatientSymptomSelector from '@/features/patient/components/PatientSymptomSelector';
import { usePatientStore } from '@/features/patient/store';
import { startEmergency } from '../services/emergencyService';

type EmergencyPatientFormData = {
  peso: string;
  idade_anos: string;
  sintomas: string[];
};

const labelClass = 'text-xs font-bold text-arca-blue-700 uppercase tracking-wider';

export default function EmergencyPatientForm() {
  const navigate = useNavigate();
  const setActivePatient = usePatientStore((s) => s.setActivePatient);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<EmergencyPatientFormData>({
    defaultValues: { peso: '', idade_anos: '', sintomas: [] },
  });

  const sintomas = useWatch({ control, name: 'sintomas' });

  async function onSubmit(data: EmergencyPatientFormData) {
    const peso = parseFloat(data.peso);
    const idade_anos = parseInt(data.idade_anos);

    if (isNaN(peso) || peso <= 0) {
      toast.error('Informe um peso válido.');
      return;
    }
    if (isNaN(idade_anos) || idade_anos < 0) {
      toast.error('Informe uma idade válida.');
      return;
    }

    setLoading(true);
    try {
      const { patient, execution } = await startEmergency({
        peso,
        idade_anos,
        sintomas: data.sintomas,
      });
      setActivePatient(patient);
      navigate(`/guided-protocol/${execution.version}`);
    } catch {
      toast.error('Erro ao iniciar emergência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Modo Emergência</h1>
      </header>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg font-semibold">
            Dados do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="peso" className={labelClass}>
              Peso (kg) *
            </label>
            <Input
              id="peso"
              placeholder="Ex: 54kg"
              inputMode="decimal"
              {...register('peso')}
              aria-invalid={!!errors.peso}
            />
            {errors.peso && (
              <p className="text-xs text-destructive">{errors.peso.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="idade_anos" className={labelClass}>
              Idade (anos) *
            </label>
            <Input
              id="idade_anos"
              type="number"
              placeholder="Ex: 8"
              {...register('idade_anos')}
              aria-invalid={!!errors.idade_anos}
            />
            {errors.idade_anos && (
              <p className="text-xs text-destructive">
                {errors.idade_anos.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg font-semibold">
            Sintomas Atuais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <PatientSymptomSelector
            value={sintomas ?? []}
            onChange={(v) => setValue('sintomas', v)}
          />
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={loading}
        className="w-full font-bold h-14"
        size="xl"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 animate-spin" /> Iniciando...
          </>
        ) : (
          'Iniciar Protocolo de Emergência'
        )}
      </Button>
    </form>
  );
}
