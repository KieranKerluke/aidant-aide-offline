import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MedicalReportType1, createMedicalReport, updateMedicalReport } from "@/lib/db";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface MedicalReportType1FormProps {
  sessionId: number;
  report: MedicalReportType1 | null;
  onSaved: (report: MedicalReportType1) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  duration: z.string().min(1, "Duration is required"),
  location: z.string().min(1, "Location is required"),
  participantName: z.string().min(1, "Participant name is required"),
  patientSituation: z.string().min(1, "Patient situation is required"),
  familySituation: z.string().min(1, "Family situation is required"),
  observations: z.string().min(1, "Observations are required"),
  conclusion: z.string().min(1, "Conclusion is required"),
  signature: z.string().min(1, "Signature is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function MedicalReportType1Form({ sessionId, report, onSaved, onCancel }: MedicalReportType1FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: report?.date || "",
      duration: report?.duration || "",
      location: report?.location || "",
      participantName: report?.participantName || "",
      patientSituation: report?.patientSituation || "",
      familySituation: report?.familySituation || "",
      observations: report?.observations || "",
      conclusion: report?.conclusion || "",
      signature: report?.signature || "Achraf Chefchaouni\nPair aidant en santé mentale",
    }
  });

  useEffect(() => {
    if (report) {
      form.reset({
        date: report.date,
        duration: report.duration,
        location: report.location,
        participantName: report.participantName,
        patientSituation: report.patientSituation,
        familySituation: report.familySituation,
        observations: report.observations,
        conclusion: report.conclusion,
        signature: report.signature,
      });
    }
  }, [report, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const reportData = {
        sessionId,
        date: data.date,
        duration: data.duration,
        location: data.location,
        participantName: data.participantName,
        patientSituation: data.patientSituation,
        familySituation: data.familySituation,
        observations: data.observations,
        conclusion: data.conclusion,
        signature: data.signature,
      };
      
      let savedReport;
      
      if (report?.id) {
        savedReport = await updateMedicalReport({
          ...reportData,
          id: report.id,
          createdAt: report.createdAt,
          updatedAt: new Date().toISOString()
        });
      } else {
        savedReport = await createMedicalReport(reportData);
      }
      
      onSaved(savedReport as MedicalReportType1);
    } catch (error) {
      console.error("Error saving medical report type 1:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <h2 className="text-xl font-semibold mb-4">
              {report ? "Edit Medical Report Type 1" : "Create Medical Report Type 1"}
            </h2>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de la séance</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the session date"
                        className="min-h-[50px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée de séance</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the session duration"
                        className="min-h-[50px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu de la séance</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the session location"
                        className="min-h-[50px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="participantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du participant</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the participant's name"
                        className="min-h-[50px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="patientSituation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situation du patient</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the patient's situation"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="familySituation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situation familiale</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the family situation"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your observations"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="conclusion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conclusion et recommandations</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your conclusion and recommendations"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="signature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Signature</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your signature"
                        className="min-h-[50px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Report"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 