'use strict';

const { prepareApp } = require('../src/bootstrap');

let appPromise;

function getApp() {
  if (!appPromise) appPromise = prepareApp();
  return appPromise;
}

/** @type {import('@vercel/node').VercelApiHandler} */
module.exports = async (req, res) => {
  try {
    const app = await getApp();
    app(req, res);
  } catch (err) {
    console.error('[dharma-api] serverless init failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          data: null,
          meta: null,
          errors: [{ code: 'BOOT_FAILED', message: err.message || 'Falha ao iniciar a API' }],
        }),
      );
    }
  }
};
