const WatchLoading = () => (
  <div className="flex min-h-screen flex-col" aria-busy="true" aria-live="polite">
    <div className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-12 animate-pulse rounded bg-muted" />
        <div className="w-16 sm:w-20" />
      </div>
    </div>

    <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="aspect-video animate-pulse rounded-xl bg-muted" />
      <div className="space-y-3">
        <div className="h-8 w-2/3 max-w-md animate-pulse rounded-md bg-muted" />
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-4 w-full max-w-lg animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3 border-t pt-8">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  </div>
);

export default WatchLoading;
