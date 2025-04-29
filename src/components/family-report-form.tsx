
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
import { FamilyReport, createFamilyReport, updateFamilyReport } from "@/lib/db";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface FamilyReportFormProps {
  sessionId: number;
  report: FamilyReport | null;
  onSaved: (report: FamilyReport) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  objective: z.string().min(1, "Objective is required"),
  topicsWithPatient: z.string().min(1, "Topics with patient are required"),
  topicsWithFamily: z.string().min(1, "Topics with family are required"),
  generalObservations: z.string().min(1, "General observations are required"),
  conclusion: z.string().min(1, "Conclusion is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function FamilyReportForm({ sessionId, report, onSaved, onCancel }: FamilyReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objective: report?.objective || "",
      topicsWithPatient: report?.topicsWithPatient || "",
      topicsWithFamily: report?.topicsWithFamily || "",
      generalObservations: report?.generalObservations || "",
      conclusion: report?.conclusion || "",
    }
  });

  useEffect(() => {
    if (report) {
      form.reset({
        objective: report.objective,
        topicsWithPatient: report.topicsWithPatient,
        topicsWithFamily: report.topicsWithFamily,
        generalObservations: report.generalObservations,
        conclusion: report.conclusion,
      });
    }
  }, [report, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const reportData = {
        sessionId,
        objective: data.objective,
        topicsWithPatient: data.topicsWithPatient,
        topicsWithFamily: data.topicsWithFamily,
        generalObservations: data.generalObservations,
        conclusion: data.conclusion,
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
      
      onSaved(savedReport);
    } catch (error) {
      console.error("Error saving family report:", error);
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
              {report ? "Edit Family Report" : "Create Family Report"}
            </h2>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectif de la séance (Session Objective)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the objective of the family session"
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
                    <FormLabel>Thèmes abordés avec le patient (Topics with Patient)</FormLabel>
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
                    <FormLabel>Thèmes abordés avec la famille (Topics with Family)</FormLabel>
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
                    <FormLabel>Observations générales (General Observations)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Document general observations from the session"
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
                        placeholder="Write a conclusion for the family session"
                        className="min-h-[100px]"
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
