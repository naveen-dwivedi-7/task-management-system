import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader, MobileNav } from "@/components/layout/mobile-nav";
import { NotificationsDropdown } from "@/components/layout/notifications";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { User } from "@shared/schema";
import { getInitials } from "@/components/ui/task-card";

type TeamMemberStats = {
  userId: number;
  username: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
};

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch team members with their task stats
  const { data: teamMembers, isLoading } = useQuery<TeamMemberStats[]>({
    queryKey: ["/api/team/stats"],
    enabled: true,
  });
  
  // Filter team members based on search query
  const filteredMembers = teamMembers?.filter(member => 
    member.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <MobileHeader title="Team" />
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-6">
        <div className="max-w-5xl mx-auto pb-16 md:pb-0">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your team and track individual performance.
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <NotificationsDropdown />
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="mb-6">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                className="pl-10 pr-3"
                type="search"
                placeholder="Search team members"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Team Stats */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>
                Overview of task completion rates and workload distribution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Total Tasks</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Overdue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.userId}>
                        <TableCell className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(member.username)}</AvatarFallback>
                          </Avatar>
                          <span>{member.username}</span>
                        </TableCell>
                        <TableCell>{member.totalTasks}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                            {member.completedTasks}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            {member.inProgressTasks}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                            {member.overdueTasks}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredMembers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          {searchQuery ? "No team members found matching your search." : "No team members available."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Team Members Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.userId}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getInitials(member.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{member.username}</h3>
                      <p className="text-sm text-gray-500">Team Member</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col p-2 bg-gray-50 rounded">
                      <span className="text-gray-500">Total Tasks</span>
                      <span className="text-lg font-semibold">{member.totalTasks}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-green-50 rounded">
                      <span className="text-gray-500">Completed</span>
                      <span className="text-lg font-semibold text-green-600">{member.completedTasks}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-blue-50 rounded">
                      <span className="text-gray-500">In Progress</span>
                      <span className="text-lg font-semibold text-blue-600">{member.inProgressTasks}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-red-50 rounded">
                      <span className="text-gray-500">Overdue</span>
                      <span className="text-lg font-semibold text-red-600">{member.overdueTasks}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
