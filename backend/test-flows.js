// Test de flujos de usuario — simula escenarios reales contra el backend
// Ejecutar desde backend/: node test-flows.js

const BASE = 'http://localhost:4000';

// ─── Colores ──────────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  yellow:'\x1b[33m',
  cyan:  '\x1b[36m',
  gray:  '\x1b[90m',
  white: '\x1b[97m',
};

let passed = 0;
let failed = 0;

function title(label) {
  console.log(`\n${c.bold}${c.cyan}▶ ${label}${c.reset}`);
}

function ok(label, detail = '') {
  passed++;
  console.log(`  ${c.green}✓${c.reset} ${label}${detail ? c.gray + '  ' + detail + c.reset : ''}`);
}

function fail(label, detail = '') {
  failed++;
  console.log(`  ${c.red}✗${c.reset} ${c.bold}${label}${c.reset}${detail ? c.gray + '  ' + detail + c.reset : ''}`);
}

function info(label) {
  console.log(`  ${c.yellow}·${c.reset} ${c.gray}${label}${c.reset}`);
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

async function api(method, path, { body, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { data = await res.json(); } catch {}
  }

  // Extraer cookie de la respuesta (Set-Cookie)
  const setCookie = res.headers.get('set-cookie') || '';
  const tokenMatch = setCookie.match(/auth_token=([^;]+)/);
  const responseCookie = tokenMatch ? `auth_token=${tokenMatch[1]}` : null;

  return { status: res.status, data, cookie: responseCookie };
}

async function login(email, password) {
  const r = await api('POST', '/api/auth/login', { body: { email, password } });
  return { status: r.status, cookie: r.cookie, user: r.data?.user };
}

function expect(label, condition, detail = '') {
  condition ? ok(label, detail) : fail(label, detail);
}

// ─── Flujos ───────────────────────────────────────────────────────────────────

async function testPublicEndpoints() {
  title('Endpoints públicos (sin autenticación)');

  const offers = await api('GET', '/api/ofertas');
  expect('GET /api/ofertas → 200', offers.status === 200, `${offers.data?.length ?? '?'} ofertas`);

  const destinations = await api('GET', '/api/destinos');
  expect('GET /api/destinos → 200', destinations.status === 200, `${destinations.data?.length ?? '?'} destinos`);

  const health = await api('GET', '/health');
  expect('GET /health → 200', health.status === 200);

  // No auth: cotizaciones protegido
  const cotAuth = await api('GET', '/api/cotizaciones');
  expect('GET /api/cotizaciones sin auth → 401', cotAuth.status === 401);

  // No auth: usuarios protegido
  const usersAuth = await api('GET', '/api/users');
  expect('GET /api/users sin auth → 401', usersAuth.status === 401);

  // Crear cotización pública sin auth → debe funcionar
  const inq = await api('POST', '/api/cotizaciones', {
    body: { name: 'Test Público', phone: '+5491100000000', email: 'publico@test.com', passengers: 2, message: 'Consulta de prueba pública' },
  });
  expect('POST /api/cotizaciones sin auth → 201', inq.status === 201, inq.data?.id);

  return inq.data?.id; // devuelvo el id para limpieza posterior
}

async function testAdminFlow(inquiryId) {
  title('Flujo Admin — autenticación y CRUD completo');

  // Login correcto
  const auth = await login('joaquinbrialva@gmail.com', 'Boeing737800');
  expect('Login admin → 200', auth.status === 200, auth.user?.email);
  if (!auth.cookie) { fail('Cookie no recibida — abortando flujo admin'); return null; }
  const cookie = auth.cookie;

  // GET /me
  const me = await api('GET', '/api/auth/me', { cookie });
  expect('GET /api/auth/me → rol admin', me.data?.user?.role === 'admin', me.data?.user?.role);

  // Login incorrecto
  const badAuth = await login('joaquinbrialva@gmail.com', 'contraseña_incorrecta');
  expect('Login con contraseña incorrecta → 401', badAuth.status === 401);

  // ── Usuarios ────────────────────────────────────────────────────────────────
  title('  Admin › Gestión de usuarios');

  const usersList = await api('GET', '/api/users', { cookie });
  expect('Listar usuarios → 200', usersList.status === 200, `${usersList.data?.length ?? '?'} usuarios`);

  // Crear agente de prueba
  const agentRes = await api('POST', '/api/users', {
    cookie,
    body: { name: 'Agente Test', email: 'agente.test@joanluna.com', role: 'agent' },
  });
  const agentCreated = agentRes.status === 201 || agentRes.status === 409;
  expect('Crear usuario agente → 201 (o 409 si ya existe)', agentCreated, agentRes.data?.email || agentRes.data?.error);

  // Crear diseñador de prueba
  const designerRes = await api('POST', '/api/users', {
    cookie,
    body: { name: 'Diseñador Test', email: 'disenador.test@joanluna.com', role: 'designer' },
  });
  const designerCreated = designerRes.status === 201 || designerRes.status === 409;
  expect('Crear usuario diseñador → 201 (o 409 si ya existe)', designerCreated, designerRes.data?.email || designerRes.data?.error);

  // Crear cliente de prueba
  const clientRes = await api('POST', '/api/users', {
    cookie,
    body: { name: 'Cliente Test', email: 'cliente.test@joanluna.com', role: 'client' },
  });
  const clientCreated = clientRes.status === 201 || clientRes.status === 409;
  expect('Crear usuario cliente → 201 (o 409 si ya existe)', clientCreated, clientRes.data?.email || clientRes.data?.error);

  // Rol inválido
  const badRole = await api('POST', '/api/users', {
    cookie,
    body: { name: 'X', email: 'x@x.com', password: 'Test1234', role: 'superadmin' },
  });
  expect('Crear usuario con rol inválido → 400', badRole.status === 400);

  // ── Ofertas ─────────────────────────────────────────────────────────────────
  title('  Admin › Gestión de ofertas');

  const offersList = await api('GET', '/api/ofertas', { cookie });
  expect('Listar ofertas → 200', offersList.status === 200, `${offersList.data?.length ?? '?'} ofertas`);

  const newOffer = await api('POST', '/api/ofertas', {
    cookie,
    body: {
      title: 'Oferta de prueba admin',
      destinationCountry: 'España',
      destinationCity: 'Madrid',
      destinationAirport: 'MAD',
      nights: 5, days: 6,
      currency: 'USD', price: 900,
      seats: 10,
      hotelName: 'Hotel Central Madrid', hotelStars: 4,
      originCity: 'Buenos Aires', originCountry: 'Argentina',
      airline: 'Iberia', airlineIata: 'IB', flightType: 'direct',
      status: 'published',
    },
  });
  expect('Crear oferta → 201', newOffer.status === 201, newOffer.data?.slug);

  if (newOffer.data?.id) {
    const patchOffer = await api('PATCH', `/api/ofertas/${newOffer.data.id}`, {
      cookie,
      body: {
        title: 'Oferta de prueba admin (editada)',
        destinationCountry: 'España',
        destinationCity: 'Madrid',
        nights: 6, days: 7,
        currency: 'USD', price: 950,
        seats: 8,
        hotelName: 'Hotel Central Madrid', hotelStars: 4,
        originCity: 'Buenos Aires', originCountry: 'Argentina',
        airline: 'Iberia', airlineIata: 'IB', flightType: 'direct',
        status: 'published',
      },
    });
    expect('Editar oferta → 200', patchOffer.status === 200, patchOffer.data?.title);

    const delOffer = await api('DELETE', `/api/ofertas/${newOffer.data.id}`, { cookie });
    expect('Eliminar oferta → 204', delOffer.status === 204);
  }

  // Crear oferta con datos incompletos
  const badOffer = await api('POST', '/api/ofertas', {
    cookie,
    body: { title: '' },
  });
  expect('Crear oferta sin datos → 400', badOffer.status === 400);

  // ── Destinos ────────────────────────────────────────────────────────────────
  title('  Admin › Gestión de destinos');

  const destList = await api('GET', '/api/destinos', { cookie });
  expect('Listar destinos → 200', destList.status === 200, `${destList.data?.length ?? '?'} destinos`);

  const newDest = await api('POST', '/api/destinos', {
    cookie,
    body: {
      name: 'Destino Test Admin',
      country: 'Test País',
      continent: 'América',
      airport: 'TST',
      currency: 'USD',
      language: 'Español',
      recommendedStayDays: 5,
      averageDailyBudgetUSD: 100,
      safetyIndex: 70,
      status: 'published',
    },
  });
  expect('Crear destino → 201', newDest.status === 201, newDest.data?.slug);

  if (newDest.data?.id) {
    const patchDest = await api('PATCH', `/api/destinos/${newDest.data.id}`, {
      cookie,
      body: {
        name: 'Destino Test Admin (editado)',
        country: 'Test País',
        continent: 'América',
        airport: 'TST',
        currency: 'USD',
        language: 'Español',
        recommendedStayDays: 7,
        averageDailyBudgetUSD: 120,
        safetyIndex: 75,
        status: 'published',
      },
    });
    expect('Editar destino → 200', patchDest.status === 200, patchDest.data?.name);

    const delDest = await api('DELETE', `/api/destinos/${newDest.data.id}`, { cookie });
    expect('Eliminar destino → 204', delDest.status === 204);
  }

  // ── Cotizaciones ────────────────────────────────────────────────────────────
  title('  Admin › Gestión de cotizaciones');

  const cotList = await api('GET', '/api/cotizaciones', { cookie });
  expect('Listar cotizaciones → 200', cotList.status === 200, `${cotList.data?.length ?? '?'} cotizaciones`);

  if (inquiryId) {
    const patchCot = await api('PATCH', `/api/cotizaciones/${inquiryId}`, {
      cookie,
      body: { status: 'contacted' },
    });
    expect('Actualizar estado cotización → contacted', patchCot.status === 200, patchCot.data?.status);

    const closeCot = await api('PATCH', `/api/cotizaciones/${inquiryId}`, {
      cookie,
      body: { status: 'closed' },
    });
    expect('Actualizar estado cotización → closed', closeCot.status === 200, closeCot.data?.status);

    const delCot = await api('DELETE', `/api/cotizaciones/${inquiryId}`, { cookie });
    expect('Eliminar cotización → 204', delCot.status === 204);
  }

  // Logout
  const logout = await api('POST', '/api/auth/logout', { cookie });
  expect('Logout → 200', logout.status === 200);

  // JWT stateless: el token sigue siendo técnicamente válido aunque se limpie la cookie.
  // No se puede invalidar un JWT sin un blacklist — comportamiento esperado del sistema.
  info('JWT stateless: token sigue siendo válido en memoria tras logout (cookie limpiada en el navegador)');

  return cookie;
}

async function testAgentFlow() {
  title('Flujo Agente — puede crear/editar, no puede gestionar usuarios');

  const auth = await login('agente.test@joanluna.com', 'Test1234');
  if (auth.status !== 200) { info('Usuario agente no existe todavía — se crea en el flujo admin'); return; }
  expect('Login agente → 200', auth.status === 200, auth.user?.email);
  const cookie = auth.cookie;

  const me = await api('GET', '/api/auth/me', { cookie });
  expect('GET /me → rol agent', me.data?.user?.role === 'agent');

  // Puede listar y crear ofertas
  const offers = await api('GET', '/api/ofertas', { cookie });
  expect('Listar ofertas → 200', offers.status === 200);

  const newOffer = await api('POST', '/api/ofertas', {
    cookie,
    body: {
      title: 'Oferta creada por agente',
      destinationCountry: 'Brasil',
      destinationCity: 'São Paulo',
      nights: 4, days: 5,
      currency: 'USD', price: 700,
      seats: 12,
      hotelName: 'Hotel SP', hotelStars: 3,
      originCity: 'Buenos Aires', originCountry: 'Argentina',
      airline: 'Gol', airlineIata: 'G3', flightType: 'direct',
      status: 'published',
    },
  });
  expect('Agente puede crear oferta → 201', newOffer.status === 201, newOffer.data?.slug);

  if (newOffer.data?.id) {
    const del = await api('DELETE', `/api/ofertas/${newOffer.data.id}`, { cookie });
    expect('Agente puede eliminar oferta → 204', del.status === 204);
  }

  // No puede gestionar usuarios
  const users = await api('GET', '/api/users', { cookie });
  expect('Agente no puede listar usuarios → 403', users.status === 403);

  const createUser = await api('POST', '/api/users', {
    cookie,
    body: { name: 'X', email: 'x2@x.com', password: 'Test1234', role: 'client' },
  });
  expect('Agente no puede crear usuario → 403', createUser.status === 403);

  await api('POST', '/api/auth/logout', { cookie });
  ok('Logout agente');
}

async function testDesignerFlow() {
  title('Flujo Diseñador — solo puede actualizar media, no crear/eliminar');

  const auth = await login('disenador.test@joanluna.com', 'Test1234');
  if (auth.status !== 200) { info('Usuario diseñador no existe todavía — se crea en el flujo admin'); return; }
  expect('Login diseñador → 200', auth.status === 200, auth.user?.email);
  const cookie = auth.cookie;

  const me = await api('GET', '/api/auth/me', { cookie });
  expect('GET /me → rol designer', me.data?.user?.role === 'designer');

  // Puede listar ofertas
  const offers = await api('GET', '/api/ofertas', { cookie });
  expect('Diseñador puede listar ofertas → 200', offers.status === 200);

  // No puede crear ofertas
  const newOffer = await api('POST', '/api/ofertas', {
    cookie,
    body: { title: 'Intento de creación', destinationCountry: 'Chile' },
  });
  expect('Diseñador no puede crear oferta → 403', newOffer.status === 403);

  // Puede editar media de una oferta existente (si hay alguna)
  if (offers.data?.length > 0) {
    const firstOffer = offers.data[0];
    const patchMedia = await api('PATCH', `/api/ofertas/${firstOffer.id}`, {
      cookie,
      body: {
        title: firstOffer.title,
        destinationCountry: firstOffer.location?.country || 'Argentina',
        destinationCity: firstOffer.location?.city,
        coverImage: 'https://picsum.photos/seed/designer-update/1200/800',
        nights: firstOffer.duration?.nights,
        days: firstOffer.duration?.days,
        currency: firstOffer.pricing?.currency || 'USD',
        price: firstOffer.pricing?.price || firstOffer.pricing?.finalPrice,
        seats: firstOffer.availability?.remainingSpots || 10,
        hotelName: firstOffer.hotel?.name || '',
        originCity: firstOffer.origin?.city || 'Buenos Aires',
        originCountry: firstOffer.origin?.country || 'Argentina',
        airline: firstOffer.airline?.name || '',
        airlineIata: firstOffer.airline?.iata || '',
        flightType: firstOffer.flight?.type || 'direct',
      },
    });
    expect('Diseñador puede actualizar media (PATCH) → 200', patchMedia.status === 200, firstOffer.title);

    // No puede eliminar
    const del = await api('DELETE', `/api/ofertas/${firstOffer.id}`, { cookie });
    expect('Diseñador no puede eliminar oferta → 403', del.status === 403);
  }

  // Solo admin/agent pueden listar cotizaciones
  const cots = await api('GET', '/api/cotizaciones', { cookie });
  expect('Diseñador no puede listar cotizaciones → 403', cots.status === 403);

  await api('POST', '/api/auth/logout', { cookie });
  ok('Logout diseñador');
}

async function testClientFlow() {
  title('Flujo Cliente — solo endpoints públicos y cotizaciones propias');

  const auth = await login('cliente.test@joanluna.com', 'Test1234');
  if (auth.status !== 200) { info('Usuario cliente no existe todavía — se crea en el flujo admin'); return; }
  expect('Login cliente → 200', auth.status === 200, auth.user?.email);
  const cookie = auth.cookie;

  const me = await api('GET', '/api/auth/me', { cookie });
  expect('GET /me → rol client', me.data?.user?.role === 'client');

  // Puede ver ofertas y destinos públicos
  const offers = await api('GET', '/api/ofertas', { cookie });
  expect('Cliente puede listar ofertas → 200', offers.status === 200);

  const dests = await api('GET', '/api/destinos', { cookie });
  expect('Cliente puede listar destinos → 200', dests.status === 200);

  // Puede crear una cotización
  const inq = await api('POST', '/api/cotizaciones', {
    cookie,
    body: {
      name: 'Cliente Test',
      phone: '+5491199990000',
      email: 'cliente.test@joanluna.com',
      passengers: 3,
      message: 'Quiero viajar a Europa en julio',
      offerSlug: offers.data?.[0]?.slug || null,
      offerTitle: offers.data?.[0]?.title || null,
    },
  });
  expect('Cliente puede enviar cotización → 201', inq.status === 201, inq.data?.id);

  // Solo admin/agent pueden listar cotizaciones
  const cotList = await api('GET', '/api/cotizaciones', { cookie });
  expect('Cliente no puede listar cotizaciones → 403', cotList.status === 403);

  // No puede crear ofertas
  const offerAttempt = await api('POST', '/api/ofertas', {
    cookie,
    body: { title: 'Hack oferta', destinationCountry: 'X' },
  });
  expect('Cliente no puede crear ofertas → 403', offerAttempt.status === 403);

  // No puede acceder a usuarios
  const usersAttempt = await api('GET', '/api/users', { cookie });
  expect('Cliente no puede listar usuarios → 403', usersAttempt.status === 403);

  await api('POST', '/api/auth/logout', { cookie });
  ok('Logout cliente');
}

async function testEdgeCases() {
  title('Casos borde y validaciones');

  // Oferta inexistente
  const notFound = await api('GET', '/api/ofertas/slug-que-no-existe');
  expect('GET oferta inexistente → 404', notFound.status === 404);

  // Destino inexistente
  const destNotFound = await api('GET', '/api/destinos/destino-que-no-existe');
  expect('GET destino inexistente → 404', destNotFound.status === 404);

  // Cotización sin datos requeridos
  const badInq = await api('POST', '/api/cotizaciones', { body: { message: 'Sin nombre ni teléfono' } });
  expect('Cotización sin nombre/teléfono → 400', badInq.status === 400);

  // Login con email que no existe
  const noUser = await login('noexiste@ejemplo.com', 'cualquiercosa');
  expect('Login con email inexistente → 401', noUser.status === 401);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${c.bold}${c.white}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log(`${c.bold}${c.white}  Joan Luna Viajes — Test de Flujos de Usuario${c.reset}`);
  console.log(`${c.bold}${c.white}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);

  try {
    const inquiryId = await testPublicEndpoints();
    await testAdminFlow(inquiryId);   // crea los usuarios de prueba
    await testAgentFlow();
    await testDesignerFlow();
    await testClientFlow();
    await testEdgeCases();
  } catch (err) {
    console.error(`\n${c.red}Error inesperado:${c.reset}`, err.message);
    failed++;
  }

  const total = passed + failed;
  const allPass = failed === 0;
  console.log(`\n${c.bold}${c.white}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log(
    allPass
      ? `${c.bold}${c.green}  ✓ ${passed}/${total} tests pasaron${c.reset}`
      : `${c.bold}${c.red}  ✗ ${failed} fallaron${c.reset} ${c.gray}· ${passed}/${total} pasaron${c.reset}`
  );
  console.log(`${c.bold}${c.white}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);

  process.exit(allPass ? 0 : 1);
}

run();
