import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createMedicalReport, updateMedicalReport, MedicalReportType2 } from '@/lib/drive';

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

type FormData = Omit<MedicalReportType2, 'id' | 'createdAt' | 'updatedAt' | 'type'>;

interface MedicalReportType2FormProps {
  sessionId: number;
  onSuccess: () => void;
  initialData?: MedicalReportType2;
}

export function MedicalReportType2Form({ sessionId, onSuccess, initialData }: MedicalReportType2FormProps) {
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

  const onSubmit = async (data: FormData) => {
    try {
      if (initialData) {
        await updateMedicalReport({
          ...initialData,
          ...data,
          type: 'type2',
        });
      } else {
        await createMedicalReport({
          ...data,
          type: 'type2',
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving medical report:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="date">Date</label>
        <Input {...form.register('date')} type="date" />
      </div>
      <div>
        <label htmlFor="duration">Duration</label>
        <Input {...form.register('duration')} />
      </div>
      <div>
        <label htmlFor="location">Location</label>
        <Input {...form.register('location')} />
      </div>
      <div>
        <label htmlFor="participantName">Participant Name</label>
        <Input {...form.register('participantName')} />
      </div>
      <div>
        <label htmlFor="sessionObjective">Session Objective</label>
        <Textarea {...form.register('sessionObjective')} />
      </div>
      <div>
        <label htmlFor="topics.withPatient">Topics with Patient</label>
        <Textarea {...form.register('topics.withPatient')} />
      </div>
      <div>
        <label htmlFor="topics.withFamily">Topics with Family</label>
        <Textarea {...form.register('topics.withFamily')} />
      </div>
      <div>
        <label htmlFor="generalObservations">General Observations</label>
        <Textarea {...form.register('generalObservations')} />
      </div>
      <div>
        <label htmlFor="conclusion">Conclusion</label>
        <Textarea {...form.register('conclusion')} />
      </div>
      <div>
        <label htmlFor="signature">Signature</label>
        <Input {...form.register('signature')} />
      </div>
      <Button type="submit">Save Report</Button>
    </form>
  );
} 