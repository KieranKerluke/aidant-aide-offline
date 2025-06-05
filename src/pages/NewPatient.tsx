
import { Layout } from "@/components/layout";
import { PatientForm } from "@/components/patient-form";

export default function NewPatient() {
  return (
    <Layout title="Add New Patient">
      <PatientForm />
    </Layout>
  );
}
