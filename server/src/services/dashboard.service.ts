import prisma from '../config/database';

export class DashboardService {
  async getAdminDashboard() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalBooks,
      totalCopies,
      availableCopies,
      issuedCopies,
      overdueTx,
      totalMembers,
      activeMembers,
      pendingReservations,
      totalFines,
      collectedFines,
      todayIssues,
      todayReturns,
      recentTransactions,
      categoryDistribution,
      monthlyStats,
      mostBorrowedBooks,
      mostActiveMembers,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.count(),
      prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
      prisma.bookCopy.count({ where: { status: 'ISSUED' } }),
      prisma.borrowTransaction.count({
        where: { status: 'ISSUED', dueDate: { lt: now } },
      }),
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'ACTIVE' } }),
      prisma.reservation.count({ where: { status: { in: ['PENDING', 'READY'] } } }),
      prisma.fine.aggregate({ _sum: { amount: true } }),
      prisma.fine.aggregate({
        _sum: { paidAmount: true },
        where: { status: { in: ['PAID', 'PARTIALLY_PAID'] } },
      }),
      prisma.borrowTransaction.count({
        where: { issueDate: { gte: startOfDay } },
      }),
      prisma.borrowTransaction.count({
        where: { returnDate: { gte: startOfDay } },
      }),
      prisma.borrowTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          bookCopy: {
            include: { book: { select: { title: true } } },
          },
        },
      }),
      prisma.category.findMany({
        include: { _count: { select: { books: true } } },
      }),
      // Monthly borrowing stats for last 6 months
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "issueDate") as month,
          COUNT(*)::int as issues,
          COUNT(CASE WHEN "returnDate" IS NOT NULL THEN 1 END)::int as returns
        FROM "borrow_transactions"
        WHERE "issueDate" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "issueDate")
        ORDER BY month ASC
      ` as Promise<any[]>,
      // Most borrowed books
      prisma.$queryRaw`
        SELECT 
          b.id, b.title, b.isbn,
          COUNT(bt.id)::int as "borrowCount"
        FROM books b
        LEFT JOIN book_copies bc ON bc."bookId" = b.id
        LEFT JOIN borrow_transactions bt ON bt."bookCopyId" = bc.id
        GROUP BY b.id, b.title, b.isbn
        ORDER BY "borrowCount" DESC
        LIMIT 10
      ` as Promise<any[]>,
      // Most active members
      prisma.$queryRaw`
        SELECT 
          u.id, u.name, u.email,
          COUNT(bt.id)::int as "transactionCount"
        FROM users u
        LEFT JOIN borrow_transactions bt ON bt."userId" = u.id
        WHERE u.role = 'MEMBER'
        GROUP BY u.id, u.name, u.email
        ORDER BY "transactionCount" DESC
        LIMIT 10
      ` as Promise<any[]>,
    ]);

    return {
      stats: {
        totalBooks,
        totalCopies,
        availableCopies,
        issuedCopies,
        overdueBooks: overdueTx,
        totalMembers,
        activeMembers,
        pendingReservations,
        totalFines: totalFines._sum.amount || 0,
        collectedFines: collectedFines._sum.paidAmount || 0,
        todayIssues,
        todayReturns,
      },
      charts: {
        categoryDistribution: categoryDistribution.map((c) => ({
          name: c.name,
          value: c._count.books,
        })),
        monthlyStats: (monthlyStats || []).map((s: any) => ({
          month: new Date(s.month).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          issues: s.issues,
          returns: s.returns,
        })),
        mostBorrowedBooks: mostBorrowedBooks || [],
        mostActiveMembers: mostActiveMembers || [],
      },
      recentTransactions,
    };
  }

  async getLibrarianDashboard() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      todayIssues,
      todayReturns,
      overdueBooks,
      pendingReservations,
      availableBooks,
      activeMembers,
      recentTransactions,
    ] = await Promise.all([
      prisma.borrowTransaction.count({
        where: { issueDate: { gte: startOfDay } },
      }),
      prisma.borrowTransaction.count({
        where: { returnDate: { gte: startOfDay } },
      }),
      prisma.borrowTransaction.count({
        where: { status: 'ISSUED', dueDate: { lt: now } },
      }),
      prisma.reservation.count({
        where: { status: { in: ['PENDING', 'READY'] } },
      }),
      prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'ACTIVE' } }),
      prisma.borrowTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          bookCopy: {
            include: { book: { select: { title: true } } },
          },
        },
      }),
    ]);

    return {
      stats: {
        todayIssues,
        todayReturns,
        overdueBooks,
        pendingReservations,
        availableBooks,
        activeMembers,
      },
      recentTransactions,
    };
  }

  async getMemberDashboard(userId: string) {
    const now = new Date();

    const [
      currentlyBorrowed,
      reservations,
      fines,
      recentNotifications,
      borrowingHistory,
    ] = await Promise.all([
      prisma.borrowTransaction.findMany({
        where: { userId, status: 'ISSUED' },
        include: {
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
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.reservation.findMany({
        where: { userId, status: { in: ['PENDING', 'READY'] } },
        include: {
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
        orderBy: { queuePosition: 'asc' },
      }),
      prisma.fine.findMany({
        where: { userId, status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
        include: {
          transaction: {
            include: {
              bookCopy: {
                include: { book: { select: { title: true } } },
              },
            },
          },
        },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.borrowTransaction.findMany({
        where: { userId, status: 'RETURNED' },
        include: {
          bookCopy: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  coverImage: true,
                  authors: { include: { author: { select: { name: true } } } },
                },
              },
            },
          },
        },
        orderBy: { returnDate: 'desc' },
        take: 5,
      }),
    ]);

    const totalPendingFines = fines.reduce(
      (sum, f) => sum + (f.amount - f.paidAmount),
      0
    );

    // Get popular books as recommendations
    const popularBooks = await prisma.book.findMany({
      where: { availableCopies: { gt: 0 } },
      include: {
        authors: { include: { author: { select: { name: true } } } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    return {
      currentlyBorrowed: currentlyBorrowed.map((t) => ({
        ...t,
        daysRemaining: Math.ceil(
          (new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
        isOverdue: new Date(t.dueDate) < now,
      })),
      reservations,
      fines,
      totalPendingFines,
      notifications: recentNotifications,
      borrowingHistory,
      recommendations: popularBooks.map((b) => ({
        ...b,
        authors: b.authors.map((ba) => ba.author),
      })),
    };
  }
}

export const dashboardService = new DashboardService();
