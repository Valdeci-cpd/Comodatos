import { NextResponse, NextRequest } from 'next/server'
import { getDb } from '@/lib/data-loader'
import type { VendedorResumo } from '@/lib/types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const supervisor = searchParams.get('supervisor')
    ? parseInt(searchParams.get('supervisor')!, 10)
    : undefined

  const db = getDb()

  const vendedoresMap: Record<number, VendedorResumo & { cidades: Set<string> }> = {}

  for (const cliente of Object.values(db.clientes)) {
    if (supervisor !== undefined && cliente.supervisor.codigo !== supervisor) {
      continue
    }

    const vend = cliente.vendedor
    const cod = vend.codigo

    if (!(cod in vendedoresMap)) {
      vendedoresMap[cod] = {
        codigo: cod,
        nome: vend.nome,
        tipo: vend.tipo,
        total_clientes: 0,
        cidades: new Set(),
      }
    }

    vendedoresMap[cod].total_clientes++
    vendedoresMap[cod].cidades.add(cliente.cidade)
  }

  const resultado = Object.values(vendedoresMap)
    .map((v) => ({
      codigo: v.codigo,
      nome: v.nome,
      tipo: v.tipo,
      total_clientes: v.total_clientes,
      cidades: Array.from(v.cidades).sort(),
    }))
    .sort((a, b) => a.codigo - b.codigo)

  return NextResponse.json(resultado)
}
