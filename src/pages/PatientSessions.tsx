
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { getPatient, Patient, Session, getAllSessionsByPatient } from "@/lib/db";
import { toast } from "@/components/ui/use-toast";
import { SessionDialog } from "@/components/session-dialog";

export default function PatientSessions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | undefined>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const fetchData = async () => {
    if (!id) return;

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
      
      const patientSessions = await getAllSessionsByPatient(Number(id));
      setSessions(patientSessions);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, navigate]);

  const handleAddSession = () => {
    setCurrentSession(null);
    setIsDialogOpen(true);
  };

  const handleEditSession = (session: Session) => {
    setCurrentSession(session);
    setIsDialogOpen(true);
  };

  const handleSaveSession = async () => {
    await fetchData();
    setIsDialogOpen(false);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
  };

  return (
    <Layout title={patient ? `Sessions - ${patient.name}` : "Sessions"}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <Link to="/patients" className="text-sm text-muted-foreground hover:underline">
              ← Back to Patients
            </Link>
            {patient && (
              <h2 className="text-2xl font-semibold mt-2">{patient.name}'s Sessions</h2>
            )}
          </div>
          <Button onClick={handleAddSession}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Session
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <p>Loading sessions...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.length === 0 ? (
              <div className="col-span-full text-center p-8 border rounded-lg">
                <p className="text-muted-foreground mb-4">No sessions recorded for this patient yet.</p>
                <Button onClick={handleAddSession}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Session
                </Button>
              </div>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader className="bg-muted/50 p-4">
                    <CardTitle className="text-lg">
                      Session on {format(new Date(session.date), "PP")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{formatDuration(session.duration)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{session.location}</span>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditSession(session)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => navigate(`/sessions/${session.id}/reports`)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Reports
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      
      {patient && (
        <SessionDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          session={currentSession}
          patientId={Number(id)}
          onSave={handleSaveSession}
        />
      )}
    </Layout>
  );
}
