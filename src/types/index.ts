export type ResourceType =
  | 'website'
  | 'github'
  | 'ai_tool'
  | 'docs'
  | 'tutorial'
  | 'api'
  | 'video'
  | 'article'
  | 'course';

export interface GitHubMetadata {
  name: string;
  owner: string;
  stars: number;
  language: string;
  forks: number;
  lastUpdate: string;
}

export interface Resource {
  id: string;
  ownerId: string;
  url: string;
  title: string;
  description: string;
  domain: string;
  faviconUrl: string;
  resourceType: ResourceType;
  collectionId: string | null;
  workspaceIds: string[];
  tags: string[];
  notes: string;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  githubData?: GitHubMetadata | null;
  clickCount: number;
  lastOpenedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  projectNotes: string;
  pinnedResourceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  theme: 'dark' | 'light';
  defaultView: 'grid' | 'table';
  createdAt: string;
}

export type ActiveTab =
  | 'home'
  | 'all'
  | 'collections'
  | 'workspaces'
  | 'favorites'
  | 'recent'
  | 'archive'
  | 'settings';
