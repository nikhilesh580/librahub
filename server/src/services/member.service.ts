import prisma from '../config/database';
import { UserRole, UserStatus } from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { createAuditLog } from '../utils/auditLog';
import bcrypt from 'bcryptjs';

export class MemberService {
  async getMembers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }) {
    const { page = 1, limit = 10, search, role, status } = params;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          profileImage: true,
          maxBooks: true,
          createdAt: true,
          _count: {
            select: {
              transactions: { where: { status: 'ISSUED' } },
              fines: { where: { status: 'PENDING' } },
              reservations: { where: { status: { in: ['PENDING', 'READY'] } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { members, total };
  }

  async getMemberById(id: string) {
    const member = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        profileImage: true,
        maxBooks: true,
        createdAt: true,
        updatedAt: true,
        transactions: {
          where: { status: 'ISSUED' },
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
        },
        fines: {
          where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
        },
        reservations: {
          where: { status: { in: ['PENDING', 'READY'] } },
          include: {
            book: {
              select: { id: true, title: true, isbn: true },
            },
          },
        },
        _count: {
          select: {
            transactions: true,
            fines: true,
            reservations: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    return member;
  }

  async updateMember(
    id: string,
    data: {
      name?: string;
      phone?: string;
      role?: UserRole;
      status?: UserStatus;
      maxBooks?: number;
    },
    updatedBy: string
  ) {
    const member = await prisma.user.findUnique({ where: { id } });
    if (!member) throw new NotFoundError('Member not found');

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        maxBooks: true,
      },
    });

    await createAuditLog({
      userId: updatedBy,
      action: 'UPDATE_MEMBER',
      entity: 'User',
      entityId: id,
      metadata: data,
    });

    return updated;
  }

  async createUser(
    data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      role: UserRole;
    },
    createdBy: string
  ) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError('Email already in use');

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      userId: createdBy,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      metadata: { role: data.role },
    });

    return user;
  }

  async deleteUser(id: string, deletedBy: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        transactions: { where: { status: 'ISSUED' } },
      },
    });

    if (!user) throw new NotFoundError('User not found');
    if (user.transactions.length > 0) {
      throw new BadRequestError('Cannot delete user with active transactions');
    }

    await prisma.user.delete({ where: { id } });

    await createAuditLog({
      userId: deletedBy,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: id,
      metadata: { email: user.email, name: user.name },
    });
  }
}

export const memberService = new MemberService();
