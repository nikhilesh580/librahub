import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { createAuditLog } from '../utils/auditLog';

// ===== Author Service =====
export class AuthorService {
  async getAuthors(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 50, search } = params;
    const where: any = {};
    if (search) {
      where.name = { contains: search };
    }

    const [authors, total] = await Promise.all([
      prisma.author.findMany({
        where,
        include: { _count: { select: { books: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.author.count({ where }),
    ]);
    return { authors, total };
  }

  async createAuthor(data: { name: string; biography?: string }, userId: string) {
    const author = await prisma.author.create({ data });
    await createAuditLog({ userId, action: 'CREATE_AUTHOR', entity: 'Author', entityId: author.id });
    return author;
  }

  async updateAuthor(id: string, data: { name?: string; biography?: string }, userId: string) {
    const existing = await prisma.author.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Author not found');
    const author = await prisma.author.update({ where: { id }, data });
    await createAuditLog({ userId, action: 'UPDATE_AUTHOR', entity: 'Author', entityId: id });
    return author;
  }

  async deleteAuthor(id: string, userId: string) {
    const existing = await prisma.author.findUnique({ where: { id }, include: { _count: { select: { books: true } } } });
    if (!existing) throw new NotFoundError('Author not found');
    if (existing._count.books > 0) throw new BadRequestError('Cannot delete author with associated books');
    await prisma.author.delete({ where: { id } });
    await createAuditLog({ userId, action: 'DELETE_AUTHOR', entity: 'Author', entityId: id });
  }
}

// ===== Category Service =====
export class CategoryService {
  async getCategories(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 50, search } = params;
    const where: any = {};
    if (search) {
      where.name = { contains: search };
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: { _count: { select: { books: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);
    return { categories, total };
  }

  async createCategory(data: { name: string; description?: string }, userId: string) {
    const category = await prisma.category.create({ data });
    await createAuditLog({ userId, action: 'CREATE_CATEGORY', entity: 'Category', entityId: category.id });
    return category;
  }

  async updateCategory(id: string, data: { name?: string; description?: string }, userId: string) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Category not found');
    const category = await prisma.category.update({ where: { id }, data });
    await createAuditLog({ userId, action: 'UPDATE_CATEGORY', entity: 'Category', entityId: id });
    return category;
  }

  async deleteCategory(id: string, userId: string) {
    const existing = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { books: true } } } });
    if (!existing) throw new NotFoundError('Category not found');
    if (existing._count.books > 0) throw new BadRequestError('Cannot delete category with associated books');
    await prisma.category.delete({ where: { id } });
    await createAuditLog({ userId, action: 'DELETE_CATEGORY', entity: 'Category', entityId: id });
  }
}

// ===== Publisher Service =====
export class PublisherService {
  async getPublishers(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 50, search } = params;
    const where: any = {};
    if (search) {
      where.name = { contains: search };
    }

    const [publishers, total] = await Promise.all([
      prisma.publisher.findMany({
        where,
        include: { _count: { select: { books: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.publisher.count({ where }),
    ]);
    return { publishers, total };
  }

  async createPublisher(data: { name: string; email?: string; phone?: string; address?: string }, userId: string) {
    const publisher = await prisma.publisher.create({ data });
    await createAuditLog({ userId, action: 'CREATE_PUBLISHER', entity: 'Publisher', entityId: publisher.id });
    return publisher;
  }

  async updatePublisher(id: string, data: { name?: string; email?: string; phone?: string; address?: string }, userId: string) {
    const existing = await prisma.publisher.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Publisher not found');
    const publisher = await prisma.publisher.update({ where: { id }, data });
    await createAuditLog({ userId, action: 'UPDATE_PUBLISHER', entity: 'Publisher', entityId: id });
    return publisher;
  }

  async deletePublisher(id: string, userId: string) {
    const existing = await prisma.publisher.findUnique({ where: { id }, include: { _count: { select: { books: true } } } });
    if (!existing) throw new NotFoundError('Publisher not found');
    if (existing._count.books > 0) throw new BadRequestError('Cannot delete publisher with associated books');
    await prisma.publisher.delete({ where: { id } });
    await createAuditLog({ userId, action: 'DELETE_PUBLISHER', entity: 'Publisher', entityId: id });
  }
}

// ===== Notification Service =====
export class NotificationService {
  async getNotifications(userId: string, params: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { page = 1, limit = 20, unreadOnly } = params;
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

// ===== Settings Service =====
export class SettingsService {
  async getSettings() {
    let settings = await prisma.librarySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.librarySettings.create({
        data: { id: 'default' },
      });
    }

    return settings;
  }

  async updateSettings(data: any, userId: string) {
    const settings = await prisma.librarySettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    await createAuditLog({
      userId,
      action: 'UPDATE_SETTINGS',
      entity: 'LibrarySettings',
      entityId: 'default',
      metadata: data,
    });

    return settings;
  }
}

// ===== Report Service =====
export class ReportService {
  async getBookInventoryReport() {
    const books = await prisma.book.findMany({
      include: {
        category: { select: { name: true } },
        publisher: { select: { name: true } },
        authors: { include: { author: { select: { name: true } } } },
        _count: {
          select: {
            copies: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    const copiesByStatus = await prisma.bookCopy.groupBy({
      by: ['status'],
      _count: true,
    });

    return { books, copiesByStatus };
  }

  async getBorrowingReport(params: { startDate?: string; endDate?: string; categoryId?: string }) {
    const where: any = {};
    if (params.startDate) where.issueDate = { gte: new Date(params.startDate) };
    if (params.endDate) {
      where.issueDate = { ...where.issueDate, lte: new Date(params.endDate) };
    }

    const transactions = await prisma.borrowTransaction.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        bookCopy: {
          include: {
            book: {
              select: {
                title: true,
                isbn: true,
                categoryId: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    const filtered = params.categoryId
      ? transactions.filter((t) => t.bookCopy.book.categoryId === params.categoryId)
      : transactions;

    return {
      transactions: filtered,
      summary: {
        total: filtered.length,
        issued: filtered.filter((t) => t.status === 'ISSUED').length,
        returned: filtered.filter((t) => t.status === 'RETURNED').length,
        overdue: filtered.filter(
          (t) => t.status === 'ISSUED' && new Date(t.dueDate) < new Date()
        ).length,
      },
    };
  }

  async getOverdueReport() {
    const overdueTransactions = await prisma.borrowTransaction.findMany({
      where: {
        status: 'ISSUED',
        dueDate: { lt: new Date() },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        bookCopy: {
          include: {
            book: { select: { title: true, isbn: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return overdueTransactions.map((t) => ({
      ...t,
      overdueDays: Math.ceil(
        (new Date().getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
  }

  async getFineReport(params: { startDate?: string; endDate?: string }) {
    const where: any = {};
    if (params.startDate) where.createdAt = { gte: new Date(params.startDate) };
    if (params.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(params.endDate) };
    }

    const fines = await prisma.fine.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        transaction: {
          include: {
            bookCopy: {
              include: { book: { select: { title: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalFines: fines.reduce((sum, f) => sum + f.amount, 0),
      collectedFines: fines.reduce((sum, f) => sum + f.paidAmount, 0),
      pendingFines: fines
        .filter((f) => f.status === 'PENDING' || f.status === 'PARTIALLY_PAID')
        .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0),
      waivedFines: fines
        .filter((f) => f.status === 'WAIVED')
        .reduce((sum, f) => sum + f.amount, 0),
      count: fines.length,
    };

    return { fines, summary };
  }

  async getMemberActivityReport() {
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true,
            reservations: true,
            fines: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return members;
  }

  async getAuditLogs(params: { page?: number; limit?: number; entity?: string; action?: string; userId?: string }) {
    const { page = 1, limit = 20, entity, action, userId } = params;
    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}

export const authorService = new AuthorService();
export const categoryService = new CategoryService();
export const publisherService = new PublisherService();
export const notificationService = new NotificationService();
export const settingsService = new SettingsService();
export const reportService = new ReportService();
