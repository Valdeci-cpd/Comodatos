import { NextResponse } from 'next/server'
import { getDb } from '@/lib/data-loader'

interface CidadeResumo {
  cidade: string
  total_clientes: number
  total_contratos: number
}

export async function GET() {
  const db = getDb()

  const cidadesMap: Record<string, CidadeResumo> = {}

  for (const cliente of Object.values(db.clientes)) {
    const cidade = cliente.cidade
    if (!(cidade in cidadesMap)) {
      cidadesMap[cidade] = {
        cidade,
        total_clientes: 0,
        total_contratos: 0,
      }
    }
    cidadesMap[cidade].total_clientes++
    cidadesMap[cidade].total_contratos += cliente.total_contratos
  }

  const resultado = Object.values(cidadesMap).sort((a, b) =>
    a.cidade.localeCompare(b.cidade)
  )

  return NextResponse.json(resultado)
}
