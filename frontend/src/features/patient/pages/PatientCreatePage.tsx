import PatientCreateForm from '../components/PatientCreateForm';

export default function PatientCreatePage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <PatientCreateForm />
      </div>
    </div>
  );
}
