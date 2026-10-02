import { z } from 'zod';

export const createBookSchema = z.object({
  body: z.object({
    isbn: z.string().min(10, 'ISBN must be at least 10 characters').max(17),
    title: z.string().min(1, 'Title is required').max(500),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    publisherId: z.string().optional(),
    categoryId: z.string().optional(),
    authorIds: z.array(z.string()).optional(),
    publishedYear: z.number().int().optional(),
    language: z.string().optional(),
    pages: z.number().int().positive().optional(),
  }),
});

export const updateBookSchema = z.object({
  body: z.object({
    isbn: z.string().min(10).max(17).optional(),
    title: z.string().min(1).max(500).optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    publisherId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    authorIds: z.array(z.string()).optional(),
    publishedYear: z.number().int().optional(),
    language: z.string().optional(),
    pages: z.number().int().positive().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const addBookCopySchema = z.object({
  body: z.object({
    bookId: z.string(),
    accessionNumber: z.string().min(1, 'Accession number is required'),
    condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']).optional(),
    shelfLocation: z.string().optional(),
  }),
});

export const addMultipleCopiesSchema = z.object({
  body: z.object({
    bookId: z.string(),
    copies: z.array(z.object({
      accessionNumber: z.string().min(1),
      condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']).optional(),
      shelfLocation: z.string().optional(),
    })).min(1, 'At least one copy is required'),
  }),
});

export const updateBookCopySchema = z.object({
  body: z.object({
    status: z.enum(['AVAILABLE', 'ISSUED', 'RESERVED', 'LOST', 'DAMAGED', 'MAINTENANCE']).optional(),
    condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']).optional(),
    shelfLocation: z.string().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});
