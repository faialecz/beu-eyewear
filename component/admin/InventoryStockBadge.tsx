import { LOW_STOCK_THRESHOLD } from '@/lib/admin/config';

export default function InventoryStockBadge({ quantity }: { quantity: number }) {
  if (quantity <= 0) {
    return <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-600">Out of stock</span>;
  }
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600">Low · {quantity}</span>;
  }
  return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">In stock</span>;
}
