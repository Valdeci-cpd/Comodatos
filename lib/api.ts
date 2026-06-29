import type { Cliente, Contrato, Paginacao, SupervisorResumo } from "./types"
import { MOCK_CLIENTES, MOCK_SUPERVISORES } from "./mock-data"

// ============================================================================
// CLIENTE DE API (lado do navegador)
// ----------------------------------------------------------------------------
// Os componentes consomem estas funções via SWR. Elas chamam as rotas de
// proxy do próprio Next (app/api/*), que por sua vez falam com o backend real
// (Comodato API). Proxiar evita CORS e centraliza o tratamento de falhas.
//
// Para desenvolver offline sem backend, defina NEXT_PUBLIC_USE_MOCK=1 e a
// aplicação passa a usar dados de exemplo sem alterar nenhum componente.
// ============================================================================
export const USANDO_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1"

async function request<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`/api${path}`, typeof window !== "undefined" ? window.location.origin : "http://localhost")
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value))
    }
  }
  const res = await fetch(url.pathname + url.search, { headers: { Accept: "application/json" } })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Erro ${res.status} ao chamar ${path}`)
  }
  return res.json() as Promise<T>
}

// latência simulada para o mock parecer uma chamada real
function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export interface FiltroClientes {
  supervisor?: number
  vendedor?: number
  rota?: string
  busca?: string
  page?: number
  per_page?: number
}

// GET /api/supervisores  (inclui vendedores aninhados)
export async function getSupervisores(): Promise<SupervisorResumo[]> {
  if (USANDO_MOCK) return delay(MOCK_SUPERVISORES)
  return request<SupervisorResumo[]>("/supervisores")
}

// GET /api/clientes
export async function getClientes(filtro: FiltroClientes): Promise<Paginacao<Cliente>> {
  if (USANDO_MOCK) {
    let data = MOCK_CLIENTES
    if (filtro.supervisor) data = data.filter((c) => c.supervisor.codigo === filtro.supervisor)
    if (filtro.vendedor) data = data.filter((c) => c.vendedor.codigo === filtro.vendedor)
    if (filtro.rota) data = data.filter((c) => c.rota === filtro.rota)
    if (filtro.busca) {
      const q = filtro.busca.toLowerCase()
      data = data.filter(
        (c) =>
          c.codigo_cliente.toLowerCase().includes(q) ||
          c.nome_fantasia.toLowerCase().includes(q) ||
          c.razao_social.toLowerCase().includes(q),
      )
    }
    return delay({ total: data.length, page: 1, per_page: 50, pages: 1, data })
  }
  return request<Paginacao<Cliente>>("/clientes", { ...filtro })
}

// GET /api/clientes/{codigo_cliente}  (retorna contratos + produtos inline)
export async function getCliente(codigo: string): Promise<Cliente> {
  if (USANDO_MOCK) {
    const cliente = MOCK_CLIENTES.find((c) => c.codigo_cliente === codigo)
    if (!cliente) throw new Error("Cliente não encontrado")
    return delay(cliente)
  }
  return request<Cliente>(`/clientes/${encodeURIComponent(codigo)}`)
}

// GET /api/contratos/{numero_contrato}
export async function getContrato(numero: string): Promise<Contrato> {
  if (USANDO_MOCK) {
    for (const c of MOCK_CLIENTES) {
      const contrato = c.contratos?.find((ct) => ct.numero_contrato === numero)
      if (contrato) return delay(contrato)
    }
    throw new Error("Contrato não encontrado")
  }
  return request<Contrato>(`/contratos/${encodeURIComponent(numero)}`)
}
