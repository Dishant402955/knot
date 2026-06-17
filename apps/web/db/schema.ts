import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const videoVisibilityEnum = pgEnum("video_visibility", [
  "PRIVATE",
  "PUBLIC",
  "AUTHENTICATED",
]);

export const videoStatusEnum = pgEnum("video_status", [
  "RECORDING",
  "PROCESSING",
  "READY",
  "FAILED",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "COMMENT",
  "VIDEO_SHARED",
  "RECORDING_READY",
  "MENTION",
]);

export const folders = pgTable("folders", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: varchar("user_id", { length: 255 }).notNull(),

  name: varchar("name", { length: 255 }).notNull(),

  parentId: uuid("parent_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: varchar("user_id", { length: 255 }).notNull(),

  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),

  visibility: videoVisibilityEnum("visibility").default("PRIVATE").notNull(),

  folderId: uuid("folder_id").references(() => folders.id, {
    onDelete: "set null",
  }),

  durationSeconds: integer("duration_seconds").default(0).notNull(),

  segmentCount: integer("segment_count").default(0).notNull(),

  thumbnailKey: text("thumbnail_key"),

  status: videoStatusEnum("status").default("RECORDING").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoSegments = pgTable(
  "video_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, {
        onDelete: "cascade",
      }),

    index: integer("index").notNull(),

    storageKey: text("storage_key").notNull(),

    durationSeconds: integer("duration_seconds").notNull(),

    size: integer("size"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueVideoSegmentIndex: unique().on(table.videoId, table.index),
  }),
);

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),

  videoId: uuid("video_id")
    .notNull()
    .references(() => videos.id, {
      onDelete: "cascade",
    }),

  userId: varchar("user_id", { length: 255 }).notNull(),

  text: text("text").notNull(),

  timestampSeconds: integer("timestamp_seconds"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: varchar("user_id", { length: 255 }).notNull(),

  type: notificationTypeEnum("type").notNull(),

  entityId: uuid("entity_id"),

  isRead: boolean("is_read").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
