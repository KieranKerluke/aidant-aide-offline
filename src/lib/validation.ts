import { z } from 'zod';
import DOMPurify from 'dompurify';

// Patient validation schema
export const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
  address: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

// Session validation schema
export const sessionSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  date: z.string().datetime("Invalid date"),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(480, "Duration cannot exceed 8 hours"),
  notes: z.string().max(1000).optional(),
  location: z.string().max(100).optional(),
});

// Document validation schema
export const documentSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  title: z.string().min(1, "Title is required").max(100),
  type: z.string().min(1, "Type is required").max(50),
  content: z.string().max(10000).optional(),
  fileUrl: z.string().url("Invalid URL").optional(),
});

// Appointment validation schema
export const appointmentSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  date: z.string().datetime("Invalid date"),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(480, "Duration cannot exceed 8 hours"),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(1000).optional(),
  location: z.string().max(100).optional(),
});

// Helper function to validate data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(", "));
    }
    throw error;
  }
}

// Sanitize HTML input using DOMPurify
export function sanitizeHtml(html: string): string {
  // Using DOMPurify to properly sanitize HTML and prevent XSS
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'style']
  });
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // First, encode all HTML entities
  const encoded = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Then use DOMPurify as an additional layer of protection
  return DOMPurify.sanitize(encoded, {
    ALLOWED_TAGS: [], // No HTML tags allowed in regular input
    KEEP_CONTENT: true
  });
}