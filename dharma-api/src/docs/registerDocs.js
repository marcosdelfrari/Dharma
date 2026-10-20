'use strict';

const swaggerUi = require('swagger-ui-express');
const spec = require('./openapi.json');

function registerDocs(app) {
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: 'Dharma API — Documentação',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    }),
  );

  app.get('/docs/openapi.json', (_req, res) => {
    res.json(spec);
  });

  app.get('/', (req, res) => {
    if (req.accepts('html')) {
      return res.redirect('/docs');
    }
    res.json({
      data: {
        name: 'dharma-api',
        docs: '/docs',
        health: '/health',
        api: '/api/v1',
      },
      meta: null,
      errors: null,
    });
  });
}

module.exports = { registerDocs };
