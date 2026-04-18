export default function AuthLoading() {
  return (
    <main className="wandr-shell-bg flex h-screen items-center justify-center overflow-hidden p-4">
      <div className="w-full max-w-[430px] rounded-[2rem] bg-white/94 p-7 shadow-[0_24px_70px_rgba(23,28,20,0.16)] md:p-8">
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
