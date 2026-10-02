export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'LIBRARIAN' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'SUSPENDED';
  profileImage?: string;
  maxBooks?: number;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    transactions: number;
    fines: number;
    reservations: number;
  };
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  description?: string;
  coverImage?: string;
  publishedYear?: number;
  language: string;
  pages?: number;
  totalCopies: number;
  availableCopies: number;
  publisherId?: string;
  categoryId?: string;
  publisher?: Publisher;
  category?: Category;
  authors: Author[];
  copies?: BookCopy[];
  _count?: { copies: number };
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  id: string;
  name: string;
  biography?: string;
  _count?: { books: number };
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: { books: number };
}

export interface Publisher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  _count?: { books: number };
}

export interface BookCopy {
  id: string;
  bookId: string;
  accessionNumber: string;
  status: 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'LOST' | 'DAMAGED' | 'MAINTENANCE';
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
  shelfLocation?: string;
  book?: Book;
  transactions?: BorrowTransaction[];
  createdAt: string;
}

export interface BorrowTransaction {
  id: string;
  userId: string;
  bookCopyId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  renewalCount: number;
  notes?: string;
  user?: Partial<User>;
  bookCopy?: BookCopy & { book?: Book & { authors?: { author: { name: string } }[] } };
  fines?: Fine[];
  daysRemaining?: number;
  isOverdue?: boolean;
  createdAt: string;
}

export interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expiryDate: string;
  status: 'PENDING' | 'READY' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';
  queuePosition: number;
  user?: Partial<User>;
  book?: Partial<Book>;
  createdAt: string;
}

export interface Fine {
  id: string;
  transactionId: string;
  userId: string;
  amount: number;
  paidAmount: number;
  reason: 'OVERDUE' | 'LOST_BOOK' | 'DAMAGED_BOOK' | 'OTHER';
  status: 'PENDING' | 'PAID' | 'WAIVED' | 'PARTIALLY_PAID';
  paidAt?: string;
  notes?: string;
  user?: Partial<User>;
  transaction?: BorrowTransaction;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  user?: Partial<User>;
  createdAt: string;
}

export interface LibrarySettings {
  id: string;
  libraryName: string;
  maxBooksPerMember: number;
  maxBorrowDays: number;
  maxRenewals: number;
  renewalDays: number;
  finePerDay: number;
  lostBookFine: number;
  damagedBookFine: number;
  reservationExpiryDays: number;
  maxReservationsPerUser: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  overdueBooks: number;
  totalMembers: number;
  activeMembers: number;
  pendingReservations: number;
  totalFines: number;
  collectedFines: number;
  todayIssues: number;
  todayReturns: number;
}

export interface AdminDashboard {
  stats: DashboardStats;
  charts: {
    categoryDistribution: { name: string; value: number }[];
    monthlyStats: { month: string; issues: number; returns: number }[];
    mostBorrowedBooks: { id: string; title: string; isbn: string; borrowCount: number }[];
    mostActiveMembers: { id: string; name: string; email: string; transactionCount: number }[];
  };
  recentTransactions: BorrowTransaction[];
}

export interface MemberDashboard {
  currentlyBorrowed: (BorrowTransaction & { daysRemaining: number; isOverdue: boolean })[];
  reservations: Reservation[];
  fines: Fine[];
  totalPendingFines: number;
  notifications: Notification[];
  borrowingHistory: BorrowTransaction[];
  recommendations: Book[];
}
