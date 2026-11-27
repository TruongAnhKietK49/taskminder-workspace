import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchService } from "@/features/search/services/search.service";

export function useGlobalSearch(workspaceId: string | undefined, rawQuery: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery.trim());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(rawQuery.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [rawQuery]);

  const query = useQuery({
    queryKey: ["global-search", workspaceId, debouncedQuery],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }
      return searchService.searchWorkspace(workspaceId, debouncedQuery);
    },
    enabled: Boolean(workspaceId) && debouncedQuery.length >= 2,
  });

  return {
    ...query,
    debouncedQuery,
  };
}
