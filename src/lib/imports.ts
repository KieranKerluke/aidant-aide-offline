/**
 * Centralized imports for problematic packages
 * This helps resolve module specifier issues in production builds
 */

// Re-export react-hook-form
import * as ReactHookForm from 'react-hook-form';
export { ReactHookForm };

// Re-export hookform resolvers
import * as HookFormResolvers from '@hookform/resolvers/zod';
export { HookFormResolvers };

// Export individual items for convenience
export const { useForm, useController, useFormContext, FormProvider } = ReactHookForm;
export const { zodResolver } = HookFormResolvers;
