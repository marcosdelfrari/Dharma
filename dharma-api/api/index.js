'use strict';

const { prepareApp } = require('../src/bootstrap');

let app;

module.exports = async (req, res) => {
  try {
    if (!app) {
      app = await prepareApp();
    }
    app(req, res);
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
