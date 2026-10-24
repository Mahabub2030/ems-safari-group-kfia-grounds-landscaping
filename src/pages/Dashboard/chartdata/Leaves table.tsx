// src/components/leaves-table.tsx
// Replaces the fixed-schema DataTable: shows the next / current leaves.
import { Badge } from "@/components/ui/badge";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import type { VacationRecord } from "@/lib/Vacation data";

const dash = (v: unknown) => (v === undefined || v === null || v === "" ? "-" : String(v));

export function LeavesTable({ records }: { records: VacationRecord[] }) {
 const rows = records
  .filter((r) =>
   ["On Leave", "Upcoming", "Pending"].includes(r.formattedStatus),
  )
  .sort(
   (a, b) =>
    (new Date(a.leave ?? "").getTime() || Infinity) -
    (new Date(b.leave ?? "").getTime() || Infinity),
  )
  .slice(0, 10);

 return (
  <div className="px-4 lg:px-6">
   <Card>
    <CardHeader>
     <CardTitle>Current & Upcoming Leaves</CardTitle>
     <CardDescription>
      On leave, upcoming and pending requests, earliest first
     </CardDescription>
    </CardHeader>
    <CardContent className="overflow-x-auto">
     <Table>
      <TableHeader>
       <TableRow>
        <TableHead>Employee</TableHead>
        <TableHead>Department</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Leave Date</TableHead>
        <TableHead>Return Date</TableHead>
        <TableHead className="text-right">Remaining</TableHead>
       </TableRow>
      </TableHeader>
      <TableBody>
       {rows.length === 0 ? (
        <TableRow>
         <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
          No current or upcoming leaves.
         </TableCell>
        </TableRow>
       ) : (
        rows.map((r, i) => (
         <TableRow key={r._id ?? i}>
          <TableCell>
           <div className="font-medium">{dash(r.name)}</div>
           <div className="text-muted-foreground text-xs">{dash(r.employeeId)}</div>
          </TableCell>
          <TableCell>{dash(r.group)}</TableCell>
          <TableCell>{dash(r.vacationType)}</TableCell>
          <TableCell>
           <Badge variant="outline">{r.formattedStatus}</Badge>
          </TableCell>
          <TableCell>{dash(r.leave)}</TableCell>
          <TableCell>{dash(r.returnDate)}</TableCell>
          <TableCell className="text-right tabular-nums">
           {dash(r.remainingDays)} d
          </TableCell>
         </TableRow>
        ))
       )}
      </TableBody>
     </Table>
    </CardContent>
   </Card>
  </div>
 );
}
