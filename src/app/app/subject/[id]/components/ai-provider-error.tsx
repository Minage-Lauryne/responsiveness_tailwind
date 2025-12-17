"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export function AIProviderError() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);

    // Add a small delay to show the loading state
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Card className="mb-4 max-w-2xl border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <CardContent className="flex items-center gap-3 p-4">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
        <div className="flex-1 space-y-2">
          <h2 className="text-lg font-medium text-orange-800 dark:text-orange-200">
            Complēre Has Experienced an Error
          </h2>
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
            AI providers may be temporarily unavailable
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-300">
            Please try again in a few moments. Our AI services should be back
            online shortly.
          </p>
        </div>
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          size="sm"
          variant="outline"
          className="border-orange-300 bg-background text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
        >
          {isRetrying ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="mr-1 h-4 w-4" />
              Retry
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
