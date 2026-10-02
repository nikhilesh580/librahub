import prisma from '../config/database';
import {
  BadRequestError,
  NotFoundError,
} from '../utils/errors';
import { createAuditLog } from '../utils/auditLog';
import { TransactionStatus, BookCopyStatus } from '@prisma/client';

export class TransactionService {
  async issueBook(
    data: {
      userId: string;
      bookCopyId: string;
      dueDate?: string;
    },
    issuedBy: string
  ) {
    const settings = await prisma.librarySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      throw new BadRequestError('Library settings not configured');
    }

    // Validate member
    const member = await prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        transactions: { where: { status: 'ISSUED' } },
        fines: { where: { status: 'PENDING' } },
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    if (member.status !== 'ACTIVE') {
      throw new BadRequestError('Member account is not active');
    }

    // Check borrow limit
    if (member.transactions.length >= (member.maxBooks || settings.maxBooksPerMember)) {
      throw new BadRequestError(
        `Member has reached the maximum borrowing limit of ${member.maxBooks || settings.maxBooksPerMember} books`
      );
    }

    // Check for overdue books
    const overdueBooks = member.transactions.filter(
      (t) => new Date(t.dueDate) < new Date()
    );
    if (overdueBooks.length > 0) {
      throw new BadRequestError('Member has overdue books. Please return them first.');
    }

    // Check for unpaid fines
    const totalUnpaidFines = member.fines.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
    if (totalUnpaidFines > 0) {
      throw new BadRequestError(`Member has unpaid fines of $${totalUnpaidFines.toFixed(2)}`);
    }

    // Validate book copy
    const bookCopy = await prisma.bookCopy.findUnique({
      where: { id: data.bookCopyId },
      include: { book: true },
    });

    if (!bookCopy) {
      throw new NotFoundError('Book copy not found');
    }

    if (bookCopy.status !== BookCopyStatus.AVAILABLE) {
      throw new BadRequestError(`Book copy is currently ${bookCopy.status.toLowerCase()}`);
    }

    // Check if the user already has this book
    const existingIssue = await prisma.borrowTransaction.findFirst({
      where: {
        userId: data.userId,
        bookCopy: { bookId: bookCopy.bookId },
        status: 'ISSUED',
      },
    });

    if (existingIssue) {
      throw new BadRequestError('Member already has a copy of this book');
    }

    const dueDate = data.dueDate
      ? new Date(data.dueDate)
      : new Date(Date.now() + settings.maxBorrowDays * 24 * 60 * 60 * 1000);

    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.borrowTransaction.create({
        data: {
          userId: data.userId,
          bookCopyId: data.bookCopyId,
          dueDate,
          status: TransactionStatus.ISSUED,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          bookCopy: {
            include: {
              book: {
                include: {
                  authors: { include: { author: { select: { name: true } } } },
                },
              },
            },
          },
        },
      });

      // Update book copy status
      await tx.bookCopy.update({
        where: { id: data.bookCopyId },
        data: { status: BookCopyStatus.ISSUED },
      });

      // Decrement available copies
      await tx.book.update({
        where: { id: bookCopy.bookId },
        data: { availableCopies: { decrement: 1 } },
      });

      // Cancel any pending reservation for this user and book
      await tx.reservation.updateMany({
        where: {
          userId: data.userId,
          bookId: bookCopy.bookId,
          status: { in: ['PENDING', 'READY'] },
        },
        data: { status: 'FULFILLED' },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: data.userId,
          title: 'Book Issued',
          message: `"${bookCopy.book.title}" has been issued to you. Due date: ${dueDate.toLocaleDateString()}`,
          type: 'BOOK_ISSUED',
        },
      });

      return newTransaction;
    });

    await createAuditLog({
      userId: issuedBy,
      action: 'ISSUE_BOOK',
      entity: 'BorrowTransaction',
      entityId: transaction.id,
      metadata: {
        memberId: data.userId,
        bookCopyId: data.bookCopyId,
        bookTitle: bookCopy.book.title,
      },
    });

    return transaction;
  }

  async returnBook(
    data: {
      transactionId: string;
      condition?: string;
      notes?: string;
    },
    returnedBy: string
  ) {
    const settings = await prisma.librarySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      throw new BadRequestError('Library settings not configured');
    }

    const transaction = await prisma.borrowTransaction.findUnique({
      where: { id: data.transactionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        bookCopy: {
          include: {
            book: {
              include: {
                authors: { include: { author: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.ISSUED && transaction.status !== TransactionStatus.OVERDUE) {
      throw new BadRequestError('This book is not currently issued');
    }

    const now = new Date();
    const dueDate = new Date(transaction.dueDate);
    const overdueDays = Math.max(0, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

    let fineAmount = 0;
    let fineReason: 'OVERDUE' | 'DAMAGED_BOOK' | 'LOST_BOOK' = 'OVERDUE';

    if (overdueDays > 0) {
      fineAmount = overdueDays * settings.finePerDay;
    }

    if (data.condition === 'DAMAGED') {
      fineAmount += settings.damagedBookFine;
      fineReason = 'DAMAGED_BOOK';
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update transaction
      const updatedTransaction = await tx.borrowTransaction.update({
        where: { id: data.transactionId },
        data: {
          returnDate: now,
          status: TransactionStatus.RETURNED,
          notes: data.notes,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          bookCopy: {
            include: {
              book: true,
            },
          },
        },
      });

      // Update book copy
      const newCopyStatus = data.condition === 'DAMAGED'
        ? BookCopyStatus.DAMAGED
        : BookCopyStatus.AVAILABLE;

      await tx.bookCopy.update({
        where: { id: transaction.bookCopyId },
        data: {
          status: newCopyStatus,
          condition: data.condition as any || undefined,
        },
      });

      // Update available copies (only if copy is going back to AVAILABLE)
      if (newCopyStatus === BookCopyStatus.AVAILABLE) {
        await tx.book.update({
          where: { id: transaction.bookCopy.bookId },
          data: { availableCopies: { increment: 1 } },
        });
      }

      // Create fine if applicable
      let fine = null;
      if (fineAmount > 0) {
        fine = await tx.fine.create({
          data: {
            transactionId: data.transactionId,
            userId: transaction.userId,
            amount: fineAmount,
            reason: fineReason,
            status: 'PENDING',
          },
        });

        await tx.notification.create({
          data: {
            userId: transaction.userId,
            title: 'Fine Generated',
            message: `A fine of $${fineAmount.toFixed(2)} has been generated for "${transaction.bookCopy.book.title}". Reason: ${fineReason.replace('_', ' ').toLowerCase()}.`,
            type: 'FINE_GENERATED',
          },
        });
      }

      // Check for pending reservations and notify next in queue
      const nextReservation = await tx.reservation.findFirst({
        where: {
          bookId: transaction.bookCopy.bookId,
          status: 'PENDING',
        },
        orderBy: { queuePosition: 'asc' },
        include: { user: true },
      });

      if (nextReservation && newCopyStatus === BookCopyStatus.AVAILABLE) {
        await tx.reservation.update({
          where: { id: nextReservation.id },
          data: { status: 'READY' },
        });

        await tx.notification.create({
          data: {
            userId: nextReservation.userId,
            title: 'Reservation Ready',
            message: `"${transaction.bookCopy.book.title}" is now available for pickup.`,
            type: 'RESERVATION_AVAILABLE',
          },
        });
      }

      // Create return notification
      await tx.notification.create({
        data: {
          userId: transaction.userId,
          title: 'Book Returned',
          message: `"${transaction.bookCopy.book.title}" has been returned successfully.`,
          type: 'BOOK_RETURNED',
        },
      });

      return { transaction: updatedTransaction, fine, overdueDays };
    });

    await createAuditLog({
      userId: returnedBy,
      action: 'RETURN_BOOK',
      entity: 'BorrowTransaction',
      entityId: data.transactionId,
      metadata: {
        memberId: transaction.userId,
        overdueDays,
        fineAmount,
      },
    });

    return result;
  }

  async renewBook(transactionId: string, userId: string) {
    const settings = await prisma.librarySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      throw new BadRequestError('Library settings not configured');
    }

    const transaction = await prisma.borrowTransaction.findUnique({
      where: { id: transactionId },
      include: {
        bookCopy: {
          include: { book: true },
        },
        user: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.ISSUED) {
      throw new BadRequestError('Only issued books can be renewed');
    }

    // Check renewal limit
    if (transaction.renewalCount >= settings.maxRenewals) {
      throw new BadRequestError(
        `Maximum renewals (${settings.maxRenewals}) reached for this book`
      );
    }

    // Check if book is overdue
    if (new Date(transaction.dueDate) < new Date()) {
      throw new BadRequestError('Cannot renew an overdue book. Please return it first.');
    }

    // Check if the user's account is blocked
    if (transaction.user.status !== 'ACTIVE') {
      throw new BadRequestError('Account is not active');
    }

    // Check if another user has reserved this book
    const pendingReservation = await prisma.reservation.findFirst({
      where: {
        bookId: transaction.bookCopy.bookId,
        status: 'PENDING',
        userId: { not: transaction.userId },
      },
    });

    if (pendingReservation) {
      throw new BadRequestError('Cannot renew. Another user has reserved this book.');
    }

    const newDueDate = new Date(transaction.dueDate);
    newDueDate.setDate(newDueDate.getDate() + settings.renewalDays);

    const updated = await prisma.borrowTransaction.update({
      where: { id: transactionId },
      data: {
        dueDate: newDueDate,
        renewalCount: { increment: 1 },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        bookCopy: {
          include: { book: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: transaction.userId,
        title: 'Book Renewed',
        message: `"${transaction.bookCopy.book.title}" has been renewed. New due date: ${newDueDate.toLocaleDateString()}`,
        type: 'BOOK_ISSUED',
      },
    });

    await createAuditLog({
      userId,
      action: 'RENEW_BOOK',
      entity: 'BorrowTransaction',
      entityId: transactionId,
      metadata: {
        renewalCount: updated.renewalCount,
        newDueDate,
      },
    });

    return updated;
  }

  async getTransactions(params: {
    page?: number;
    limit?: number;
    status?: TransactionStatus;
    userId?: string;
    search?: string;
  }) {
    const { page = 1, limit = 10, status, userId, search } = params;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { bookCopy: { accessionNumber: { contains: search } } },
        { bookCopy: { book: { title: { contains: search } } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.borrowTransaction.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          bookCopy: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  isbn: true,
                  coverImage: true,
                  authors: { include: { author: { select: { name: true } } } },
                },
              },
            },
          },
          fines: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.borrowTransaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async getTransactionById(id: string) {
    const transaction = await prisma.borrowTransaction.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        bookCopy: {
          include: {
            book: {
              include: {
                authors: { include: { author: true } },
                category: true,
              },
            },
          },
        },
        fines: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    return transaction;
  }

  async getUserTransactions(userId: string, params: {
    page?: number;
    limit?: number;
    status?: TransactionStatus;
  }) {
    return this.getTransactions({ ...params, userId });
  }
}

export const transactionService = new TransactionService();
