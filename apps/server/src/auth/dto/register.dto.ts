import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
