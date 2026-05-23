import http from 'node:http';

const port = Number(process.env.MOCK_ADMIN_API_PORT ?? '7072');

const now = '2026-05-04T12:00:00.000Z';

let categories = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    heroImageUrl: 'https://example.com/plumbing.jpg',
    sortOrder: 10,
    isActive: true,
    updatedBy: 'seed',
    createdAt: now,
    updatedAt: now,
  },
];

let services = [
  {
    id: 'leak-fix',
    categoryId: 'plumbing',
    name: 'Leak Fix',
    shortDescription: 'Fast pipe and tap leak repair.',
    heroImageUrl: 'https://example.com/leak.jpg',
    basePrice: 59900,
    commissionBps: 2250,
    durationMinutes: 60,
    includes: [],
    faq: [],
    addOns: [],
    photoStages: [],
    isActive: true,
    updatedBy: 'seed',
    createdAt: now,
    updatedAt: now,
  },
];

let adminUsers = [
  {
    adminId: 'super-e2e',
    email: 'owner@homeheroo.test',
    role: 'super-admin',
    displayName: 'Owner',
    totpEnrolled: true,
    createdAt: now,
    updatedAt: now,
    deactivatedAt: null,
  },
];

const complaints = [
  {
    id: 'a11y-complaint-001',
    orderId: 'order-1',
    customerId: 'cust-1',
    customerName: 'Ramesh Verma',
    technicianId: 'tech-1',
    technicianName: 'Suresh Kumar',
    status: 'NEW',
    description: 'Technician arrived late',
    assigneeAdminId: null,
    internalNotes: [],
    createdAt: now,
    updatedAt: now,
  },
];

let erasureRequests = [
  {
    id: 'erase-1',
    userId: 'cust-1',
    userRole: 'CUSTOMER',
    status: 'PENDING',
    requestedAt: '2026-04-20T00:00:00.000Z',
    scheduledDeletionAt: '2026-04-28T00:00:00.000Z',
    reason: 'User request',
  },
];

let levies = [
  {
    id: '2026-Q1',
    quarter: '2026-Q1',
    gmv: 10000000,
    levyRate: 0.01,
    levyAmount: 100000,
    status: 'PENDING_APPROVAL',
    createdAt: '2026-04-01T00:00:00.000Z',
  },
];

function send(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function withAuditFields(doc) {
  return { ...doc, updatedBy: 'e2e', updatedAt: now };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  const path = url.pathname;

  if (path === '/api/v1/health') {
    send(res, 200, { ok: true, version: '0.1.0', commit: 'abcdef1234567890' });
    return;
  }

  if (path === '/api/v1/admin/dashboard/summary') {
    send(res, 200, {
      summary: {
        bookingsToday: 8,
        gmvToday: 1200000,
        commissionToday: 270000,
        payoutsPending: 286750,
        complaintsOpen: 2,
        techsOnDuty: 5,
      },
    });
    return;
  }

  if (path === '/api/v1/admin/dashboard/tech-locations') {
    send(res, 200, { techs: [] });
    return;
  }

  if (path === '/api/v1/admin/dashboard/feed') {
    send(res, 200, { events: [], total: 0 });
    return;
  }

  if (path === '/api/v1/admin/catalogue/categories' && req.method === 'GET') {
    send(res, 200, { categories });
    return;
  }

  if (path === '/api/v1/admin/catalogue/categories' && req.method === 'POST') {
    const body = await readJson(req);
    const created = withAuditFields({ ...body, isActive: true, createdAt: now });
    categories = [...categories, created];
    send(res, 201, created);
    return;
  }

  const categoryMatch = /^\/api\/v1\/admin\/catalogue\/categories\/([^/]+)$/.exec(path);
  if (categoryMatch && req.method === 'GET') {
    const category = categories.find((item) => item.id === categoryMatch[1]);
    send(res, category ? 200 : 404, category ?? { error: 'Category not found' });
    return;
  }

  if (categoryMatch && req.method === 'PUT') {
    const body = await readJson(req);
    categories = categories.map((item) =>
      item.id === categoryMatch[1] ? withAuditFields({ ...item, ...body }) : item,
    );
    send(res, 200, categories.find((item) => item.id === categoryMatch[1]));
    return;
  }

  const categoryToggleMatch = /^\/api\/v1\/admin\/catalogue\/categories\/([^/]+)\/toggle$/.exec(path);
  if (categoryToggleMatch && req.method === 'PATCH') {
    categories = categories.map((item) =>
      item.id === categoryToggleMatch[1] ? withAuditFields({ ...item, isActive: !item.isActive }) : item,
    );
    send(res, 200, categories.find((item) => item.id === categoryToggleMatch[1]));
    return;
  }

  if (path === '/api/v1/admin/catalogue/services' && req.method === 'GET') {
    const categoryId = url.searchParams.get('categoryId');
    send(res, 200, {
      services: categoryId ? services.filter((item) => item.categoryId === categoryId) : services,
    });
    return;
  }

  if (path === '/api/v1/admin/catalogue/services' && req.method === 'POST') {
    const body = await readJson(req);
    const created = withAuditFields({ ...body, isActive: true, createdAt: now });
    services = [...services, created];
    send(res, 201, created);
    return;
  }

  const serviceMatch = /^\/api\/v1\/admin\/catalogue\/services\/([^/]+)$/.exec(path);
  if (serviceMatch && req.method === 'GET') {
    const service = services.find((item) => item.id === serviceMatch[1]);
    send(res, service ? 200 : 404, service ?? { error: 'Service not found' });
    return;
  }

  if (serviceMatch && req.method === 'PUT') {
    const body = await readJson(req);
    services = services.map((item) =>
      item.id === serviceMatch[1] ? withAuditFields({ ...item, ...body }) : item,
    );
    send(res, 200, services.find((item) => item.id === serviceMatch[1]));
    return;
  }

  const serviceToggleMatch = /^\/api\/v1\/admin\/catalogue\/services\/([^/]+)\/toggle$/.exec(path);
  if (serviceToggleMatch && req.method === 'PATCH') {
    services = services.map((item) =>
      item.id === serviceToggleMatch[1] ? withAuditFields({ ...item, isActive: !item.isActive }) : item,
    );
    send(res, 200, services.find((item) => item.id === serviceToggleMatch[1]));
    return;
  }

  if (path === '/api/v1/admin/finance/summary') {
    send(res, 200, {
      dailyPnL: [{ date: '2026-05-04', grossRevenue: 1200000, commission: 270000, netToOwner: 930000 }],
      totalGross: 1200000,
      totalCommission: 270000,
      totalNet: 930000,
    });
    return;
  }

  if (path === '/api/v1/admin/finance/payout-queue') {
    send(res, 200, {
      weekStart: '2026-04-27',
      weekEnd: '2026-05-03',
      totalNetPayable: 286750,
      entries: [
        {
          technicianId: 'tech-1',
          technicianName: 'Ravi Kumar',
          completedJobsThisWeek: 5,
          grossEarnings: 250000,
          commissionDeducted: 56250,
          netPayable: 193750,
        },
      ],
    });
    return;
  }

  if (path === '/api/v1/admin/finance/payouts/approve-all' && req.method === 'POST') {
    send(res, 200, { approved: 1, failed: 0, errors: [] });
    return;
  }

  if (path === '/api/v1/admin/orders') {
    send(res, 200, { items: [], total: 0, page: 1, pageSize: 50, totalPages: 1 });
    return;
  }

  if (path === '/api/v1/admin/complaints') {
    const filteredComplaints = url.searchParams.has('status')
      ? complaints.filter(c => url.searchParams.get('status')?.split(',').includes(c.status))
      : complaints;
    send(res, 200, { items: filteredComplaints, total: filteredComplaints.length, page: 1, pageSize: 50, totalPages: 1 });
    return;
  }

  if (path === '/api/v1/admin/complaints/repeat-offenders') {
    send(res, 200, { offenders: [{ technicianId: 'tech-1', count: 4 }] });
    return;
  }

  if (path === '/api/v1/admin/users' && req.method === 'GET') {
    send(res, 200, { users: adminUsers });
    return;
  }

  const adminUserMatch = /^\/api\/v1\/admin\/users\/([^/]+)$/.exec(path);
  if (adminUserMatch && req.method === 'PATCH') {
    const body = await readJson(req);
    adminUsers = adminUsers.map((item) =>
      item.adminId === adminUserMatch[1] ? { ...item, ...body, updatedAt: now } : item,
    );
    send(res, 200, { ok: true });
    return;
  }

  if (path === '/api/v1/admin/erasure-requests') {
    send(res, 200, { items: erasureRequests });
    return;
  }

  const erasureMatch = /^\/api\/v1\/admin\/erasure-requests\/([^/]+)$/.exec(path);
  if (erasureMatch && req.method === 'PATCH') {
    const body = await readJson(req);
    if (body.action === 'DENY') {
      erasureRequests = erasureRequests.map((item) =>
        item.id === erasureMatch[1]
          ? { ...item, status: 'DENIED', denialReason: body.reason, deniedAt: now }
          : item,
      );
      send(res, 200, { erasureId: erasureMatch[1], status: 'DENIED', denialReason: body.reason, deniedAt: now });
      return;
    }
    erasureRequests = erasureRequests.map((item) =>
      item.id === erasureMatch[1] ? { ...item, status: 'EXECUTED', executedAt: now } : item,
    );
    send(res, 200, { erasureId: erasureMatch[1], status: 'EXECUTED', executedAt: now, deletedCounts: {} });
    return;
  }

  if (path === '/api/v1/admin/compliance/ssc-levy') {
    send(res, 200, { levies });
    return;
  }

  const sscApproveMatch = /^\/api\/v1\/admin\/compliance\/ssc-levy\/([^/]+)\/approve$/.exec(path);
  if (sscApproveMatch && req.method === 'POST') {
    levies = levies.map((item) =>
      item.id === sscApproveMatch[1]
        ? { ...item, status: 'TRANSFERRED', razorpayTransferId: 'trf_e2e', transferredAt: now }
        : item,
    );
    const levy = levies.find((item) => item.id === sscApproveMatch[1]);
    send(res, 200, {
      levyId: sscApproveMatch[1],
      quarter: levy?.quarter ?? sscApproveMatch[1],
      transferId: 'trf_e2e',
      status: 'TRANSFERRED',
    });
    return;
  }

  send(res, 404, { error: `Unhandled mock route ${req.method} ${path}` });
});

server.listen(port, () => {
  console.log(`Mock admin API listening on http://localhost:${port}/api/v1/health`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
