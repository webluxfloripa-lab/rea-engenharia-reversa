import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), owner: text('owner').notNull(), name: text('name').notNull(),
  version: integer('version').notNull().default(1), payload: text('payload').notNull(),
  archived: integer('archived').notNull().default(0), created: text('created').notNull(), updated: text('updated').notNull()
}, t=>[index('projects_owner').on(t.owner)]);
export const revisions = sqliteTable('revisions', {
  project: text('project').notNull().references(()=>projects.id,{onDelete:'cascade'}),
  version: integer('version').notNull(), payload: text('payload').notNull(), label: text('label').notNull(), created: text('created').notNull()
},t=>[primaryKey({columns:[t.project,t.version]})]);
export const events = sqliteTable('audit_events', {
  id: text('id').primaryKey(), owner: text('owner').notNull(), project: text('project'), action: text('action').notNull(), created:text('created').notNull()
},t=>[index('audit_owner').on(t.owner,t.created)]);
export const limits = sqliteTable('rate_limits',{owner:text('owner').primaryKey(),window:integer('window').notNull(),count:integer('count').notNull()});
