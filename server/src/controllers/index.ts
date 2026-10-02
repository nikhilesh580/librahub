import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';
import { reservationService } from '../services/reservation.service';
import { fineService } from '../services/fine.service';
import { memberService } from '../services/member.service';
import { dashboardService } from '../services/dashboard.service';
import {
  authorService, categoryService, publisherService,
  notificationService, settingsService, reportService,
} from '../services/misc.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// ===== Transaction Controller =====
export class TransactionController {
  async issueBook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.issueBook(req.body, req.user!.id);
      sendSuccess(res, result, 'Book issued successfully', 201);
    } catch (error) { next(error); }
  }

  async returnBook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.returnBook(req.body, req.user!.id);
      sendSuccess(res, result, 'Book returned successfully');
    } catch (error) { next(error); }
  }

  async renewBook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.renewBook(req.body.transactionId, req.user!.id);
      sendSuccess(res, result, 'Book renewed successfully');
    } catch (error) { next(error); }
  }

  async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, userId, search } = req.query;
      const result = await transactionService.getTransactions({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as any,
        userId: userId as string,
        search: search as string,
      });
      sendPaginated(res, result.transactions, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 10);
    } catch (error) { next(error); }
  }

  async getTransactionById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.getTransactionById(req.params.id);
      sendSuccess(res, result, 'Transaction retrieved');
    } catch (error) { next(error); }
  }

  async getMyTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status } = req.query;
      const result = await transactionService.getUserTransactions(req.user!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as any,
      });
      sendPaginated(res, result.transactions, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 10);
    } catch (error) { next(error); }
  }
}

// ===== Reservation Controller =====
export class ReservationController {
  async createReservation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await reservationService.createReservation(req.user!.id, req.body.bookId);
      sendSuccess(res, result, 'Reservation created', 201);
    } catch (error) { next(error); }
  }

  async cancelReservation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await reservationService.cancelReservation(req.params.id, req.user!.id);
      sendSuccess(res, null, 'Reservation cancelled');
    } catch (error) { next(error); }
  }

  async getReservations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, userId, bookId } = req.query;
      const result = await reservationService.getReservations({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
        userId: userId as string,
        bookId: bookId as string,
      });
      sendPaginated(res, result.reservations, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 10);
    } catch (error) { next(error); }
  }

  async getMyReservations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await reservationService.getReservations({ userId: req.user!.id });
      sendSuccess(res, result.reservations, 'Reservations retrieved');
    } catch (error) { next(error); }
  }
}

// ===== Fine Controller =====
export class FineController {
  async getFines(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, userId } = req.query;
      const result = await fineService.getFines({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as any,
        userId: userId as string,
      });
      sendPaginated(res, result.fines, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 10);
    } catch (error) { next(error); }
  }

  async payFine(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await fineService.payFine(req.params.id, req.body.amount, req.user!.id);
      sendSuccess(res, result, 'Fine paid');
    } catch (error) { next(error); }
  }

  async waiveFine(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await fineService.waiveFine(req.params.id, req.body.notes, req.user!.id);
      sendSuccess(res, result, 'Fine waived');
    } catch (error) { next(error); }
  }

  async getMyFines(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await fineService.getUserFines(req.user!.id);
      sendSuccess(res, result, 'Fines retrieved');
    } catch (error) { next(error); }
  }
}

// ===== Member Controller =====
export class MemberController {
  async getMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, role, status } = req.query;
      const result = await memberService.getMembers({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        role: role as any,
        status: status as any,
      });
      sendPaginated(res, result.members, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 10);
    } catch (error) { next(error); }
  }

  async getMemberById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await memberService.getMemberById(req.params.id);
      sendSuccess(res, result, 'Member retrieved');
    } catch (error) { next(error); }
  }

  async updateMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await memberService.updateMember(req.params.id, req.body, req.user!.id);
      sendSuccess(res, result, 'Member updated');
    } catch (error) { next(error); }
  }

  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await memberService.createUser(req.body, req.user!.id);
      sendSuccess(res, result, 'User created', 201);
    } catch (error) { next(error); }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await memberService.deleteUser(req.params.id, req.user!.id);
      sendSuccess(res, null, 'User deleted');
    } catch (error) { next(error); }
  }
}

// ===== Dashboard Controller =====
export class DashboardController {
  async getAdminDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getAdminDashboard();
      sendSuccess(res, result, 'Dashboard data retrieved');
    } catch (error) { next(error); }
  }

  async getLibrarianDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getLibrarianDashboard();
      sendSuccess(res, result, 'Dashboard data retrieved');
    } catch (error) { next(error); }
  }

  async getMemberDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getMemberDashboard(req.user!.id);
      sendSuccess(res, result, 'Dashboard data retrieved');
    } catch (error) { next(error); }
  }
}

// ===== Misc Controllers =====
export class AuthorController {
  async getAuthors(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search } = req.query;
      const result = await authorService.getAuthors({ page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined, search: search as string });
      sendPaginated(res, result.authors, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 50);
    } catch (error) { next(error); }
  }
  async createAuthor(req: AuthRequest, res: Response, next: NextFunction) {
    try { const result = await authorService.createAuthor(req.body, req.user!.id); sendSuccess(res, result, 'Author created', 201); } catch (error) { next(error); }
  }
  async updateAuthor(req: AuthRequest, res: Response, next: NextFunction) {
    try { const result = await authorService.updateAuthor(req.params.id, req.body, req.user!.id); sendSuccess(res, result, 'Author updated'); } catch (error) { next(error); }
  }
  async deleteAuthor(req: AuthRequest, res: Response, next: NextFunction) {
    try { await authorService.deleteAuthor(req.params.id, req.user!.id); sendSuccess(res, null, 'Author deleted'); } catch (error) { next(error); }
  }
}

export class CategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search } = req.query;
      const result = await categoryService.getCategories({ page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined, search: search as string });
      sendPaginated(res, result.categories, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 50);
    } catch (error) { next(error); }
  }
  async createCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try { const result = await categoryService.createCategory(req.body, req.user!.id); sendSuccess(res, result, 'Category created', 201); } catch (error) { next(error); }
  }
  async updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try { const result = await categoryService.updateCategory(req.params.id, req.body, req.user!.id); sendSuccess(res, result, 'Category updated'); } catch (error) { next(error); }
  }
  async deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try { await categoryService.deleteCategory(req.params.id, req.user!.id); sendSuccess(res, null, 'Category deleted'); } catch (error) { next(error); }
  }
}

export class PublisherController {
  async getPublishers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search } = req.query;
      const result = await publisherService.getPublishers({ page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined, search: search as string });
      sendPaginated(res, result.publishers, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 50);
    } catch (error) { next(error); }
  }
  async createPublisher(req: AuthRequest, res: Response, next: NextFunction) {
    try { const result = await publisherService.createPublisher(req.body, req.user!.id); sendSuccess(res, result, 'Publisher created', 201); } catch (error) { next(error); }
  }
  async updatePublisher(req: AuthRequest, res: Response, next: NextFunction) {
    try { const result = await publisherService.updatePublisher(req.params.id, req.body, req.user!.id); sendSuccess(res, result, 'Publisher updated'); } catch (error) { next(error); }
  }
  async deletePublisher(req: AuthRequest, res: Response, next: NextFunction) {
    try { await publisherService.deletePublisher(req.params.id, req.user!.id); sendSuccess(res, null, 'Publisher deleted'); } catch (error) { next(error); }
  }
}

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, unreadOnly } = req.query;
      const result = await notificationService.getNotifications(req.user!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        unreadOnly: unreadOnly === 'true',
      });
      sendSuccess(res, result, 'Notifications retrieved');
    } catch (error) { next(error); }
  }
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try { await notificationService.markAsRead(req.params.id, req.user!.id); sendSuccess(res, null, 'Notification marked as read'); } catch (error) { next(error); }
  }
  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try { await notificationService.markAllAsRead(req.user!.id); sendSuccess(res, null, 'All notifications marked as read'); } catch (error) { next(error); }
  }
}

export class SettingsController {
  async getSettings(_req: Request, res: Response, next: NextFunction) {
    try { const result = await settingsService.getSettings(); sendSuccess(res, result, 'Settings retrieved'); } catch (error) { next(error); }
  }
  async updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try { const result = await settingsService.updateSettings(req.body, req.user!.id); sendSuccess(res, result, 'Settings updated'); } catch (error) { next(error); }
  }
}

export class ReportController {
  async getBookInventory(_req: Request, res: Response, next: NextFunction) {
    try { const result = await reportService.getBookInventoryReport(); sendSuccess(res, result, 'Report generated'); } catch (error) { next(error); }
  }
  async getBorrowingReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, categoryId } = req.query;
      const result = await reportService.getBorrowingReport({ startDate: startDate as string, endDate: endDate as string, categoryId: categoryId as string });
      sendSuccess(res, result, 'Report generated');
    } catch (error) { next(error); }
  }
  async getOverdueReport(_req: Request, res: Response, next: NextFunction) {
    try { const result = await reportService.getOverdueReport(); sendSuccess(res, result, 'Report generated'); } catch (error) { next(error); }
  }
  async getFineReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const result = await reportService.getFineReport({ startDate: startDate as string, endDate: endDate as string });
      sendSuccess(res, result, 'Report generated');
    } catch (error) { next(error); }
  }
  async getMemberActivity(_req: Request, res: Response, next: NextFunction) {
    try { const result = await reportService.getMemberActivityReport(); sendSuccess(res, result, 'Report generated'); } catch (error) { next(error); }
  }
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, entity, action, userId } = req.query;
      const result = await reportService.getAuditLogs({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        entity: entity as string,
        action: action as string,
        userId: userId as string,
      });
      sendPaginated(res, result.logs, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 20);
    } catch (error) { next(error); }
  }
}

export const transactionController = new TransactionController();
export const reservationController = new ReservationController();
export const fineController = new FineController();
export const memberController = new MemberController();
export const dashboardController = new DashboardController();
export const authorController = new AuthorController();
export const categoryController = new CategoryController();
export const publisherController = new PublisherController();
export const notificationController = new NotificationController();
export const settingsController = new SettingsController();
export const reportController = new ReportController();
