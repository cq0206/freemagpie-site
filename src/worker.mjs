const repo = 'https://github.com/cq0206/freemagpie/releases';

export async function releaseMetadata(kind, fetcher = fetch) {
  const response = await fetcher(`${repo}/latest/download/${kind}.json`, {
    redirect: 'follow',
    headers: { 'User-Agent': 'FreeMagpie-Website', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
    cf: { cacheTtlByStatus: { '200-299': 300, '400-599': 0 }, cacheEverything: true },
  });
  if (!response.ok) throw new Error(`release metadata: HTTP ${response.status}`);
  const data = await response.json();
  if (kind === 'latest') {
    if (!/^\d+\.\d+\.\d+$/.test(data.version) || !data.assets || typeof data.notes !== 'string') {
      throw new Error('invalid release metadata');
    }
    const page = `${repo}/tag/freemagpie-v${data.version}`;
    if (data.url !== page) throw new Error('invalid release page');
    for (const [name, asset] of Object.entries(data.assets)) {
      if (!/^[\w.-]+$/.test(name) || asset.url !== `${page.replace('/tag/', '/download/')}/${name}` ||
          !/^[a-f0-9]{64}$/.test(asset.sha256) || !Number.isSafeInteger(asset.size) || asset.size <= 0) {
        throw new Error('invalid release asset');
      }
    }
    if (Object.keys(data.assets).length < 13) throw new Error('incomplete release');
  } else if (!Array.isArray(data.releases) || data.releases.length === 0 ||
      data.releases.some(r => !/^\d+\.\d+\.\d+$/.test(r.version) || typeof r.notes !== 'string' ||
        r.url !== `${repo}/tag/freemagpie-v${r.version}`)) {
    throw new Error('invalid release notes');
  }
  return data;
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path !== '/api/latest' && path !== '/api/notes') {
      return env.ASSETS.fetch(request);
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    try {
      const data = await releaseMetadata(path.slice('/api/'.length));
      return new Response(request.method === 'HEAD' ? null : JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
      });
    } catch (error) {
      console.error(String(error));
      return Response.json({ error: 'Release metadata is temporarily unavailable. Please use GitHub Releases.' }, {
        status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
      });
    }
  },
};
