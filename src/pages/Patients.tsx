import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";
import { getAllPatients, Patient, deletePatient } from "@/lib/db";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { PatientForm } from "@/components/patient-form";

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | undefined>(undefined);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const allPatients = await getAllPatients();
      setPatients(allPatients);
      setFilteredPatients(allPatients);
    } catch (error) {
      console.error("Error loading patients:", error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(query) ||
        (patient.tags && patient.tags.some(tag => tag.toLowerCase().includes(query)))
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const handleDeletePatient = async (id: number | undefined) => {
    if (!id) return;
    
    try {
      await deletePatient(id);
      await loadPatients();
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
    }
  };

  const handleAddNewPatient = () => {
    setPatientToEdit(undefined);
    setIsPatientFormOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsPatientFormOpen(true);
  };

  const handleSavePatient = (patient: Patient) => {
    loadPatients();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Layout title="Patients">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleAddNewPatient}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Patient
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <p>Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center p-8 border rounded-lg">
            {patients.length === 0 ? (
              <>
                <p className="text-muted-foreground mb-4">You haven't added any patients yet.</p>
                <Button onClick={handleAddNewPatient}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Patient
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">No patients match your search criteria.</p>
            )}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <Link 
                        to={`/patients/${patient.id}/sessions`} 
                        className="hover:underline"
                      >
                        {patient.name}
                      </Link>
                    </TableCell>
                    <TableCell>{calculateAge(patient.dateOfBirth)} years</TableCell>
                    <TableCell>{patient.personalPhone}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {patient.tags && patient.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditPatient(patient)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/patients/${patient.id}/sessions`}>
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Sessions</span>
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {patient.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePatient(patient.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Patient Form Dialog */}
      <PatientForm
        isOpen={isPatientFormOpen}
        onOpenChange={setIsPatientFormOpen}
        patient={patientToEdit}
        isEdit={!!patientToEdit}
        onSave={handleSavePatient}
      />
    </Layout>
  );
}
