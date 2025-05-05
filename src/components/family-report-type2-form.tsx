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
import { FamilyReportType2, createFamilyReport, updateFamilyReport } from "@/lib/drive";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from '@/components/ui/input';

interface FamilyReportType2FormProps {
  sessionId: number;
  onSuccess: () => void;
  initialData?: FamilyReportType2;
}

const formSchema = z.object({
  sessionId: z.number(),
  date: z.string(),
  duration: z.string(),
  location: z.string(),
  participantName: z.string(),
  sessionObjective: z.string(),
  topics: z.object({
    withPatient: z.string(),
    withFamily: z.string(),
  }),
  generalObservations: z.string(),
  conclusion: z.string(),
  signature: z.string(),
});

type FormData = Omit<FamilyReportType2, 'id' | 'createdAt' | 'updatedAt' | 'type'>;

export function FamilyReportType2Form({ sessionId, onSuccess, initialData }: FamilyReportType2FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      sessionId,
      date: new Date().toISOString().split('T')[0],
      duration: '',
      location: '',
      participantName: '',
      sessionObjective: '',
      topics: {
        withPatient: '',
        withFamily: '',
      },
      generalObservations: '',
      conclusion: '',
      signature: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        sessionId,
        date: initialData.date,
        duration: initialData.duration,
        location: initialData.location,
        participantName: initialData.participantName,
        sessionObjective: initialData.sessionObjective,
        topics: {
          withPatient: initialData.topics.withPatient,
          withFamily: initialData.topics.withFamily,
        },
        generalObservations: initialData.generalObservations,
        conclusion: initialData.conclusion,
        signature: initialData.signature,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      if (initialData) {
        await updateFamilyReport({
          ...initialData,
          ...data,
          type: 'type2' as const,
        });
      } else {
        await createFamilyReport({
          ...data,
          type: 'type2' as const,
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving family report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-6 pt-6">
            <h2 className="text-xl font-semibold mb-4">
              {initialData ? "Edit Family Report Type 2" : "Create Family Report Type 2"}
            </h2>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de la séance</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="topics.withPatient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thèmes abordés avec le patient</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="topics.withFamily"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thèmes abordés avec la famille</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
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
                      <Textarea {...field} />
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
                      <Textarea {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Report"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 