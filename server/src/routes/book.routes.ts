import { Router } from 'express';
import { bookController } from '../controllers/book.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBookSchema, updateBookSchema, addBookCopySchema, addMultipleCopiesSchema, updateBookCopySchema } from '../validators/book.validator';

const router = Router();

// Public routes
router.get('/', (req, res, next) => bookController.getBooks(req, res, next));
router.get('/:id', (req, res, next) => bookController.getBookById(req, res, next));
router.get('/:bookId/copies', (req, res, next) => bookController.getBookCopies(req, res, next));

// Protected routes - Admin/Librarian
router.post('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate(createBookSchema), (req, res, next) => bookController.createBook(req, res, next));
router.put('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate(updateBookSchema), (req, res, next) => bookController.updateBook(req, res, next));
router.delete('/:id', authenticate, authorize('ADMIN'), (req, res, next) => bookController.deleteBook(req, res, next));

// Book copies
router.post('/copies', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate(addBookCopySchema), (req, res, next) => bookController.addBookCopy(req, res, next));
router.post('/copies/bulk', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate(addMultipleCopiesSchema), (req, res, next) => bookController.addMultipleCopies(req, res, next));
router.put('/copies/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), validate(updateBookCopySchema), (req, res, next) => bookController.updateBookCopy(req, res, next));

export default router;
