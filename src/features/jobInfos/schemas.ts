import { experienceLevels } from "@/drizzle/schema";
import z from "zod";

export const jobInfoSchema = z
  .object({
    name: z.string().min(1, "Required"),
    title: z.string().min(1).nullable(),
    experienceLevel: z.enum(experienceLevels),
    technologies: z.array(z.string()),
    description: z.string(),
    hasResume: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // Description is required only when no resume is uploaded
    if (
      !data.hasResume &&
      (!data.description || data.description.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["description"],
      });
    }
  });
