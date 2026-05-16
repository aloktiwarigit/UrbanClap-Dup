import { app } from '@azure/functions';
import { z } from 'zod';
import { requireCustomer, type CustomerHttpHandler } from '../middleware/requireCustomer.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { slotHoldsRepo } from '../cosmos/slot-holds-repository.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { generateSlots, filterElapsedSlots, currentIstMinuteOfDay, todayIst } from '../shared/slot-utils.js';

function addDays(yyyymmdd: string, days: number): string {
  const d = new Date(`${yyyymmdd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const DateQuerySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d.getTime());
}, { message: 'Invalid calendar date' });

export const availabilityHandler: CustomerHttpHandler = async (req, _ctx, _customer) => {
  const { id: serviceId } = (req as unknown as { params: { id: string } }).params;
  const dateParam = (req as unknown as { query: { get(k: string): string | null } }).query.get('date');

  // Validate date param format
  const dateParsed = DateQuerySchema.safeParse(dateParam);
  if (!dateParsed.success) {
    return { status: 422, jsonBody: { code: 'INVALID_DATE_RANGE', message: 'date must be YYYY-MM-DD' } };
  }
  const date = dateParsed.data;

  // Validate range: today IST ≤ date ≤ today+7 IST
  const today = todayIst();
  const max = addDays(today, 7);
  if (date < today || date > max) {
    return {
      status: 422,
      jsonBody: {
        code: 'INVALID_DATE_RANGE',
        message: `date must be between ${today} and ${max} (IST)`,
      },
    };
  }

  // Look up service
  const service = await catalogueRepo.getServiceByIdCrossPartition(serviceId);
  if (!service || !service.isActive) {
    return { status: 404, jsonBody: { code: 'SERVICE_NOT_FOUND' } };
  }

  // Generate server-side slot windows; filter elapsed slots when date is today
  let allWindows = generateSlots(service, date);
  if (date === today) {
    allWindows = filterElapsedSlots(allWindows, currentIstMinuteOfDay());
  }

  // Load held + hard-booked windows in parallel
  const [holds, bookedWindows] = await Promise.all([
    slotHoldsRepo.listHolds(serviceId, date),
    bookingRepo.getBookedWindowsByServiceDate(serviceId, date),
  ]);

  const unavailable = new Set<string>([
    ...holds.map((h) => h.window),
    ...bookedWindows,
  ]);

  return {
    status: 200,
    jsonBody: {
      serviceId,
      date,
      slotGranularityMinutes: service.durationMinutes,
      slots: allWindows.map((window) => ({ window, available: !unavailable.has(window) })),
    },
  };
};

app.http('servicesAvailability', {
  methods: ['GET'],
  route: 'v1/services/{id}/availability',
  handler: requireCustomer(availabilityHandler),
});
