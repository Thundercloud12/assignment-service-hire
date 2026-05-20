import { z } from 'zod';

export const generateEmailSchema = z.object({
  leadId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Lead ID format'),
  templateId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Template ID format').optional().nullable(),
});

export type GenerateEmailInput = z.infer<typeof generateEmailSchema>;
