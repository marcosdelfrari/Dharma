'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const spec = require('../../src/docs/openapi.json');

describe('openapi.json', () => {
  it('documenta a maior parte das rotas /api/v1', () => {
    const paths = Object.keys(spec.paths);
    const apiV1 = paths.filter((p) => p.startsWith('/api/v1/'));
    assert.ok(apiV1.length >= 280, `esperado >= 280 paths v1, got ${apiV1.length}`);
  });

  it('GET /api/v1/config/public usa query system', () => {
    const op = spec.paths['/api/v1/config/public']?.get;
    assert.ok(op);
    const system = op.parameters?.find((p) => p.name === 'system' && p.in === 'query');
    assert.ok(system?.required);
  });

  it('npm run docs:openapi reproduz o arquivo commitado', () => {
    const root = path.join(__dirname, '../..');
    execFileSync(process.execPath, ['scripts/generate-openapi.js'], {
      cwd: root,
      stdio: 'pipe',
    });
    const fresh = require('../../src/docs/openapi.json');
    assert.deepEqual(Object.keys(fresh.paths).sort(), Object.keys(spec.paths).sort());
  });
});
