import { db } from '@/config/database';
import { InsertSale, sales } from '@/schemas/sales.schema';

export const updateOnSales = async (data: InsertSale) => {
  return await db
    .insert(sales)
    .values(data)
    .returning()
    .execute()
    .then(([res]) => res)
    .catch(() => null);
};
