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
  MedicalReportType1,
  MedicalReportType2,
  FamilyReportType1,
  FamilyReportType2,
  getMedicalReportBySession,
  getFamilyReportBySession
} from "@/lib/drive";
import { toast } from "@/components/ui/use-toast";
import { MedicalReportType1Form } from "@/components/medical-report-type1-form";
import { MedicalReportType2Form } from "@/components/medical-report-type2-form";
import { FamilyReportType1Form } from "@/components/family-report-type1-form";
import { FamilyReportType2Form } from "@/components/family-report-type2-form";
import { saveAs } from "file-saver";
import { Document as DocxDocument, Packer, Paragraph, HeadingLevel } from "docx";

export default function SessionReports() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalReportType1, setMedicalReportType1] = useState<MedicalReportType1 | null>(null);
  const [medicalReportType2, setMedicalReportType2] = useState<MedicalReportType2 | null>(null);
  const [familyReportType1, setFamilyReportType1] = useState<FamilyReportType1 | null>(null);
  const [familyReportType2, setFamilyReportType2] = useState<FamilyReportType2 | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeReportType, setActiveReportType] = useState<"type1" | "type2">("type1");

  useEffect(() => {
    async function loadData() {
      try {
        if (!id) return;
        
        const sessionData = await getSession(Number(id));
        if (!sessionData) {
          toast({
            title: "Error",
            description: "Session not found",
            variant: "destructive"
          });
          navigate("/sessions");
          return;
        }
        
        setSession(sessionData);
        
        if (sessionData.patientId) {
          const patientData = await getPatient(sessionData.patientId);
          setPatient(patientData || null);
        }
        
        const medicalReport = await getMedicalReportBySession(Number(id));
        if (medicalReport) {
          if (medicalReport.type === 'type1') {
            setMedicalReportType1(medicalReport as MedicalReportType1);
          } else {
            setMedicalReportType2(medicalReport as MedicalReportType2);
          }
        }
        
        const familyReport = await getFamilyReportBySession(Number(id));
        if (familyReport) {
          if (familyReport.type === 'type1') {
            setFamilyReportType1(familyReport as FamilyReportType1);
          } else {
            setFamilyReportType2(familyReport as FamilyReportType2);
          }
        }
      } catch (error) {
        console.error("Error loading session data:", error);
        toast({
          title: "Error",
          description: "Failed to load session data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [id, navigate]);

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
  const generateMedicalReportType1Doc = (report: MedicalReportType1) => {
    return new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({ text: "Rapport psy : Séance de pair aidance", heading: HeadingLevel.TITLE }),
            new Paragraph({ text: `Date de la séance: ${report.date}` }),
            new Paragraph({ text: `Durée de séance: ${report.duration}` }),
            new Paragraph({ text: `Lieu de la séance: ${report.location}` }),
            new Paragraph({ text: `Nom du participant: ${report.participantName}` }),
            new Paragraph({ text: `Situation du patient: ${report.patientSituation}` }),
            new Paragraph({ text: `Situation familiale: ${report.familySituation}` }),
            new Paragraph({ text: `Observations: ${report.observations}` }),
            new Paragraph({ text: `Conclusion et recommandations: ${report.conclusion}` }),
            new Paragraph({ text: `Signature: ${report.signature}` }),
          ],
        },
      ],
    });
  };

  const generateMedicalReportType2Doc = (report: MedicalReportType2) => {
    return new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({ text: "Rapport : Séance d'évaluation", heading: HeadingLevel.TITLE }),
            new Paragraph({ text: `Date de la séance: ${report.date}` }),
            new Paragraph({ text: `Durée de séance: ${report.duration}` }),
            new Paragraph({ text: `Lieu de la séance: ${report.location}` }),
            new Paragraph({ text: `Nom du participant: ${report.participantName}` }),
            new Paragraph({ text: `Objectif de la séance: ${report.sessionObjective}` }),
            new Paragraph({ text: `Thèmes abordés avec le patient: ${report.topics.withPatient}` }),
            new Paragraph({ text: `Thèmes abordés avec la famille: ${report.topics.withFamily}` }),
            new Paragraph({ text: `Observations générales: ${report.generalObservations}` }),
            new Paragraph({ text: `Conclusion: ${report.conclusion}` }),
            new Paragraph({ text: `Signature: ${report.signature}` }),
          ],
        },
      ],
    });
  };

  const generateFamilyReportType1Doc = (report: FamilyReportType1) => {
    return new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({ text: "Rapport Famille : Séance de pair aidance", heading: HeadingLevel.TITLE }),
            new Paragraph({ text: `Date de la séance: ${report.date}` }),
            new Paragraph({ text: `Durée de séance: ${report.duration}` }),
            new Paragraph({ text: `Lieu de la séance: ${report.location}` }),
            new Paragraph({ text: `Nom du participant: ${report.participantName}` }),
            new Paragraph({ text: `Situation familiale: ${report.familySituation}` }),
            new Paragraph({ text: `Observations: ${report.observations}` }),
            new Paragraph({ text: `Conclusion et recommandations: ${report.conclusion}` }),
            new Paragraph({ text: `Signature: ${report.signature}` }),
          ],
        },
      ],
    });
  };

  const generateFamilyReportType2Doc = (report: FamilyReportType2) => {
    return new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({ text: "Rapport Famille : Séance d'évaluation", heading: HeadingLevel.TITLE }),
            new Paragraph({ text: `Date de la séance: ${report.date}` }),
            new Paragraph({ text: `Durée de séance: ${report.duration}` }),
            new Paragraph({ text: `Lieu de la séance: ${report.location}` }),
            new Paragraph({ text: `Nom du participant: ${report.participantName}` }),
            new Paragraph({ text: `Objectif de la séance: ${report.sessionObjective}` }),
            new Paragraph({ text: `Thèmes abordés avec le patient: ${report.topics.withPatient}` }),
            new Paragraph({ text: `Thèmes abordés avec la famille: ${report.topics.withFamily}` }),
            new Paragraph({ text: `Observations générales: ${report.generalObservations}` }),
            new Paragraph({ text: `Conclusion: ${report.conclusion}` }),
            new Paragraph({ text: `Signature: ${report.signature}` }),
          ],
        },
      ],
    });
  };

  const handleExportMedicalReport = async () => {
    if (activeReportType === "type1" && medicalReportType1) {
      const doc = generateMedicalReportType1Doc(medicalReportType1);
      const blob = await Packer.toBlob(doc);
      const filename = `Medical_Report_Type1_${format(new Date(session?.date ?? Date.now()), "yyyy-MM-dd")}.docx`;
      saveAs(blob, filename);
    } else if (activeReportType === "type2" && medicalReportType2) {
      const doc = generateMedicalReportType2Doc(medicalReportType2);
      const blob = await Packer.toBlob(doc);
      const filename = `Medical_Report_Type2_${format(new Date(session?.date ?? Date.now()), "yyyy-MM-dd")}.docx`;
      saveAs(blob, filename);
    }
  };

  const handleExportFamilyReport = async () => {
    if (activeReportType === "type1" && familyReportType1) {
      const doc = generateFamilyReportType1Doc(familyReportType1);
      const blob = await Packer.toBlob(doc);
      const filename = `Family_Report_Type1_${format(new Date(session?.date ?? Date.now()), "yyyy-MM-dd")}.docx`;
      saveAs(blob, filename);
    } else if (activeReportType === "type2" && familyReportType2) {
      const doc = generateFamilyReportType2Doc(familyReportType2);
      const blob = await Packer.toBlob(doc);
      const filename = `Family_Report_Type2_${format(new Date(session?.date ?? Date.now()), "yyyy-MM-dd")}.docx`;
      saveAs(blob, filename);
    }
  };

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
    <Layout title="Session Reports">
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate("/sessions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {patient ? patient.name : "Unknown Patient"}
            </h1>
            <p className="text-muted-foreground">
              {session?.date ? format(new Date(session.date), "PPP") : "No date"}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medicalReport">Medical Report</TabsTrigger>
            <TabsTrigger value="familyReport">Family Report</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Report</CardTitle>
                  <CardDescription>
                    Clinical evaluation and observations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={activeReportType === "type1" ? "default" : "outline"}
                        onClick={() => setActiveReportType("type1")}
                      >
                        Type 1
                      </Button>
                      <Button
                        variant={activeReportType === "type2" ? "default" : "outline"}
                        onClick={() => setActiveReportType("type2")}
                      >
                        Type 2
                      </Button>
                    </div>
                    {activeReportType === "type1" ? (
                      medicalReportType1 ? (
                        <p>A medical report type 1 has been created for this session.</p>
                      ) : (
                        <p>No medical report type 1 has been created yet for this session.</p>
                      )
                    ) : (
                      medicalReportType2 ? (
                        <p>A medical report type 2 has been created for this session.</p>
                      ) : (
                        <p>No medical report type 2 has been created yet for this session.</p>
                      )
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    onClick={() => setActiveTab("medicalReport")}
                    variant={activeReportType === "type1" ? (medicalReportType1 ? "outline" : "default") : (medicalReportType2 ? "outline" : "default")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {activeReportType === "type1" ? (medicalReportType1 ? "View/Edit Report" : "Create Report") : (medicalReportType2 ? "View/Edit Report" : "Create Report")}
                  </Button>
                  {(activeReportType === "type1" && medicalReportType1) || (activeReportType === "type2" && medicalReportType2) ? (
                    <Button variant="secondary" onClick={handleExportMedicalReport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Word
                    </Button>
                  ) : null}
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
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={activeReportType === "type1" ? "default" : "outline"}
                        onClick={() => setActiveReportType("type1")}
                      >
                        Type 1
                      </Button>
                      <Button
                        variant={activeReportType === "type2" ? "default" : "outline"}
                        onClick={() => setActiveReportType("type2")}
                      >
                        Type 2
                      </Button>
                    </div>
                    {activeReportType === "type1" ? (
                      familyReportType1 ? (
                        <p>A family report type 1 has been created for this session.</p>
                      ) : (
                        <p>No family report type 1 has been created yet for this session.</p>
                      )
                    ) : (
                      familyReportType2 ? (
                        <p>A family report type 2 has been created for this session.</p>
                      ) : (
                        <p>No family report type 2 has been created yet for this session.</p>
                      )
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    onClick={() => setActiveTab("familyReport")}
                    variant={activeReportType === "type1" ? (familyReportType1 ? "outline" : "default") : (familyReportType2 ? "outline" : "default")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {activeReportType === "type1" ? (familyReportType1 ? "View/Edit Report" : "Create Report") : (familyReportType2 ? "View/Edit Report" : "Create Report")}
                  </Button>
                  {(activeReportType === "type1" && familyReportType1) || (activeReportType === "type2" && familyReportType2) ? (
                    <Button variant="secondary" onClick={handleExportFamilyReport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Word
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="medicalReport" className="mt-4">
            {session && (
              activeReportType === "type1" ? (
                <MedicalReportType1Form 
                  sessionId={Number(id)} 
                  initialData={medicalReportType1}
                  onSuccess={() => {
                    setActiveTab("overview");
                    toast({
                      title: "Success",
                      description: "Medical report type 1 saved successfully"
                    });
                  }}
                />
              ) : (
                <MedicalReportType2Form 
                  sessionId={Number(id)} 
                  initialData={medicalReportType2}
                  onSuccess={() => {
                    setActiveTab("overview");
                    toast({
                      title: "Success",
                      description: "Medical report type 2 saved successfully"
                    });
                  }}
                />
              )
            )}
          </TabsContent>
          
          <TabsContent value="familyReport" className="mt-4">
            {session && (
              activeReportType === "type1" ? (
                <FamilyReportType1Form 
                  sessionId={Number(id)} 
                  initialData={familyReportType1}
                  onSuccess={() => {
                    setActiveTab("overview");
                    toast({
                      title: "Success",
                      description: "Family report type 1 saved successfully"
                    });
                  }}
                />
              ) : (
                <FamilyReportType2Form 
                  sessionId={Number(id)} 
                  initialData={familyReportType2}
                  onSuccess={() => {
                    setActiveTab("overview");
                    toast({
                      title: "Success",
                      description: "Family report type 2 saved successfully"
                    });
                  }}
                />
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
