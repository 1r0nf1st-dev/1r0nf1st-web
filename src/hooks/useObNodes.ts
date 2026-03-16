import { useEffect, useState, useCallback } from 'react';
import { obApi, type ObNode, type ObNodeCreate, type ObNodeUpdate } from '../lib/obApi';
import { ApiError } from '../apiClient';

interface UseObNodesParams {
  limit?: number;
  offset?: number;
  node_type?: ObNode['node_type'];
  visibility?: ObNode['visibility'];
}

interface UseObNodesState {
  nodes: ObNode[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useObNodes(params?: UseObNodesParams): UseObNodesState {
  const [nodes, setNodes] = useState<ObNode[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await obApi.nodes.list(params);
      setNodes(list ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load nodes');
      setNodes([]);
    } finally {
      setIsLoading(false);
    }
  }, [params?.limit, params?.offset, params?.node_type, params?.visibility]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { nodes, isLoading, error, refetch };
}

export async function createObNode(data: ObNodeCreate): Promise<ObNode> {
  return obApi.nodes.create(data);
}

export async function updateObNode(id: string, data: ObNodeUpdate): Promise<ObNode> {
  return obApi.nodes.update(id, data);
}

export async function deleteObNode(id: string): Promise<void> {
  return obApi.nodes.delete(id);
}
