// Matches ProductDetailClient's layout exactly (same container widths, same grid shape,
// same gallery aspect ratio) so there's no shift when the real product swaps in.
export default function ProductLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Breadcrumbs */}
      <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 mt-5 flex items-center gap-2">
        <div className="h-3.5 w-12 bg-surface-2 rounded animate-pulse" />
        <div className="h-3.5 w-20 bg-surface-2 rounded animate-pulse" />
      </div>

      <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-7 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-start">
        {/* Gallery */}
        <div className="aspect-[3/4] rounded-3xl bg-surface-2 animate-pulse" />

        {/* Details panel */}
        <div className="flex flex-col gap-4">
          <div className="h-7 w-3/4 bg-surface-2 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-surface-2 rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-surface-2 rounded animate-pulse" />
          <div className="flex gap-2 mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-16 bg-surface-2 rounded-md animate-pulse" />
            ))}
          </div>
          <div className="h-12 w-full bg-surface-2 rounded-xl animate-pulse mt-3" />
          <div className="h-12 w-full bg-surface-2 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
