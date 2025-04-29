
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { PatientForm } from "@/components/patient-form";
import { Patient, getPatient } from "@/lib/db";
import { toast } from "@/components/ui/use-toast";

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) {
        navigate("/patients");
        return;
      }

      try {
        setIsLoading(true);
        const patientData = await getPatient(Number(id));
        
        if (!patientData) {
          toast({
            title: "Error",
            description: "Patient not found",
            variant: "destructive"
          });
          navigate("/patients");
          return;
        }
        
        setPatient(patientData);
      } catch (error) {
        console.error("Error fetching patient:", error);
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive"
        });
        navigate("/patients");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [id, navigate]);

  return (
    <Layout title="Edit Patient">
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p>Loading patient data...</p>
        </div>
      ) : (
        <PatientForm patient={patient} isEdit />
      )}
    </Layout>
  );
}
