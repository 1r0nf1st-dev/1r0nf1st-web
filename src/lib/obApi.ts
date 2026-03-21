import { getJson } from '../apiClient';

const OB = '/api/ob';

export interface ObNode {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  node_type: 'note' | 'concept' | 'question' | 'source' | 'project';
  visibility: 'public' | 'private' | 'shared';
  embedding: number[] | null;
  ai_summary: string | null;
  ai_tags: string[];
  user_tags: string[];
  source_url: string | null;
  linked_note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ObNodeCreate {
  title: string;
  body?: string | null;
  node_type?: ObNode['node_type'];
  visibility?: ObNode['visibility'];
  source_url?: string | null;
  linked_note_id?: string | null;
  user_tags?: string[];
}

export interface ObNodeUpdate {
  title?: string;
  body?: string | null;
  node_type?: ObNode['node_type'];
  visibility?: ObNode['visibility'];
  source_url?: string | null;
  linked_note_id?: string | null;
  user_tags?: string[];
}

export interface ObProfile {
  id: string;
  username: string;
  display_name: string | null;
  brain_slug: string;
  bio: string | null;
}

export type ObEdgeType = 'supports' | 'contradicts' | 'extends' | 'inspired_by' | 'references';

export interface ObPublicEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: ObEdgeType;
  created_by: 'user' | 'ai';
}

export interface ObPublicBrain {
  profile: ObProfile;
  nodes: ObNode[];
  edges: ObPublicEdge[];
}

export interface ObSearchResult {
  id: string;
  title: string | null;
  body: string | null;
  node_type: string;
  ai_summary: string | null;
  ai_tags: string[];
  user_tags: string[];
  user_id: string;
  similarity: number;
}

export interface ObExploreResult extends ObSearchResult {
  username: string;
  brain_slug: string;
}

export type ObReactionType = 'resonates' | 'challenges' | 'expands' | 'bookmarks';

export interface ObReaction {
  id: string;
  node_id: string;
  user_id: string;
  type: ObReactionType;
  note: string | null;
  created_at: string;
}

export const obApi = {
  /** Public brain by slug (no auth required). */
  public: {
    getBySlug: (brainSlug: string, params?: { limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params?.limit != null) q.set('limit', String(params.limit));
      if (params?.offset != null) q.set('offset', String(params.offset));
      const query = q.toString();
      return getJson<ObPublicBrain>(
        `/api/ob/public/${encodeURIComponent(brainSlug)}${query ? `?${query}` : ''}`,
      );
    },
  },
  /** Current user's profile (auth required, admin only). */
  profile: {
    getMe: () => getJson<ObProfile>('/api/ob/profile/me'),
  },
  explore: {
    search: (query: string, limit?: number, nodeType?: ObNode['node_type'] | null) =>
      getJson<ObExploreResult[]>(`${OB}/explore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          limit,
          ...(nodeType != null ? { node_type: nodeType } : {}),
        }),
      }),
  },
  edges: {
    list: (params?: { fromNodeId?: string; toNodeId?: string }) => {
      const q = new URLSearchParams();
      if (params?.fromNodeId) q.set('fromNodeId', params.fromNodeId);
      if (params?.toNodeId) q.set('toNodeId', params.toNodeId);
      const query = q.toString();
      return getJson<ObPublicEdge[]>(`${OB}/edges${query ? `?${query}` : ''}`);
    },
  },
  nodes: {
    list: (params?: {
      limit?: number;
      offset?: number;
      node_type?: ObNode['node_type'];
      visibility?: ObNode['visibility'];
    }) => {
      const q = new URLSearchParams();
      if (params?.limit != null) q.set('limit', String(params.limit));
      if (params?.offset != null) q.set('offset', String(params.offset));
      if (params?.node_type) q.set('node_type', params.node_type);
      if (params?.visibility) q.set('visibility', params.visibility);
      const query = q.toString();
      return getJson<ObNode[]>(`${OB}/nodes${query ? `?${query}` : ''}`);
    },
    get: (id: string) => getJson<ObNode>(`${OB}/nodes/${id}`),
    create: (data: ObNodeCreate) =>
      getJson<ObNode>(`${OB}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: ObNodeUpdate) =>
      getJson<ObNode>(`${OB}/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    delete: (id: string) => getJson<void>(`${OB}/nodes/${id}`, { method: 'DELETE' }),
  },
  ai: {
    search: (query: string, brainOwnerId?: string, limit?: number) =>
      getJson<ObSearchResult[]>(`${OB}/ai/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, brainOwnerId, limit }),
      }),
    chat: (
      query: string,
      brainOwnerId: string,
      history?: Array<{ role: string; content: string }>,
    ) =>
      getJson<{ response: string; citedNodeIds: string[] }>(`${OB}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, brainOwnerId, history }),
      }),
  },
  /** Reactions (admin only for now). */
  reactions: {
    list: (nodeId: string) =>
      getJson<ObReaction[]>(`${OB}/reactions?nodeId=${encodeURIComponent(nodeId)}`),
    add: (nodeId: string, type: ObReactionType, note?: string | null) =>
      getJson<ObReaction>(`${OB}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, type, note: note ?? undefined }),
      }),
    remove: (nodeId: string, type: ObReactionType) =>
      getJson<void>(
        `${OB}/reactions?nodeId=${encodeURIComponent(nodeId)}&type=${encodeURIComponent(type)}`,
        {
          method: 'DELETE',
        },
      ),
  },
};
