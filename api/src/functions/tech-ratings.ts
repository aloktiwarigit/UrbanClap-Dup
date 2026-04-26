import { type HttpHandler, type HttpRequest, type InvocationContext, app } from '@azure/functions';
import '../bootstrap.js';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { ratingRepo } from '../cosmos/rating-repository.js';
import type { TechRatingSummary } from '../schemas/rating.js';

export const getTechRatingsHandler: HttpHandler = async (req: HttpRequest, _ctx: InvocationContext) => {
  let uid: string;
  try {
    const decoded = await verifyTechnicianToken(req);
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  const docs = await ratingRepo.getAllByTechnicianId(uid);

  const n = docs.length;
  if (n === 0) {
    return {
      status: 200,
      jsonBody: {
        totalCount: 0,
        averageOverall: 0,
        averageSubScores: { punctuality: 0, skill: 0, behaviour: 0 },
        trend: [],
        items: [],
      } satisfies TechRatingSummary,
    };
  }

  const round1 = (v: number) => Math.round(v * 10) / 10;
  const sumOverall = docs.reduce((s, d) => s + (d.customerOverall ?? 0), 0);
  const sumP = docs.reduce((s, d) => s + (d.customerSubScores?.punctuality ?? 0), 0);
  const sumS = docs.reduce((s, d) => s + (d.customerSubScores?.skill ?? 0), 0);
  const sumB = docs.reduce((s, d) => s + (d.customerSubScores?.behaviour ?? 0), 0);

  const sorted = [...docs].sort(
    (a, b) => (b.customerSubmittedAt ?? '').localeCompare(a.customerSubmittedAt ?? ''),
  );

  const weekMap = new Map<string, { sum: number; count: number }>();
  for (const d of docs) {
    if (!d.customerSubmittedAt) continue;
    const date = new Date(d.customerSubmittedAt);
    const dow = (date.getUTCDay() + 6) % 7;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - dow);
    const key = monday.toISOString().slice(0, 10);
    const entry = weekMap.get(key) ?? { sum: 0, count: 0 };
    entry.sum += d.customerOverall ?? 0;
    entry.count += 1;
    weekMap.set(key, entry);
  }
  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setUTCDate(now.getUTCDate() - 28);
  const trend = [...weekMap.entries()]
    .filter(([k]) => new Date(k) >= fourWeeksAgo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, { sum, count }]) => ({ weekStart, average: round1(sum / count), count }));

  const items = sorted.map(d => ({
    bookingId: d.bookingId,
    overall: d.customerOverall ?? 0,
    subScores: {
      punctuality: d.customerSubScores?.punctuality ?? 0,
      skill: d.customerSubScores?.skill ?? 0,
      behaviour: d.customerSubScores?.behaviour ?? 0,
    },
    ...(d.customerComment ? { comment: d.customerComment } : {}),
    submittedAt: d.customerSubmittedAt!,
  }));

  return {
    status: 200,
    jsonBody: {
      totalCount: n,
      averageOverall: round1(sumOverall / n),
      averageSubScores: {
        punctuality: round1(sumP / n),
        skill: round1(sumS / n),
        behaviour: round1(sumB / n),
      },
      trend,
      items,
    } satisfies TechRatingSummary,
  };
};

app.http('getTechRatings', {
  route: 'v1/technicians/me/ratings',
  methods: ['GET'],
  handler: getTechRatingsHandler,
});
