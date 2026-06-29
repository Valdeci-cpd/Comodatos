"use client"

import useSWR from "swr"
import { ChevronLeft, ChevronRight, FileText, User } from "lucide-react"
import { getCliente } from "@/lib/api"
import type { Cliente, Contrato } from "@/lib/types"
import { formatarData } from "@/lib/format"

interface Props {
  cliente: Cliente
  onSelectContrato: (contrato: Contrato) => void
  onVoltar: () => void
}

export function ContractsScreen({ cliente, onSelectContrato, onVoltar }: Props) {
  const { data, isLoading } = useSWR(["cliente", cliente.codigo_cliente], () =>
    getCliente(cliente.codigo_cliente),
  )

  // Contratos em aberto do cliente (não quitados)
  const contratos = data?.contratos ?? []

  return (
    <div className="flex h-full flex-col">
      {/* Header do cliente */}
      <header className="flex items-center gap-2 border-b border-border bg-card px-2 py-3">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar"
          className="flex size-9 shrink-0 items-center justify-center text-primary"
        >
          <ChevronLeft className="size-7" />
        </button>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <User className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight text-foreground">{cliente.razao_social}</p>
          <p className="truncate text-sm leading-tight text-muted-foreground">{cliente.nome_fantasia}</p>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-background px-4 pt-4">
        <div className="rounded-lg bg-secondary py-2 text-center text-xs font-semibold tracking-wide text-secondary-foreground">
          {isLoading ? "CARREGANDO…" : `${contratos.length} CONTRATO${contratos.length === 1 ? "" : "S"} EM ABERTO`}
        </div>
      </div>

      {/* Lista de contratos */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {contratos.map((ct) => (
              <li key={ct.numero_contrato}>
                <button
                  type="button"
                  onClick={() => onSelectContrato(ct)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-success px-4 py-3.5 text-left"
                >
                  <FileText className="size-6 shrink-0 text-success-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-success-foreground">
                        CONTRATO Nº {ct.numero_contrato}
                      </p>
                      <span className="shrink-0 text-xs font-medium uppercase text-success-foreground/70">
                        {ct.tipo}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-success-foreground/80">
                      EMISSÃO: {formatarData(ct.emissao)} &nbsp; VENCIMENTO: {formatarData(ct.vencimento)}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-success-foreground/60" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
