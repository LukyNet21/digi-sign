// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, sqliteTableCreator } from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `digi-sign_${name}`);

export const files = createTable(
  'file',
  (d) => ({
    id: d.integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }).notNull(),
    fileName: d.text({ length: 256 }).notNull(), // original filename
    path: d.text().notNull(),
    mimeType: d.text().notNull(),
    size: d.integer().notNull(),
    createdAt: d
      .integer({ mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d
      .integer({ mode: 'timestamp' })
      .$onUpdate(() => new Date()),
  }),
  (t) => [index('file_name_idx').on(t.name)],
);

export const playlists = createTable(
  'playlist',
  (d) => ({
    id: d.integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }).notNull(),
    description: d.text({ length: 1024 }),
    createdAt: d
      .integer({ mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d
      .integer({ mode: 'timestamp' })
      .$onUpdate(() => new Date()),
  }),
  (t) => [index('playlist_name_idx').on(t.name)],
);

export const playlistItems = createTable(
  'playlist_item',
  (d) => ({
    id: d.integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    playlistId: d
      .integer({ mode: 'number' })
      .notNull()
      .references(() => playlists.id, { onDelete: 'cascade' }),
    fileId: d
      .integer({ mode: 'number' })
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    position: d.integer({ mode: 'number' }).notNull().default(0),
    imageDisplayDurationMs: d.integer({ mode: 'number' }),
    pdfPageDurationMs: d.integer({ mode: 'number' }),
    pdfDocumentLoopCount: d.integer({ mode: 'number' }),
    videoLoopCount: d.integer({ mode: 'number' }),
    createdAt: d
      .integer({ mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d
      .integer({ mode: 'timestamp' })
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index('playlist_item_playlist_idx').on(t.playlistId),
    index('playlist_item_playlist_position_idx').on(t.playlistId, t.position),
  ],
);

export const players = createTable(
  'players',
  (d) => ({
    id: d.integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }).notNull(),
    description: d.text({ length: 1024 }),
    identifier: d.text({ length: 128 }).notNull(),
    createdAt: d
      .integer({ mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d
      .integer({ mode: 'timestamp' })
      .$onUpdate(() => new Date()),
  }),
  (t) => [index('player_name_idx').on(t.name)],
);

export const playerGroups = createTable(
  'player_group',
  (d) => ({
    id: d.integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }).notNull(),
    description: d.text({ length: 1024 }),
    createdAt: d
      .integer({ mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d
      .integer({ mode: 'timestamp' })
      .$onUpdate(() => new Date()),
  }),
  (t) => [index('player_group_name_idx').on(t.name)],
);

export const playerGroupMembers = createTable(
  'player_group_member',
  (d) => ({
    id: d.integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    groupId: d
      .integer({ mode: 'number' })
      .notNull()
      .references(() => playerGroups.id, { onDelete: 'cascade' }),
    playerId: d
      .integer({ mode: 'number' })
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    createdAt: d
      .integer({ mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index('player_group_member_group_idx').on(t.groupId),
    index('player_group_member_player_idx').on(t.playerId),
  ],
);