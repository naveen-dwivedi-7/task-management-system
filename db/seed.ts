import { db } from "./index";
import * as schema from "@shared/schema";
import { hashPassword } from "../server/auth-utils";

async function seed() {
  try {
    console.log("Starting database seed...");
    
    // Create test users if they don't exist
    const users = [
      { username: "john", password: "password123" },
      { username: "emma", password: "password123" },
      { username: "michael", password: "password123" },
      { username: "taylor", password: "password123" },
      { username: "robert", password: "password123" }
    ];
    
    for (const user of users) {
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, user.username)
      });
      
      if (!existingUser) {
        const hashedPassword = await hashPassword(user.password);
        await db.insert(schema.users).values({
          username: user.username,
          password: hashedPassword
        });
        console.log(`Created user: ${user.username}`);
      }
    }
    
    // Get all user ids for reference
    const allUsers = await db.query.users.findMany();
    const userMap: Record<string, number> = {};
    
    allUsers.forEach(user => {
      userMap[user.username] = user.id;
    });
    
    // Create sample tasks if table is empty
    const taskCount = await db.select({ count: sql`count(*)` }).from(schema.tasks);
    
    if (taskCount[0].count === 0) {
      const sampleTasks = [
        {
          title: "Complete UI redesign for client dashboard",
          description: "Update all UI components to match new brand guidelines and improve user experience",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
          priority: "high",
          status: "in-progress",
          createdById: userMap["taylor"],
          assignedToId: userMap["john"]
        },
        {
          title: "Implement authentication API",
          description: "Create secure user registration and login endpoints with JWT authentication",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
          priority: "medium",
          status: "todo",
          createdById: userMap["michael"],
          assignedToId: userMap["john"]
        },
        {
          title: "Create documentation for API endpoints",
          description: "Document all API endpoints, parameters, and response formats using Swagger",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
          priority: "low",
          status: "review",
          createdById: userMap["john"],
          assignedToId: userMap["john"]
        },
        {
          title: "Design marketing emails for product launch",
          description: "Create responsive email templates for product announcement campaign",
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Due 2 days ago
          priority: "high",
          status: "done",
          createdById: userMap["john"],
          assignedToId: userMap["emma"]
        },
        {
          title: "Implement frontend form validations",
          description: "Add client-side validation to registration and onboarding forms",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 1 week
          priority: "medium",
          status: "in-progress",
          createdById: userMap["john"],
          assignedToId: userMap["robert"]
        },
        {
          title: "Fix critical security vulnerability",
          description: "Address security issues identified in the latest penetration testing report",
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Due 2 days ago
          priority: "high",
          status: "in-progress",
          createdById: userMap["john"],
          assignedToId: userMap["john"]
        },
        {
          title: "Prepare monthly performance report",
          description: "Compile data and create report on team performance metrics for Q2",
          dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Due 3 days ago
          priority: "high",
          status: "todo",
          createdById: userMap["michael"],
          assignedToId: userMap["john"]
        }
      ];
      
      for (const task of sampleTasks) {
        const insertedTask = await db.insert(schema.tasks).values(task).returning();
        console.log(`Created task: ${task.title}`);
        
        // Create sample notifications for tasks
        if (task.createdById !== task.assignedToId) {
          await db.insert(schema.notifications).values({
            userId: task.assignedToId,
            senderId: task.createdById,
            taskId: insertedTask[0].id,
            type: 'task_assigned',
            message: `${allUsers.find(u => u.id === task.createdById)?.username} assigned you a task`,
            details: task.title,
            isRead: Math.random() > 0.5, // Randomly mark some as read
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000) // Random date within last 5 days
          });
        }
      }
      
      // Create a couple of overdue task notifications
      const overdueTasks = sampleTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'done');
      
      for (const task of overdueTasks) {
        await db.insert(schema.notifications).values({
          userId: task.assignedToId,
          senderId: task.assignedToId, // System notification (self)
          taskId: (await db.select().from(schema.tasks).where(sql`title = ${task.title}`))[0].id,
          type: 'task_overdue',
          message: `Task overdue reminder`,
          details: `${task.title} is now overdue`,
          isRead: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        });
      }
    }
    
    console.log("Database seed completed successfully");
  } catch (error) {
    console.error("Error during database seed:", error);
  }
}

seed();

// TypeScript helper function
import { sql } from "drizzle-orm";
