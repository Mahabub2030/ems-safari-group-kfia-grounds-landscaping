"use client"

export type EmployeeSummaryStats = {
  total: number
  active: number
  onLeave: number
  inactive: number
}

export type ExpirySummaryStats = {
  total: number
  dacoIdCount: number
  expiredIqama: number
  expiredDaco: number
  validTotal: number
  applied: number
  missing: number
}

export type VacationSummaryStats = {
  total: number
  Pending: number
  Cancelled: number
  "On Leave": number
}

export type DocumentSummaryStats = {
  total: number
  available: number
  iqama: number
  passport: number
  gacaCertificate: number
  otherDocuments: number
  missing: number
}

export function SectionCards({
  stats,
  expiryStats,
  vacationStats,
  documentStats,
}: {
  stats?: EmployeeSummaryStats
  expiryStats?: ExpirySummaryStats
  vacationStats?: VacationSummaryStats
  documentStats?: DocumentSummaryStats
}) {
  const totalEmployees = stats?.total ?? 0
  const activeEmployees = stats?.active ?? 0
  const onLeaveEmployees = stats?.onLeave ?? 0
  const inactiveEmployees = stats?.inactive ?? 0
  const activePercent = totalEmployees
    ? Math.round((activeEmployees / totalEmployees) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border-[2px] border-[#1f3a2b] bg-[#f3f3f3] p-3 shadow-[0_0_0_1px_rgba(31,58,43,0.15)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[{
            label: "Total Employees",
            value: totalEmployees,
            note: "Staff count from current records",
            badge: `+${Math.max(0, activeEmployees - inactiveEmployees)}`,
            badgeTone: "text-[#0f5132] bg-[#dfeee5] border-[#b8d9c4]",
          }, {
            label: "Active Employees",
            value: activeEmployees,
            note: "Currently on duty",
            badge: `${activePercent}%`,
            badgeTone: "text-[#0f5132] bg-[#dfeee5] border-[#b8d9c4]",
          }, {
            label: "On Vacation",
            value: onLeaveEmployees,
            note: "Employees currently away",
            badge: `${onLeaveEmployees}`,
            badgeTone: "text-[#8a5d00] bg-[#fff3cd] border-[#f5d97d]",
          }, {
            label: "Inactive Employees",
            value: inactiveEmployees,
            note: "Needs attention",
            badge: `${inactiveEmployees}`,
            badgeTone: "text-[#495057] bg-[#e9ecef] border-[#ced4da]",
          }].map((card) => (
            <div key={card.label} className="overflow-hidden rounded-[12px] border border-[#1f3a2b] bg-[#f9f9f9] shadow-sm">
              <div className="flex items-center justify-between bg-[#1f3a2b] px-3 py-2.5 text-white">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/90">
                  {card.label}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${card.badgeTone}`}>
                  {card.badge}
                </span>
              </div>
              <div className="px-3 pb-3 pt-4">
                <div className="text-3xl font-extrabold leading-none tracking-tight text-[#1b2d23]">
                  {card.value}
                </div>
                <div className="mt-2 text-[11px] font-medium text-[#4d5a52]">
                  {card.note}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {expiryStats ? (
        <div className="rounded-[16px] border-[2px] border-[#1f3a2b] bg-[#f3f3f3] p-3 shadow-[0_0_0_1px_rgba(31,58,43,0.15)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Expirations", value: expiryStats.total, tone: "text-[#0f5132] bg-[#dfeee5] border-[#b8d9c4]" },
              { label: "DACO IDs", value: expiryStats.dacoIdCount, tone: "text-[#0f5132] bg-[#dfeee5] border-[#b8d9c4]" },
              { label: "Expired IQAMA", value: expiryStats.expiredIqama, tone: "text-[#842029] bg-[#f8d7da] border-[#f1aeb5]" },
              { label: "Valid Total", value: expiryStats.validTotal, tone: "text-[#0f5132] bg-[#dfeee5] border-[#b8d9c4]" },
              { label: "Applied", value: expiryStats.applied, tone: "text-[#0f5132] bg-[#dfeee5] border-[#b8d9c4]" },
              { label: "Missing", value: expiryStats.missing, tone: "text-[#7c2d12] bg-[#ffedd5] border-[#fdba74]" },
            ].map((card) => (
              <div key={card.label} className="overflow-hidden rounded-[12px] border border-[#1f3a2b] bg-[#f9f9f9] shadow-sm">
                <div className="flex items-center justify-between bg-[#2b4d3d] px-3 py-2.5 text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/90">
                    {card.label}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${card.tone}`}>
                    {card.value}
                  </span>
                </div>
                <div className="px-3 pb-3 pt-4">
                  <div className="text-3xl font-extrabold leading-none tracking-tight text-[#1b2d23]">
                    {card.value}
                  </div>
                  <div className="mt-2 text-[11px] font-medium text-[#4d5a52]">
                    {!card.label.includes("Expired") ? "Current document status" : "Needs renewal attention"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(vacationStats || documentStats) ? (
        <div className="rounded-[16px] border-[2px] border-[#1f3a2b] bg-[#f3f3f3] p-3 shadow-[0_0_0_1px_rgba(31,58,43,0.15)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-extrabold uppercase tracking-[0.08em] text-[#1b2d23]">
              Operational Overview
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {vacationStats ? [
              { label: "Total Vacations", value: vacationStats.total, tone: "text-[#0f5132] bg-[#dfeee5] border-[#b8d9c4]" },
              { label: "Pending", value: vacationStats.Pending, tone: "text-[#8a5d00] bg-[#fff3cd] border-[#f5d97d]" },
              { label: "Cancelled", value: vacationStats.Cancelled, tone: "text-[#6c5f00] bg-[#fff9d6] border-[#f3e69b]" },
              { label: "On Leave", value: vacationStats["On Leave"], tone: "text-[#4c1d95] bg-[#ede9fe] border-[#c4b5fd]" },
            ].map((card) => (
              <div key={card.label} className="overflow-hidden rounded-[12px] border border-[#1f3a2b] bg-[#f9f9f9] shadow-sm">
                <div className="flex items-center justify-between bg-[#2b4d3d] px-3 py-2.5 text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/90">
                    {card.label}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${card.tone}`}>
                    {card.value}
                  </span>
                </div>
                <div className="px-3 pb-3 pt-4">
                  <div className="text-3xl font-extrabold leading-none tracking-tight text-[#1b2d23]">
                    {card.value}
                  </div>
                  <div className="mt-2 text-[11px] font-medium text-[#4d5a52]">
                    {card.label === "Total Vacations" ? "All requests" : "Current status"}
                  </div>
                </div>
              </div>
            )) : null}

            {documentStats ? [
              { label: "Valid Documents", value: documentStats.available, tone: "text-[#0f5132] bg-[#dfeee5] border-[#b8d9c4]" },
              { label: "Iqama", value: documentStats.iqama, tone: "text-[#0f5132] bg-[#dfeee5] border-[#b8d9c4]" },
              { label: "Passport", value: documentStats.passport, tone: "text-[#4c1d95] bg-[#ede9fe] border-[#c4b5fd]" },
              { label: "GACA", value: documentStats.gacaCertificate, tone: "text-[#7c2d12] bg-[#ffedd5] border-[#fdba74]" },
              { label: "Other Documents", value: documentStats.otherDocuments, tone: "text-[#0f172a] bg-[#e2e8f0] border-[#cbd5e1]" },
              { label: "Missing", value: documentStats.missing, tone: "text-[#7f1d1d] bg-[#fee2e2] border-[#fca5a5]" },
            ].map((card) => (
              <div key={card.label} className="overflow-hidden rounded-[12px] border border-[#1f3a2b] bg-[#f9f9f9] shadow-sm">
                <div className="flex items-center justify-between bg-[#2b4d3d] px-3 py-2.5 text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/90">
                    {card.label}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${card.tone}`}>
                    {card.value}
                  </span>
                </div>
                <div className="px-3 pb-3 pt-4">
                  <div className="text-3xl font-extrabold leading-none tracking-tight text-[#1b2d23]">
                    {card.value}
                  </div>
                  <div className="mt-2 text-[11px] font-medium text-[#4d5a52]">
                    {card.label === "Valid Documents" ? "Available records" : "Document type"}
                  </div>
                </div>
              </div>
            )) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
