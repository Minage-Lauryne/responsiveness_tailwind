"use client";

import { type Subscription } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RetiredSubscriptions({
  subscriptions,
}: {
  subscriptions: Subscription[],
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            Plan
          </TableHead>
          <TableHead>
            Ended
          </TableHead>
          <TableHead>
            Seats
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscriptions.map((subscription) => (
          <TableRow
            key={`$retired-subscription-${subscription.id}`}
          >
            <TableCell>
              {subscription.plan}
            </TableCell>
            <TableCell>
              {subscription.periodEnd.toLocaleDateString("en-US")}
            </TableCell>
            <TableCell>
              {subscription.seats}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
