import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader, MobileNav } from "@/components/layout/mobile-nav";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TaskFilters } from "@/components/dashboard/task-filters";
import { TaskList } from "@/components/dashboard/task-list";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsDropdown } from "@/components/layout/notifications";
import { WebSocketStatus } from "@/components/websocket-status";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all_statuses");
  const [priorityFilter, setPriorityFilter] = useState("all_priorities");
  const [dueDateFilter, setDueDateFilter] = useState("all_dates");
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
  };
  
  const handlePriorityChange = (priority: string) => {
    setPriorityFilter(priority);
  };
  
  const handleDueDateChange = (dueDate: string) => {
    setDueDateFilter(dueDate);
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <MobileHeader title="Dashboard" />
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-6">
        <div className="max-w-5xl mx-auto pb-16 md:pb-0">
          {/* Dashboard Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Welcome back, {user?.username}. Here's an overview of your tasks.
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-2">
                <WebSocketStatus />
                <NotificationsDropdown />
                <Button 
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="bg-primary hover:bg-primary-dark"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  New Task
                </Button>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <StatsCards />
          
          {/* Task Filters */}
          <TaskFilters 
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onDueDateChange={handleDueDateChange}
          />
          
          {/* Task Lists */}
          <TaskList 
            title="My Tasks"
            endpoint="/api/tasks/assigned"
            noTasksMessage="You don't have any tasks assigned to you."
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            dueDateFilter={dueDateFilter}
          />
          
          <TaskList 
            title="Tasks I Created"
            endpoint="/api/tasks/created"
            noTasksMessage="You haven't created any tasks yet."
            isCreator={true}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            dueDateFilter={dueDateFilter}
          />
          
          <TaskList 
            title="Overdue Tasks"
            endpoint="/api/tasks/overdue"
            noTasksMessage="You don't have any overdue tasks. Great job!"
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
          />
        </div>
      </main>
      
      <MobileNav />
      
      {/* Create Task Modal */}
      <CreateTaskForm 
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />
    </div>
  );
}
