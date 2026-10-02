import { z } from 'zod';

export const issueBookSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'Member ID is required'),
    bookCopyId: z.string().min(1, 'Book copy ID is required'),
    dueDate: z.string().optional(),
  }),
});

export const returnBookSchema = z.object({
  body: z.object({
    transactionId: z.string().min(1, 'Transaction ID is required'),
    condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']).optional(),
    notes: z.string().optional(),
  }),
});

export const renewBookSchema = z.object({
  body: z.object({
    transactionId: z.string().min(1, 'Transaction ID is required'),
  }),
});

export const createReservationSchema = z.object({
  body: z.object({
    bookId: z.string().min(1, 'Book ID is required'),
  }),
});

export const payFineSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive').optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const waiveFineSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});
