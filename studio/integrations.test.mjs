import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSourceUrl, readWebPage, reviewReaEvidence } from './integrations.mjs';

test('URL: permite sites públicos e bloqueia destinos locais', () => {
  assert.equal(validateSourceUrl('https://example.org/page#section'), 'https://example.org/page');
  for (const url of ['http://127.0.0.1/', 'http://[::1]/', 'http://localhost/', 'http://192.168.0.1/', 'https://user:pass@example.com/', 'file:///etc/passwd', 'http://foo.internal/']) {
    assert.throws(() => validateSourceUrl(url));
  }
});
test('Microlink extrai texto e preserva origem', async () => {
  const fetchImpl = async (url) => {
    assert.equal(url.searchParams.get('data.text.attr'), 'text');
    return { ok: true, headers: new Headers(), text: async () => JSON.stringify({ status: 'success', data: { title: 'Exemplo', text: 'Texto público' } }) };
  };
  const data = await readWebPage('https://example.org/', { fetchImpl, apiKey: '' });
  assert.equal(data.text, 'Texto público');
  assert.equal(data.title, 'Exemplo');
});
test('Revisão exige evidência concluída e usa somente gateway local', async () => {
  let destination;
  const fetchImpl = async (url, options) => {
    destination = url;
    assert.match(options.headers.Authorization, /Bearer test/);
    return { ok: true, headers: new Headers(), text: async () => JSON.stringify({ model:'test', choices:[{ message:{ content:'Revisão verificável' } }] }) };
  };
  const result = await reviewReaEvidence({ status: 'concluido', objective: 'Auditar', parsed: { ok:true } }, { fetchImpl, apiKey:'test' });
  assert.equal(result.review, 'Revisão verificável');
  assert.equal(destination, 'http://127.0.0.1:3001/v1/chat/completions');
  await assert.rejects(() => reviewReaEvidence({ status:'executando' }, { apiKey:'test' }));
});
