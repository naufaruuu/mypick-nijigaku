export interface Song {
  id: number;
  slug: string;
  name: string;
  jpName: string | null;
  image: string;
  bucket: string;
  sort: number;
}

export interface Character {
  id: number;
  slug: string;
  name: string;
  fullName: string;
  jpName: string;
  color: string;
  image: string;
}

export interface SongsResponse {
  songs: Record<string, Song[]>;
  characters: Character[];
}

// a saved pick set: slotId -> song slug
export type PicksData = Record<string, string>;
