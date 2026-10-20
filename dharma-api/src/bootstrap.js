'use strict';

const { createApp } = require('./app');
const { env } = require('./config/env');
const { checkConnection } = require('./db/pool');

let appInstance;

async function runSchemaEnsures() {
  const skip =
    process.env.SKIP_SCHEMA_ENSURE === '1' ||
    (process.env.VERCEL && process.env.RUN_SCHEMA_ENSURE !== '1');
  if (skip) return;

  const tasks = [
    ['associate_status', './db/ensureAssociateStatusColumn', 'ensureAssociateStatusColumn'],
    ['system_backups', './db/ensureSystemBackups', 'ensureSystemBackups'],
    ['operator_sessions', './db/ensureOperatorSessions', 'ensureOperatorSessions'],
    ['users_api', './db/ensureUsersApiTokenPrefix', 'ensureUsersApiTokenPrefix'],
    ['email_unique', './db/ensureEmailAccountUnique', 'ensureEmailAccountUnique'],
    ['webhooks', './db/ensureWebhooks', 'ensureWebhooks'],
  ];

  for (const [, modPath, fnName] of tasks) {
    try {
      const mod = require(modPath);
      await mod[fnName]();
    } catch (err) {
      console.warn(`Schema: ${fnName} falhou:`, err.message);
    }
  }

  try {
    const docSignService = require('./services/docSignService');
    await docSignService.ensureDefaultTemplates();
  } catch (err) {
    console.warn('Doc-sign: ensureDefaultTemplates falhou:', err.message);
  }
}

async function startBackgroundJobs() {
  if (process.env.VERCEL) return;

  void require('./services/backupCron')
    .rescheduleBackupCron()
    .catch((err) => console.warn('[backup-cron] init falhou:', err.message));
  try {
    require('./services/webhooks').startWebhookWorker();
  } catch (err) {
    console.warn('[webhooks] worker init falhou:', err.message);
  }
}

/**
 * Conecta ao banco, garante schema (opcional) e devolve app Express pronto.
 * Reutilizado por server.js (long-running) e Vercel (serverless).
 */
async function prepareApp() {
  if (appInstance) return appInstance;

  if (!env.pgUrl) {
    throw new Error('PG_URL ou DATABASE_URL (PostgreSQL) é obrigatório');
  }

  await checkConnection();
  await runSchemaEnsures();

  appInstance = createApp();
  return appInstance;
}

module.exports = { prepareApp, startBackgroundJobs };
