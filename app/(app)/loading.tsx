export default function ProtectedLoading() {
  return (
    <main className="wandr-shell-bg min-h-screen px-4 py-4 lg:px-6 lg:py-6">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="surface-card-strong hidden min-h-[calc(100vh-3rem)] rounded-[2rem] p-5 lg:block">
          <div className="h-16 animate-pulse rounded-3xl bg-black/8" />
          <div className="mt-6 space-y-3">
            <div className="h-12 animate-pulse rounded-full bg-[#9fe870]/50" />
            <div className="h-12 animate-pulse rounded-full bg-black/8" />
            <div className="h-12 animate-pulse rounded-full bg-black/8" />
            <div className="h-12 animate-pulse rounded-full bg-black/8" />
          </div>
        </aside>
        <section className="space-y-4">
          <div className="surface-card-strong h-32 animate-pulse rounded-[2rem]" />
          <div className="map-canvas h-[440px] animate-pulse" />
        </section>
      </div>
    </main>
  );
}
