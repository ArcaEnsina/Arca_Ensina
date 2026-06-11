import EmergencyPatientForm from "../components/EmergencyPatientForm";

export default function EmergencyProtocolPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-display-md text-arca-blue-900">
          Modo Emergência
        </h1>

        <p className="text-body-md text-muted-foreground">
          Informe os dados clínicos iniciais para iniciar um protocolo de emergência.
        </p>
      </div>

      <EmergencyPatientForm />
    </div>
  );
}