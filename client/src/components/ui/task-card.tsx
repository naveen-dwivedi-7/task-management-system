import { MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Task } from "@shared/schema";
import { formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TaskMenu } from "@/components/tasks/task-menu";

type TaskCardProps = {
  task: Task;
  createdBy?: string;
  assignedTo?: string;
  onEdit?: (taskId: number) => void;
  onDelete?: (taskId: number) => void;
  onStatusChange?: (taskId: number, status: string) => void;
  onAssigneeChange?: (taskId: number, assigneeId: number) => void;
  isCreator?: boolean;
};

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case "todo":
      return "status-todo";
    case "in-progress":
      return "status-in-progress";
    case "review":
      return "status-review";
    case "done":
      return "status-done";
    default:
      return "status-todo";
  }
}

export function getFormattedStatus(status: string) {
  switch (status) {
    case "todo":
      return "To Do";
    case "in-progress":
      return "In Progress";
    case "review":
      return "Review";
    case "done":
      return "Done";
    default:
      return "To Do";
  }
}

export function getPriorityClass(priority: string) {
  switch (priority) {
    case "high":
      return "priority-high";
    case "medium":
      return "priority-medium";
    case "low":
      return "priority-low";
    default:
      return "priority-medium";
  }
}

export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function getDueDateText(dueDate: Date | string) {
  const date = new Date(dueDate);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    return "No due date";
  }
  
  const isOverdue = date < now && date.toDateString() !== now.toDateString();
  const isSameDay = date.toDateString() === now.toDateString();
  
  if (isOverdue) {
    return `Overdue by ${formatDistance(date, now)}`;
  } else if (isSameDay) {
    return "Due Today";
  } else {
    return `Due in ${formatDistance(now, date)}`;
  }
}

export function TaskCard({ 
  task, 
  createdBy, 
  assignedTo,
  onEdit,
  onDelete,
  onStatusChange,
  onAssigneeChange,
  isCreator = false
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ 
      x: rect.left, 
      y: rect.bottom + window.scrollY 
    });
    
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  const dueDateText = getDueDateText(task.dueDate);
  const isOverdue = dueDateText.startsWith("Overdue");
  
  return (
    <Card className={cn(
      "task-card hover:shadow transition-shadow",
      getPriorityClass(task.priority)
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className={cn("status-badge mr-2", getStatusBadgeClass(task.status))}>
                {getFormattedStatus(task.status)}
              </span>
              <span className={cn(
                "text-xs", 
                isOverdue ? "text-destructive font-medium" : "text-gray-500"
              )}>
                {dueDateText}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{task.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
            <div className="flex items-center">
              <Avatar className="w-9 h-9 mr-2">
                <AvatarFallback>
                  {isCreator 
                    ? assignedTo && getInitials(assignedTo)
                    : createdBy && getInitials(createdBy)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-500">
                {isCreator 
                  ? `Assigned to: ${assignedTo || 'Unassigned'}`
                  : `Assigned by: ${createdBy || 'Unknown'}`}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button 
              onClick={handleMenuClick}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {menuOpen && (
        <TaskMenu
          position={menuPosition}
          onClose={closeMenu}
          onEdit={() => {
            onEdit && onEdit(task.id);
            closeMenu();
          }}
          onDelete={() => {
            onDelete && onDelete(task.id);
            closeMenu();
          }}
          onStatusChange={(status) => {
            onStatusChange && onStatusChange(task.id, status);
            closeMenu();
          }}
          onAssigneeChange={(assigneeId) => {
            onAssigneeChange && onAssigneeChange(task.id, assigneeId);
            closeMenu();
          }}
        />
      )}
    </Card>
  );
}
