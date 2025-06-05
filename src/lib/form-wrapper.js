// This is a wrapper module to fix react-hook-form import issues in production
import * as ReactHookForm from 'react-hook-form';

// Re-export everything from react-hook-form
export const useForm = ReactHookForm.useForm;
export const useFormContext = ReactHookForm.useFormContext;
export const useController = ReactHookForm.useController;
export const useFieldArray = ReactHookForm.useFieldArray;
export const useWatch = ReactHookForm.useWatch;
export const Controller = ReactHookForm.Controller;
export const FormProvider = ReactHookForm.FormProvider;

// Export the default object as well
export default ReactHookForm;
