"use client"

import { useState } from "react"
import { FilterScreen, type FiltroSelecionado } from "@/components/screens/filter-screen"
import { ClientsScreen } from "@/components/screens/clients-screen"
import { ContractsScreen } from "@/components/screens/contracts-screen"
import { ProductsScreen } from "@/components/screens/products-screen"
import { USANDO_MOCK } from "@/lib/api"
import type { Cliente, Contrato } from "@/lib/types"

type Etapa = "filtro" | "clientes" | "contratos" | "produtos"

export default function Page() {
  const [etapa, setEtapa] = useState<Etapa>("filtro")
  const [filtro, setFiltro] = useState<FiltroSelecionado | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [contrato, setContrato] = useState<Contrato | null>(null)

  return (
    <main className="flex min-h-dvh justify-center bg-secondary/50">
      <div className="flex h-dvh w-full max-w-md flex-col bg-background shadow-sm">
        {USANDO_MOCK && (
          <div className="shrink-0 bg-primary/10 px-4 py-1.5 text-center text-[11px] font-medium text-primary">
            Modo demonstração · defina NEXT_PUBLIC_API_URL para conectar a API
          </div>
        )}

        <div className="min-h-0 flex-1">
          {etapa === "filtro" && (
            <FilterScreen
              onConcluir={(f) => {
                setFiltro(f)
                setEtapa("clientes")
              }}
            />
          )}

          {etapa === "clientes" && filtro && (
            <ClientsScreen
              filtro={filtro}
              onVoltar={() => setEtapa("filtro")}
              onSelectCliente={(c) => {
                setCliente(c)
                setEtapa("contratos")
              }}
            />
          )}

          {etapa === "contratos" && cliente && (
            <ContractsScreen
              cliente={cliente}
              onVoltar={() => setEtapa("clientes")}
              onSelectContrato={(ct) => {
                setContrato(ct)
                setEtapa("produtos")
              }}
            />
          )}

          {etapa === "produtos" && cliente && contrato && (
            <ProductsScreen cliente={cliente} contrato={contrato} onVoltar={() => setEtapa("contratos")} />
          )}
        </div>
      </div>
    </main>
  )
}
