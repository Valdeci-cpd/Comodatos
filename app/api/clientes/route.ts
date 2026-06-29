import { NextResponse, NextRequest } from 'next/server'
import { getDb } from '@/lib/data-loader'
import type { Cliente, Paginacao } from '@/lib/types'

interface ClienteResumo extends Omit<Cliente, 'contratos'> {
  total_contratos: number
  contratos_ativos: number
  contratos_vencidos: number
  contratos_a_vencer: number
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const cidade = searchParams.get('cidade') || undefined
  const vendedor = searchParams.get('vendedor')
    ? parseInt(searchParams.get('vendedor')!, 10)
    : undefined
  const supervisor = searchParams.get('supervisor')
    ? parseInt(searchParams.get('supervisor')!, 10)
    : undefined
  const rota = searchParams.get('rota') || undefined
  const busca = searchParams.get('busca') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const per_page = Math.min(200, Math.max(1, parseInt(searchParams.get('per_page') || '50', 10)))

  const db = getDb()
  let clientes = Object.values(db.clientes)

  // Aplicar filtros
  if (cidade) {
    clientes = clientes.filter((c) => c.cidade.toLowerCase() === cidade.toLowerCase())
  }
  if (vendedor !== undefined) {
    clientes = clientes.filter((c) => c.vendedor.codigo === vendedor)
  }
  if (supervisor !== undefined) {
    clientes = clientes.filter((c) => c.supervisor.codigo === supervisor)
  }
  if (rota) {
    clientes = clientes.filter((c) => c.rota === rota)
  }
  if (busca) {
    const termo = busca.toLowerCase()
    clientes = clientes.filter(
      (c) =>
        c.nome_fantasia.toLowerCase().includes(termo) ||
        c.razao_social.toLowerCase().includes(termo)
    )
  }

  const total = clientes.length
  const inicio = (page - 1) * per_page
  const fim = inicio + per_page

  const resultado: ClienteResumo[] = clientes.slice(inicio, fim).map((c) => ({
    codigo_cliente: c.codigo_cliente,
    nome_fantasia: c.nome_fantasia,
    razao_social: c.razao_social,
    cidade: c.cidade,
    rota: c.rota,
    vendedor: c.vendedor,
    supervisor: c.supervisor,
    total_contratos: c.total_contratos,
    contratos_ativos: c.contratos_ativos,
    contratos_vencidos: c.contratos_vencidos,
    contratos_a_vencer: c.contratos_a_vencer,
  }))

  const response: Paginacao<ClienteResumo> = {
    total,
    page,
    per_page,
    pages: Math.ceil(total / per_page),
    data: resultado,
  }

  return NextResponse.json(response)
}
