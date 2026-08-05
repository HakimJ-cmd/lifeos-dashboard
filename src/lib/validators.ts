import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
});

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  projectId: z.string().cuid().optional().nullable(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  deadline: z.string().datetime().optional().nullable(),
});

export const projectSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
  // Integrasi GitHub — opsional, dikosongkan/null berarti proyek tidak di-link ke repo apa pun.
  githubOwner: z.string().max(100).regex(/^[a-zA-Z0-9-]*$/).optional().nullable(),
  githubRepo: z.string().max(100).regex(/^[a-zA-Z0-9._-]*$/).optional().nullable(),
  // null = tidak di-assign ke client mana pun.
  clientId: z.string().cuid().optional().nullable(),
});

export const clientSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
});

export const clientUpdateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  email: z.string().email().max(255).optional(),
  // Password opsional saat update — kalau dikosongkan, password lama dipakai lagi.
  password: z.string().min(8).max(200).optional(),
});

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive().max(1_000_000_000),
  transactionDate: z.string().datetime(),
  categoryId: z.string().cuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const budgetLimitSchema = z.object({
  budgetLimit: z.number().nonnegative().max(1_000_000_000),
});
