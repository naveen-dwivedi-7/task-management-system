import { db } from "@db";
import { eq, and, desc, gt, lte, ilike, or, sql, asc, lt } from "drizzle-orm";
import {
  users,
  tasks,
  notifications,
  InsertUser,
  User,
  InsertTask,
  Task,
  UpdateTask,
  InsertNotification,
  Notification
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@db";
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } from "date-fns";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser: (id: number) => Promise<User>;
  getUserByUsername: (username: string) => Promise<User | undefined>;
  createUser: (user: InsertUser) => Promise<User>;
  getAllUsers: () => Promise<User[]>;

  // Task methods
  createTask: (task: InsertTask) => Promise<Task>;
  getTask: (id: number) => Promise<Task | undefined>;
  updateTask: (id: number, task: UpdateTask) => Promise<Task | undefined>;
  deleteTask: (id: number) => Promise<boolean>;
  getTasksByAssignee: (userId: number, filters: TaskFilters) => Promise<{ tasks: Task[], users: Record<number, User> }>;
  getTasksByCreator: (userId: number, filters: TaskFilters) => Promise<{ tasks: Task[], users: Record<number, User> }>;
  getOverdueTasks: (userId: number, filters: TaskFilters) => Promise<{ tasks: Task[], users: Record<number, User> }>;
  updateTaskStatus: (id: number, status: string) => Promise<Task | undefined>;
  updateTaskAssignee: (id: number, assigneeId: number, currentUserId: number) => Promise<Task | undefined>;
  getTaskStats: (userId: number) => Promise<TaskStats>;

  // Notification methods
  createNotification: (notification: InsertNotification) => Promise<Notification>;
  getNotifications: (userId: number) => Promise<{ notifications: Notification[], unreadCount: number }>;
  markNotificationAsRead: (id: number, userId: number) => Promise<boolean>;
  markAllNotificationsAsRead: (userId: number) => Promise<boolean>;
  getUnreadNotificationCount: (userId: number) => Promise<number>;

  // Team methods
  getTeamStats: () => Promise<TeamMemberStats[]>;

  // Session store
  sessionStore: session.SessionStore;
}

export type TaskFilters = {
  search?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
};

export type TaskStats = {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
};

export type TeamMemberStats = {
  userId: number;
  username: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
};

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'user_sessions'
    });
  }

  // === USER METHODS ===
  async getUser(id: number): Promise<User> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.username));
  }

  // === TASK METHODS ===
  async createTask(task: InsertTask): Promise<Task> {
    const newTask = await db.insert(tasks).values(task).returning();
    
    // Create notification for the assignee
    if (task.assignedToId !== task.createdById) {
      const creator = await this.getUser(task.createdById);
      await this.createNotification({
        userId: task.assignedToId,
        senderId: task.createdById,
        taskId: newTask[0].id,
        type: 'task_assigned',
        message: `${creator.username} assigned you a new task`,
        details: task.title,
        isRead: false
      });
    }
    
    return newTask[0];
  }

  async getTask(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  }

  async updateTask(id: number, taskUpdate: UpdateTask): Promise<Task | undefined> {
    const oldTask = await this.getTask(id);
    if (!oldTask) return undefined;
    
    const result = await db
      .update(tasks)
      .set({ ...taskUpdate, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    
    // Create notification if the assignee has changed
    if (taskUpdate.assignedToId && taskUpdate.assignedToId !== oldTask.assignedToId) {
      const creator = await this.getUser(oldTask.createdById);
      await this.createNotification({
        userId: taskUpdate.assignedToId,
        senderId: oldTask.createdById,
        taskId: id,
        type: 'task_assigned',
        message: `${creator.username} assigned you a task`,
        details: oldTask.title,
        isRead: false
      });
    }
    
    // Create notification if status changed to 'done'
    if (taskUpdate.status === 'done' && oldTask.status !== 'done') {
      await this.createNotification({
        userId: oldTask.createdById,
        senderId: oldTask.assignedToId,
        taskId: id,
        type: 'task_updated',
        message: `Task marked as complete`,
        details: oldTask.title,
        isRead: false
      });
    }
    
    return result[0];
  }

  async deleteTask(id: number): Promise<boolean> {
    // First delete related notifications
    await db.delete(notifications).where(eq(notifications.taskId, id));
    
    // Then delete the task
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async _applyTaskFilters(query: any, filters: TaskFilters) {
    let filteredQuery = query;
    
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = `%${filters.search.trim()}%`;
      filteredQuery = filteredQuery.where(
        or(
          ilike(tasks.title, searchTerm),
          ilike(tasks.description, searchTerm)
        )
      );
    }
    
    if (filters.status && filters.status !== 'all_statuses') {
      // Use SQL template string to safely handle enum value
      filteredQuery = filteredQuery.where(
        sql`${tasks.status} = ${filters.status}`
      );
    }
    
    if (filters.priority && filters.priority !== 'all_priorities') {
      // Use SQL template string to safely handle enum value
      filteredQuery = filteredQuery.where(
        sql`${tasks.priority} = ${filters.priority}`
      );
    }
    
    if (filters.dueDate && filters.dueDate !== 'all_dates') {
      const now = new Date();
      
      switch (filters.dueDate) {
        case 'today':
          filteredQuery = filteredQuery.where(
            and(
              gte(tasks.dueDate, startOfDay(now)),
              lte(tasks.dueDate, endOfDay(now))
            )
          );
          break;
        case 'this_week':
          filteredQuery = filteredQuery.where(
            and(
              gte(tasks.dueDate, startOfWeek(now)),
              lte(tasks.dueDate, endOfWeek(now))
            )
          );
          break;
        case 'next_week':
          filteredQuery = filteredQuery.where(
            and(
              gte(tasks.dueDate, startOfWeek(addDays(now, 7))),
              lte(tasks.dueDate, endOfWeek(addDays(now, 7)))
            )
          );
          break;
        case 'overdue':
          filteredQuery = filteredQuery.where(lt(tasks.dueDate, now));
          break;
      }
    }
    
    return filteredQuery;
  }

  async _getUsersForTasks(tasks: Task[]): Promise<Record<number, User>> {
    if (tasks.length === 0) return {};
    
    const userIds = new Set<number>();
    tasks.forEach(task => {
      if (task.createdById) userIds.add(task.createdById);
      if (task.assignedToId) userIds.add(task.assignedToId);
    });
    
    if (userIds.size === 0) return {};
    
    // Use individual queries with OR conditions instead of IN clause
    // This avoids SQL parameter formatting issues
    const userList = await db
      .select()
      .from(users)
      .where(
        or(
          ...Array.from(userIds).map(id => eq(users.id, id))
        )
      );
    
    const userMap: Record<number, User> = {};
    userList.forEach(user => {
      userMap[user.id] = user;
    });
    
    return userMap;
  }

  async getTasksByAssignee(userId: number, filters: TaskFilters = {}): Promise<{ tasks: Task[], users: Record<number, User> }> {
    let query = db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedToId, userId))
      .orderBy(desc(tasks.updatedAt));
    
    query = await this._applyTaskFilters(query, filters);
    const taskList = await query;
    
    const usersMap = await this._getUsersForTasks(taskList);
    
    return {
      tasks: taskList,
      users: usersMap
    };
  }

  async getTasksByCreator(userId: number, filters: TaskFilters = {}): Promise<{ tasks: Task[], users: Record<number, User> }> {
    let query = db
      .select()
      .from(tasks)
      .where(eq(tasks.createdById, userId))
      .orderBy(desc(tasks.updatedAt));
    
    query = await this._applyTaskFilters(query, filters);
    const taskList = await query;
    
    const usersMap = await this._getUsersForTasks(taskList);
    
    return {
      tasks: taskList,
      users: usersMap
    };
  }

  async getOverdueTasks(userId: number, filters: TaskFilters = {}): Promise<{ tasks: Task[], users: Record<number, User> }> {
    const now = new Date();
    
    let query = db
      .select()
      .from(tasks)
      .where(
        and(
          lt(tasks.dueDate, now),
          or(
            eq(tasks.assignedToId, userId),
            eq(tasks.createdById, userId)
          ),
          sql`${tasks.status} != 'done'`
        )
      )
      .orderBy(asc(tasks.dueDate));
    
    query = await this._applyTaskFilters(query, filters);
    const taskList = await query;
    
    const usersMap = await this._getUsersForTasks(taskList);
    
    return {
      tasks: taskList,
      users: usersMap
    };
  }

  async updateTaskStatus(id: number, status: string): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    const result = await db
      .update(tasks)
      .set({ 
        status: status as any, 
        updatedAt: new Date() 
      })
      .where(eq(tasks.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    
    // Notify the creator if task is marked as done
    if (status === 'done' && task.status !== 'done' && task.createdById !== task.assignedToId) {
      const assignee = await this.getUser(task.assignedToId);
      await this.createNotification({
        userId: task.createdById,
        senderId: task.assignedToId,
        taskId: id,
        type: 'task_updated',
        message: `${assignee.username} completed a task`,
        details: task.title,
        isRead: false
      });
    }
    
    return result[0];
  }

  async updateTaskAssignee(id: number, assigneeId: number, currentUserId: number): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    const result = await db
      .update(tasks)
      .set({ 
        assignedToId: assigneeId, 
        updatedAt: new Date() 
      })
      .where(eq(tasks.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    
    // Notify the new assignee
    const user = await this.getUser(currentUserId);
    await this.createNotification({
      userId: assigneeId,
      senderId: currentUserId,
      taskId: id,
      type: 'task_assigned',
      message: `${user.username} assigned you a task`,
      details: task.title,
      isRead: false
    });
    
    return result[0];
  }

  async getTaskStats(userId: number): Promise<TaskStats> {
    const now = new Date();
    
    // Total tasks for user (assigned or created)
    const totalTasksResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        or(
          eq(tasks.assignedToId, userId),
          eq(tasks.createdById, userId)
        )
      );
    
    // Completed tasks
    const completedTasksResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          or(
            eq(tasks.assignedToId, userId),
            eq(tasks.createdById, userId)
          ),
          eq(tasks.status, 'done')
        )
      );
    
    // In progress tasks
    const inProgressTasksResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          or(
            eq(tasks.assignedToId, userId),
            eq(tasks.createdById, userId)
          ),
          eq(tasks.status, 'in-progress')
        )
      );
    
    // Overdue tasks
    const overdueTasksResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          or(
            eq(tasks.assignedToId, userId),
            eq(tasks.createdById, userId)
          ),
          lt(tasks.dueDate, now),
          sql`${tasks.status} != 'done'`
        )
      );
    
    return {
      total: totalTasksResult[0]?.count || 0,
      completed: completedTasksResult[0]?.count || 0,
      inProgress: inProgressTasksResult[0]?.count || 0,
      overdue: overdueTasksResult[0]?.count || 0
    };
  }

  // === NOTIFICATION METHODS ===
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async getNotifications(userId: number): Promise<{ notifications: Notification[], unreadCount: number }> {
    const notificationsList = await db
      .select({
        id: notifications.id,
        message: notifications.message,
        details: notifications.details,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        type: notifications.type,
        senderName: users.username
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.senderId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    
    const unreadCount = await this.getUnreadNotificationCount(userId);
    
    // Transforming the result to match frontend expectations
    const formattedNotifications = notificationsList.map(n => ({
      id: n.id,
      message: n.message,
      details: n.details || "",
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      type: n.type,
      senderName: n.senderName
    }));
    
    return {
      notifications: formattedNotifications as any,
      unreadCount
    };
  }

  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId)
        )
      )
      .returning();
    
    return result.length > 0;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .returning();
    
    return result.length > 0;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    
    return result[0]?.count || 0;
  }

  // === TEAM METHODS ===
  async getTeamStats(): Promise<TeamMemberStats[]> {
    const usersList = await this.getAllUsers();
    const now = new Date();
    
    const statsPromises = usersList.map(async (user) => {
      // Total tasks
      const totalTasksResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(eq(tasks.assignedToId, user.id));
      
      // Completed tasks
      const completedTasksResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.assignedToId, user.id),
            eq(tasks.status, 'done')
          )
        );
      
      // In progress tasks
      const inProgressTasksResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.assignedToId, user.id),
            eq(tasks.status, 'in-progress')
          )
        );
      
      // Overdue tasks
      const overdueTasksResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.assignedToId, user.id),
            lt(tasks.dueDate, now),
            sql`${tasks.status} != 'done'`
          )
        );
      
      return {
        userId: user.id,
        username: user.username,
        totalTasks: totalTasksResult[0]?.count || 0,
        completedTasks: completedTasksResult[0]?.count || 0,
        inProgressTasks: inProgressTasksResult[0]?.count || 0,
        overdueTasks: overdueTasksResult[0]?.count || 0
      };
    });
    
    return Promise.all(statsPromises);
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();

// TypeScript helper functions
function gte(column: any, value: any) {
  return sql`${column} >= ${value}`;
}
