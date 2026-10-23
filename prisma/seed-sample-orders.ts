import 'dotenv/config';
import { confirmSampleDatabase, printSampleSummary, SampleOrdersError, seedSampleOrders } from '../lib/admin/sample-orders';

async function main() {
  confirmSampleDatabase(process.env.DATABASE_URL, process.argv.slice(2));
  const { prisma } = await import('../lib/prisma');
  try {
    const summary = await seedSampleOrders(prisma);
    printSampleSummary(summary);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof SampleOrdersError ? error.message : 'Sample seeding failed. Check database connectivity and retry; clear existing samples before reseeding. Connection details are not printed.');
  process.exitCode = 1;
});
