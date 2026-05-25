import { z } from "zod";

export const createVariableSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

export const updateVariableSchema = z.object({
  key: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
});
