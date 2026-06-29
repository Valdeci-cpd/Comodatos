import { NextResponse } from 'next/server'
import { getDb } from '@/lib/data-loader'

export async function GET() {
  const db = getDb()
  return NextResponse.json({
    status: 'ok',
    total_clientes: Object.keys(db.clientes).length,
    total_contratos: Object.keys(db.contratos).length,
  })
}
