// Matches the homepage's above-the-fold layout (hero, offer strip, category circles,
// product grid) so there's no shift/flash when real content swaps in.
export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <div className="w-full mt-6 px-4 md:px-7">
        <div className="rounded-[28px] min-h-[50vh] max-h-[65vh] md:min-h-[220px] md:max-h-none bg-surface-2 animate-pulse" />
      </div>

      {/* Offer strip */}
      <div className="w-full mt-4 px-4 md:px-7 flex gap-2 md:gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[86vw] sm:w-[360px] md:flex-1 h-[60px] bg-surface-2 rounded-md animate-pulse" />
        ))}
      </div>

      {/* Category circles */}
      <div className="w-full mt-8 px-4 md:px-7 flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface-2 animate-pulse" />
            <div className="h-3 w-12 bg-surface-2 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Product grid */}
      <div className="w-full mt-10">
        <div className="flex items-baseline justify-between mb-5 px-4 md:px-7">
          <div className="h-6 w-40 bg-surface-2 rounded animate-pulse" />
          <div className="h-4 w-16 bg-surface-2 rounded animate-pulse" />
        </div>
        <div className="px-4 md:px-7">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-[3/4] rounded-xl bg-surface-2 animate-pulse" />
                <div className="h-3.5 w-3/4 bg-surface-2 rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-surface-2 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
