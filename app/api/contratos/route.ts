import { NextResponse, NextRequest } from 'next/server'
import { getDb } from '@/lib/data-loader'
import type { Contrato, Paginacao } from '@/lib/types'

interface ContratoComCliente extends Contrato {
  codigo_cliente: string
  cliente: {
    codigo_cliente: string
    nome_fantasia: string
    cidade: string
    vendedor: { codigo: number; nome: string; tipo: string }
    supervisor: { codigo: number; nome: string; tipo: string }
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const status = searchParams.get('status') || undefined
  const tipo = searchParams.get('tipo') || undefined
  const cidade = searchParams.get('cidade') || undefined
  const vendedor = searchParams.get('vendedor')
    ? parseInt(searchParams.get('vendedor')!, 10)
    : undefined
  const supervisor = searchParams.get('supervisor')
    ? parseInt(searchParams.get('supervisor')!, 10)
    : undefined
  const venceDe = searchParams.get('vence_de') || undefined
  const venceAte = searchParams.get('vence_ate') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const per_page = Math.min(200, Math.max(1, parseInt(searchParams.get('per_page') || '50', 10)))

  const db = getDb()
  let contratos = Object.values(db.contratos)

  // Filtros básicos no contrato
  if (status) {
    contratos = contratos.filter((c) => c.status === status)
  }
  if (tipo) {
    contratos = contratos.filter((c) => c.tipo.toLowerCase() === tipo.toLowerCase())
  }
  if (venceDe) {
    contratos = contratos.filter((c) => c.vencimento && c.vencimento >= venceDe)
  }
  if (venceAte) {
    contratos = contratos.filter((c) => c.vencimento && c.vencimento <= venceAte)
  }

  // Filtros que dependem do cliente
  if (cidade || vendedor !== undefined || supervisor !== undefined) {
    contratos = contratos.filter((c) => {
      const cliente = db.clientes[c.codigo_cliente]
      if (!cliente) return false
      if (cidade && cliente.cidade.toLowerCase() !== cidade.toLowerCase()) return false
      if (vendedor !== undefined && cliente.vendedor.codigo !== vendedor) return false
      if (supervisor !== undefined && cliente.supervisor.codigo !== supervisor) return false
      return true
    })
  }

  const total = contratos.length
  const inicio = (page - 1) * per_page
  const fim = inicio + per_page

  const resultado: ContratoComCliente[] = contratos.slice(inicio, fim).map((c) => {
    const cliente = db.clientes[c.codigo_cliente] || {}
    return {
      numero_contrato: c.numero_contrato,
      emissao: c.emissao,
      vencimento: c.vencimento,
      tipo: c.tipo,
      status: c.status,
      produtos: c.produtos,
      codigo_cliente: c.codigo_cliente,
      cliente: {
        codigo_cliente: cliente.codigo_cliente || '',
        nome_fantasia: cliente.nome_fantasia || '',
        cidade: cliente.cidade || '',
        vendedor: cliente.vendedor || { codigo: 0, nome: '', tipo: 'vendedor' },
        supervisor: cliente.supervisor || { codigo: 0, nome: '', tipo: 'supervisor' },
      },
    }
  })

  const response: Paginacao<ContratoComCliente> = {
    total,
    page,
    per_page,
    pages: Math.ceil(total / per_page),
    data: resultado,
  }

  return NextResponse.json(response)
}
