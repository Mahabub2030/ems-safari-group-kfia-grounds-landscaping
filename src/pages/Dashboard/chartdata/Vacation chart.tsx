// src/components/vacation-chart.tsx
// Replaces ChartAreaInteractive: leaves per month, stacked by vacation type.
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import {
 type ChartConfig,
 ChartContainer,
 ChartLegend,
 ChartLegendContent,
 ChartTooltip,
 ChartTooltipContent,
} from "@/components/ui/chart";
import { monthlyByType, type VacationRecord } from "@/lib/Vacation data";

export function VacationChart({ records }: { records: VacationRecord[] }) {
 const { rows, types } = monthlyByType(records);
 const totalLeaveRecords = records.length;
 const monthsCovered = rows.length;
 const groupedTypes = types.length;

 const config: ChartConfig = Object.fromEntries(
  types.map((t, i) => [
   t.key,
   { label: t.label, color: `var(--chart-${(i % 5) + 1})` },
  ]),
 );

 return (
  <Card className="@container/card border border-border/80 bg-card/95 shadow-sm">
   <CardHeader className="gap-4 border-b border-border/60 pb-4">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
     <div>
      <CardTitle className="text-xl font-semibold tracking-tight">
       Vacation Monitoring
      </CardTitle>
      <CardDescription className="mt-1 text-sm text-muted-foreground">
       Leave activity by month, grouped by vacation category
      </CardDescription>
     </div>
     <div className="flex flex-wrap items-center gap-2 text-xs">
      <div className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
        <span className="text-muted-foreground">Total records</span>
        <div className="font-semibold text-foreground">{totalLeaveRecords}</div>
      </div>
      <div className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
        <span className="text-muted-foreground">Types</span>
        <div className="font-semibold text-foreground">{groupedTypes}</div>
      </div>
      <div className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
        <span className="text-muted-foreground">Months</span>
        <div className="font-semibold text-foreground">{monthsCovered}</div>
      </div>
     </div>
    </div>
   </CardHeader>
   <CardContent className="pt-5">
    {rows.length === 0 ? (
     <div className="text-muted-foreground flex h-[250px] items-center justify-center text-sm">
      No leave dates found in Vacations.json
     </div>
    ) : (
     <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
       <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
       <XAxis
        dataKey="month"
        tickLine={false}
        axisLine={false}
        tickMargin={10}
        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
       />
       <YAxis
        allowDecimals={false}
        tickLine={false}
        axisLine={false}
        width={30}
        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
       />
       <ChartTooltip
        content={<ChartTooltipContent className="w-[180px]" />}
        cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
       />
       <ChartLegend content={<ChartLegendContent />} />
       {types.map((t) => (
        <Bar
         key={t.key}
         dataKey={t.key}
         stackId="leaves"
         fill={`var(--color-${t.key})`}
         radius={4}
         maxBarSize={38}
        />
       ))}
      </BarChart>
     </ChartContainer>
    )}
   </CardContent>
  </Card>
 );
}
