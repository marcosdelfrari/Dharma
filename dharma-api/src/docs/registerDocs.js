'use strict';

const spec = require('./openapi.json');

function specForHtml() {
  return JSON.stringify(spec).replace(/</g, '\\u003c');
}

/** Swagger UI via CDN; spec embutido (não depende de /docs/openapi.json). */
function swaggerUiHtml() {
  const embedded = specForHtml();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dharma API — Documentação</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        spec: ${embedded},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
        persistAuthorization: true,
        displayRequestDuration: true,
      });
    };
  </script>
</body>
</html>`;
}

function registerDocs(app) {
  const sendSpec = (_req, res) => {
    res.type('application/json').json(spec);
  };

  const sendUi = (_req, res) => {
    res.type('text/html; charset=utf-8').send(swaggerUiHtml());
  };

  const docPaths = ['/docs', '/docs/', '/api/docs', '/api/docs/'];

  app.get('/docs/openapi.json', sendSpec);
  app.get('/api/docs/openapi.json', sendSpec);
  docPaths.forEach((p) => app.get(p, sendUi));

  const goDocs = (_req, res) => res.redirect(302, '/docs');

  app.get('/', (req, res) => {
    if (req.accepts('html')) return goDocs(req, res);
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

  app.get('/api', (req, res) => {
    if (req.accepts('html')) return goDocs(req, res);
    res.json({
      data: { name: 'dharma-api', docs: '/docs', api: '/api/v1' },
      meta: null,
      errors: null,
    });
  });
}

module.exports = { registerDocs };
