import type { ReactNode } from "react";

export function EmptyState({
  eyebrow,
  title,
  description,
  icon,
  action,
  secondary,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <section className="surface-card-strong rounded-[2rem] p-6 lg:p-7">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#9fe870] px-4 py-2 text-sm font-semibold text-[#203811]">
        {icon}
        {eyebrow}
      </div>
      <h2 className="mt-5 max-w-md text-3xl font-semibold tracking-tight text-[#16181a]">
        {title}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-7 text-[#5c645e]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
      {secondary ? <div className="mt-5">{secondary}</div> : null}
    </section>
  );
}
