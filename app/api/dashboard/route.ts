import { NextResponse } from 'next/server'
import { getDb } from '@/lib/data-loader'

interface DashboardResponse {
  resumo: {
    total_clientes: number
    total_contratos: number
    contratos_ativos: number
    contratos_vencidos: number
    contratos_a_vencer: number
    contratos_fixos: number
    contratos_provisorios: number
  }
  por_status: Record<string, number>
  por_tipo: Record<string, number>
  por_supervisor: Array<{
    codigo: number
    nome: string
    total_clientes: number
  }>
  por_vendedor: Array<{
    codigo: number
    nome: string
    total_clientes: number
  }>
  top_cidades: Array<{
    cidade: string
    total_clientes: number
  }>
}

export async function GET() {
  const db = getDb()

  const clientes = Object.values(db.clientes)
  const contratos = Object.values(db.contratos)

  const totalClientes = clientes.length
  const totalContratos = contratos.length

  const porStatus: Record<string, number> = {
    ativo: 0,
    vencido: 0,
    a_vencer: 0,
    indefinido: 0,
  }
  const porTipo: Record<string, number> = {
    Fixo: 0,
    Provisório: 0,
  }
  const porCidade: Record<string, number> = {}
  const porSupervisor: Record<number, { codigo: number; nome: string; total_clientes: number }> = {}
  const porVendedor: Record<number, { codigo: number; nome: string; total_clientes: number }> = {}

  for (const ct of contratos) {
    porStatus[ct.status] = (porStatus[ct.status] || 0) + 1
    porTipo[ct.tipo] = (porTipo[ct.tipo] || 0) + 1
  }

  for (const cli of clientes) {
    const cidade = cli.cidade
    porCidade[cidade] = (porCidade[cidade] || 0) + 1

    const codSup = cli.supervisor.codigo
    const codVend = cli.vendedor.codigo

    if (!(codSup in porSupervisor)) {
      porSupervisor[codSup] = {
        codigo: codSup,
        nome: cli.supervisor.nome,
        total_clientes: 0,
      }
    }
    porSupervisor[codSup].total_clientes++

    if (!(codVend in porVendedor)) {
      porVendedor[codVend] = {
        codigo: codVend,
        nome: cli.vendedor.nome,
        total_clientes: 0,
      }
    }
    porVendedor[codVend].total_clientes++
  }

  // Top 10 cidades por clientes
  const topCidades = Object.entries(porCidade)
    .map(([cidade, total]) => ({ cidade, total_clientes: total }))
    .sort((a, b) => b.total_clientes - a.total_clientes)
    .slice(0, 10)

  const response: DashboardResponse = {
    resumo: {
      total_clientes: totalClientes,
      total_contratos: totalContratos,
      contratos_ativos: porStatus.ativo,
      contratos_vencidos: porStatus.vencido,
      contratos_a_vencer: porStatus.a_vencer,
      contratos_fixos: porTipo.Fixo,
      contratos_provisorios: porTipo.Provisório,
    },
    por_status: porStatus,
    por_tipo: porTipo,
    por_supervisor: Object.values(porSupervisor).sort((a, b) => a.codigo - b.codigo),
    por_vendedor: Object.values(porVendedor).sort((a, b) => a.codigo - b.codigo),
    top_cidades: topCidades,
  }

  return NextResponse.json(response)
}
