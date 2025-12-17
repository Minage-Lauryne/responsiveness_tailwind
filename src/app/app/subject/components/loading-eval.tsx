export function LoadingEval() {
  const fileWidths = ["75%", "65%", "80%"]; // Fixed widths instead of random

  return (
    <div className="flex h-screen gap-8 p-8">
      {/* Left Sidebar Loading */}
      <div className="w-2/6 rounded-2xl bg-slate-900 p-8">
        <div className="space-y-6">
          {/* Title Skeleton */}
          <div>
            <div className="h-7 w-3/4 animate-pulse rounded bg-slate-700/50 backdrop-blur-sm"></div>
          </div>

          {/* Files Section Skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-16 animate-pulse rounded bg-slate-700/50 backdrop-blur-sm"></div>

            <div className="ml-2 space-y-3">
              {/* File Item Skeletons */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded bg-slate-700/50 backdrop-blur-sm"></div>
                  <div className="flex-1 space-y-1">
                    <div
                      className="h-4 animate-pulse rounded bg-slate-700/50 backdrop-blur-sm"
                      style={{ width: fileWidths[i - 1] }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Context Section Skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-700/50 backdrop-blur-sm"></div>
            <div className="ml-2 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-slate-700/50 backdrop-blur-sm"></div>
              <div className="h-3 w-4/5 animate-pulse rounded bg-slate-700/50 backdrop-blur-sm"></div>
              <div className="h-3 w-3/5 animate-pulse rounded bg-slate-700/50 backdrop-blur-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel Loading */}
      <div className="w-4/6">
        <div className="h-full rounded-2xl bg-white p-8 shadow-sm">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-3">
              <div className="h-8 w-1/3 animate-pulse rounded bg-slate-200/70 backdrop-blur-sm"></div>
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/70 backdrop-blur-sm"></div>
            </div>

            {/* Content Blocks */}
            <div className="space-y-6">
              {[1, 2, 3].map((block) => (
                <div key={block} className="space-y-3">
                  <div className="h-6 w-1/4 animate-pulse rounded bg-slate-200/70 backdrop-blur-sm"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((line) => (
                      <div
                        key={line}
                        className="h-4 animate-pulse rounded bg-slate-200/70 backdrop-blur-sm"
                        style={{
                          width: line === 4 ? "60%" : "100%",
                          animationDelay: `${line * 0.1}s`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Large Content Block */}
            <div className="mt-8 space-y-4 rounded-lg border border-slate-100 p-6">
              <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200/70 backdrop-blur-sm"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-32 animate-pulse rounded bg-slate-200/70 backdrop-blur-sm"></div>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200/70 backdrop-blur-sm"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-32 animate-pulse rounded bg-slate-200/70 backdrop-blur-sm"></div>
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/70 backdrop-blur-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
