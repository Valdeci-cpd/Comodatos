import "server-only"

// ============================================================================
// PROXY PARA A API DE COMODATOS (FastAPI)
// ----------------------------------------------------------------------------
// As rotas em app/api/* usam este helper para falar com o backend real.
// Proxiar pelo servidor do Next resolve dois problemas:
//   1. CORS (o navegador nunca chama o backend diretamente);
//   2. Instabilidade do host (Render free tier retorna 404/5xx esporádicos em
//      cold start) — por isso aplicamos retry com backoff.
// Configure COMODATO_API_URL para apontar para outro ambiente, se necessário.
// ============================================================================
const BACKEND_URL = (process.env.COMODATO_API_URL || "https://backend-comodatos.onrender.com").replace(/\/$/, "")

interface BackendOptions {
  searchParams?: Record<string, string | undefined>
  retries?: number
}

export async function backendFetch<T>(path: string, options: BackendOptions = {}): Promise<T> {
  const { searchParams, retries = 4 } = options
  const url = new URL(`${BACKEND_URL}/api${path}`)
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, value)
    }
  }

  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        // backend é somente leitura; pode cachear por curto período
        next: { revalidate: 30 },
      })
      if (res.ok) {
        return (await res.json()) as T
      }
      // 404/5xx no Render costumam ser transitórios em cold start → tenta de novo
      lastError = new Error(`Backend respondeu ${res.status} em ${path}`)
    } catch (err) {
      lastError = err
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Falha ao chamar ${path}`)
}
