import { z } from "zod"

import { EmailSchema, UserViewSchema } from "../users/users.schemas.ts"

export const SessionUserSchema = UserViewSchema.extend({ permissions: z.array(z.string()) })

export const LoginBody = z.object({
  email: EmailSchema,
  // Upper bound stops absurd payloads from reaching the hash function.
  password: z.string().min(1).max(256),
  remember: z.boolean().default(false),
})

export const DemoBody = z.object({ role: z.string().min(1), remember: z.boolean().default(false) })

export const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(10, "Use at least 10 characters.").max(128),
})

export const AuthConfigResponse = z.object({
  demoLogin: z.boolean(),
  demoRoles: z.array(z.object({ id: z.string(), label: z.string() })),
})
