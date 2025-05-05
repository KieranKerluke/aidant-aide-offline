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
import { FamilyReportType2, createFamilyReport, updateFamilyReport } from "@/lib/db";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface FamilyReportType2FormProps {
  sessionId: number;
  report: FamilyReportType2 | null;
  onSaved: (report: FamilyReportType2) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  duration: z.string().min(1, "Duration is required"),
  location: z.string().min(1, "Location is required"),
  participantName: z.string().min(1, "Participant name is required"),
  sessionObjective: z.string().min(1, "Session objective is required"),
  topicsWithPatient: z.string().min(1, "Topics with patient are required"),
  topicsWithFamily: z.string().min(1, "Topics with family are required"),
  generalObservations: z.string().min(1, "General observations are required"),
  conclusion: z.string().min(1, "Conclusion is required"),
  signature: z.string().min(1, "Signature is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function FamilyReportType2Form({ sessionId, report, onSaved, onCancel }: FamilyReportType2FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: report?.date || "",
      duration: report?.duration || "",
      location: report?.location || "",
      participantName: report?.participantName || "",
      sessionObjective: report?.sessionObjective || "",
      topicsWithPatient: report?.topics.withPatient || "",
      topicsWithFamily: report?.topics.withFamily || "",
      generalObservations: report?.generalObservations || "",
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
        sessionObjective: report.sessionObjective,
        topicsWithPatient: report.topics.withPatient,
        topicsWithFamily: report.topics.withFamily,
        generalObservations: report.generalObservations,
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
        sessionObjective: data.sessionObjective,
        topics: {
          withPatient: data.topicsWithPatient,
          withFamily: data.topicsWithFamily,
        },
        generalObservations: data.generalObservations,
        conclusion: data.conclusion,
        signature: data.signature,
      };
      
      let savedReport;
      
      if (report?.id) {
        savedReport = await updateFamilyReport({
          ...reportData,
          id: report.id,
          createdAt: report.createdAt,
          updatedAt: new Date().toISOString()
        });
      } else {
        savedReport = await createFamilyReport(reportData);
      }
      
      onSaved(savedReport as FamilyReportType2);
    } catch (error) {
      console.error("Error saving family report type 2:", error);
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
              {report ? "Edit Family Report Type 2" : "Create Family Report Type 2"}
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
                name="sessionObjective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectif de la séance</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the session objective"
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
                name="topicsWithPatient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thèmes abordés avec le patient</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List topics discussed with the patient"
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
                name="topicsWithFamily"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thèmes abordés avec la famille</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List topics discussed with the family"
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
                name="generalObservations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations générales</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your general observations"
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
                    <FormLabel>Conclusion</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your conclusion"
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