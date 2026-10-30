import net from 'node:net';

export function validateSourceUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('URL inválida.');
  let url;
  try { url = new URL(value); } catch { throw new Error('URL inválida.'); }
  const hostname = url.hostname.toLowerCase();
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.port || net.isIP(hostname) || !hostname.includes('.') ||
      hostname.endsWith('.localhost') || hostname.endsWith('.local') ||
      hostname.endsWith('.internal') || hostname.endsWith('.test') ||
      hostname.endsWith('.invalid') || hostname.endsWith('.onion')) {
    throw new Error('Informe uma URL pública HTTP(S), sem credenciais, porta personalizada ou IP.');
  }
  url.hash = '';
  return url.toString();
}

async function jsonResponse(response) {
  const size = Number(response.headers?.get?.('content-length') || 0);
  if (size > 1024 * 1024) throw new Error('Resposta externa acima do limite de 1 MB.');
  if (!response.ok) throw new Error('Provedor externo indisponível (HTTP ' + response.status + ').');
  const raw = await response.text();
  if (raw.length > 1024 * 1024) throw new Error('Resposta externa acima do limite de 1 MB.');
  try { return JSON.parse(raw); } catch { throw new Error('Resposta externa inválida.'); }
}

export async function readWebPage(value, {
  fetchImpl = fetch,
  apiKey = process.env.MICROLINK_API_KEY,
} = {}) {
  const source = validateSourceUrl(value);
  const endpoint = new URL(apiKey ? 'https://pro.microlink.io/' : 'https://api.microlink.io/');
  endpoint.searchParams.set('url', source);
  endpoint.searchParams.set('data.text.attr', 'text');
  const response = await fetchImpl(endpoint, {
    headers: apiKey ? { 'x-api-key': apiKey } : {},
    signal: AbortSignal.timeout(20000),
  });
  const result = await jsonResponse(response);
  if (result.status !== 'success' || typeof result.data?.text !== 'string' || !result.data.text.trim()) {
    throw new Error('A página não forneceu texto público legível pelo Microlink.');
  }
  return {
    source,
    title: String(result.data.title || '').slice(0, 180),
    description: String(result.data.description || '').slice(0, 400),
    text: result.data.text.slice(0, 45000),
    truncated: result.data.text.length > 45000,
    provider: 'microlink',
  };
}

export async function reviewReaEvidence(job, {
  fetchImpl = fetch,
  apiKey = process.env.FREELLMAPI_API_KEY,
} = {}) {
  if (!apiKey) throw new Error('FREELLMAPI_API_KEY não configurada no servidor.');
  if (job?.status !== 'concluido') throw new Error('Finalize uma análise antes de solicitar a revisão.');
  const evidence = JSON.stringify({
    objective: job.objective,
    findings: job.parsed ?? String(job.stdout || '').slice(0, 12000),
  }).slice(0, 20000);
  const response = await fetchImpl('http://127.0.0.1:3001/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'auto',
      stream: false,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: 'system', content: 'Você audita evidências técnicas de análise autorizada. Responda em português brasileiro. Identifique fatos verificáveis e hipóteses separadamente. Não invente código, não sugira acesso não autorizado e não afirme ter executado ações.' },
        { role: 'user', content: evidence },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });
  const result = await jsonResponse(response);
  const answer = result.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) throw new Error('O roteador de IA não retornou uma revisão textual.');
  return { review: answer.slice(0, 15000), model: result.model || 'não informado', mode: 'read-only' };
}
