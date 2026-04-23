import { z } from 'zod';
import { type HttpHandler, type InvocationContext, app } from '@azure/functions';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { getCosmosClient, DB_NAME } from '../cosmos/client.js';

const PatchFcmTokenBodySchema = z.object({
  fcmToken: z.string().min(1),
});

export const patchFcmTokenHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  let uid: string;
  try {
    const decoded = await verifyTechnicianToken(req);
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  let body: { fcmToken: string };
  try {
    const raw: unknown = await req.json();
    const result = PatchFcmTokenBodySchema.safeParse(raw);
    if (!result.success) {
      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: result.error.issues } };
    }
    body = result.data;
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  const container = getCosmosClient().database(DB_NAME).container('technicians');
  const { resource: existing } = await container.item(uid, uid).read<Record<string, unknown>>();
  const doc = { ...(existing ?? { id: uid }), fcmToken: body.fcmToken };
  await container.items.upsert(doc);

  return { status: 200, jsonBody: { ok: true } };
};

app.http('patchTechnicianFcmToken', {
  route: 'v1/technicians/fcm-token',
  methods: ['PATCH'],
  handler: patchFcmTokenHandler,
});
