"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";
import {
  EXPLORE_DISCOVERY_FILTERS,
  type ExploreDiscoveryFilter,
} from "@/lib/namibia-data";

type ExploreMapStateValue = {
  activeFilter: ExploreDiscoveryFilter;
  searchQuery: string;
  selectedPlaceSlug: string | null;
  setActiveFilter: (filter: ExploreDiscoveryFilter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedPlaceSlug: (slug: string | null) => void;
};

const ExploreMapStateContext = createContext<ExploreMapStateValue | null>(null);

export { EXPLORE_DISCOVERY_FILTERS };

export function ExploreMapStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeFilter, setActiveFilter] =
    useState<ExploreDiscoveryFilter>("Experiences");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaceSlug, setSelectedPlaceSlug] = useState<string | null>(null);

  return (
    <ExploreMapStateContext.Provider
      value={{
        activeFilter,
        searchQuery,
        selectedPlaceSlug,
        setActiveFilter,
        setSearchQuery,
        setSelectedPlaceSlug,
      }}
    >
      {children}
    </ExploreMapStateContext.Provider>
  );
}

export function useExploreMapState() {
  const value = useContext(ExploreMapStateContext);

  if (!value) {
    throw new Error("useExploreMapState must be used within ExploreMapStateProvider.");
  }

  return value;
}
