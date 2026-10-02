import { Request, Response, NextFunction } from 'express';
import { bookService } from '../services/book.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export class BookController {
  async getBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, categoryId, authorId, publisherId, language, availability, publishedYear, sortBy, sortOrder } = req.query;
      const result = await bookService.getBooks({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        categoryId: categoryId as string,
        authorId: authorId as string,
        publisherId: publisherId as string,
        language: language as string,
        availability: availability as string,
        publishedYear: publishedYear ? parseInt(publishedYear as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      sendPaginated(res, result.books, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 10, 'Books retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getBookById(req: Request, res: Response, next: NextFunction) {
    try {
      const book = await bookService.getBookById(req.params.id);
      sendSuccess(res, book, 'Book retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createBook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const book = await bookService.createBook(req.body, req.user!.id);
      sendSuccess(res, book, 'Book created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateBook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const book = await bookService.updateBook(req.params.id, req.body, req.user!.id);
      sendSuccess(res, book, 'Book updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteBook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await bookService.deleteBook(req.params.id, req.user!.id);
      sendSuccess(res, null, 'Book deleted');
    } catch (error) {
      next(error);
    }
  }

  async addBookCopy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const copy = await bookService.addBookCopy(req.body, req.user!.id);
      sendSuccess(res, copy, 'Book copy added', 201);
    } catch (error) {
      next(error);
    }
  }

  async addMultipleCopies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const copies = await bookService.addMultipleCopies(req.body, req.user!.id);
      sendSuccess(res, copies, 'Book copies added', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateBookCopy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const copy = await bookService.updateBookCopy(req.params.id, req.body, req.user!.id);
      sendSuccess(res, copy, 'Book copy updated');
    } catch (error) {
      next(error);
    }
  }

  async getBookCopies(req: Request, res: Response, next: NextFunction) {
    try {
      const copies = await bookService.getBookCopies(req.params.bookId);
      sendSuccess(res, copies, 'Book copies retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const bookController = new BookController();
