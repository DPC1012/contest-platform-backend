import z from "zod";

export const SignupSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string().min(4),
  role: z.enum(["contestee", "creator"]).default("contestee"),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(4),
});
