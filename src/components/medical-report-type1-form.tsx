import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createMedicalReport, updateMedicalReport, MedicalReportType1 } from '@/lib/drive';

const formSchema = z.object({
  sessionId: z.number(),
  date: z.string(),
  duration: z.string(),
  location: z.string(),
  participantName: z.string(),
  patientSituation: z.string(),
  familySituation: z.string(),
  observations: z.string(),
  conclusion: z.string(),
  signature: z.string(),
});

type FormData = Omit<MedicalReportType1, 'id' | 'createdAt' | 'updatedAt' | 'type'>;

interface MedicalReportType1FormProps {
  sessionId: number;
  onSuccess: () => void;
  initialData?: MedicalReportType1;
}

export function MedicalReportType1Form({ sessionId, onSuccess, initialData }: MedicalReportType1FormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      sessionId,
      date: new Date().toISOString().split('T')[0],
      duration: '',
      location: '',
      participantName: '',
      patientSituation: '',
      familySituation: '',
      observations: '',
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
          type: 'type1',
        });
      } else {
        await createMedicalReport({
          ...data,
          type: 'type1',
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
        <label htmlFor="patientSituation">Patient Situation</label>
        <Textarea {...form.register('patientSituation')} />
      </div>
      <div>
        <label htmlFor="familySituation">Family Situation</label>
        <Textarea {...form.register('familySituation')} />
      </div>
      <div>
        <label htmlFor="observations">Observations</label>
        <Textarea {...form.register('observations')} />
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