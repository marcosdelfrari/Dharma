'use strict';

const crypto = require('crypto');

/**
 * Sign body with HMAC-SHA256. Header value: sha256=<hex>
 */
function signPayload(secret, body, timestamp) {
  const payload = `${timestamp}.${body}`;
  const digest = crypto.createHmac('sha256', String(secret)).update(payload).digest('hex');
  return `sha256=${digest}`;
}

function verifySignature(secret, body, timestamp, signatureHeader) {
  const expected = signPayload(secret, body, timestamp);
  const got = String(signatureHeader || '');
  if (expected.length !== got.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got));
  } catch {
    return false;
  }
}

function buildHeaders({ eventId, deliveryId, table, action, secret, body, timestamp }) {
  const ts = String(timestamp || Math.floor(Date.now() / 1000));
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'Dharma-Webhooks/1.0',
    'X-Dharma-Event': String(eventId),
    'X-Dharma-Delivery': String(deliveryId),
    'X-Dharma-Table': String(table),
    'X-Dharma-Action': String(action),
    'X-Dharma-Timestamp': ts,
    'X-Dharma-Signature': signPayload(secret, body, ts),
  };
}

module.exports = {
  signPayload,
  verifySignature,
  buildHeaders,
};
