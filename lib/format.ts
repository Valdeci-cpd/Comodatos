export function formatarData(iso: string | null): string {
  if (!iso) return "—"

  const datePart = iso.split("T")[0]
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(datePart)
  if (match) {
    const [, year, month, day] = match
    return `${day}/${month}/${year}`
  }

  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  vencido: "Vencido",
  a_vencer: "A vencer",
  indefinido: "Indefinido",
}

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status
}
