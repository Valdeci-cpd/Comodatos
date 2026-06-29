"use client"

import { useState } from "react"
import useSWR from "swr"
import { CheckCheck, ChevronRight, Menu, Search, User, X } from "lucide-react"
import { getClientes } from "@/lib/api"
import type { Cliente } from "@/lib/types"
import { DIAS_ATENDIMENTO } from "@/lib/types"
import type { FiltroSelecionado } from "./filter-screen"

interface Props {
  filtro: FiltroSelecionado
  onSelectCliente: (cliente: Cliente) => void
  onVoltar: () => void
}

export function ClientsScreen({ filtro, onSelectCliente, onVoltar }: Props) {
  const [busca, setBusca] = useState("")
  const [menuAberto, setMenuAberto] = useState(false)

  const { data, isLoading } = useSWR(
    ["clientes", filtro.supervisor, filtro.vendedor, busca],
    () => getClientes({ supervisor: filtro.supervisor, vendedor: filtro.vendedor, busca }),
  )

  // Filtro do dia de atendimento: pastas/rotas com final igual ao dígito do dia
  const clientes = (data?.data ?? []).filter((c) => c.rota.endsWith(filtro.digitoRota))
  const diaLabel = DIAS_ATENDIMENTO.find((d) => d.id === filtro.diaId)?.label ?? ""

  return (
    <div className="flex h-full flex-col">
      {/* Header com busca */}
      <header className="relative border-b border-border bg-card px-4 pb-3 pt-3.5">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-secondary px-3.5 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código, nome ou razão social"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Buscar cliente"
            />
            {busca && (
              <button type="button" onClick={() => setBusca("")} aria-label="Limpar busca">
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Abrir menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground"
          >
            <Menu className="size-6" />
          </button>
        </div>

        {menuAberto && (
          <>
            <button
              type="button"
              aria-label="Fechar menu"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setMenuAberto(false)}
            />
            <div className="absolute right-4 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuAberto(false)
                  onVoltar()
                }}
                className="w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-secondary"
              >
                Voltar para o filtro
              </button>
            </div>
          </>
        )}
      </header>

      {/* Contexto do filtro */}
      <div className="flex items-center justify-between bg-background px-4 py-2 text-xs text-muted-foreground">
        <span>
          Vendedor {filtro.vendedor} · {diaLabel}
        </span>
        <span>{clientes.length} clientes</span>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ul>
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                <div className="size-11 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              </li>
            ))}
          </ul>
        ) : clientes.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado para esta rota.
          </p>
        ) : (
          <ul>
            {clientes.map((c) => (
              <li key={c.codigo_cliente}>
                <button
                  type="button"
                  onClick={() => onSelectCliente(c)}
                  className="flex w-full items-center gap-3 border-b border-border bg-card px-4 py-3 text-left"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <User className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{c.razao_social}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <CheckCheck className="size-3.5 shrink-0 text-primary" />
                      {c.nome_fantasia}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <CheckCheck className="size-3.5 shrink-0 text-primary" />
                      {c.cidade}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-xs text-muted-foreground">{c.codigo_cliente}</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
