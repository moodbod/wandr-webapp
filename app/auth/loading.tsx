import { getAuthMapStillUrl } from "@/lib/mapbox-static";

export default function AuthLoading() {
  const mapStillUrl = getAuthMapStillUrl(
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  );

  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden p-4">
      <div
        className="absolute inset-0 bg-[#e9ece6] bg-cover bg-center bg-no-repeat"
        style={mapStillUrl ? { backgroundImage: `url("${mapStillUrl}")` } : undefined}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,228,136,0.16),transparent_0,transparent_26%),radial-gradient(circle_at_100%_0%,rgba(120,232,238,0.14),transparent_0,transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06))]" />

      <div className="relative z-10 w-full max-w-[430px] rounded-[2rem] bg-white/94 p-7 shadow-[0_24px_70px_rgba(23,28,20,0.16)] md:p-8">
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 rounded-full bg-black/8" />
          <div className="h-11 w-40 rounded-full bg-black/[0.06]" />
        </div>
        <div className="mt-8 h-3 w-16 rounded-full bg-black/8" />
        <div className="mt-4 h-10 w-40 rounded-2xl bg-black/8" />
        <div className="mt-3 h-5 w-32 rounded-full bg-black/[0.06]" />
        <div className="mt-8 h-14 rounded-[1.1rem] bg-black/[0.06]" />
        <div className="mt-4 h-14 rounded-[1.1rem] bg-black/[0.06]" />
        <div className="mt-6 h-14 rounded-full bg-[#9fe870]/45" />
      </div>
    </main>
  );
}
