"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { FileText, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

interface Filing {
  id: string;
  ein: string;
  taxYear: number;
  pdfUrl: string;
  totalRevenue: bigint | null;
  totalExpenses: bigint | null;
  totalAssets: bigint | null;
}

interface Form990FilingsSheetProps {
  organizationId: string;
  organizationName: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatCompactCurrency(amount: bigint | null): string {
  if (amount === null) return "N/A";
  const num = Number(amount);
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(0)}K`;
  }
  return `$${num}`;
}

export function Form990FilingsSheet({
  organizationId,
  organizationName,
  isOpen,
  onClose,
}: Form990FilingsSheetProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = api.form990.getFilings.useQuery(
    { organizationId },
    { enabled: isOpen }
  );

  const filings = data?.filings || [];
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFilings = filings.slice(startIndex, endIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen, filings.length]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const latestFiling = filings[0];
  const oldestFiling = filings[filings.length - 1];
  const yearsSpan = latestFiling && oldestFiling ? latestFiling.taxYear - oldestFiling.taxYear + 1 : 0;

  const calculateNetIncome = (revenue: bigint | null, expenses: bigint | null): number | null => {
    if (revenue === null || expenses === null) return null;
    return Number(revenue) - Number(expenses);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-3xl overflow-y-auto">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-xl">Form 990 Tax Filings</SheetTitle>
            <SheetDescription className="mt-1">{organizationName}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-8 pb-6">
            {isLoading && (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            )}

            {!isLoading && filings.length === 0 && (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Form 990 Filings Available</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Tax filings for this organization are not yet available in the ProPublica database.
                </p>
              </div>
            )}

            {!isLoading && filings.length > 0 && (
              <>
                {/* Summary Section */}
                <div className="rounded-lg border bg-card p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <h3 className="text-base font-semibold">Filing Summary</h3>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
                      <Calendar className="h-3 w-3" />
                      {yearsSpan} year{yearsSpan !== 1 ? 's' : ''} of data
                    </Badge>
                  </div>

                  {latestFiling && (
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Latest Filing</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-gray-900">{latestFiling.taxYear}</p>
                          <Badge variant="outline">Most Recent</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Total Filings</p>
                        <p className="text-2xl font-bold text-gray-900">{filings.length}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Net Income ({latestFiling.taxYear})</p>
                        <div className="flex items-center gap-1">
                          {(() => {
                            const netIncome = calculateNetIncome(latestFiling.totalRevenue, latestFiling.totalExpenses);
                            if (netIncome === null) {
                              return <p className="text-lg font-semibold text-gray-400">N/A</p>;
                            }
                            const isPositive = netIncome >= 0;
                            return (
                              <>
                                <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCompactCurrency(BigInt(netIncome))}
                                </p>
                                {isPositive ? (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-base font-semibold mb-6">All Tax Filings</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Tax Year</TableHead>
                          <TableHead className="font-semibold">Revenue</TableHead>
                          <TableHead className="font-semibold">Expenses</TableHead>
                          <TableHead className="font-semibold">Assets</TableHead>
                          <TableHead className="font-semibold">Net Income</TableHead>
                          <TableHead className="text-right font-semibold">PDF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedFilings.map((filing: Filing, index: number) => {
                          const netIncome = calculateNetIncome(filing.totalRevenue, filing.totalExpenses);
                          const globalIndex = startIndex + index;
                          const isLatest = globalIndex === 0;

                          return (
                            <TableRow
                              key={filing.id}
                              className="h-14"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {filing.taxYear}
                                  {isLatest && (
                                    <Badge variant="default" className="text-xs">Latest</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {formatCompactCurrency(filing.totalRevenue)}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {formatCompactCurrency(filing.totalExpenses)}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {formatCompactCurrency(filing.totalAssets)}
                              </TableCell>
                              <TableCell>
                                {netIncome === null ? (
                                  <span className="text-sm text-muted-foreground">N/A</span>
                                ) : (
                                  <span className={`font-mono text-sm font-medium ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCompactCurrency(BigInt(netIncome))}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(filing.pdfUrl, "_blank")}
                                  className="gap-1.5"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View PDF
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, filings.length)} of {filings.length} filings
                      </p>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="gap-1"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}