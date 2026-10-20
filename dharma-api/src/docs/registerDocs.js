'use strict';

const spec = require('./openapi.json');

/** Swagger UI via CDN — funciona em serverless (Vercel) sem assets locais. */
function swaggerUiHtml(specUrl) {
  const safeUrl = specUrl.replace(/"/g, '&quot;');
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
        url: "${safeUrl}",
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

  const sendUi = (req, res) => {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const host = req.get('x-forwarded-host') || req.get('host') || '';
    const base = host ? `${proto}://${host}` : '';
    const specUrl = `${base}/docs/openapi.json`;
    res.type('text/html; charset=utf-8').send(swaggerUiHtml(specUrl));
  };

  app.get('/docs/openapi.json', sendSpec);
  app.get(['/docs', '/docs/'], sendUi);

  app.get('/', (req, res) => {
    if (req.accepts('html')) {
      return res.redirect(302, '/docs');
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
