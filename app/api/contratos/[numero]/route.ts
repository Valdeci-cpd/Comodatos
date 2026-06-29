import { NextResponse, NextRequest } from 'next/server'
import { getDb } from '@/lib/data-loader'
import type { Contrato } from '@/lib/types'

interface ContratoComCliente extends Contrato {
  codigo_cliente: string
  cliente: {
    codigo_cliente: string
    nome_fantasia: string
    razao_social: string
    cidade: string
    rota: string
    vendedor: { codigo: number; nome: string; tipo: string }
    supervisor: { codigo: number; nome: string; tipo: string }
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  const { numero } = await params
  const db = getDb()

  const contratoData = db.contratos[numero]
  if (!contratoData) {
    return NextResponse.json(
      { error: 'Contrato não encontrado' },
      { status: 404 }
    )
  }

  const cliente = db.clientes[contratoData.codigo_cliente] || {}

  const response: ContratoComCliente = {
    numero_contrato: contratoData.numero_contrato,
    emissao: contratoData.emissao,
    vencimento: contratoData.vencimento,
    tipo: contratoData.tipo,
    status: contratoData.status,
    produtos: contratoData.produtos,
    codigo_cliente: contratoData.codigo_cliente,
    cliente: {
      codigo_cliente: cliente.codigo_cliente || '',
      nome_fantasia: cliente.nome_fantasia || '',
      razao_social: cliente.razao_social || '',
      cidade: cliente.cidade || '',
      rota: cliente.rota || '',
      vendedor: cliente.vendedor || { codigo: 0, nome: '', tipo: 'vendedor' },
      supervisor: cliente.supervisor || { codigo: 0, nome: '', tipo: 'supervisor' },
    },
  }

  return NextResponse.json(response)
}
