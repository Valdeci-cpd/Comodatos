import { NextResponse } from 'next/server'
import { getDb } from '@/lib/data-loader'
import type { SupervisorResumo } from '@/lib/types'

export async function GET() {
  const db = getDb()

  const supervisoresMap: Record<number, SupervisorResumo> = {}

  for (const cliente of Object.values(db.clientes)) {
    const sup = cliente.supervisor
    const vend = cliente.vendedor
    const codSup = sup.codigo

    if (!(codSup in supervisoresMap)) {
      supervisoresMap[codSup] = {
        codigo: codSup,
        nome: sup.nome,
        tipo: sup.tipo,
        total_clientes: 0,
        vendedores: [],
      }
    }

    supervisoresMap[codSup].total_clientes++

    const codVend = vend.codigo
    let vendedor = supervisoresMap[codSup].vendedores.find((v) => v.codigo === codVend)
    if (!vendedor) {
      vendedor = {
        codigo: codVend,
        nome: vend.nome,
        tipo: vend.tipo,
        total_clientes: 0,
      }
      supervisoresMap[codSup].vendedores.push(vendedor)
    }
    vendedor.total_clientes++
  }

  const resultado = Object.values(supervisoresMap)
    .map((sup) => ({
      ...sup,
      vendedores: sup.vendedores.sort((a, b) => a.codigo - b.codigo),
    }))
    .sort((a, b) => a.codigo - b.codigo)

  return NextResponse.json(resultado)
}
