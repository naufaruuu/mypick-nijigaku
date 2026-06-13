import { pgTable, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

// One row per song. `bucket` + `sort` denormalize songs-final.json.
export const songs = pgTable(
  'songs',
  {
    id: integer('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    jpName: text('jp_name'),
    image: text('image').notNull(),
    bucket: text('bucket').notNull(),
    sort: integer('sort').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('songs_bucket_idx').on(t.bucket, t.sort)],
);

export const characters = pgTable('characters', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  jpName: text('jp_name').notNull(),
  color: text('color').notNull(),
  image: text('image').notNull(),
});

// A saved, shareable set of picks. `data` is { [slotId]: songSlug }.
export const picks = pgTable('picks', {
  id: text('id').primaryKey(),
  data: jsonb('data').notNull().$type<Record<string, string>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type SongRow = typeof songs.$inferSelect;
export type CharacterRow = typeof characters.$inferSelect;
export type PickRow = typeof picks.$inferSelect;
