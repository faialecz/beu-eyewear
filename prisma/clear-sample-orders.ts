import 'dotenv/config';
import { clearSampleOrders, confirmSampleDatabase, SampleOrdersError } from '../lib/admin/sample-orders';

async function main() {
  confirmSampleDatabase(process.env.DATABASE_URL, process.argv.slice(2));
  const { prisma } = await import('../lib/prisma');
  try {
    const counts = await clearSampleOrders(prisma);
    console.log(`Removed: ${counts.items} sample items, ${counts.orders} sample orders, ${counts.users} sample users.`);
    console.log('Product stock and non-sample data were not changed.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof SampleOrdersError ? error.message : 'Sample cleanup failed. Check database connectivity and retry. Connection details are not printed.');
  process.exitCode = 1;
});
