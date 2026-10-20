'use strict';

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { env } = require('../config/env');

/** Singleton Prisma Client (Prisma Postgres / PostgreSQL). Gere com `npm run db:generate`. */
let prisma = null;
let pool = null;

function getPrisma() {
  if (!prisma) {
    if (!env.pgUrl) {
      throw new Error('DATABASE_URL (ou PG_URL / PG*) is required for Prisma');
    }
    pool = new Pool({ connectionString: env.pgUrl });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPrisma, disconnectPrisma };
