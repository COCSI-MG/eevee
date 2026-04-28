"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_DEBOUNCE_MS = 300;

export interface UsePaginatedSearchOptions {
  initialPage?: number;
  initialSearch?: string;
  debounceMs?: number;
}

export interface PaginatedSearchState {
  page: number;
  search: string;
  debouncedSearch: string;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
}

export function usePaginatedSearch(
  options: UsePaginatedSearchOptions = {},
): PaginatedSearchState {
  const {
    initialPage = 1,
    initialSearch = "",
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const isFirstDebounce = useRef(true);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), debounceMs);
    return () => clearTimeout(timeout);
  }, [search, debounceMs]);

  useEffect(() => {
    if (isFirstDebounce.current) {
      isFirstDebounce.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch]);

  return { page, search, debouncedSearch, setPage, setSearch };
}
