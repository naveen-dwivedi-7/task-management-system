import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader, MobileNav } from "@/components/layout/mobile-nav";
import { TaskFilters } from "@/components/dashboard/task-filters";
import { TaskList } from "@/components/dashboard/task-list";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsDropdown } from "@/components/layout/notifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyTasksPage() {
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
      <MobileHeader title="My Tasks" />
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-6">
        <div className="max-w-5xl mx-auto pb-16 md:pb-0">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage and track all your tasks in one place.
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-2">
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
          
          {/* Task Filters */}
          <TaskFilters 
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onDueDateChange={handleDueDateChange}
          />
          
          {/* Tabs for Tasks */}
          <Tabs defaultValue="assigned" className="mt-6">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
              <TabsTrigger value="created">Created by Me</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assigned">
              <TaskList 
                title="Tasks Assigned to Me"
                endpoint="/api/tasks/assigned"
                noTasksMessage="You don't have any tasks assigned to you."
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                dueDateFilter={dueDateFilter}
              />
            </TabsContent>
            
            <TabsContent value="created">
              <TaskList 
                title="Tasks Created by Me"
                endpoint="/api/tasks/created"
                noTasksMessage="You haven't created any tasks yet."
                isCreator={true}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                dueDateFilter={dueDateFilter}
              />
            </TabsContent>
            
            <TabsContent value="overdue">
              <TaskList 
                title="Overdue Tasks"
                endpoint="/api/tasks/overdue"
                noTasksMessage="You don't have any overdue tasks. Great job!"
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
              />
            </TabsContent>
          </Tabs>
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
