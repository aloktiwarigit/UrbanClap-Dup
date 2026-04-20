import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const OrderStatusEnum = z.enum([
  'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',
  'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PAID',
]);

export const OrderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  technicianId: z.string().optional(),
  technicianName: z.string().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  categoryId: z.string().optional(),
  status: OrderStatusEnum,
  city: z.string(),
  scheduledAt: z.string(),
  amount: z.number().nonnegative(),
  createdAt: z.string(),
  _ts: z.number().optional(),
});

export const OrderListQuerySchema = z.object({
  status: z.string().optional().transform(s =>
    s ? s.split(',').map(x => x.trim()).filter(Boolean) as z.infer<typeof OrderStatusEnum>[] : undefined
  ),
  city: z.string().optional(),
  categoryId: z.string().optional(),
  technicianId: z.string().optional(),
  customerPhone: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(50).transform(v => Math.min(v, 10000)),
});

export const OrderListResponseSchema = z.object({
  items: z.array(OrderSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;
