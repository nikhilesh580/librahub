import { Router } from 'express';
import {
  transactionController,
  reservationController,
  fineController,
  memberController,
  dashboardController,
  authorController,
  categoryController,
  publisherController,
  notificationController,
  settingsController,
  reportController,
} from '../controllers/index';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { issueBookSchema, returnBookSchema, renewBookSchema, createReservationSchema, payFineSchema, waiveFineSchema } from '../validators/transaction.validator';

// ===== Transaction Routes =====
export const transactionRoutes = Router();
transactionRoutes.post('/issue', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate(issueBookSchema), (req, res, next) => transactionController.issueBook(req, res, next));
transactionRoutes.post('/return', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate(returnBookSchema), (req, res, next) => transactionController.returnBook(req, res, next));
transactionRoutes.post('/renew', authenticate, validate(renewBookSchema), (req, res, next) => transactionController.renewBook(req, res, next));
transactionRoutes.get('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => transactionController.getTransactions(req, res, next));
transactionRoutes.get('/my', authenticate, (req, res, next) => transactionController.getMyTransactions(req, res, next));
transactionRoutes.get('/:id', authenticate, (req, res, next) => transactionController.getTransactionById(req, res, next));

// ===== Reservation Routes =====
export const reservationRoutes = Router();
reservationRoutes.post('/', authenticate, validate(createReservationSchema), (req, res, next) => reservationController.createReservation(req, res, next));
reservationRoutes.delete('/:id', authenticate, (req, res, next) => reservationController.cancelReservation(req, res, next));
reservationRoutes.get('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => reservationController.getReservations(req, res, next));
reservationRoutes.get('/my', authenticate, (req, res, next) => reservationController.getMyReservations(req, res, next));

// ===== Fine Routes =====
export const fineRoutes = Router();
fineRoutes.get('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => fineController.getFines(req, res, next));
fineRoutes.get('/my', authenticate, (req, res, next) => fineController.getMyFines(req, res, next));
fineRoutes.post('/:id/pay', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate(payFineSchema), (req, res, next) => fineController.payFine(req, res, next));
fineRoutes.post('/:id/waive', authenticate, authorize('ADMIN'), validate(waiveFineSchema), (req, res, next) => fineController.waiveFine(req, res, next));

// ===== Member Routes =====
export const memberRoutes = Router();
memberRoutes.get('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => memberController.getMembers(req, res, next));
memberRoutes.get('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => memberController.getMemberById(req, res, next));
memberRoutes.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => memberController.updateMember(req, res, next));
memberRoutes.post('/', authenticate, authorize('ADMIN'), (req, res, next) => memberController.createUser(req, res, next));
memberRoutes.delete('/:id', authenticate, authorize('ADMIN'), (req, res, next) => memberController.deleteUser(req, res, next));

// ===== Dashboard Routes =====
export const dashboardRoutes = Router();
dashboardRoutes.get('/admin', authenticate, authorize('ADMIN'), (req, res, next) => dashboardController.getAdminDashboard(req, res, next));
dashboardRoutes.get('/librarian', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => dashboardController.getLibrarianDashboard(req, res, next));
dashboardRoutes.get('/member', authenticate, (req, res, next) => dashboardController.getMemberDashboard(req, res, next));

// ===== Author Routes =====
export const authorRoutes = Router();
authorRoutes.get('/', (req, res, next) => authorController.getAuthors(req, res, next));
authorRoutes.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => authorController.createAuthor(req, res, next));
authorRoutes.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => authorController.updateAuthor(req, res, next));
authorRoutes.delete('/:id', authenticate, authorize('ADMIN'), (req, res, next) => authorController.deleteAuthor(req, res, next));

// ===== Category Routes =====
export const categoryRoutes = Router();
categoryRoutes.get('/', (req, res, next) => categoryController.getCategories(req, res, next));
categoryRoutes.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => categoryController.createCategory(req, res, next));
categoryRoutes.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => categoryController.updateCategory(req, res, next));
categoryRoutes.delete('/:id', authenticate, authorize('ADMIN'), (req, res, next) => categoryController.deleteCategory(req, res, next));

// ===== Publisher Routes =====
export const publisherRoutes = Router();
publisherRoutes.get('/', (req, res, next) => publisherController.getPublishers(req, res, next));
publisherRoutes.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => publisherController.createPublisher(req, res, next));
publisherRoutes.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => publisherController.updatePublisher(req, res, next));
publisherRoutes.delete('/:id', authenticate, authorize('ADMIN'), (req, res, next) => publisherController.deletePublisher(req, res, next));

// ===== Notification Routes =====
export const notificationRoutes = Router();
notificationRoutes.get('/', authenticate, (req, res, next) => notificationController.getNotifications(req, res, next));
notificationRoutes.put('/:id/read', authenticate, (req, res, next) => notificationController.markAsRead(req, res, next));
notificationRoutes.put('/read-all', authenticate, (req, res, next) => notificationController.markAllAsRead(req, res, next));

// ===== Settings Routes =====
export const settingsRoutes = Router();
settingsRoutes.get('/', authenticate, authorize('ADMIN'), (req, res, next) => settingsController.getSettings(req, res, next));
settingsRoutes.put('/', authenticate, authorize('ADMIN'), (req, res, next) => settingsController.updateSettings(req, res, next));

// ===== Report Routes =====
export const reportRoutes = Router();
reportRoutes.get('/inventory', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => reportController.getBookInventory(req, res, next));
reportRoutes.get('/borrowing', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => reportController.getBorrowingReport(req, res, next));
reportRoutes.get('/overdue', authenticate, authorize('ADMIN', 'LIBRARIAN'), (req, res, next) => reportController.getOverdueReport(req, res, next));
reportRoutes.get('/fines', authenticate, authorize('ADMIN'), (req, res, next) => reportController.getFineReport(req, res, next));
reportRoutes.get('/members', authenticate, authorize('ADMIN'), (req, res, next) => reportController.getMemberActivity(req, res, next));
reportRoutes.get('/audit-logs', authenticate, authorize('ADMIN'), (req, res, next) => reportController.getAuditLogs(req, res, next));
