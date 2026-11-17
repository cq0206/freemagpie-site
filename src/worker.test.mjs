import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker, { releaseMetadata } from './worker.mjs';

const base = 'https://github.com/cq0206/freemagpie/releases';
function metadata() {
  return {
    version: '0.1.0', notes: 'A release', url: `${base}/tag/freemagpie-v0.1.0`,
    assets: Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`magpie-${i}`, {
      url: `${base}/download/freemagpie-v0.1.0/magpie-${i}`, size: 100, sha256: 'a'.repeat(64),
    }])),
  };
}
const mock = data => async () => Response.json(data);
test('published version and hashes reach the updater unchanged', async () => {
  const data = metadata();
  assert.deepEqual(await releaseMetadata('latest', mock(data)), data);
});
test('missing, incomplete or foreign release data is refused', async () => {
  await assert.rejects(releaseMetadata('latest', async () => new Response('Not Found', { status: 404 })));
  const missing = metadata(); missing.assets = {};
  await assert.rejects(releaseMetadata('latest', mock(missing)));
  const foreign = metadata(); foreign.assets['magpie-0'].url = 'https://example.com/package';
  await assert.rejects(releaseMetadata('latest', mock(foreign)));
  const corrupt = metadata(); corrupt.assets['magpie-0'].sha256 = '';
  await assert.rejects(releaseMetadata('latest', mock(corrupt)));
});
test('release notes retain the fork release page', async () => {
  const data = { releases: [{ version: '0.1.0', notes: 'Notes', url: `${base}/tag/freemagpie-v0.1.0` }] };
  assert.deepEqual(await releaseMetadata('notes', mock(data)), data);
});
test('API method guard and static asset routing', async () => {
  const staticResponse = await worker.fetch(new Request('https://freemagpie.com/'), {
    ASSETS: { fetch: () => new Response('homepage') },
  });
  assert.equal(await staticResponse.text(), 'homepage');
  assert.equal((await worker.fetch(new Request('https://freemagpie.com/api/latest', { method: 'POST' }), {})).status, 405);
});
test('updater receives JSON and HEAD has no body', async t => {
  t.mock.method(globalThis, 'fetch', mock(metadata()));
  const response = await worker.fetch(new Request('https://freemagpie.com/api/latest?lang=zh'), {});
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.equal((await response.json()).version, '0.1.0');
  const head = await worker.fetch(new Request('https://freemagpie.com/api/latest', { method: 'HEAD' }), {});
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
test('a failed release lookup is retryable, never a false up-to-date result', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 404 }));
  t.mock.method(console, 'error', () => {});
  const response = await worker.fetch(new Request('https://freemagpie.com/api/latest'), {});
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('retry-after'), '60');
  assert.ok((await response.json()).error);
});
