import 'server-only';

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const CUSTOMERS_PAGE_SIZE = 10;

// A customer is a User with the CUSTOMER role; admins never show up here.
export async function getCustomers({ q, page }: { q: string; page: number }) {
  const where: Prisma.UserWhereInput = {
    role: 'CUSTOMER',
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const [filteredCount, totalCount] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(filteredCount / CUSTOMERS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (currentPage - 1) * CUSTOMERS_PAGE_SIZE,
    take: CUSTOMERS_PAGE_SIZE,
    select: { id: true, name: true, email: true, createdAt: true, emailVerifiedAt: true, _count: { select: { orders: true } } },
  });

  // Spend ignores cancelled orders. One grouped query for the whole page.
  const spend = await prisma.order.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map((u) => u.id) }, status: { not: 'CANCELLED' } },
    _sum: { total: true },
  });
  const spendByUser = new Map(spend.map((row) => [row.userId, row._sum.total ?? 0]));

  const customers = users.map((user) => ({ ...user, totalSpent: spendByUser.get(user.id) ?? 0 }));
  return { customers, filteredCount, totalCount, page: currentPage, totalPages };
}

export async function getCustomer(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, role: 'CUSTOMER' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      emailVerifiedAt: true,
      savedAddresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          number: true,
          createdAt: true,
          status: true,
          paymentStatus: true,
          total: true,
          _count: { select: { items: true } },
        },
      },
    },
  });
  if (!user) return null;

  const totalSpent = user.orders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total, 0);
  return { ...user, totalSpent };
}
