"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";

const filterOptions = ["Experiences", "Dining", "Stays"] as const;

const trendingCards = [
  {
    slug: "omakase-masterclass",
    title: "Omakase Masterclass",
    price: "$120",
    subtitle: "Ginza District · 2 hours",
    rating: "4.9",
    category: "Dining",
    image:
      "url('https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80')",
    imageStyle: "center",
  },
  {
    slug: "neon-night-walk",
    title: "Neon Night Walk",
    price: "$45",
    subtitle: "Shinjuku · 3 hours",
    rating: "4.7",
    category: "Experiences",
    image:
      "url('https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=900&q=80')",
    imageStyle: "center",
  },
  {
    slug: "zen-tea-ceremony",
    title: "Zen Tea Ceremony",
    price: "$85",
    subtitle: "Kyoto Heights · 1.5 hours",
    rating: "5.0",
    category: "Stays",
    image:
      "url('https://images.unsplash.com/photo-1564894809611-1742fc40ed80?auto=format&fit=crop&w=900&q=80')",
    imageStyle: "center",
  },
] as const;

export function ExploreDiscovery({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [activeFilter, setActiveFilter] =
    useState<(typeof filterOptions)[number]>("Experiences");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const tripHref = isAuthenticated ? "/trips" : "/auth";
  const searchValue = deferredQuery.trim().toLowerCase();
  const visibleCards = trendingCards.filter((card) => {
    const matchesFilter = card.category === activeFilter;
    const matchesQuery = searchValue
      ? `${card.title} ${card.subtitle}`.toLowerCase().includes(searchValue)
      : true;

    return matchesFilter && matchesQuery;
  });
  const renderedCards = visibleCards.length > 0 ? visibleCards : trendingCards;

  return (
    <section className="pointer-events-none relative isolate h-full overflow-hidden px-4 py-5 md:px-6 lg:px-8 lg:py-6">
      <div className="relative z-10 flex h-full flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-1">
            <h1 className="text-[2.55rem] font-black leading-none tracking-[-0.08em] text-[#17191a] md:text-[3.1rem]">
              Explore
            </h1>
            <span className="mt-1 block size-3 rounded-full bg-[#9fe870] md:size-3.5" />
          </div>

          <div className="flex flex-1 flex-col gap-3 xl:max-w-[720px] xl:flex-row xl:items-center xl:justify-end">
            <label className="pointer-events-auto flex h-14 flex-1 items-center gap-3 rounded-full border border-white/55 bg-white/92 px-5 shadow-[0_10px_24px_rgba(35,42,31,0.08)]">
              <Search className="size-5 text-[#5d655c]" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => setSearchQuery(nextValue));
                }}
                placeholder="Where to next?"
                className="w-full bg-transparent text-[0.98rem] font-semibold text-[#293023] outline-none placeholder:text-[#9aa195]"
              />
              <span className="flex size-8 items-center justify-center rounded-full bg-[#f5f5f0] text-[#576056]">
                <SlidersHorizontal className="size-4" />
              </span>
            </label>

            <div className="pointer-events-auto flex flex-wrap gap-3">
              {filterOptions.map((filter) => {
                const isActive = filter === activeFilter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`pill-button h-12 rounded-full px-6 text-sm font-bold shadow-[0_10px_24px_rgba(35,42,31,0.08)] ${
                      isActive
                        ? "bg-white text-[#22251d]"
                        : "bg-white/78 text-[#4f584e]"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-3 xl:gap-4">
            <div className="flex items-center justify-between">
              <div className="rounded-full border border-white/55 bg-white/88 px-5 py-2.5 text-base font-black tracking-[-0.05em] text-[#24271f] shadow-[0_10px_24px_rgba(35,42,31,0.08)] md:text-[1.55rem]">
                Trending Near You
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <button
                  type="button"
                  className="pill-button pointer-events-auto flex size-12 items-center justify-center rounded-full bg-white/88 text-[#34392f] shadow-[0_10px_24px_rgba(35,42,31,0.08)]"
                >
                  <ArrowLeft className="size-5" />
                </button>
                <button
                  type="button"
                  className="pill-button pointer-events-auto flex size-12 items-center justify-center rounded-full bg-white/88 text-[#34392f] shadow-[0_10px_24px_rgba(35,42,31,0.08)]"
                >
                  <ArrowRight className="size-5" />
                </button>
              </div>
            </div>

            <div className="grid max-w-[1100px] gap-4 xl:grid-cols-3">
              {renderedCards.map((card) => (
                <article
                  key={card.slug}
                  className="pointer-events-auto rounded-[1.7rem] border border-white/55 bg-white/92 p-3.5 shadow-[0_14px_32px_rgba(35,42,31,0.08)]"
                >
                  <div
                    className="relative h-32 overflow-hidden rounded-[1.3rem] bg-[#d9d2bd] bg-cover bg-center"
                    style={{
                      backgroundImage: card.image,
                      backgroundPosition: card.imageStyle,
                    }}
                  >
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/94 px-3 py-1 text-sm font-bold text-[#28301f] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                      <Star className="size-3.5 fill-[#6da83a] text-[#6da83a]" />
                      {card.rating}
                    </div>
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <h2 className="max-w-[11ch] text-[1.35rem] font-black leading-[1.02] tracking-[-0.06em] text-[#20231c] md:text-[1.55rem]">
                      {card.title}
                    </h2>
                    <span className="pt-1 text-[1.5rem] font-black tracking-[-0.05em] text-[#21241c]">
                      {card.price}
                    </span>
                  </div>

                  <p className="mt-2 text-[0.92rem] font-semibold text-[#666e64]">
                    {card.subtitle}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <Link
                      href={tripHref}
                      className={`pill-button inline-flex flex-1 items-center justify-center rounded-full px-4 py-2.5 text-sm font-bold ${
                        card.slug === "omakase-masterclass"
                          ? "bg-[#9fe870] text-[#294115]"
                          : "bg-[#ecece8] text-[#23261f]"
                      }`}
                    >
                      Book
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
