import { randomBytes, randomUUID } from 'node:crypto';
import type { OrderStatus, PaymentStatus, Prisma, PrismaClient } from '@prisma/client';
import { calcTotals } from '../checkout/pricing';

export const SAMPLE_EMAIL = 'sample-orders@beu.test';
export const SAMPLE_USER_ID = 'SAMPLE-USER-reporting-v1';
export const SAMPLE_USER_NAME = 'SAMPLE reporting customer — do not fulfil or cancel';
export const SAMPLE_ORDER_PREFIX = 'SAMPLE-';
export const SAMPLE_ITEM_PREFIX = 'SAMPLE-ITEM-';
const PASSWORD_PREFIX = 'SAMPLE-DISABLED-';
const DAY_MS = 86_400_000;
const ORDER_COUNT = 80;
const STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export class SampleOrdersError extends Error {}

// Check the flag before importing the shared client or making any database call.
export function confirmSampleDatabase(databaseUrl: string | undefined, args: string[]) {
  let host: string;
  try {
    const url = new URL(databaseUrl ?? '');
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) throw new Error();
    host = url.hostname;
  } catch {
    throw new SampleOrdersError('DATABASE_URL must be a valid Postgres URL. Its value has not been printed.');
  }
  console.log(`Database host: ${host}`);
  if (args.length !== 1 || args[0] !== '--confirm') {
    throw new SampleOrdersError('No data changed. Pass --confirm to run this script (npm run <script> -- --confirm).');
  }
}

type SampleProduct = { slug: string; name: string; price: number; colors: string[]; categorySlug: string };

export function buildSampleOrders(products: SampleProduct[], now = new Date()) {
  if (products.length === 0) throw new SampleOrdersError('No products found. Add catalog products before seeding sample orders.');
  if (products.some((product) => !Number.isInteger(product.price) || product.price < 0)) {
    throw new SampleOrdersError('Catalog prices must be nonnegative whole pesos. No sample data was written.');
  }
  const orders: Prisma.OrderCreateManyInput[] = [];
  const items: Prisma.OrderItemCreateManyInput[] = [];
  const statusMix: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'DELIVERED', 'CANCELLED', 'DELIVERED', 'PROCESSING', 'PENDING', 'SHIPPED'];
  for (let i = 0; i < ORDER_COUNT; i++) {
    const id = `${SAMPLE_ORDER_PREFIX}${randomUUID()}`;
    const createdAt = new Date(now.getTime() - Math.floor(i * 89 / (ORDER_COUNT - 1)) * DAY_MS - (i % 12) * 3_600_000);
    const status = statusMix[i % statusMix.length];
    const paymentStatus: PaymentStatus = status === 'CANCELLED' ? 'UNPAID'
      : status === 'SHIPPED' || status === 'DELIVERED' || i % 3 === 0 ? 'PAID' : 'UNPAID';
    let subtotal = 0;
    for (let j = 0; j < Math.min(1 + i % 3, products.length); j++) {
      const product = products[(i * 3 + j) % products.length];
      const quantity = 1 + (i + j) % 3;
      items.push({
        id: `${SAMPLE_ITEM_PREFIX}${randomUUID()}`, orderId: id, productSlug: product.slug,
        name: product.name, color: product.colors[(i + j) % product.colors.length] ?? null,
        unitPrice: product.price, quantity,
      });
      subtotal += product.price * quantity;
    }
    const shippingMethod = i % 4 === 0 ? 'EXPRESS' : 'STANDARD';
    const totals = calcTotals(subtotal, shippingMethod);
    if (!Number.isSafeInteger(totals.total) || totals.total > 2_147_483_647) {
      throw new SampleOrdersError('A sample total would exceed the database money limit. No sample data was written.');
    }
    const after = (days: number) => new Date(Math.min(now.getTime(), createdAt.getTime() + days * DAY_MS));
    orders.push({
      id, userId: SAMPLE_USER_ID, status, paymentStatus, shippingMethod,
      paymentMethod: (['CARD', 'WALLET', 'BANK'] as const)[i % 3], ...totals, createdAt,
      paidAt: paymentStatus === 'PAID' ? after(0.01) : null,
      shippedAt: status === 'SHIPPED' || status === 'DELIVERED' ? after(1) : null,
      deliveredAt: status === 'DELIVERED' ? after(3) : null,
      cancelledAt: status === 'CANCELLED' ? after(0.5) : null,
      shipName: 'SAMPLE — do not fulfil or cancel', shipAddress: 'SAMPLE DATA — not a delivery address',
      shipCity: 'Quezon City', shipProvince: 'Metro Manila', shipZip: '1100', shipPhone: '00000000000',
    });
  }
  return { orders, items };
}

export async function seedSampleOrders(prisma: PrismaClient) {
  return prisma.$transaction(async (tx) => {
    const users = await tx.user.count({ where: { OR: [{ id: SAMPLE_USER_ID }, { email: SAMPLE_EMAIL }] } });
    const existingOrders = await tx.order.count({ where: { id: { startsWith: SAMPLE_ORDER_PREFIX } } });
    if (users || existingOrders) {
      throw new SampleOrdersError('Sample data or a reserved marker already exists. Run seed:sample-orders:clear first; do not overwrite it.');
    }
    const products = await tx.product.findMany({
      orderBy: [{ categorySlug: 'asc' }, { slug: 'asc' }],
      select: { slug: true, name: true, price: true, colors: true, categorySlug: true },
    });
    const { orders, items } = buildSampleOrders(products);
    await tx.user.create({ data: {
      id: SAMPLE_USER_ID, email: SAMPLE_EMAIL, name: SAMPLE_USER_NAME, role: 'CUSTOMER',
      // Intentionally invalid for verifyPassword (no salt:key separator); no password can sign in.
      passwordHash: `${PASSWORD_PREFIX}${randomBytes(32).toString('hex')}`,
    } });
    await tx.order.createMany({ data: orders });
    await tx.orderItem.createMany({ data: items });
    const where = { userId: SAMPLE_USER_ID, id: { startsWith: SAMPLE_ORDER_PREFIX } };
    const byStatus = await tx.order.groupBy({ by: ['status'], where, _count: { _all: true } });
    const byPayment = await tx.order.groupBy({ by: ['paymentStatus'], where, _count: { _all: true } });
    const revenue = await tx.order.aggregate({ where: { ...where, status: { not: 'CANCELLED' } }, _sum: { total: true } });
    const paidRevenue = await tx.order.aggregate({ where: { ...where, status: { not: 'CANCELLED' }, paymentStatus: 'PAID' }, _sum: { total: true } });
    return {
      orders: orders.length, items: items.length, byStatus, byPayment,
      revenue: revenue._sum.total ?? 0, paidRevenue: paidRevenue._sum.total ?? 0,
    };
  }, { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 30_000 });
}

export async function clearSampleOrders(prisma: PrismaClient) {
  return prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      where: { OR: [{ id: SAMPLE_USER_ID }, { email: SAMPLE_EMAIL }] },
      select: { id: true, email: true, name: true, role: true, passwordHash: true,
        _count: { select: { sessions: true, authTokens: true, savedAddresses: true } } },
    });
    const orders = await tx.order.findMany({
      where: { OR: [{ userId: SAMPLE_USER_ID }, { id: { startsWith: SAMPLE_ORDER_PREFIX } }] },
      select: { id: true, userId: true },
    });
    if (users.length === 0 && orders.length === 0) return { users: 0, orders: 0, items: 0 };
    const user = users[0];
    if (users.length !== 1 || user.id !== SAMPLE_USER_ID || user.email !== SAMPLE_EMAIL
      || user.name !== SAMPLE_USER_NAME || user.role !== 'CUSTOMER' || !user.passwordHash.startsWith(PASSWORD_PREFIX)) {
      throw new SampleOrdersError('Reserved sample user markers do not match. Cleanup refused; no data was removed.');
    }
    if (user._count.sessions || user._count.authTokens || user._count.savedAddresses) {
      throw new SampleOrdersError('The sample user has unexpected sessions, tokens or addresses. Cleanup refused; no data was removed.');
    }
    if (orders.some((order) => order.userId !== SAMPLE_USER_ID || !order.id.startsWith(SAMPLE_ORDER_PREFIX))) {
      throw new SampleOrdersError('An order has mismatched sample markers. Cleanup refused; no data was removed.');
    }
    const orderIds = orders.map((order) => order.id);
    const unmarkedItems = await tx.orderItem.count({ where: { orderId: { in: orderIds }, NOT: { id: { startsWith: SAMPLE_ITEM_PREFIX } } } });
    if (unmarkedItems) throw new SampleOrdersError('A sample order has unmarked items. Cleanup refused; no data was removed.');
    // Explicit child-first deletion; never invoke cancellation or update any products.
    const itemsRemoved = await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    const ordersRemoved = await tx.order.deleteMany({ where: { userId: SAMPLE_USER_ID, id: { in: orderIds } } });
    const usersRemoved = await tx.user.deleteMany({ where: { id: SAMPLE_USER_ID, email: SAMPLE_EMAIL } });
    if (ordersRemoved.count !== orders.length || usersRemoved.count !== 1) {
      throw new SampleOrdersError('Sample data changed during cleanup. The transaction was rolled back; retry.');
    }
    return { users: usersRemoved.count, orders: ordersRemoved.count, items: itemsRemoved.count };
  }, { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 30_000 });
}

export function printSampleSummary(summary: Awaited<ReturnType<typeof seedSampleOrders>>) {
  const peso = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
  console.log(`Created: 1 sample user, ${summary.orders} orders, ${summary.items} items over the last 90 days.`);
  for (const status of STATUSES) console.log(`${status}: ${summary.byStatus.find((row) => row.status === status)?._count._all ?? 0}`);
  for (const status of ['PAID', 'UNPAID']) console.log(`${status}: ${summary.byPayment.find((row) => row.paymentStatus === status)?._count._all ?? 0}`);
  const waiting = summary.byStatus.filter((row) => row.status === 'PENDING' || row.status === 'PROCESSING').reduce((sum, row) => sum + row._count._all, 0);
  console.log(`Orders waiting for action: ${waiting}`);
  console.log(`Revenue (excl. cancelled; includes shipping): ${peso(summary.revenue)}`);
  console.log(`Paid revenue (excl. cancelled; includes shipping): ${peso(summary.paidRevenue)}`);
  console.log('Product stock was not changed. These fixtures contribute to dashboard totals alongside any existing orders.');
  console.log('Do not cancel sample orders through admin/customer Orders: cancellation restores stock that these fixtures never deducted. Use seed:sample-orders:clear.');
}
