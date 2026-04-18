export default function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-4 py-12">
      <div className="w-full max-w-[380px]">
        {/* Brand skeleton */}
        <div className="mb-10">
          <div className="h-3 w-12 animate-pulse rounded-full bg-black/[0.05]" />
          <div className="mt-4 h-8 w-48 animate-pulse rounded-lg bg-black/[0.06]" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded-full bg-black/[0.04]" />
        </div>

        {/* Form skeleton */}
        <div className="space-y-5">
          <div>
            <div className="mb-1.5 h-3 w-10 rounded-full bg-black/[0.04]" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-black/[0.04]" />
          </div>
          <div>
            <div className="mb-1.5 h-3 w-16 rounded-full bg-black/[0.04]" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-black/[0.04]" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-full bg-black/[0.08]" />
        </div>

        <div className="mt-8 flex justify-center">
          <div className="h-4 w-40 animate-pulse rounded-full bg-black/[0.04]" />
        </div>
      </div>
    </main>
  );
}
