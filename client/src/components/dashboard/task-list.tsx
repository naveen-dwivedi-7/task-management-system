import { useQuery, useMutation } from "@tanstack/react-query";
import { TaskCard } from "@/components/ui/task-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Task, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type TaskListProps = {
  title: string;
  endpoint: string;
  noTasksMessage?: string;
  isCreator?: boolean;
  searchQuery?: string;
  statusFilter?: string;
  priorityFilter?: string;
  dueDateFilter?: string;
};

export function TaskList({
  title,
  endpoint,
  noTasksMessage = "No tasks found",
  isCreator = false,
  searchQuery = "",
  statusFilter = "all_statuses",
  priorityFilter = "all_priorities",
  dueDateFilter = "all_dates"
}: TaskListProps) {
  const { toast } = useToast();
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  // Build the query URL with filters
  const queryUrl = `${endpoint}?search=${encodeURIComponent(searchQuery)}` +
    `&status=${statusFilter}` +
    `&priority=${priorityFilter}` +
    `&dueDate=${dueDateFilter}`;
    
  // Fetch tasks - real-time updates will be handled by WebSocket
  const { data: tasks, isLoading } = useQuery<{
    tasks: Task[];
    users: Record<number, User>;
  }>({
    queryKey: [queryUrl],
    enabled: true,
    // No need for polling since WebSocket will trigger cache invalidation
  });
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: async () => {
      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/created"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/overdue"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] })
      ]);
      
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      await apiRequest("PATCH", `/api/tasks/${taskId}/status`, { status });
    },
    onSuccess: async () => {
      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/created"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/overdue"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] })
      ]);
      
      toast({
        title: "Status updated",
        description: "The task status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update task assignee mutation
  const updateTaskAssigneeMutation = useMutation({
    mutationFn: async ({ taskId, assigneeId }: { taskId: number; assigneeId: number }) => {
      await apiRequest("PATCH", `/api/tasks/${taskId}/assignee`, { assigneeId });
    },
    onSuccess: async () => {
      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/created"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/overdue"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] })
      ]);
      
      toast({
        title: "Task reassigned",
        description: "The task has been reassigned to another user.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error reassigning task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleEdit = (taskId: number) => {
    const task = tasks?.tasks.find(t => t.id === taskId);
    if (task) {
      setTaskToEdit(task);
    }
  };
  
  const handleDelete = (taskId: number) => {
    setTaskToDelete(taskId);
  };
  
  const confirmDelete = () => {
    if (taskToDelete !== null) {
      deleteTaskMutation.mutate(taskToDelete);
      setTaskToDelete(null);
    }
  };
  
  const handleStatusChange = (taskId: number, status: string) => {
    updateTaskStatusMutation.mutate({ taskId, status });
  };
  
  const handleAssigneeChange = (taskId: number, assigneeId: number) => {
    updateTaskAssigneeMutation.mutate({ taskId, assigneeId });
  };
  
  // Close edit form
  const closeEditForm = () => {
    setTaskToEdit(null);
  };
  
  // Render loading skeletons
  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Skeleton className="h-5 w-20 mr-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-4/5 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex items-center">
                    <Skeleton className="h-9 w-9 rounded-full mr-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!tasks?.tasks.length) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">{noTasksMessage}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {tasks?.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            createdBy={tasks.users[task.createdById]?.username}
            assignedTo={tasks.users[task.assignedToId]?.username}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onAssigneeChange={handleAssigneeChange}
            isCreator={isCreator}
          />
        ))}
      </div>
      
      {/* Edit Task Modal */}
      {taskToEdit && (
        <CreateTaskForm
          isOpen={true}
          onClose={closeEditForm}
          taskToEdit={taskToEdit}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={taskToDelete !== null} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
