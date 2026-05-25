import { z } from "zod";

export const createSpielSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  departmentId: z.string().min(1, "Department is required"),
  categoryId: z.string().nullable().optional(),
  contentHtml: z.string().min(1, "Content is required"),
  contentJson: z.string().optional(),
  contentPlain: z.string().optional(),
});

export const updateSpielSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  contentHtml: z.string().optional(),
  contentJson: z.string().optional(),
  contentPlain: z.string().optional(),
  status: z.enum(["active", "archived"]).optional(),
  categoryId: z.string().nullable().optional(),
});

export const reviewSpielSchema = z.object({
  action: z.enum(["approve", "reject"]),
  comment: z.string().max(500).optional(),
});
