"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

export function useRemoteList<T>(
  loader: (search: string) => Promise<T[]>,
  search: string,
  debounceMs = 280,
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (term: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await loader(term);
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Falha ao carregar");
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [loader],
  );

  useEffect(() => {
    const t = setTimeout(() => void reload(search.trim()), debounceMs);
    return () => clearTimeout(t);
  }, [search, reload, debounceMs]);

  return { rows, loading, error, setError, reload: () => reload(search.trim()) };
}
