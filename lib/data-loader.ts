import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import type { Cliente, Contrato, Pessoa, ContratoStatus, ContratoTipo, Produto } from './types'

// ──────────────────────────────────────────────────────────────────────────
// Mapeamentos de domínio
// ──────────────────────────────────────────────────────────────────────────

const TIPO_CONTRATO: Record<string, ContratoTipo> = {
  '01': 'Fixo',
  '02': 'Fixo',
  '1': 'Fixo',
  '2': 'Fixo',
  '04': 'Provisório',
  '4': 'Provisório',
}

const SUPERVISORES: Record<number, Pessoa> = {
  100: { codigo: 100, nome: 'Supervisor 100', tipo: 'supervisor' },
  200: { codigo: 200, nome: 'Supervisor 200', tipo: 'supervisor' },
  400: { codigo: 400, nome: 'Supervisor 400', tipo: 'supervisor' },
  500: { codigo: 500, nome: 'Supervisor 500', tipo: 'supervisor' },
  800: { codigo: 800, nome: 'Balcão', tipo: 'balcao' },
}

export function classificarVendedor(codigo: number): Pessoa {
  if (codigo === 301) {
    return { codigo, nome: 'Balcão', tipo: 'balcao' }
  }
  return { codigo, nome: `Vendedor ${codigo}`, tipo: 'vendedor' }
}

export function supervisorDoVendedor(codSupervisor: number): Pessoa {
  return (
    SUPERVISORES[codSupervisor] || {
      codigo: codSupervisor,
      nome: `Supervisor ${codSupervisor}`,
      tipo: 'supervisor',
    }
  )
}

export function statusContrato(vencimento: string | null): ContratoStatus {
  if (!vencimento) return 'indefinido'

  const dataVencimento = new Date(vencimento)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  dataVencimento.setHours(0, 0, 0, 0)

  if (dataVencimento < hoje) {
    return 'vencido'
  }

  const diff = Math.floor((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 30) {
    return 'a_vencer'
  }

  return 'ativo'
}

// ──────────────────────────────────────────────────────────────────────────
// Carregamento e normalização de dados
// ──────────────────────────────────────────────────────────────────────────

interface RawRow {
  [key: string]: any
}

interface Database {
  clientes: Record<string, Omit<Cliente, 'contratos'> & { contratos: string[] }>
  contratos: Record<string, Contrato & { codigo_cliente: string; tipo_codigo: string }>
  cidades: string[]
  vendedores: number[]
  supervisores: number[]
}

function normalizeColumnNames(data: RawRow[]): RawRow[] {
  return data.map((row) => {
    const normalized: RawRow = {}
    for (const [key, value] of Object.entries(row)) {
      let newKey = key.trim().toUpperCase()

      // Aplicar mapeamento de colunas
      const colMap: Record<string, string> = {
        'Nº DO CONTRATO': 'NR_CONTRATO',
        'CÓDIGO DO CLIENTE': 'COD_CLIENTE',
        'NOME FANTASIA': 'NOME_FANTASIA',
        'RAZÃO SOCIAL': 'RAZAO_SOCIAL',
        'PASTA': 'ROTA',
        'COD PRODUTO': 'COD_PRODUTO',
        'EMISSÃO': 'EMISSAO',
      }

      newKey = colMap[newKey] || newKey

      normalized[newKey] = value
    }
    return normalized
  })
}

function parseDate(dateValue: any): string | null {
  if (!dateValue) return null

  let date: Date
  if (typeof dateValue === 'number') {
    // Excel serial date
    const excelEpoch = new Date(1900, 0, 1)
    date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000)
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue)
  } else if (dateValue instanceof Date) {
    date = dateValue
  } else {
    return null
  }

  if (isNaN(date.getTime())) return null

  return date.toISOString().split('T')[0]
}

export function loadData(filePath: string): Database {
  let data: RawRow[] = []

  try {
    const fileBuffer = fs.readFileSync(filePath)
    const workbook = XLSX.read(fileBuffer, { cellDates: true })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    data = XLSX.utils.sheet_to_json(worksheet, { raw: false })
  } catch (error) {
    console.error(`Erro ao carregar arquivo ${filePath}:`, error)
    return {
      clientes: {},
      contratos: {},
      cidades: [],
      vendedores: [],
      supervisores: [],
    }
  }

  // Normaliza nomes de colunas
  data = normalizeColumnNames(data)

  // Processa tipos de dados
  const processedData = data.map((row) => {
    const supervisor = parseInt(String(row.SUPERVISOR), 10) || 0
    const vendedor = parseInt(String(row.VENDEDOR), 10) || 0
    const qtd = parseInt(String(row.QTD), 10) || 0

    return {
      ...row,
      SUPERVISOR: supervisor,
      VENDEDOR: vendedor,
      QTD: qtd,
      TIPO: String(row.TIPO || '').trim(),
      NR_CONTRATO: String(row.NR_CONTRATO || '').trim(),
      COD_CLIENTE: String(row.COD_CLIENTE || '').trim(),
      EMISSAO: parseDate(row.EMISSAO),
      VENCIMENTO: parseDate(row.VENCIMENTO),
    }
  })

  // ─── Clientes ─────────────────────────────────────────────────────────
  const clientesMap = new Map<
    string,
    Omit<Cliente, 'contratos'> & { contratos: string[] }
  >()

  const uniqueClientes = Array.from(
    new Map(processedData.map((row) => [row.COD_CLIENTE, row])).values()
  )

  for (const row of uniqueClientes) {
    const cod = row.COD_CLIENTE
    clientesMap.set(cod, {
      codigo_cliente: cod,
      nome_fantasia: String(row.NOME_FANTASIA || '').trim(),
      razao_social: String(row.RAZAO_SOCIAL || '').trim(),
      cidade: String(row.CIDADE || '').trim(),
      rota: String(row.ROTA || '').trim(),
      vendedor: classificarVendedor(row.VENDEDOR),
      supervisor: supervisorDoVendedor(row.SUPERVISOR),
      total_contratos: 0,
      contratos_ativos: 0,
      contratos_vencidos: 0,
      contratos_a_vencer: 0,
      contratos: [],
    })
  }

  // ─── Contratos ────────────────────────────────────────────────────────
  const contratosMap = new Map<string, Contrato & { codigo_cliente: string; tipo_codigo: string }>()

  const uniqueContratos = Array.from(
    new Map(processedData.map((row) => [row.NR_CONTRATO, row])).values()
  )

  for (const row of uniqueContratos) {
    const nr = row.NR_CONTRATO
    const tipoRaw = String(row.TIPO || '').trim()
    const emissao = row.EMISSAO
    const vencimento = row.VENCIMENTO

    contratosMap.set(nr, {
      numero_contrato: nr,
      codigo_cliente: row.COD_CLIENTE,
      emissao: emissao,
      vencimento: vencimento,
      tipo: TIPO_CONTRATO[tipoRaw] || 'Fixo',
      tipo_codigo: tipoRaw,
      status: statusContrato(vencimento),
      produtos: [],
    })
  }

  // ─── Produtos por contrato ────────────────────────────────────────────
  for (const row of processedData) {
    const nr = row.NR_CONTRATO
    if (contratosMap.has(nr)) {
      const contrato = contratosMap.get(nr)!
      contrato.produtos.push({
        codigo_produto: String(row.COD_PRODUTO || '').trim(),
        descricao: String(row.PRODUTO || '').trim(),
        quantidade: row.QTD,
      })
    }
  }

  // ─── Vincula contratos aos clientes ────────────────────────────────────
  for (const contrato of contratosMap.values()) {
    const cod = contrato.codigo_cliente
    if (clientesMap.has(cod)) {
      const cliente = clientesMap.get(cod)!
      cliente.contratos.push(contrato.numero_contrato)
    }
  }

  // ─── Atualiza contadores de contratos ──────────────────────────────────
  for (const cliente of clientesMap.values()) {
    for (const nrContrato of cliente.contratos) {
      const contrato = contratosMap.get(nrContrato)
      if (contrato) {
        cliente.total_contratos++
        if (contrato.status === 'ativo') cliente.contratos_ativos++
        else if (contrato.status === 'vencido') cliente.contratos_vencidos++
        else if (contrato.status === 'a_vencer') cliente.contratos_a_vencer++
      }
    }
  }

  // ─── Índices auxiliares ────────────────────────────────────────────────
  const cidades = Array.from(new Set([...clientesMap.values()].map((c) => c.cidade))).sort()
  const vendedores = Array.from(new Set([...clientesMap.values()].map((c) => c.vendedor.codigo))).sort(
    (a, b) => a - b
  )
  const supervisores = Array.from(new Set([...clientesMap.values()].map((c) => c.supervisor.codigo))).sort(
    (a, b) => a - b
  )

  const clientes: Record<string, Omit<Cliente, 'contratos'> & { contratos: string[] }> = {}
  for (const [cod, cliente] of clientesMap) {
    clientes[cod] = cliente
  }

  const contratos: Record<string, Contrato & { codigo_cliente: string; tipo_codigo: string }> = {}
  for (const [nr, contrato] of contratosMap) {
    contratos[nr] = contrato
  }

  return {
    clientes,
    contratos,
    cidades,
    vendedores,
    supervisores,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Singleton em memória
// ──────────────────────────────────────────────────────────────────────────

let cachedDb: Database | null = null

export function getDb(): Database {
  if (cachedDb) {
    return cachedDb
  }

  // Tenta carregar do arquivo na raiz ou no diretório public
  let filePath = path.join(process.cwd(), 'BASE_DE_DADOS.xlsx')
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'public', 'BASE_DE_DADOS.xlsx')
  }

  cachedDb = loadData(filePath)
  return cachedDb
}

// Limpar cache (útil para testes)
export function clearDbCache(): void {
  cachedDb = null
}
