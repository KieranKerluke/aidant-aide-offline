import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Edit, FileText, ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";
import { 
  getSession, 
  getPatient, 
  Session, 
  Patient, 
  MedicalReport, 
  FamilyReport,
  getMedicalReportBySession,
  getFamilyReportBySession
} from "@/lib/db";
import { toast } from "@/components/ui/use-toast";
import { MedicalReportForm } from "@/components/medical-report-form";
import { FamilyReportForm } from "@/components/family-report-form";
import { saveAs } from "file-saver";
import { Document as DocxDocument, Packer, Paragraph, HeadingLevel } from "docx";

export default function SessionReports() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | undefined>();
  const [patient, setPatient] = useState<Patient | undefined>();
  const [medicalReport, setMedicalReport] = useState<MedicalReport | null>(null);
  const [familyReport, setFamilyReport] = useState<FamilyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const sessionData = await getSession(Number(id));
        
        if (!sessionData) {
          toast({
            title: "Error",
            description: "Session not found",
            variant: "destructive"
          });
          navigate("/patients");
          return;
        }
        
        setSession(sessionData);
        
        // Fetch patient data
        if (sessionData.patientId) {
          const patientData = await getPatient(sessionData.patientId);
          setPatient(patientData);
        }
        
        // Fetch reports
        const medical = await getMedicalReportBySession(Number(id));
        setMedicalReport(medical || null);
        
        const family = await getFamilyReportBySession(Number(id));
        setFamilyReport(family || null);
        
      } catch (error) {
        console.error("Error fetching session data:", error);
        toast({
          title: "Error",
          description: "Failed to load session data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleCreateMedicalReport = () => {
    setActiveTab("medicalReport");
  };

  const handleCreateFamilyReport = () => {
    setActiveTab("familyReport");
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

  // ----- Export to Word helpers -----
  const generateMedicalReportDoc = (report: MedicalReport) => {
    return new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({ text: "Medical Report", heading: HeadingLevel.TITLE }),
            new Paragraph({ text: `Objectives: ${report.objectives}` }),
            new Paragraph({ text: `Example: ${report.example}` }),
            new Paragraph({ text: `Topics: ${report.topics}` }),
            new Paragraph({ text: `Emotional State (Beginning): ${report.emotionalState.beginning}` }),
            new Paragraph({ text: `Emotional State (End): ${report.emotionalState.end}` }),
            new Paragraph({ text: `Expression Ability: ${report.expressionAbility}` }),
            new Paragraph({ text: `Intervention Reactions: ${report.interventionReactions}` }),
            new Paragraph({ text: `Observed Progress: ${report.observedProgress}` }),
            new Paragraph({ text: `Obstacles (Emotional): ${report.obstacles.emotional}` }),
            new Paragraph({ text: `Obstacles (Family Communication): ${report.obstacles.familyCommunication}` }),
            new Paragraph({ text: `Obstacles (External Factors): ${report.obstacles.externalFactors}` }),
            new Paragraph({ text: `Recommendations (Patient): ${report.recommendations.patient}` }),
            new Paragraph({ text: `Recommendations (Family): ${report.recommendations.family}` }),
            new Paragraph({ text: `Conclusion: ${report.conclusion}` }),
          ],
        },
      ],
    });
  };

  const generateFamilyReportDoc = (report: FamilyReport) => {
    return new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({ text: "Family Report", heading: HeadingLevel.TITLE }),
            new Paragraph({ text: `Objective: ${report.objective}` }),
            new Paragraph({ text: `Topics With Patient: ${report.topicsWithPatient}` }),
            new Paragraph({ text: `Topics With Family: ${report.topicsWithFamily}` }),
            new Paragraph({ text: `General Observations: ${report.generalObservations}` }),
            new Paragraph({ text: `Conclusion: ${report.conclusion}` }),
          ],
        },
      ],
    });
  };

  const handleExportMedicalReport = async () => {
    if (!medicalReport) return;
    const doc = generateMedicalReportDoc(medicalReport);
    const blob = await Packer.toBlob(doc);
    const filename = `Medical_Report_${format(new Date(session?.date ?? Date.now()), "yyyy-MM-dd")}.docx`;
    saveAs(blob, filename);
  };

  const handleExportFamilyReport = async () => {
    if (!familyReport) return;
    const doc = generateFamilyReportDoc(familyReport);
    const blob = await Packer.toBlob(doc);
    const filename = `Family_Report_${format(new Date(session?.date ?? Date.now()), "yyyy-MM-dd")}.docx`;
    saveAs(blob, filename);
  };
  // ----- End helpers -----

  if (isLoading) {
    return (
      <Layout title="Session Reports">
        <div className="flex justify-center p-8">
          <p>Loading session data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={session ? `Session Reports - ${format(new Date(session.date), "PP")}` : "Session Reports"}>
      <div className="space-y-4">
        <div>
          <Link 
            to={patient ? `/patients/${patient.id}/sessions` : "/patients"} 
            className="text-sm text-muted-foreground hover:underline flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {patient ? `Back to ${patient.name}'s Sessions` : "Back"}
          </Link>
          
          {session && (
            <h2 className="text-2xl font-semibold mt-2">
              Session on {format(new Date(session.date), "PPPP")}
              {patient && <span className="text-lg text-muted-foreground ml-2">with {patient.name}</span>}
            </h2>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medicalReport">Medical Report</TabsTrigger>
            <TabsTrigger value="familyReport">Family Report</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            {session && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p>{format(new Date(session.date), "PPP")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duration</p>
                      <p>{formatDuration(session.duration)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p>{session.location}</p>
                    </div>
                    {patient && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Patient</p>
                        <p>{patient.name}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Report</CardTitle>
                  <CardDescription>
                    Clinical evaluation and observations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {medicalReport ? (
                    <p>A medical report has been created for this session.</p>
                  ) : (
                    <p>No medical report has been created yet for this session.</p>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    onClick={handleCreateMedicalReport}
                    variant={medicalReport ? "outline" : "default"}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {medicalReport ? "View/Edit Report" : "Create Report"}
                  </Button>
                  {medicalReport && (
                    <Button variant="secondary" onClick={handleExportMedicalReport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Word
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Family Report</CardTitle>
                  <CardDescription>
                    Family interactions and observations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {familyReport ? (
                    <p>A family report has been created for this session.</p>
                  ) : (
                    <p>No family report has been created yet for this session.</p>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    onClick={handleCreateFamilyReport}
                    variant={familyReport ? "outline" : "default"}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {familyReport ? "View/Edit Report" : "Create Report"}
                  </Button>
                  {familyReport && (
                    <Button variant="secondary" onClick={handleExportFamilyReport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Word
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="medicalReport" className="mt-4">
            {session && (
              <MedicalReportForm 
                sessionId={Number(id)} 
                report={medicalReport} 
                onSaved={(savedReport) => {
                  setMedicalReport(savedReport);
                  setActiveTab("overview");
                  toast({
                    title: "Success",
                    description: "Medical report saved successfully"
                  });
                }}
                onCancel={() => setActiveTab("overview")}
              />
            )}
          </TabsContent>
          
          <TabsContent value="familyReport" className="mt-4">
            {session && (
              <FamilyReportForm 
                sessionId={Number(id)} 
                report={familyReport}
                onSaved={(savedReport) => {
                  setFamilyReport(savedReport);
                  setActiveTab("overview");
                  toast({
                    title: "Success",
                    description: "Family report saved successfully"
                  });
                }}
                onCancel={() => setActiveTab("overview")}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
