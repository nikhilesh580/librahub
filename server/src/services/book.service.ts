import prisma from '../config/database';
import { Prisma, BookCopyStatus, BookCopyCondition } from '@prisma/client';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../utils/errors';
import { createAuditLog } from '../utils/auditLog';

export class BookService {
  async getBooks(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    authorId?: string;
    publisherId?: string;
    language?: string;
    availability?: string;
    publishedYear?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      authorId,
      publisherId,
      language,
      availability,
      publishedYear,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.BookWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { isbn: { contains: search } },
        { authors: { some: { author: { name: { contains: search } } } } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (publisherId) where.publisherId = publisherId;
    if (language) where.language = language;
    if (publishedYear) where.publishedYear = publishedYear;
    if (authorId) {
      where.authors = { some: { authorId } };
    }

    if (availability === 'available') {
      where.availableCopies = { gt: 0 };
    } else if (availability === 'unavailable') {
      where.availableCopies = { equals: 0 };
    }

    let orderBy: Prisma.BookOrderByWithRelationInput = {};
    
    switch (sortBy) {
      case 'title':
        orderBy = { title: sortOrder };
        break;
      case 'publishedYear':
        orderBy = { publishedYear: sortOrder };
        break;
      case 'createdAt':
        orderBy = { createdAt: sortOrder };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          publisher: { select: { id: true, name: true } },
          authors: {
            include: {
              author: { select: { id: true, name: true } },
            },
          },
          _count: { select: { copies: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.book.count({ where }),
    ]);

    const formattedBooks = books.map((book) => ({
      ...book,
      authors: book.authors.map((ba) => ba.author),
    }));

    return { books: formattedBooks, total };
  }

  async getBookById(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
        publisher: true,
        authors: {
          include: {
            author: true,
          },
        },
        copies: {
          orderBy: { accessionNumber: 'asc' },
        },
        reservations: {
          where: { status: { in: ['PENDING', 'READY'] } },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { queuePosition: 'asc' },
        },
      },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    return {
      ...book,
      authors: book.authors.map((ba) => ba.author),
    };
  }

  async createBook(
    data: {
      isbn: string;
      title: string;
      description?: string;
      coverImage?: string;
      publisherId?: string;
      categoryId?: string;
      authorIds?: string[];
      publishedYear?: number;
      language?: string;
      pages?: number;
    },
    userId: string
  ) {
    const existingBook = await prisma.book.findUnique({
      where: { isbn: data.isbn },
    });

    if (existingBook) {
      throw new ConflictError('A book with this ISBN already exists');
    }

    const { authorIds, ...bookData } = data;

    const book = await prisma.book.create({
      data: {
        ...bookData,
        authors: authorIds
          ? {
              create: authorIds.map((authorId) => ({
                authorId,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        publisher: true,
        authors: {
          include: { author: true },
        },
      },
    });

    await createAuditLog({
      userId,
      action: 'CREATE_BOOK',
      entity: 'Book',
      entityId: book.id,
      metadata: { title: book.title, isbn: book.isbn },
    });

    return {
      ...book,
      authors: book.authors.map((ba) => ba.author),
    };
  }

  async updateBook(
    id: string,
    data: {
      isbn?: string;
      title?: string;
      description?: string;
      coverImage?: string;
      publisherId?: string | null;
      categoryId?: string | null;
      authorIds?: string[];
      publishedYear?: number;
      language?: string;
      pages?: number;
    },
    userId: string
  ) {
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Book not found');
    }

    if (data.isbn && data.isbn !== existing.isbn) {
      const duplicateISBN = await prisma.book.findUnique({
        where: { isbn: data.isbn },
      });
      if (duplicateISBN) {
        throw new ConflictError('A book with this ISBN already exists');
      }
    }

    const { authorIds, ...bookData } = data;

    const book = await prisma.$transaction(async (tx) => {
      if (authorIds !== undefined) {
        await tx.bookAuthor.deleteMany({ where: { bookId: id } });
        if (authorIds.length > 0) {
          await tx.bookAuthor.createMany({
            data: authorIds.map((authorId) => ({ bookId: id, authorId })),
          });
        }
      }

      return tx.book.update({
        where: { id },
        data: bookData,
        include: {
          category: true,
          publisher: true,
          authors: { include: { author: true } },
        },
      });
    });

    await createAuditLog({
      userId,
      action: 'UPDATE_BOOK',
      entity: 'Book',
      entityId: id,
      metadata: { title: book.title },
    });

    return {
      ...book,
      authors: book.authors.map((ba) => ba.author),
    };
  }

  async deleteBook(id: string, userId: string) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: { where: { status: 'ISSUED' } },
      },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    if (book.copies.length > 0) {
      throw new BadRequestError('Cannot delete a book with issued copies');
    }

    await prisma.book.delete({ where: { id } });

    await createAuditLog({
      userId,
      action: 'DELETE_BOOK',
      entity: 'Book',
      entityId: id,
      metadata: { title: book.title, isbn: book.isbn },
    });
  }

  async addBookCopy(
    data: {
      bookId: string;
      accessionNumber: string;
      condition?: BookCopyCondition;
      shelfLocation?: string;
    },
    userId: string
  ) {
    const book = await prisma.book.findUnique({ where: { id: data.bookId } });
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const existingCopy = await prisma.bookCopy.findUnique({
      where: { accessionNumber: data.accessionNumber },
    });
    if (existingCopy) {
      throw new ConflictError('A copy with this accession number already exists');
    }

    const copy = await prisma.$transaction(async (tx) => {
      const newCopy = await tx.bookCopy.create({
        data: {
          bookId: data.bookId,
          accessionNumber: data.accessionNumber,
          condition: data.condition || 'NEW',
          shelfLocation: data.shelfLocation,
          status: 'AVAILABLE',
        },
      });

      await tx.book.update({
        where: { id: data.bookId },
        data: {
          totalCopies: { increment: 1 },
          availableCopies: { increment: 1 },
        },
      });

      return newCopy;
    });

    await createAuditLog({
      userId,
      action: 'ADD_BOOK_COPY',
      entity: 'BookCopy',
      entityId: copy.id,
      metadata: { bookId: data.bookId, accessionNumber: data.accessionNumber },
    });

    return copy;
  }

  async addMultipleCopies(
    data: {
      bookId: string;
      copies: Array<{
        accessionNumber: string;
        condition?: BookCopyCondition;
        shelfLocation?: string;
      }>;
    },
    userId: string
  ) {
    const book = await prisma.book.findUnique({ where: { id: data.bookId } });
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdCopies = [];
      for (const copyData of data.copies) {
        const copy = await tx.bookCopy.create({
          data: {
            bookId: data.bookId,
            accessionNumber: copyData.accessionNumber,
            condition: copyData.condition || 'NEW',
            shelfLocation: copyData.shelfLocation,
            status: 'AVAILABLE',
          },
        });
        createdCopies.push(copy);
      }

      await tx.book.update({
        where: { id: data.bookId },
        data: {
          totalCopies: { increment: data.copies.length },
          availableCopies: { increment: data.copies.length },
        },
      });

      return createdCopies;
    });

    await createAuditLog({
      userId,
      action: 'ADD_MULTIPLE_COPIES',
      entity: 'BookCopy',
      metadata: { bookId: data.bookId, count: data.copies.length },
    });

    return result;
  }

  async updateBookCopy(
    id: string,
    data: {
      status?: BookCopyStatus;
      condition?: BookCopyCondition;
      shelfLocation?: string;
    },
    userId: string
  ) {
    const copy = await prisma.bookCopy.findUnique({
      where: { id },
      include: { book: true },
    });

    if (!copy) {
      throw new NotFoundError('Book copy not found');
    }

    const oldStatus = copy.status;
    
    const updated = await prisma.$transaction(async (tx) => {
      const updatedCopy = await tx.bookCopy.update({
        where: { id },
        data,
      });

      // Update available copies count if status changed
      if (data.status && data.status !== oldStatus) {
        const wasAvailable = oldStatus === 'AVAILABLE';
        const isNowAvailable = data.status === 'AVAILABLE';

        if (wasAvailable && !isNowAvailable) {
          await tx.book.update({
            where: { id: copy.bookId },
            data: { availableCopies: { decrement: 1 } },
          });
        } else if (!wasAvailable && isNowAvailable) {
          await tx.book.update({
            where: { id: copy.bookId },
            data: { availableCopies: { increment: 1 } },
          });
        }
      }

      return updatedCopy;
    });

    await createAuditLog({
      userId,
      action: 'UPDATE_BOOK_COPY',
      entity: 'BookCopy',
      entityId: id,
      metadata: { oldStatus, newStatus: data.status },
    });

    return updated;
  }

  async getBookCopies(bookId: string) {
    return prisma.bookCopy.findMany({
      where: { bookId },
      include: {
        transactions: {
          where: { status: 'ISSUED' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { accessionNumber: 'asc' },
    });
  }
}

export const bookService = new BookService();
