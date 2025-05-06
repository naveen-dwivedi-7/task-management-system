import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { Task, insertTaskSchema, updateTaskSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

// Middleware to check authentication
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Helper to handle errors consistently
function handleError(res: Response, error: any) {
  console.error("Error:", error);
  
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.errors
    });
  }
  
  res.status(500).json({
    message: "Internal server error",
    error: error.message
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // === TASKS ROUTES ===
  
  // Create task
  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        createdById: req.user!.id
      });
      
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get tasks assigned to the current user
  app.get("/api/tasks/assigned", isAuthenticated, async (req, res) => {
    try {
      const { search, status, priority, dueDate } = req.query;
      
      const tasks = await storage.getTasksByAssignee(req.user!.id, {
        search: search as string,
        status: status as string,
        priority: priority as string,
        dueDate: dueDate as string
      });
      
      res.json(tasks);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get tasks created by the current user
  app.get("/api/tasks/created", isAuthenticated, async (req, res) => {
    try {
      const { search, status, priority, dueDate } = req.query;
      
      const tasks = await storage.getTasksByCreator(req.user!.id, {
        search: search as string,
        status: status as string,
        priority: priority as string,
        dueDate: dueDate as string
      });
      
      res.json(tasks);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get overdue tasks
  app.get("/api/tasks/overdue", isAuthenticated, async (req, res) => {
    try {
      const { search, status, priority } = req.query;
      
      const tasks = await storage.getOverdueTasks(req.user!.id, {
        search: search as string,
        status: status as string,
        priority: priority as string
      });
      
      res.json(tasks);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get task stats
  app.get("/api/tasks/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getTaskStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get a single task
  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Update a task
  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has permission to update this task
      const userId = req.user!.id;
      if (task.createdById !== userId && task.assignedToId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this task" });
      }
      
      const taskData = updateTaskSchema.parse(req.body);
      const updatedTask = await storage.updateTask(taskId, taskData);
      
      res.json(updatedTask);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Update task status
  app.patch("/api/tasks/:id/status", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has permission to update this task
      const userId = req.user!.id;
      if (task.createdById !== userId && task.assignedToId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this task" });
      }
      
      const updatedTask = await storage.updateTaskStatus(taskId, status);
      res.json(updatedTask);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Update task assignee
  app.patch("/api/tasks/:id/assignee", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const { assigneeId } = req.body;
      if (!assigneeId) {
        return res.status(400).json({ message: "Assignee ID is required" });
      }
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has permission to update this task
      const userId = req.user!.id;
      if (task.createdById !== userId) {
        return res.status(403).json({ message: "Only the task creator can reassign tasks" });
      }
      
      const updatedTask = await storage.updateTaskAssignee(taskId, assigneeId, userId);
      res.json(updatedTask);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Delete a task
  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has permission to delete this task
      if (task.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Only the task creator can delete tasks" });
      }
      
      const deleted = await storage.deleteTask(taskId);
      
      if (deleted) {
        res.json({ message: "Task deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete task" });
      }
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // === USER ROUTES ===
  
  // Get all users (for task assignment)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // === NOTIFICATION ROUTES ===
  
  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get unread notification count
  app.get("/api/notifications/unread/count", isAuthenticated, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Mark a notification as read
  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const success = await storage.markNotificationAsRead(notificationId, req.user!.id);
      
      if (success) {
        res.json({ message: "Notification marked as read" });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Mark all notifications as read
  app.post("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // === TEAM ROUTES ===
  
  // Get team stats
  app.get("/api/team/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getTeamStats();
      res.json(stats);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
