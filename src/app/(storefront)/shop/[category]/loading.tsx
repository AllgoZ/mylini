// Matches ShopCategoryPage + ProductGridClient's layout exactly (same container widths,
// same grid columns, same aspect ratios) so there's no shift when real content swaps in.
export default function ShopCategoryLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Category Header */}
      <div className="bg-surface py-12 border-b border-border-soft">
        <div className="w-full mx-auto px-4 md:px-8 lg:px-12 text-center flex flex-col items-center gap-4">
          <div className="h-10 md:h-12 w-64 bg-surface-2 rounded-lg animate-pulse" />
          <div className="h-4 w-80 max-w-full bg-surface-2 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="w-full mx-auto px-4 md:px-8 lg:px-12 py-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar filters */}
        <aside className="hidden lg:flex w-[260px] flex-shrink-0 flex-col gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-border-soft shadow-s1 flex flex-col gap-3">
              <div className="h-4 w-20 bg-surface-2 rounded animate-pulse" />
              <div className="h-8 w-full bg-surface-2 rounded-lg animate-pulse" />
            </div>
          ))}
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0 w-full">
          <div className="h-5 w-28 bg-surface-2 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
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
