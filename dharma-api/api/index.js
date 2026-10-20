'use strict';

const serverless = require('serverless-http');
const { prepareApp } = require('../src/bootstrap');

let handlerPromise;

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = prepareApp().then((app) =>
      serverless(app, {
        binary: ['image/*', 'application/pdf', 'application/octet-stream'],
      }),
    );
  }
  return handlerPromise;
}

module.exports = async (req, res) => {
  try {
    const handler = await getHandler();
    return handler(req, res);
  } catch (err) {
    console.error('[dharma-api] serverless init failed:', err);
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
};
