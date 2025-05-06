import { pgTable, text, serial, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === USER SCHEMA ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// === TASK SCHEMA ===
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in-progress', 'review', 'done']);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  priority: taskPriorityEnum("priority").notNull(),
  status: taskStatusEnum("status").notNull().default('todo'),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  assignedToId: integer("assigned_to_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: "created_tasks",
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: "assigned_tasks",
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  createdTasks: many(tasks, { relationName: "created_tasks" }),
  assignedTasks: many(tasks, { relationName: "assigned_tasks" }),
  notifications: many(notifications, { relationName: "user_notifications" }),
}));

export const insertTaskSchema = createInsertSchema(tasks, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(5, "Description must be at least 5 characters"),
  dueDate: (schema) => z.coerce.date(),
}).omit({ createdAt: true, updatedAt: true });

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// === NOTIFICATION SCHEMA ===
export const notificationTypeEnum = pgEnum('notification_type', ['task_assigned', 'task_updated', 'task_overdue']);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  taskId: integer("task_id").references(() => tasks.id),
  type: notificationTypeEnum("type").notNull(),
  message: text("message").notNull(),
  details: text("details"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: "user_notifications",
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Additional validation schemas
export const updateTaskSchema = createInsertSchema(tasks, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(5, "Description must be at least 5 characters"),
  dueDate: (schema) => z.coerce.date(),
}).partial().omit({ id: true, createdById: true, createdAt: true, updatedAt: true });

export type UpdateTask = z.infer<typeof updateTaskSchema>;
