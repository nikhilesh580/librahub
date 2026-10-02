import { PrismaClient, UserRole, UserStatus, BookCopyCondition, BookCopyStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.borrowTransaction.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.bookAuthor.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.category.deleteMany();
  await prisma.publisher.deleteMany();
  await prisma.user.deleteMany();
  await prisma.librarySettings.deleteMany();

  console.log('📦 Cleared existing data');

  // Create library settings
  await prisma.librarySettings.create({
    data: {
      id: 'default',
      libraryName: 'Central Library Management System',
      maxBooksPerMember: 5,
      maxBorrowDays: 14,
      maxRenewals: 2,
      renewalDays: 7,
      finePerDay: 1.0,
      lostBookFine: 50.0,
      damagedBookFine: 25.0,
      reservationExpiryDays: 3,
      maxReservationsPerUser: 3,
    },
  });

  // Create users
  const hashedAdmin = await bcrypt.hash('Admin@123', 12);
  const hashedLibrarian = await bcrypt.hash('Librarian@123', 12);
  const hashedStudent = await bcrypt.hash('Student@123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@library.com',
      password: hashedAdmin,
      phone: '+1234567890',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const librarian1 = await prisma.user.create({
    data: {
      name: 'Sarah Johnson',
      email: 'librarian1@library.com',
      password: hashedLibrarian,
      phone: '+1234567891',
      role: UserRole.LIBRARIAN,
      status: UserStatus.ACTIVE,
    },
  });

  const librarian2 = await prisma.user.create({
    data: {
      name: 'Michael Chen',
      email: 'librarian2@library.com',
      password: hashedLibrarian,
      phone: '+1234567892',
      role: UserRole.LIBRARIAN,
      status: UserStatus.ACTIVE,
    },
  });

  const students = await Promise.all(
    [
      { name: 'Alice Williams', email: 'student1@library.com' },
      { name: 'Bob Martinez', email: 'student2@library.com' },
      { name: 'Charlie Brown', email: 'student3@library.com' },
      { name: 'Diana Prince', email: 'student4@library.com' },
      { name: 'Edward Norton', email: 'student5@library.com' },
      { name: 'Fiona Apple', email: 'student6@library.com' },
      { name: 'George Lucas', email: 'student7@library.com' },
      { name: 'Hannah Montana', email: 'student8@library.com' },
      { name: 'Ivan Petrov', email: 'student9@library.com' },
      { name: 'Julia Roberts', email: 'student10@library.com' },
      { name: 'Kevin Hart', email: 'student11@library.com' },
      { name: 'Luna Lovegood', email: 'student12@library.com' },
    ].map((s) =>
      prisma.user.create({
        data: {
          name: s.name,
          email: s.email,
          password: hashedStudent,
          role: UserRole.MEMBER,
          status: UserStatus.ACTIVE,
        },
      })
    )
  );

  console.log('👥 Created users');

  // Create categories
  const categories = await Promise.all(
    [
      { name: 'Fiction', description: 'Novels, short stories, and literary fiction' },
      { name: 'Non-Fiction', description: 'Factual books and essays' },
      { name: 'Science', description: 'Physics, chemistry, biology, and more' },
      { name: 'Technology', description: 'Computer science, programming, and engineering' },
      { name: 'Mathematics', description: 'Pure and applied mathematics' },
      { name: 'History', description: 'World history and historical analysis' },
      { name: 'Philosophy', description: 'Western and Eastern philosophy' },
      { name: 'Psychology', description: 'Human behavior and mental processes' },
      { name: 'Business', description: 'Management, economics, and entrepreneurship' },
      { name: 'Art & Design', description: 'Visual arts, architecture, and design' },
    ].map((c) => prisma.category.create({ data: c }))
  );

  // Create publishers
  const publishers = await Promise.all(
    [
      { name: 'Penguin Random House', email: 'contact@penguinrandomhouse.com', address: 'New York, NY' },
      { name: 'HarperCollins', email: 'contact@harpercollins.com', address: 'New York, NY' },
      { name: "O'Reilly Media", email: 'info@oreilly.com', address: 'Sebastopol, CA' },
      { name: 'MIT Press', email: 'info@mitpress.edu', address: 'Cambridge, MA' },
      { name: 'Oxford University Press', email: 'info@oup.com', address: 'Oxford, UK' },
      { name: 'Wiley', email: 'info@wiley.com', address: 'Hoboken, NJ' },
      { name: 'Springer', email: 'info@springer.com', address: 'Berlin, Germany' },
      { name: 'Pearson', email: 'info@pearson.com', address: 'London, UK' },
    ].map((p) => prisma.publisher.create({ data: p }))
  );

  // Create authors
  const authors = await Promise.all(
    [
      { name: 'George Orwell', biography: 'English novelist and essayist, known for 1984 and Animal Farm' },
      { name: 'Jane Austen', biography: 'English novelist known for her social commentary and wit' },
      { name: 'Robert C. Martin', biography: 'Software engineer and author of Clean Code' },
      { name: 'Martin Fowler', biography: 'Software developer specializing in enterprise architecture' },
      { name: 'Stephen Hawking', biography: 'Theoretical physicist and cosmologist' },
      { name: 'Yuval Noah Harari', biography: 'Israeli historian and author of Sapiens' },
      { name: 'Malcolm Gladwell', biography: 'Canadian journalist and bestselling author' },
      { name: 'Daniel Kahneman', biography: 'Israeli-American psychologist and Nobel laureate' },
      { name: 'F. Scott Fitzgerald', biography: 'American novelist of the Jazz Age' },
      { name: 'Harper Lee', biography: 'American novelist known for To Kill a Mockingbird' },
      { name: 'J.K. Rowling', biography: 'British author of the Harry Potter series' },
      { name: 'Douglas Adams', biography: 'English author and satirist' },
      { name: 'Isaac Asimov', biography: 'American writer and professor of biochemistry' },
      { name: 'Toni Morrison', biography: 'American novelist and Nobel Prize winner' },
      { name: 'Andrew Hunt', biography: 'Co-author of The Pragmatic Programmer' },
    ].map((a) => prisma.author.create({ data: a }))
  );

  console.log('📚 Created categories, publishers, authors');

  // Create books with their copies
  const booksData = [
    { isbn: '9780451524935', title: '1984', description: 'A dystopian social science fiction novel set in a totalitarian society.', publishedYear: 1949, language: 'English', pages: 328, publisherIdx: 0, categoryIdx: 0, authorIdx: [0], copies: 3 },
    { isbn: '9780141439518', title: 'Pride and Prejudice', description: 'A romantic novel of manners set in Georgian England.', publishedYear: 1813, language: 'English', pages: 432, publisherIdx: 0, categoryIdx: 0, authorIdx: [1], copies: 2 },
    { isbn: '9780132350884', title: 'Clean Code', description: 'A handbook of agile software craftsmanship.', publishedYear: 2008, language: 'English', pages: 464, publisherIdx: 2, categoryIdx: 3, authorIdx: [2], copies: 4 },
    { isbn: '9780201633610', title: 'Design Patterns', description: 'Elements of reusable object-oriented software.', publishedYear: 1994, language: 'English', pages: 416, publisherIdx: 5, categoryIdx: 3, authorIdx: [3], copies: 2 },
    { isbn: '9780553380163', title: 'A Brief History of Time', description: 'A landmark volume in science writing exploring the universe.', publishedYear: 1988, language: 'English', pages: 256, publisherIdx: 1, categoryIdx: 2, authorIdx: [4], copies: 3 },
    { isbn: '9780062316110', title: 'Sapiens: A Brief History of Humankind', description: 'A brief history of humankind from the Stone Age to the modern day.', publishedYear: 2015, language: 'English', pages: 443, publisherIdx: 1, categoryIdx: 5, authorIdx: [5], copies: 3 },
    { isbn: '9780316017930', title: 'Outliers', description: 'The story of success and what makes high achievers different.', publishedYear: 2008, language: 'English', pages: 309, publisherIdx: 0, categoryIdx: 7, authorIdx: [6], copies: 2 },
    { isbn: '9780374533557', title: 'Thinking, Fast and Slow', description: 'Explores the two systems that drive the way we think.', publishedYear: 2011, language: 'English', pages: 499, publisherIdx: 0, categoryIdx: 7, authorIdx: [7], copies: 3 },
    { isbn: '9780743273565', title: 'The Great Gatsby', description: 'A novel about the American dream set in the Jazz Age.', publishedYear: 1925, language: 'English', pages: 180, publisherIdx: 0, categoryIdx: 0, authorIdx: [8], copies: 4 },
    { isbn: '9780060935467', title: 'To Kill a Mockingbird', description: 'A novel about racial injustice in the American South.', publishedYear: 1960, language: 'English', pages: 336, publisherIdx: 1, categoryIdx: 0, authorIdx: [9], copies: 3 },
    { isbn: '9780439708180', title: "Harry Potter and the Sorcerer's Stone", description: 'The first book in the Harry Potter series about a young wizard.', publishedYear: 1997, language: 'English', pages: 309, publisherIdx: 0, categoryIdx: 0, authorIdx: [10], copies: 5 },
    { isbn: '9780345391803', title: "The Hitchhiker's Guide to the Galaxy", description: 'A comedic science fiction series.', publishedYear: 1979, language: 'English', pages: 224, publisherIdx: 0, categoryIdx: 0, authorIdx: [11], copies: 2 },
    { isbn: '9780553293357', title: 'Foundation', description: 'The first novel in the Foundation series about the fall and rise of civilizations.', publishedYear: 1951, language: 'English', pages: 244, publisherIdx: 0, categoryIdx: 0, authorIdx: [12], copies: 3 },
    { isbn: '9781400033416', title: 'Beloved', description: 'A powerful meditation on the legacy of slavery.', publishedYear: 1987, language: 'English', pages: 324, publisherIdx: 0, categoryIdx: 0, authorIdx: [13], copies: 2 },
    { isbn: '9780201616224', title: 'The Pragmatic Programmer', description: 'Your journey to mastery in software development.', publishedYear: 1999, language: 'English', pages: 352, publisherIdx: 7, categoryIdx: 3, authorIdx: [14], copies: 3 },
    { isbn: '9780596517748', title: 'JavaScript: The Good Parts', description: 'Unearthing the excellence in JavaScript.', publishedYear: 2008, language: 'English', pages: 176, publisherIdx: 2, categoryIdx: 3, authorIdx: [], copies: 4 },
    { isbn: '9780596007126', title: 'Head First Design Patterns', description: 'A brain-friendly guide to design patterns.', publishedYear: 2004, language: 'English', pages: 694, publisherIdx: 2, categoryIdx: 3, authorIdx: [], copies: 2 },
    { isbn: '9780140449136', title: 'The Republic', description: "Plato's philosophical masterpiece on justice and government.", publishedYear: -380, language: 'English', pages: 416, publisherIdx: 0, categoryIdx: 6, authorIdx: [], copies: 2 },
    { isbn: '9780393356687', title: 'Homo Deus', description: 'A brief history of tomorrow, exploring the future of humanity.', publishedYear: 2017, language: 'English', pages: 450, publisherIdx: 1, categoryIdx: 5, authorIdx: [5], copies: 3 },
    { isbn: '9780316346627', title: 'The Tipping Point', description: 'How little things can make a big difference.', publishedYear: 2000, language: 'English', pages: 301, publisherIdx: 0, categoryIdx: 8, authorIdx: [6], copies: 2 },
    { isbn: '9780553803716', title: 'The Universe in a Nutshell', description: 'A journey through the universe explained with illustrations.', publishedYear: 2001, language: 'English', pages: 224, publisherIdx: 1, categoryIdx: 2, authorIdx: [4], copies: 2 },
    { isbn: '9780451526342', title: 'Animal Farm', description: 'A satirical allegory about the Russian Revolution.', publishedYear: 1945, language: 'English', pages: 141, publisherIdx: 0, categoryIdx: 0, authorIdx: [0], copies: 3 },
    { isbn: '9780439064873', title: 'Harry Potter and the Chamber of Secrets', description: 'The second book in the Harry Potter series.', publishedYear: 1998, language: 'English', pages: 341, publisherIdx: 0, categoryIdx: 0, authorIdx: [10], copies: 4 },
    { isbn: '9780439136365', title: 'Harry Potter and the Prisoner of Azkaban', description: 'The third book in the Harry Potter series.', publishedYear: 1999, language: 'English', pages: 435, publisherIdx: 0, categoryIdx: 0, authorIdx: [10], copies: 3 },
    { isbn: '9780141182803', title: 'Sense and Sensibility', description: 'A novel about two sisters and their romantic lives.', publishedYear: 1811, language: 'English', pages: 409, publisherIdx: 0, categoryIdx: 0, authorIdx: [1], copies: 2 },
    { isbn: '9780553573015', title: 'A Game of Thrones', description: 'The first book in the epic fantasy series A Song of Ice and Fire.', publishedYear: 1996, language: 'English', pages: 694, publisherIdx: 0, categoryIdx: 0, authorIdx: [], copies: 3 },
    { isbn: '9780307474728', title: 'The Lean Startup', description: 'How today\'s entrepreneurs use continuous innovation.', publishedYear: 2011, language: 'English', pages: 336, publisherIdx: 0, categoryIdx: 8, authorIdx: [], copies: 2 },
    { isbn: '9780321125217', title: 'Domain-Driven Design', description: 'Tackling complexity in the heart of software.', publishedYear: 2003, language: 'English', pages: 560, publisherIdx: 7, categoryIdx: 3, authorIdx: [], copies: 2 },
    { isbn: '9780262033848', title: 'Introduction to Algorithms', description: 'The comprehensive textbook on algorithms and data structures.', publishedYear: 2009, language: 'English', pages: 1312, publisherIdx: 3, categoryIdx: 4, authorIdx: [], copies: 3 },
    { isbn: '9780199535569', title: 'The Art of War', description: 'An ancient Chinese military treatise.', publishedYear: -500, language: 'English', pages: 273, publisherIdx: 4, categoryIdx: 6, authorIdx: [], copies: 2 },
    { isbn: '9780385333481', title: 'The Design of Everyday Things', description: 'How design serves as the communication between object and user.', publishedYear: 1988, language: 'English', pages: 368, publisherIdx: 0, categoryIdx: 9, authorIdx: [], copies: 2 },
    { isbn: '9780262510875', title: 'Structure and Interpretation of Computer Programs', description: 'A foundational textbook in computer science.', publishedYear: 1996, language: 'English', pages: 657, publisherIdx: 3, categoryIdx: 3, authorIdx: [], copies: 2 },
  ];

  let accessionCounter = 1;

  for (const bookData of booksData) {
    const { copies: numCopies, authorIdx, publisherIdx, categoryIdx, ...rest } = bookData;
    
    const book = await prisma.book.create({
      data: {
        ...rest,
        publisherId: publishers[publisherIdx].id,
        categoryId: categories[categoryIdx].id,
        totalCopies: numCopies,
        availableCopies: numCopies,
      },
    });

    // Link authors
    for (const aIdx of authorIdx) {
      await prisma.bookAuthor.create({
        data: { bookId: book.id, authorId: authors[aIdx].id },
      });
    }

    // Create copies
    for (let i = 0; i < numCopies; i++) {
      await prisma.bookCopy.create({
        data: {
          bookId: book.id,
          accessionNumber: `ACC-${String(accessionCounter++).padStart(5, '0')}`,
          status: BookCopyStatus.AVAILABLE,
          condition: BookCopyCondition.GOOD,
          shelfLocation: `Shelf ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}-${Math.floor(Math.random() * 20) + 1}`,
        },
      });
    }
  }

  console.log('📖 Created books with copies');

  // Create sample transactions
  const allBooks = await prisma.book.findMany({
    include: { copies: { where: { status: 'AVAILABLE' }, take: 1 } },
  });

  // Issue some books to students
  const issuedBooks: string[] = [];
  for (let i = 0; i < 6 && i < allBooks.length; i++) {
    const book = allBooks[i];
    if (book.copies.length === 0) continue;
    
    const copy = book.copies[0];
    const student = students[i % students.length];

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14 - i * 2); // Varying due dates

    await prisma.borrowTransaction.create({
      data: {
        userId: student.id,
        bookCopyId: copy.id,
        issueDate: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000), // Staggered issue dates
        dueDate,
        status: 'ISSUED',
      },
    });

    await prisma.bookCopy.update({
      where: { id: copy.id },
      data: { status: 'ISSUED' },
    });

    await prisma.book.update({
      where: { id: book.id },
      data: { availableCopies: { decrement: 1 } },
    });

    issuedBooks.push(copy.id);
  }

  // Create some returned transactions
  for (let i = 6; i < 12 && i < allBooks.length; i++) {
    const book = allBooks[i];
    if (book.copies.length === 0) continue;
    
    const copy = book.copies[0];
    const student = students[i % students.length];

    const issueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);
    const returnDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    const tx = await prisma.borrowTransaction.create({
      data: {
        userId: student.id,
        bookCopyId: copy.id,
        issueDate,
        dueDate,
        returnDate,
        status: 'RETURNED',
      },
    });

    // Create overdue fines for some
    if (i % 2 === 0) {
      const overdueDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (overdueDays > 0) {
        await prisma.fine.create({
          data: {
            transactionId: tx.id,
            userId: student.id,
            amount: overdueDays * 1.0,
            reason: 'OVERDUE',
            status: i % 4 === 0 ? 'PAID' : 'PENDING',
            paidAmount: i % 4 === 0 ? overdueDays * 1.0 : 0,
            paidAt: i % 4 === 0 ? new Date() : null,
          },
        });
      }
    }
  }

  // Create some reservations
  for (let i = 0; i < 3; i++) {
    const book = allBooks[i];
    const student = students[i + 6];

    await prisma.reservation.create({
      data: {
        userId: student.id,
        bookId: book.id,
        queuePosition: 1,
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
    });
  }

  // Create notifications
  for (const student of students.slice(0, 5)) {
    await prisma.notification.create({
      data: {
        userId: student.id,
        title: 'Welcome to the Library!',
        message: 'Your account has been created. Start browsing our collection!',
        type: 'GENERAL',
      },
    });
  }

  console.log('📋 Created sample transactions, fines, reservations, and notifications');
  console.log('\n✅ Seed completed successfully!\n');
  console.log('Demo Credentials:');
  console.log('  Admin:     admin@library.com / Admin@123');
  console.log('  Librarian: librarian1@library.com / Librarian@123');
  console.log('  Student:   student1@library.com / Student@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
