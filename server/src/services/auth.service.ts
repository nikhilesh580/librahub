import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import { config } from '../config';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '../utils/errors';
import { createAuditLog } from '../utils/auditLog';
import { UserRole, UserStatus } from '@prisma/client';

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: UserRole.MEMBER,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Ensure default library settings exist
    await prisma.librarySettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    });

    const tokens = this.generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    await createAuditLog({
      userId: user.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
    });

    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError(
        `Your account is ${user.status.toLowerCase()}. Please contact the administrator.`
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        profileImage: user.profileImage,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        id: string;
        email: string;
        role: UserRole;
        name: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedError('Account is not active');
      }

      const tokens = this.generateTokens({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await createAuditLog({
      userId,
      action: 'LOGOUT',
      entity: 'User',
      entityId: userId,
    });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In production, send email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If the email exists, a reset link has been sent', resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: user.id,
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await createAuditLog({
      userId,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: userId,
    });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        _count: {
          select: {
            transactions: { where: { status: 'ISSUED' } },
            reservations: { where: { status: 'PENDING' } },
            fines: { where: { status: 'PENDING' } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; profileImage?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  private generateTokens(user: { id: string; name: string; email: string; role: UserRole }) {
    const accessToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry as any }
    );

    const refreshToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry as any }
    );

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
