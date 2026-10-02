import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDaysRemaining(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ISSUED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    RESERVED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    LOST: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    DAMAGED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    MAINTENANCE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    RETURNED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    READY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    FULFILLED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    WAIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    SUSPENDED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
