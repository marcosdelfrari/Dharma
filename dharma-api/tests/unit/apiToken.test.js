'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { apiTokenLookupPrefix } = require('../../src/utils/apiToken');

describe('apiTokenLookupPrefix', () => {
  it('builds dharma_live_ plus first 12 chars of the secret', () => {
    const token = `dharma_live_${'a'.repeat(48)}`;
    assert.equal(apiTokenLookupPrefix(token), `dharma_live_${'a'.repeat(12)}`);
  });

  it('rejects missing prefix or short remainder', () => {
    assert.equal(apiTokenLookupPrefix(''), null);
    assert.equal(apiTokenLookupPrefix('not_a_token'), null);
    assert.equal(apiTokenLookupPrefix('dharma_live_short'), null);
  });
});
