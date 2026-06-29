"use client"

import useSWR from "swr"
import { ChevronLeft, User } from "lucide-react"
import { getContrato } from "@/lib/api"
import type { Cliente, Contrato } from "@/lib/types"

interface Props {
  cliente: Cliente
  contrato: Contrato
  onVoltar: () => void
}

export function ProductsScreen({ cliente, contrato, onVoltar }: Props) {
  const { data, isLoading } = useSWR(["contrato", contrato.numero_contrato], () =>
    getContrato(contrato.numero_contrato),
  )

  const produtos = data?.produtos ?? contrato.produtos ?? []

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

      {/* Banners contrato */}
      <div className="space-y-2 bg-background px-4 pt-4">
        <div className="rounded-lg bg-secondary py-2 text-center text-sm font-semibold tracking-wide text-secondary-foreground">
          CONTRATO Nº {contrato.numero_contrato}
        </div>
        <div className="rounded-lg bg-secondary/60 py-1.5 text-center text-xs font-medium tracking-wide text-muted-foreground">
          {isLoading ? "CARREGANDO…" : `${produtos.length} PRODUTO${produtos.length === 1 ? "" : "S"}`}
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {produtos.map((p, i) => (
              <li
                key={`${p.codigo_produto}-${i}`}
                className="flex items-center gap-4 rounded-2xl bg-success px-4 py-4"
              >
                <span className="min-w-12 text-3xl font-bold leading-none text-success-foreground">
                  {p.quantidade}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold uppercase leading-tight text-success-foreground">
                    {p.descricao}
                  </p>
                  <p className="text-sm text-success-foreground/70">{p.codigo_produto}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
