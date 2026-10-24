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

 const config: ChartConfig = Object.fromEntries(
  types.map((t, i) => [
   t.key,
   { label: t.label, color: `var(--chart-${(i % 5) + 1})` },
  ]),
 );

 return (
  <Card className="@container/card">
   <CardHeader>
    <CardTitle>Vacations by Month</CardTitle>
    <CardDescription>
     Number of leaves starting each month, split by vacation type
    </CardDescription>
   </CardHeader>
   <CardContent>
    {rows.length === 0 ? (
     <div className="text-muted-foreground flex h-[250px] items-center justify-center text-sm">
      No leave dates found in Vacations.json
     </div>
    ) : (
     <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
      <BarChart data={rows}>
       <CartesianGrid vertical={false} />
       <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
       <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
       <ChartTooltip content={<ChartTooltipContent />} />
       <ChartLegend content={<ChartLegendContent />} />
       {types.map((t) => (
        <Bar
         key={t.key}
         dataKey={t.key}
         stackId="leaves"
         fill={`var(--color-${t.key})`}
         radius={2}
        />
       ))}
      </BarChart>
     </ChartContainer>
    )}
   </CardContent>
  </Card>
 );
}
