import prisma from '../config/database';
import {
  BadRequestError,
  NotFoundError,
} from '../utils/errors';
import { createAuditLog } from '../utils/auditLog';
import { FineStatus } from '@prisma/client';

export class FineService {
  async getFines(params: {
    page?: number;
    limit?: number;
    status?: FineStatus;
    userId?: string;
  }) {
    const { page = 1, limit = 10, status, userId } = params;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [fines, total] = await Promise.all([
      prisma.fine.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          transaction: {
            include: {
              bookCopy: {
                include: {
                  book: { select: { id: true, title: true, isbn: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fine.count({ where }),
    ]);

    return { fines, total };
  }

  async payFine(id: string, amount: number | undefined, userId: string) {
    const fine = await prisma.fine.findUnique({ where: { id } });

    if (!fine) throw new NotFoundError('Fine not found');

    if (fine.status === 'PAID') {
      throw new BadRequestError('This fine has already been paid');
    }

    if (fine.status === 'WAIVED') {
      throw new BadRequestError('This fine has been waived');
    }

    const remainingAmount = fine.amount - fine.paidAmount;
    const payAmount = amount || remainingAmount;

    if (payAmount > remainingAmount) {
      throw new BadRequestError(`Payment amount exceeds remaining fine of $${remainingAmount.toFixed(2)}`);
    }

    const newPaidAmount = fine.paidAmount + payAmount;
    const newStatus = newPaidAmount >= fine.amount ? 'PAID' : 'PARTIALLY_PAID';

    const updated = await prisma.fine.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        transaction: {
          include: {
            bookCopy: {
              include: { book: { select: { title: true } } },
            },
          },
        },
      },
    });

    if (newStatus === 'PAID') {
      await prisma.notification.create({
        data: {
          userId: fine.userId,
          title: 'Fine Paid',
          message: `Your fine of $${fine.amount.toFixed(2)} has been paid in full.`,
          type: 'FINE_PAID',
        },
      });
    }

    await createAuditLog({
      userId,
      action: 'PAY_FINE',
      entity: 'Fine',
      entityId: id,
      metadata: { payAmount, newPaidAmount, newStatus },
    });

    return updated;
  }

  async waiveFine(id: string, notes: string | undefined, userId: string) {
    const fine = await prisma.fine.findUnique({ where: { id } });

    if (!fine) throw new NotFoundError('Fine not found');

    if (fine.status === 'PAID') {
      throw new BadRequestError('Cannot waive a paid fine');
    }

    const updated = await prisma.fine.update({
      where: { id },
      data: {
        status: FineStatus.WAIVED,
        notes: notes || 'Fine waived by administrator',
        paidAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: fine.userId,
        title: 'Fine Waived',
        message: `Your fine of $${fine.amount.toFixed(2)} has been waived.`,
        type: 'FINE_PAID',
      },
    });

    await createAuditLog({
      userId,
      action: 'WAIVE_FINE',
      entity: 'Fine',
      entityId: id,
      metadata: { amount: fine.amount, notes },
    });

    return updated;
  }

  async getUserFines(userId: string) {
    const fines = await prisma.fine.findMany({
      where: { userId },
      include: {
        transaction: {
          include: {
            bookCopy: {
              include: { book: { select: { id: true, title: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalFines: fines.reduce((sum, f) => sum + f.amount, 0),
      paidFines: fines
        .filter((f) => f.status === 'PAID')
        .reduce((sum, f) => sum + f.amount, 0),
      pendingFines: fines
        .filter((f) => f.status === 'PENDING' || f.status === 'PARTIALLY_PAID')
        .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0),
      waivedFines: fines
        .filter((f) => f.status === 'WAIVED')
        .reduce((sum, f) => sum + f.amount, 0),
    };

    return { fines, summary };
  }
}

export const fineService = new FineService();
