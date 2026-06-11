import EmergencyPatientForm from "../components/EmergencyPatientForm";

export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <EmergencyPatientForm />
      </div>
    </div>
  );
}