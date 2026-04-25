import { getRatingsContainer } from './client.js';
import type { RatingDoc } from '../schemas/rating.js';

interface SubmitInput {
  bookingId: string;
  customerId: string;
  technicianId: string;
  side: 'CUSTOMER_TO_TECH' | 'TECH_TO_CUSTOMER';
  overall: number;
  subScores: Record<string, number>;
  comment?: string;
}

function nowIso(): string { return new Date().toISOString(); }

export const ratingRepo = {
  async getByBookingId(bookingId: string): Promise<RatingDoc | null> {
    const { resource } = await getRatingsContainer()
      .item(bookingId, bookingId)
      .read<RatingDoc>();
    return resource ?? null;
  },

  async submitSide(input: SubmitInput): Promise<RatingDoc | null> {
    const existing = await this.getByBookingId(input.bookingId);
    const now = nowIso();

    if (!existing) {
      const fresh: RatingDoc = {
        id: input.bookingId,
        bookingId: input.bookingId,
        customerId: input.customerId,
        technicianId: input.technicianId,
        ...(input.side === 'CUSTOMER_TO_TECH'
          ? {
              customerOverall: input.overall,
              customerSubScores: input.subScores as RatingDoc['customerSubScores'],
              customerComment: input.comment,
              customerSubmittedAt: now,
            }
          : {
              techOverall: input.overall,
              techSubScores: input.subScores as RatingDoc['techSubScores'],
              techComment: input.comment,
              techSubmittedAt: now,
            }),
      };
      const { resource } = await getRatingsContainer().items.create<RatingDoc>(fresh);
      return resource ?? fresh;
    }

    const alreadySubmitted =
      input.side === 'CUSTOMER_TO_TECH'
        ? existing.customerSubmittedAt !== undefined
        : existing.techSubmittedAt !== undefined;
    if (alreadySubmitted) return null;

    const updated: RatingDoc = {
      ...existing,
      ...(input.side === 'CUSTOMER_TO_TECH'
        ? {
            customerOverall: input.overall,
            customerSubScores: input.subScores as RatingDoc['customerSubScores'],
            customerComment: input.comment,
            customerSubmittedAt: now,
          }
        : {
            techOverall: input.overall,
            techSubScores: input.subScores as RatingDoc['techSubScores'],
            techComment: input.comment,
            techSubmittedAt: now,
          }),
    };
    if (updated.customerSubmittedAt && updated.techSubmittedAt && !updated.revealedAt) {
      updated.revealedAt = now;
    }
    const { resource } = await getRatingsContainer()
      .item(input.bookingId, input.bookingId)
      .replace<RatingDoc>(updated);
    return resource ?? updated;
  },
};
