// Tipos espelhando o backend (Comodato API - FastAPI)

export type PessoaTipo = "supervisor" | "vendedor" | "balcao"

export interface Pessoa {
  codigo: number
  nome: string
  tipo: PessoaTipo
}

export type ContratoStatus = "ativo" | "vencido" | "a_vencer" | "indefinido"
export type ContratoTipo = "Fixo" | "Provisório"

export interface Produto {
  codigo_produto: string
  descricao: string
  quantidade: number
}

export interface Contrato {
  numero_contrato: string
  emissao: string | null // ISO 8601
  vencimento: string | null // ISO 8601
  tipo: ContratoTipo
  status: ContratoStatus
  produtos?: Produto[]
}

export interface Cliente {
  codigo_cliente: string
  nome_fantasia: string
  razao_social: string
  cidade: string
  rota: string
  vendedor: Pessoa
  supervisor: Pessoa
  total_contratos: number
  contratos_ativos: number
  contratos_vencidos: number
  contratos_a_vencer: number
  contratos?: Contrato[]
}

export interface Paginacao<T> {
  total: number
  page: number
  per_page: number
  pages: number
  data: T[]
}

export interface VendedorResumo {
  codigo: number
  nome: string
  tipo: PessoaTipo
  total_clientes: number
}

export interface SupervisorResumo {
  codigo: number
  nome: string
  tipo: PessoaTipo
  total_clientes: number
  vendedores: VendedorResumo[]
}

// Mapeamento dia da semana -> dígito final da rota/pasta
export const DIAS_ATENDIMENTO = [
  { id: 1, label: "Segunda-feira", digito: "1" },
  { id: 2, label: "Terça-feira", digito: "2" },
  { id: 3, label: "Quarta-feira", digito: "3" },
  { id: 4, label: "Quinta-feira", digito: "4" },
  { id: 5, label: "Sexta-feira", digito: "5" },
] as const

export type DiaAtendimento = (typeof DIAS_ATENDIMENTO)[number]
