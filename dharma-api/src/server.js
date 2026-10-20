'use strict';

const { env } = require('./config/env');
const { prepareApp, startBackgroundJobs } = require('./bootstrap');
const systemErrorsService = require('./services/systemErrorsService');

function installProcessErrorHooks() {
  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    console.error('[dharma-api] unhandledRejection', err);
    void systemErrorsService.recordSafe({
      ...systemErrorsService.payloadFromBackendError(err),
      code: 'UNHANDLED_REJECTION',
      metadata: { hook: 'unhandledRejection' },
    });
  });

  process.on('uncaughtException', (err) => {
    console.error('[dharma-api] uncaughtException', err);
    void systemErrorsService.recordSafe({
      ...systemErrorsService.payloadFromBackendError(err),
      code: 'UNCAUGHT_EXCEPTION',
      metadata: { hook: 'uncaughtException' },
    });
  });
}

async function main() {
  try {
    await prepareApp();
    console.log('Database connected');
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }

  installProcessErrorHooks();

  const app = await prepareApp();
  const host = process.env.HOST || '0.0.0.0';
  app.listen(env.port, host, () => {
    console.log(`dharma-api listening on http://${host}:${env.port}`);
    console.log(`Swagger UI: http://${host}:${env.port}/docs`);
    void startBackgroundJobs();
  });
}

main();
