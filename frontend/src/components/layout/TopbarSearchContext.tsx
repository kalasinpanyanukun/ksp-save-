import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export interface TopbarSearchConfig {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

interface TopbarSearchContextValue {
  search: TopbarSearchConfig | null;
  setSearch: Dispatch<SetStateAction<TopbarSearchConfig | null>>;
}

const TopbarSearchContext = createContext<TopbarSearchContextValue | null>(null);

export function TopbarSearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState<TopbarSearchConfig | null>(null);
  const value = useMemo(() => ({ search, setSearch }), [search]);
  return (
    <TopbarSearchContext.Provider value={value}>
      {children}
    </TopbarSearchContext.Provider>
  );
}

export function useTopbarSearch(config: TopbarSearchConfig | null) {
  const context = useContext(TopbarSearchContext);
  const setSearch = context?.setSearch;

  useEffect(() => {
    if (!setSearch) return;
    setSearch(config);
    return () => setSearch(null);
  }, [config, setSearch]);
}

export function useTopbarSearchValue() {
  return useContext(TopbarSearchContext)?.search ?? null;
}
