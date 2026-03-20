export interface World {
  id: string;
  name: string;
  tagline: string;
  description: string;
  magic_enabled: boolean;
  settings: string; // JSON
  created_at: string;
  updated_at: string;
  forked_from: string | null;
}

export interface WorldElement {
  id: string;
  world_id: string;
  domain: string;
  element_type: string;
  name: string;
  summary: string;
  detailed_notes: string;
  properties: string; // JSON
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  world_id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;
  description: string;
  strength: string;
  bidirectional: boolean;
  created_at: string;
}

export interface MapRecord {
  id: string;
  world_id: string;
  name: string;
  image_path: string;
  width: number;
  height: number;
  scale_label: string;
  map_type: string;
  created_at: string;
}

export interface MapPin {
  id: string;
  map_id: string;
  element_id: string;
  x: number;
  y: number;
  label: string;
  icon: string;
  color: string;
}

export interface Era {
  id: string;
  world_id: string;
  calendar_id: string | null;
  name: string;
  start_year: number;
  end_year: number | null;
  description: string;
  color: string;
  sort_order: number;
}

export interface Tag {
  id: string;
  world_id: string;
  name: string;
  color: string;
}

export interface SearchResult {
  element_id: string;
  domain: string;
  element_type: string;
  name: string;
  snippet: string;
  rank: number;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
