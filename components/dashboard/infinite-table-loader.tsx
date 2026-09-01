"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import type { PaginatedResponse } from "@/lib/pagination";

export function useInfiniteTable<T extends { id: string }>(
  loadPage: (page: number, signal?: AbortSignal) => Promise<PaginatedResponse<T>>,
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const generationRef = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const generation = ++generationRef.current;

    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setIsInitialLoading(true);
      setError(null);
      setLoadMoreError(null);
      loadingMoreRef.current = false;

      try {
        const response = await loadPage(1, controller.signal);
        if (controller.signal.aborted || generation !== generationRef.current) return;
        setItems(response.items);
        setPage(response.page);
        setHasMore(response.hasMore);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
        if (generation === generationRef.current) {
          setError(caughtError instanceof Error ? caughtError.message : "We couldn't load this table.");
        }
      } finally {
        if (!controller.signal.aborted && generation === generationRef.current) {
          setIsInitialLoading(false);
        }
      }
    });

    return () => controller.abort();
  }, [loadPage, reloadToken]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current || isInitialLoading) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    const generation = generationRef.current;

    try {
      const response = await loadPage(page + 1);
      if (generation !== generationRef.current) return;
      setItems((current) => {
        const knownIds = new Set(current.map((item) => item.id));
        return [...current, ...response.items.filter((item) => !knownIds.has(item.id))];
      });
      setPage(response.page);
      setHasMore(response.hasMore);
    } catch (caughtError) {
      if (generation === generationRef.current) {
        setLoadMoreError(caughtError instanceof Error ? caughtError.message : "We couldn't load more rows.");
      }
    } finally {
      if (generation === generationRef.current) setIsLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [hasMore, isInitialLoading, loadPage, page]);

  return {
    items,
    setItems,
    isInitialLoading,
    error,
    hasMore,
    isLoadingMore,
    loadMoreError,
    loadMore,
    reload: () => setReloadToken((current) => current + 1),
  };
}

export function InfiniteTableLoader({
  hasMore,
  isLoading,
  error,
  onLoadMore,
}: {
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  onLoadMore: () => void;
}) {
  const { t } = useLocale();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading || error) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, isLoading, onLoadMore]);

  return (
    <div
      ref={sentinelRef}
      className="flex min-h-10 items-center justify-center px-4 text-[12px] text-muted-foreground"
      style={{ overflowAnchor: "none" }}
      aria-hidden={!hasMore && !isLoading && !error}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoaderCircle className="size-3.5 animate-spin text-brand-accent" />
          {t("pagination.loadingMore")}
        </span>
      ) : error ? (
        <span className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-status-danger">{error}</span>
          <Button type="button" variant="ghost" size="xs" onClick={onLoadMore}>
            {t("common.tryAgain")}
          </Button>
        </span>
      ) : null}
    </div>
  );
}
