import { useState } from "react";
import { Link, useRoute } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home, 
  CheckSquare, 
  Users, 
  Calendar, 
  Settings, 
  LogOut 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/components/ui/task-card";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  const { toast } = useToast();
  
  // Don't render the sidebar on mobile
  if (isMobile) {
    return null;
  }
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <span className="text-2xl font-bold text-primary-dark">TaskFlow</span>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            <NavItem href="/" label="Dashboard" icon={<Home className="h-5 w-5 mr-3" />} />
            <NavItem href="/my-tasks" label="My Tasks" icon={<CheckSquare className="h-5 w-5 mr-3" />} />
            <NavItem href="/team" label="Team" icon={<Users className="h-5 w-5 mr-3" />} />
            <NavItem href="/calendar" label="Calendar" icon={<Calendar className="h-5 w-5 mr-3" />} />
            <NavItem href="/settings" label="Settings" icon={<Settings className="h-5 w-5 mr-3" />} />
          </nav>
        </div>
        
        {/* User Profile Section */}
        <div className="flex items-center px-4 py-3 border-t border-gray-200">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{user && getInitials(user.username)}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.username}</p>
            <p className="text-xs text-gray-500">View profile</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto text-gray-400 hover:text-gray-600"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function NavItem({ href, label, icon }: NavItemProps) {
  const [isActive] = useRoute(href);
  
  return (
    <Link href={href}>
      <a
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          isActive 
            ? "bg-primary-light text-white" 
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        {icon}
        {label}
      </a>
    </Link>
  );
}
