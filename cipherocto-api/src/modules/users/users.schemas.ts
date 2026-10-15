import { z } from "zod"

export const EmailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254))

/** What a browser may see about a user. Never includes the password hash. */
export const UserViewSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  status: z.enum(["active", "suspended"]),
  role: z.object({ id: z.string(), label: z.string() }),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
})

export type UserView = z.infer<typeof UserViewSchema>

export const CreateUserBody = z.object({
  email: EmailSchema,
  name: z.string().trim().min(1, "Enter a name.").max(120),
  roleId: z.string().min(1),
  password: z.string().min(10, "Use at least 10 characters.").max(128),
})

export const UpdateUserBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    roleId: z.string().min(1).optional(),
    status: z.enum(["active", "suspended"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update.")

export const UserIdParams = z.object({ id: z.string().min(1) })
