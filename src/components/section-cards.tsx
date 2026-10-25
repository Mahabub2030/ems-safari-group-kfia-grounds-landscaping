"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

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
}

export function SectionCards({
  stats,
  expiryStats,
}: {
  stats?: EmployeeSummaryStats
  expiryStats?: ExpirySummaryStats
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
      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Employees</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalEmployees}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                +{Math.max(0, activeEmployees - inactiveEmployees)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Staff count from current records{" "}
              <TrendingUpIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Includes active and inactive personnel
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Active Employees</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {activeEmployees}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                {activePercent > 0 ? "+" : ""}
                {activePercent}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Currently on duty{" "}
              <TrendingUpIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Based on the live vacation status summary
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>On Vacation</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {onLeaveEmployees}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingDownIcon />
                {onLeaveEmployees}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Employees currently away{" "}
              <TrendingDownIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Derived from the vacation records
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Inactive Employees</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {inactiveEmployees}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingDownIcon />
                {inactiveEmployees > 0 ? "-" : "+"}
                {inactiveEmployees}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Needs attention{" "}
              <TrendingDownIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Records marked inactive in the current data set
            </div>
          </CardFooter>
        </Card>
      </div>

      {expiryStats ? (
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Total Expirations</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {expiryStats.total}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendingUpIcon />
                  {expiryStats.total}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Records in expiry tracker
                <TrendingUpIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">Current document expiry list</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>DACO IDs</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {expiryStats.dacoIdCount}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendingUpIcon />
                  {expiryStats.dacoIdCount}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Employees with DACO ID
                <TrendingUpIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">Active document coverage</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Expired IQAMA</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {expiryStats.expiredIqama}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendingDownIcon />
                  {expiryStats.expiredIqama}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Already expired iqama records
                <TrendingDownIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">Needs renewal attention</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Valid Total</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {expiryStats.validTotal}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendingUpIcon />
                  {expiryStats.validTotal}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Current valid document records
                <TrendingUpIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">Not expired yet</div>
            </CardFooter>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
