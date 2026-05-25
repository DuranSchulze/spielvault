import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["employee", "admin", "super_admin"]).default("employee"),
  departmentIds: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["employee", "admin", "super_admin"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
  departmentIds: z.array(z.string()).optional(),
});
