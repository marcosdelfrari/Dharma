'use strict';

/**
 * Gera src/docs/openapi.json a partir das rotas Express registradas em createApp().
 * Uso: node scripts/generate-openapi.js
 */

const fs = require('fs');
const path = require('path');
const listEndpoints = require('express-list-endpoints');
const { createApp } = require('../src/app');

const OUT = path.join(__dirname, '../src/docs/openapi.json');

const DOC_HTML_PREFIXES = ['/docs', '/api/docs'];

const TAG_DESCRIPTIONS = {
  Sistema: 'Health, config pública e metadados',
  Auth: 'Login, logout, instalação e tokens de API',
  'Auth (associado)': 'Portal do associado (cadastro e sessão)',
  Admin: 'Painel administrador (schema, papéis)',
  'Admin — serviços externos': 'Integrações e credenciais (admin)',
  'Admin — storage': 'Armazenamento, backups e branding',
  'Admin — webhooks': 'Webhooks de saída',
  'Admin — observabilidade': 'Erros, web vitals, cache, saúde',
  Users: 'Associados e pacientes',
  Orders: 'Pedidos',
  Services: 'Atendimentos',
  Reception: 'Acolhimento e triagem',
  Products: 'Produtos e estoque',
  Professionals: 'Profissionais',
  Files: 'Upload e download de arquivos',
  Modules: 'Módulos de integração (OAuth, webhooks públicos)',
  'Modules — pagarme': 'Pagar.me',
  'Modules — melhorenvio': 'Melhor Envio',
  'Modules — loggi': 'Loggi',
  'Modules — google_calendar': 'Google Calendar',
  'Modules — utalk': 'Utalk',
  'Modules — pedidos remotos': 'Sincronização de pedidos com instância remota (OAuth, webhooks, outbound)',
  'Modules — geoapify': 'Geoapify',
  'Modules — ciap2': 'CIAP2',
  'Modules — email': 'E-mail',
  'Doc sign': 'Assinatura eletrônica de documentos',
  Terms: 'Termos e contratos',
  Items: 'CRUD genérico por coleção (admin operacional)',
  Outros: 'Demais rotas da API v1',
};

const PATH_OVERRIDES = {
  'GET /api/v1/config/public': {
    summary: 'Config pública por sistema (branding, flags)',
    parameters: [
      {
        name: 'system',
        in: 'query',
        required: true,
        description: 'Identificador do sistema (ex.: dharma, registration)',
        schema: { type: 'string', example: 'dharma' },
      },
    ],
  },
};

function shouldInclude(pathname) {
  if (DOC_HTML_PREFIXES.some((p) => pathname === p || pathname === `${p}/`)) {
    return false;
  }
  if (pathname === '/' || pathname === '/api') return false;
  if (pathname.startsWith('/api/v1')) return true;
  if (pathname === '/health' || pathname === '/api/health') return true;
  if (pathname === '/docs/openapi.json' || pathname === '/api/docs/openapi.json') return true;
  return false;
}

function expressPathToOpenApi(routePath) {
  return routePath.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function tagForPath(routePath) {
  if (routePath === '/health' || routePath === '/api/health') return 'Sistema';
  if (routePath.includes('/openapi.json')) return 'Sistema';

  const rest = routePath.replace(/^\/api\/v1\/?/, '');
  const seg = rest.split('/').filter(Boolean)[0] || 'Outros';

  if (seg === 'auth') {
    if (rest.startsWith('auth/associate')) return 'Auth (associado)';
    return 'Auth';
  }
  if (seg === 'admin') {
    const sub = rest.split('/')[1];
    const adminSub = {
      'external-services': 'Admin — serviços externos',
      storage: 'Admin — storage',
      webhooks: 'Admin — webhooks',
      'system-errors': 'Admin — observabilidade',
      'web-vitals': 'Admin — observabilidade',
      cache: 'Admin — observabilidade',
      'system-health': 'Admin — observabilidade',
      'support-credentials': 'Admin — observabilidade',
      'sample-data': 'Admin — observabilidade',
    };
    return adminSub[sub] || 'Admin';
  }
  if (seg === 'modules') {
    const mod = rest.split('/')[1];
    const modTags = {
      pagarme: 'Modules — pagarme',
      melhorenvio: 'Modules — melhorenvio',
      loggi: 'Modules — loggi',
      google_calendar: 'Modules — google_calendar',
      utalk: 'Modules — utalk',
      soucannabis_orders: 'Modules — pedidos remotos',
      geoapify: 'Modules — geoapify',
      ciap2: 'Modules — ciap2',
      email: 'Modules — email',
    };
    return modTags[mod] || 'Modules';
  }

  const simple = {
    users: 'Users',
    orders: 'Orders',
    services: 'Services',
    reception: 'Reception',
    products: 'Products',
    professionals: 'Professionals',
    files: 'Files',
    'doc-sign': 'Doc sign',
    terms: 'Terms',
    items: 'Items',
    config: 'Sistema',
    freight: 'Orders',
    search: 'Outros',
    tags: 'Outros',
    activity: 'Outros',
    analytics: 'Outros',
    reports: 'Outros',
    'institutional-clients': 'Outros',
    'system-users': 'Admin',
    'system-errors': 'Admin — observabilidade',
    'web-vitals': 'Admin — observabilidade',
    cache: 'Admin — observabilidade',
    health: 'Sistema',
  };
  return simple[seg] || 'Outros';
}

function pathParameters(openApiPath) {
  const params = [];
  const re = /\{([A-Za-z0-9_]+)\}/g;
  let m;
  while ((m = re.exec(openApiPath)) !== null) {
    params.push({
      name: m[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    });
  }
  return params;
}

function needsSessionAuth(middlewares) {
  const authMw = new Set([
    'authenticate',
    'authorize',
    'authorizeAdmin',
    'requireRole',
    'requireAssociate',
    'requireApiAccessEnabled',
    'requireModule',
  ]);
  return middlewares.some((name) => authMw.has(name) || name.startsWith('authorize'));
}

function operationObject(method, routePath, middlewares) {
  const openPath = expressPathToOpenApi(routePath);
  const overrideKey = `${method} ${routePath}`;
  const override = PATH_OVERRIDES[overrideKey] || {};

  const op = {
    tags: [tagForPath(routePath)],
    summary: override.summary || `${method} ${openPath}`,
    responses: {
      200: { description: 'Envelope `{ data, meta, errors }` (ou binário/stream conforme rota)' },
      400: { description: 'Validação / regra de negócio' },
      401: { description: 'Não autenticado' },
      403: { description: 'Sem permissão' },
      404: { description: 'Não encontrado' },
    },
    parameters: override.parameters || pathParameters(openPath),
  };

  if (needsSessionAuth(middlewares)) {
    op.security = [{ operatorSession: [] }, { associateSession: [] }, { apiBearer: [] }];
  }

  if (method !== 'GET' && method !== 'DELETE') {
    op.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: { type: 'object', additionalProperties: true },
        },
      },
    };
  }

  return op;
}

function buildSpec(endpoints) {
  const paths = {};

  for (const ep of endpoints) {
    if (!shouldInclude(ep.path)) continue;

    const openPath = expressPathToOpenApi(ep.path);
    if (!paths[openPath]) paths[openPath] = {};

    for (const method of ep.methods) {
      const upper = method.toUpperCase();
      paths[openPath][method.toLowerCase()] = operationObject(upper, ep.path, ep.middlewares || []);
    }
  }

  const sortedPaths = {};
  for (const key of Object.keys(paths).sort()) {
    sortedPaths[key] = paths[key];
  }

  const usedTags = new Set();
  for (const p of Object.values(sortedPaths)) {
    for (const op of Object.values(p)) {
      if (op.tags) op.tags.forEach((t) => usedTags.add(t));
    }
  }

  const tags = [...usedTags]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((name) => ({
      name,
      description: TAG_DESCRIPTIONS[name] || name,
    }));

  return {
    openapi: '3.0.3',
    info: {
      title: 'Dharma API',
      description:
        'REST API do painel Dharma. Gerado automaticamente a partir das rotas Express (`npm run docs:openapi`). Autenticação típica: cookie de sessão do operador ou associado; algumas rotas aceitam token de API.',
      version: '0.1.0',
    },
    servers: [{ url: '/', description: 'Origem da instância (local, Docker ou produção)' }],
    tags,
    paths: sortedPaths,
    components: {
      securitySchemes: {
        operatorSession: {
          type: 'apiKey',
          in: 'cookie',
          name: 'dharma_session',
          description:
            'Sessão do operador. O nome real do cookie pode variar por instalação (prefixo por app).',
        },
        associateSession: {
          type: 'apiKey',
          in: 'cookie',
          name: 'associate_session',
          description: 'Sessão do portal do associado.',
        },
        apiBearer: {
          type: 'http',
          scheme: 'bearer',
          description: 'Token de API (admin), quando habilitado.',
        },
      },
    },
  };
}

function main() {
  const app = createApp();
  const endpoints = listEndpoints(app);
  const spec = buildSpec(endpoints);
  const json = `${JSON.stringify(spec, null, 2)}\n`;
  fs.writeFileSync(OUT, json, 'utf8');

  const opCount = Object.values(spec.paths).reduce(
    (n, methods) => n + Object.keys(methods).length,
    0
  );
  console.log(`OpenAPI escrito em ${OUT}`);
  console.log(`Paths: ${Object.keys(spec.paths).length}, operações: ${opCount}`);
}

main();
