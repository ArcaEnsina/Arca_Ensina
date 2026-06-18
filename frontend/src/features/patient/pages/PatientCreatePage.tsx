import PatientForm from '../components/PatientForm';

export default function PatientCreatePage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <PatientForm mode="create" />
      </div>
    </div>
  );
}
