import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import '../bootstrap.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { ServiceCardSchema, ServiceDetailSchema } from '../schemas/service.js';

const CACHE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
};

export async function getCategoriesHandler(
  _req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const [categories, allServices] = await Promise.all([
    catalogueRepo.listActiveCategories(),
    catalogueRepo.listAllActiveServices(),
  ]);

  const catIds = new Set(categories.map((c) => c.id));
  const byCat = new Map<string, typeof allServices>();
  for (const svc of allServices) {
    if (!catIds.has(svc.categoryId)) continue;
    const list = byCat.get(svc.categoryId) ?? [];
    list.push(svc);
    byCat.set(svc.categoryId, list);
  }

  return {
    status: 200,
    headers: CACHE_HEADERS,
    jsonBody: {
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        heroImageUrl: cat.heroImageUrl,
        sortOrder: cat.sortOrder,
        services: (byCat.get(cat.id) ?? []).map((s) => ServiceCardSchema.parse(s)),
      })),
    },
  };
}

export async function getServiceByIdHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const id = req.params['id'];
  if (!id) return { status: 400, jsonBody: { error: 'Missing id' } };

  const svc = await catalogueRepo.getServiceByIdCrossPartition(id);
  if (!svc || !svc.isActive) {
    return { status: 404, jsonBody: { error: 'Service not found' } };
  }

  return {
    status: 200,
    headers: CACHE_HEADERS,
    jsonBody: ServiceDetailSchema.parse(svc),
  };
}

app.http('getCategories', {
  methods: ['GET'],
  route: 'v1/categories',
  authLevel: 'anonymous',
  handler: getCategoriesHandler,
});

app.http('getServiceById', {
  methods: ['GET'],
  route: 'v1/services/{id}',
  authLevel: 'anonymous',
  handler: getServiceByIdHandler,
});
