
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MedicalReport, createMedicalReport, updateMedicalReport } from "@/lib/db";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface MedicalReportFormProps {
  sessionId: number;
  report: MedicalReport | null;
  onSaved: (report: MedicalReport) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  objectives: z.string().min(1, "Objectives are required"),
  example: z.string().min(1, "Example is required"),
  topics: z.string().min(1, "Topics are required"),
  emotionalStateBeginning: z.string().min(1, "Beginning emotional state is required"),
  emotionalStateEnd: z.string().min(1, "End emotional state is required"),
  expressionAbility: z.string().min(1, "Expression ability is required"),
  interventionReactions: z.string().min(1, "Intervention reactions are required"),
  observedProgress: z.string().min(1, "Observed progress is required"),
  obstaclesEmotional: z.string().min(1, "Emotional obstacles are required"),
  obstaclesFamilyCommunication: z.string().min(1, "Family communication obstacles are required"),
  obstaclesExternalFactors: z.string().min(1, "External obstacles are required"),
  recommendationsPatient: z.string().min(1, "Patient recommendations are required"),
  recommendationsFamily: z.string().min(1, "Family recommendations are required"),
  conclusion: z.string().min(1, "Conclusion is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function MedicalReportForm({ sessionId, report, onSaved, onCancel }: MedicalReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objectives: report?.objectives || "",
      example: report?.example || "",
      topics: report?.topics || "",
      emotionalStateBeginning: report?.emotionalState?.beginning || "",
      emotionalStateEnd: report?.emotionalState?.end || "",
      expressionAbility: report?.expressionAbility || "",
      interventionReactions: report?.interventionReactions || "",
      observedProgress: report?.observedProgress || "",
      obstaclesEmotional: report?.obstacles?.emotional || "",
      obstaclesFamilyCommunication: report?.obstacles?.familyCommunication || "",
      obstaclesExternalFactors: report?.obstacles?.externalFactors || "",
      recommendationsPatient: report?.recommendations?.patient || "",
      recommendationsFamily: report?.recommendations?.family || "",
      conclusion: report?.conclusion || "",
    }
  });

  useEffect(() => {
    if (report) {
      form.reset({
        objectives: report.objectives,
        example: report.example,
        topics: report.topics,
        emotionalStateBeginning: report.emotionalState.beginning,
        emotionalStateEnd: report.emotionalState.end,
        expressionAbility: report.expressionAbility,
        interventionReactions: report.interventionReactions,
        observedProgress: report.observedProgress,
        obstaclesEmotional: report.obstacles.emotional,
        obstaclesFamilyCommunication: report.obstacles.familyCommunication,
        obstaclesExternalFactors: report.obstacles.externalFactors,
        recommendationsPatient: report.recommendations.patient,
        recommendationsFamily: report.recommendations.family,
        conclusion: report.conclusion,
      });
    }
  }, [report, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const reportData = {
        sessionId,
        objectives: data.objectives,
        example: data.example,
        topics: data.topics,
        emotionalState: {
          beginning: data.emotionalStateBeginning,
          end: data.emotionalStateEnd
        },
        expressionAbility: data.expressionAbility,
        interventionReactions: data.interventionReactions,
        observedProgress: data.observedProgress,
        obstacles: {
          emotional: data.obstaclesEmotional,
          familyCommunication: data.obstaclesFamilyCommunication,
          externalFactors: data.obstaclesExternalFactors
        },
        recommendations: {
          patient: data.recommendationsPatient,
          family: data.recommendationsFamily
        },
        conclusion: data.conclusion,
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
      
      onSaved(savedReport);
    } catch (error) {
      console.error("Error saving medical report:", error);
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
              {report ? "Edit Medical Report" : "Create Medical Report"}
            </h2>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="objectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectif des séances (Session Objectives)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the objectives of the session"
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
                name="example"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exemple dans le cas présent (Current Example)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the specific case example"
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
                name="topics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thèmes abordés (Topics Covered)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List the topics discussed during the session"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emotionalStateBeginning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>État émotionnel - début (Emotional State - Beginning)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe emotional state at the beginning"
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
                  name="emotionalStateEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>État émotionnel - fin (Emotional State - End)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe emotional state at the end"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="expressionAbility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacité à exprimer ses pensées (Expression Ability)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Evaluate the patient's ability to express thoughts"
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
                name="interventionReactions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réactions aux interventions (Intervention Reactions)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe reactions to interventions"
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
                name="observedProgress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progrès observés (Observed Progress)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Document any observed progress"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <h3 className="text-lg font-medium pt-4">Obstacles</h3>
              
              <FormField
                control={form.control}
                name="obstaclesEmotional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barrières émotionnelles (Emotional Barriers)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe any emotional barriers"
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
                name="obstaclesFamilyCommunication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problèmes de communication familiale (Family Communication Issues)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe any family communication issues"
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
                name="obstaclesExternalFactors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facteurs externes (External Factors)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe any external factors"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <h3 className="text-lg font-medium pt-4">Recommandations</h3>
              
              <FormField
                control={form.control}
                name="recommendationsPatient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommandations pour le patient (Recommendations for Patient)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter recommendations for the patient"
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
                name="recommendationsFamily"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommandations pour la famille (Recommendations for Family)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter recommendations for the family"
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
                    <FormLabel>Conclusion générale (General Conclusion)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write a general conclusion"
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
