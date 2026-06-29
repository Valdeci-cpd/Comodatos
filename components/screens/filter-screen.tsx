"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Check } from "lucide-react"
import { getSupervisores } from "@/lib/api"
import { DIAS_ATENDIMENTO } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface FiltroSelecionado {
  supervisor: number
  vendedor: number
  diaId: number
  digitoRota: string
  vendedorNome: string
}

export function FilterScreen({ onConcluir }: { onConcluir: (filtro: FiltroSelecionado) => void }) {
  const { data: supervisores, isLoading } = useSWR("supervisores", getSupervisores)

  const [supervisor, setSupervisor] = useState<number | null>(null)
  const [vendedor, setVendedor] = useState<number | null>(null)
  const [diaId, setDiaId] = useState<number | null>(null)

  const supervisorAtual = useMemo(
    () => supervisores?.find((s) => s.codigo === supervisor),
    [supervisores, supervisor],
  )

  const vendedores = supervisorAtual?.vendedores ?? []
  const podeConcluir = supervisor !== null && vendedor !== null && diaId !== null

  function concluir() {
    if (!podeConcluir) return
    const dia = DIAS_ATENDIMENTO.find((d) => d.id === diaId)!
    const v = vendedores.find((x) => x.codigo === vendedor)
    onConcluir({
      supervisor: supervisor!,
      vendedor: vendedor!,
      diaId: diaId!,
      digitoRota: dia.digito,
      vendedorNome: v?.nome ?? String(vendedor),
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3.5">
        <div className="w-16" />
        <h1 className="text-base font-semibold text-foreground">Filtro</h1>
        <button
          type="button"
          onClick={concluir}
          disabled={!podeConcluir}
          className={cn(
            "w-16 text-right text-base font-semibold transition-colors",
            podeConcluir ? "text-primary" : "text-muted-foreground/50",
          )}
        >
          Concluir
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Supervisores */}
        <section className="px-4 pt-5">
          <h2 className="mb-3 text-sm font-bold tracking-wide text-foreground">SUPERVISORES</h2>
          {isLoading ? (
            <div className="flex gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 flex-1 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <div className="flex gap-2.5">
              {supervisores?.map((s) => {
                const ativo = supervisor === s.codigo
                const rotulo = s.tipo === "balcao" ? "BALCÃO" : String(s.codigo)
                return (
                  <button
                    key={s.codigo}
                    type="button"
                    onClick={() => {
                      setSupervisor(s.codigo)
                      setVendedor(null)
                    }}
                    className={cn(
                      "flex h-12 flex-1 items-center justify-center rounded-xl border-2 px-2 text-sm font-bold transition-colors",
                      ativo
                        ? "border-primary bg-secondary text-foreground"
                        : "border-transparent bg-secondary text-secondary-foreground",
                    )}
                  >
                    {rotulo}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Vendedores */}
        <section className="mt-6">
          <h2 className="px-4 pb-1 text-sm font-bold tracking-wide text-foreground">VENDEDORES</h2>
          {supervisor === null ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">Selecione um supervisor.</p>
          ) : (
            <ul className="bg-card">
              {vendedores.map((v) => {
                const ativo = vendedor === v.codigo
                return (
                  <li key={v.codigo}>
                    <button
                      type="button"
                      onClick={() => setVendedor(v.codigo)}
                      className="flex w-full items-center justify-between border-b border-border px-4 py-3.5 text-left"
                    >
                      <span className="text-base text-foreground">{v.codigo}</span>
                      {ativo && <Check className="size-5 text-primary" strokeWidth={3} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Dia de atendimento */}
        <section className="mt-6">
          <h2 className="px-4 pb-1 text-sm font-bold tracking-wide text-foreground">DIA DE ATENDIMENTO</h2>
          <ul className="bg-card">
            {DIAS_ATENDIMENTO.map((d) => {
              const ativo = diaId === d.id
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setDiaId(d.id)}
                    className="flex w-full items-center justify-between border-b border-border px-4 py-3.5 text-left"
                  >
                    <span className="text-base uppercase text-foreground">{d.label}</span>
                    {ativo && <Check className="size-5 text-primary" strokeWidth={3} />}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
