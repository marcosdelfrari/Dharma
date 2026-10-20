'use strict';

/**
 * Ajusta req.url no Vercel quando o rewrite aponta para /api e o path original se perde.
 */
function vercelPathFix(req, _res, next) {
  if (!process.env.VERCEL) return next();

  let url = req.url || '/';
  const qIndex = url.indexOf('?');
  const query = qIndex >= 0 ? url.slice(qIndex) : '';
  let path = qIndex >= 0 ? url.slice(0, qIndex) : url;

  const forwarded =
    req.headers['x-vercel-sc-path'] ||
    req.headers['x-invoke-path'] ||
    req.headers['x-matched-path'];

  if (typeof forwarded === 'string' && forwarded.startsWith('/')) {
    path = forwarded.split('?')[0];
  }

  if (path === '/api' || path === '/api/') {
    path = '/';
  } else if (path.startsWith('/api/') && !path.startsWith('/api/v1')) {
    path = path.slice(4) || '/';
  }

  req.url = path + query;
  next();
}

module.exports = { vercelPathFix };
