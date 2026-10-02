import prisma from '../config/database';
import {
  BadRequestError,
  NotFoundError,
} from '../utils/errors';
import { createAuditLog } from '../utils/auditLog';

export class ReservationService {
  async createReservation(userId: string, bookId: string) {
    const settings = await prisma.librarySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      throw new BadRequestError('Library settings not configured');
    }

    // Check user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reservations: { where: { status: { in: ['PENDING', 'READY'] } } },
      },
    });

    if (!user) throw new NotFoundError('User not found');
    if (user.status !== 'ACTIVE') throw new BadRequestError('Account is not active');

    // Check reservation limit
    if (user.reservations.length >= settings.maxReservationsPerUser) {
      throw new BadRequestError(
        `Maximum reservation limit of ${settings.maxReservationsPerUser} reached`
      );
    }

    // Check if already reserved
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        userId,
        bookId,
        status: { in: ['PENDING', 'READY'] },
      },
    });

    if (existingReservation) {
      throw new BadRequestError('You already have a reservation for this book');
    }

    // Check if user already has this book
    const hasBook = await prisma.borrowTransaction.findFirst({
      where: {
        userId,
        bookCopy: { bookId },
        status: 'ISSUED',
      },
    });

    if (hasBook) {
      throw new BadRequestError('You already have a copy of this book');
    }

    // Check book exists
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError('Book not found');

    // Get queue position
    const lastReservation = await prisma.reservation.findFirst({
      where: { bookId, status: { in: ['PENDING', 'READY'] } },
      orderBy: { queuePosition: 'desc' },
    });

    const queuePosition = (lastReservation?.queuePosition || 0) + 1;

    const expiryDate = new Date(
      Date.now() + settings.reservationExpiryDays * 24 * 60 * 60 * 1000
    );

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        bookId,
        queuePosition,
        expiryDate,
        status: book.availableCopies > 0 && queuePosition === 1 ? 'READY' : 'PENDING',
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            authors: { include: { author: { select: { name: true } } } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: 'Book Reserved',
        message: `You have reserved "${book.title}". Position in queue: ${queuePosition}.`,
        type: 'GENERAL',
      },
    });

    return reservation;
  }

  async cancelReservation(id: string, userId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { book: true },
    });

    if (!reservation) throw new NotFoundError('Reservation not found');

    if (reservation.userId !== userId) {
      // Only the user or admin/librarian can cancel
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role === 'MEMBER') {
        throw new BadRequestError('You can only cancel your own reservations');
      }
    }

    if (reservation.status !== 'PENDING' && reservation.status !== 'READY') {
      throw new BadRequestError('Only pending or ready reservations can be cancelled');
    }

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Reorder queue
      await tx.reservation.updateMany({
        where: {
          bookId: reservation.bookId,
          status: 'PENDING',
          queuePosition: { gt: reservation.queuePosition },
        },
        data: { queuePosition: { decrement: 1 } },
      });

      // If the cancelled reservation was READY, make the next one ready
      if (reservation.status === 'READY') {
        const next = await tx.reservation.findFirst({
          where: {
            bookId: reservation.bookId,
            status: 'PENDING',
          },
          orderBy: { queuePosition: 'asc' },
        });

        if (next) {
          await tx.reservation.update({
            where: { id: next.id },
            data: { status: 'READY' },
          });

          await tx.notification.create({
            data: {
              userId: next.userId,
              title: 'Reservation Ready',
              message: `"${reservation.book.title}" is now available for pickup.`,
              type: 'RESERVATION_AVAILABLE',
            },
          });
        }
      }
    });

    await createAuditLog({
      userId,
      action: 'CANCEL_RESERVATION',
      entity: 'Reservation',
      entityId: id,
    });
  }

  async getReservations(params: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    bookId?: string;
  }) {
    const { page = 1, limit = 10, status, userId, bookId } = params;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (bookId) where.bookId = bookId;

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
              coverImage: true,
              availableCopies: true,
              authors: { include: { author: { select: { name: true } } } },
            },
          },
        },
        orderBy: [{ bookId: 'asc' }, { queuePosition: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return { reservations, total };
  }

  async expireOldReservations() {
    const expired = await prisma.reservation.findMany({
      where: {
        status: 'READY',
        expiryDate: { lt: new Date() },
      },
      include: { book: true },
    });

    for (const reservation of expired) {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: 'EXPIRED' },
        });

        await tx.notification.create({
          data: {
            userId: reservation.userId,
            title: 'Reservation Expired',
            message: `Your reservation for "${reservation.book.title}" has expired.`,
            type: 'RESERVATION_EXPIRED',
          },
        });

        // Promote next in queue
        const next = await tx.reservation.findFirst({
          where: {
            bookId: reservation.bookId,
            status: 'PENDING',
          },
          orderBy: { queuePosition: 'asc' },
        });

        if (next) {
          await tx.reservation.update({
            where: { id: next.id },
            data: { status: 'READY' },
          });

          await tx.notification.create({
            data: {
              userId: next.userId,
              title: 'Reservation Ready',
              message: `"${reservation.book.title}" is now available for pickup.`,
              type: 'RESERVATION_AVAILABLE',
            },
          });
        }
      });
    }

    return expired.length;
  }
}

export const reservationService = new ReservationService();
