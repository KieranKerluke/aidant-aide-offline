import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { PatientForm } from "@/components/patient-form";
import { Patient, getPatient, updatePatient } from "@/lib/db";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);

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
        // Only open the form after patient data is loaded
        setIsPatientFormOpen(true);
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

  const handleSavePatient = async (updatedPatient: Patient) => {
    try {
      // Update the local state with the updated patient data
      setPatient(updatedPatient);
      toast({
        title: "Success",
        description: "Patient updated successfully"
      });
      
      // Navigate back to patients page after a short delay
      setTimeout(() => {
        navigate("/patients");
      }, 500);
    } catch (error) {
      console.error("Error in handleSavePatient:", error);
    }
  };

  const handleFormClose = () => {
    setIsPatientFormOpen(false);
    // Navigate back to patients page after a short delay
    setTimeout(() => {
      navigate("/patients");
    }, 100);
  };

  return (
    <Layout title="Edit Patient">
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p>Loading patient data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/patients")} 
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
          </Button>
          
          {patient && (
            <PatientForm 
              isOpen={isPatientFormOpen}
              onOpenChange={handleFormClose}
              patient={patient} 
              isEdit={true}
              onSave={handleSavePatient}
            />
          )}
        </div>
      )}
    </Layout>
  );
}
