import { NextResponse, NextRequest } from 'next/server'
import { getDb } from '@/lib/data-loader'
import type { Cliente } from '@/lib/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  const db = getDb()

  const clienteData = db.clientes[codigo]
  if (!clienteData) {
    return NextResponse.json(
      { error: 'Cliente não encontrado' },
      { status: 404 }
    )
  }

  // Recupera os contratos do cliente
  const contratos = clienteData.contratos
    .map((nr) => db.contratos[nr])
    .filter(Boolean)
    .sort((a, b) => {
      // Ordena por vencimento descendente
      if (!a.vencimento && !b.vencimento) return 0
      if (!a.vencimento) return 1
      if (!b.vencimento) return -1
      return b.vencimento.localeCompare(a.vencimento)
    })

  const response: Cliente = {
    codigo_cliente: clienteData.codigo_cliente,
    nome_fantasia: clienteData.nome_fantasia,
    razao_social: clienteData.razao_social,
    cidade: clienteData.cidade,
    rota: clienteData.rota,
    vendedor: clienteData.vendedor,
    supervisor: clienteData.supervisor,
    total_contratos: clienteData.total_contratos,
    contratos_ativos: clienteData.contratos_ativos,
    contratos_vencidos: clienteData.contratos_vencidos,
    contratos_a_vencer: clienteData.contratos_a_vencer,
    contratos,
  }

  return NextResponse.json(response)
}
