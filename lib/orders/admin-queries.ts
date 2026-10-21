import 'server-only';

import type { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { STATUS_FLOW } from './rules';

export const ADMIN_ORDERS_PAGE_SIZE = 10;

export const ORDER_STATUS_FILTERS: readonly OrderStatus[] = [...STATUS_FLOW, 'CANCELLED'];
export const PAYMENT_STATUS_FILTERS: readonly PaymentStatus[] = ['UNPAID', 'PAID'];

export function parseOrderStatus(value: unknown): OrderStatus | null {
  return ORDER_STATUS_FILTERS.find((s) => s === value) ?? null;
}

export function parsePaymentStatus(value: unknown): PaymentStatus | null {
  return PAYMENT_STATUS_FILTERS.find((s) => s === value) ?? null;
}

// "#ORD-000123", "ORD-123", "#123" and "123" all mean order number 123.
function parseOrderNumber(q: string): number | null {
  const match = /^#?(?:ORD-?)?0*(\d{1,9})$/i.exec(q.trim());
  return match ? Number(match[1]) : null;
}

export interface AdminOrderFilters {
  q: string;
  status: OrderStatus | null;
  payment: PaymentStatus | null;
  page: number;
}

export async function getAdminOrders({ q, status, payment, page }: AdminOrderFilters) {
  const number = q ? parseOrderNumber(q) : null;

  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...(payment && { paymentStatus: payment }),
    ...(q && {
      OR: [
        ...(number !== null ? [{ number }] : []),
        { shipName: { contains: q, mode: 'insensitive' as const } },
        { user: { name: { contains: q, mode: 'insensitive' as const } } },
        { user: { email: { contains: q, mode: 'insensitive' as const } } },
      ],
    }),
  };

  const [filteredCount, totalCount] = await Promise.all([prisma.order.count({ where }), prisma.order.count()]);
  const totalPages = Math.max(1, Math.ceil(filteredCount / ADMIN_ORDERS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (currentPage - 1) * ADMIN_ORDERS_PAGE_SIZE,
    take: ADMIN_ORDERS_PAGE_SIZE,
    select: {
      id: true,
      number: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      total: true,
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { items: true } },
    },
  });

  return { orders, filteredCount, totalCount, page: currentPage, totalPages };
}

export async function getAdminOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: 'asc' } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
