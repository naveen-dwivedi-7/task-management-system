import { useRoute, Link } from "wouter";
import { Home, CheckSquare, Users, User } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

export function MobileNav() {
  const isMobile = useMobile();
  
  // Don't render on desktop
  if (!isMobile) {
    return null;
  }
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex items-center justify-around">
        <NavItem href="/" icon={<Home className="h-6 w-6" />} label="Dashboard" />
        <NavItem href="/my-tasks" icon={<CheckSquare className="h-6 w-6" />} label="Tasks" />
        <NavItem href="/team" icon={<Users className="h-6 w-6" />} label="Team" />
        <NavItem href="/profile" icon={<User className="h-6 w-6" />} label="Profile" />
      </div>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const [isActive] = useRoute(href);
  
  return (
    <Link href={href}>
      <a className={`flex flex-col items-center p-3 ${
        isActive ? "text-primary" : "text-gray-600"
      }`}>
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </a>
    </Link>
  );
}

export function MobileHeader({ title }: { title: string }) {
  const isMobile = useMobile();
  
  // Don't render on desktop
  if (!isMobile) {
    return null;
  }
  
  return (
    <header className="bg-white shadow md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <span className="text-xl font-semibold text-primary-dark">TaskFlow</span>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationsBell />
        </div>
      </div>
    </header>
  );
}

function NotificationsBell() {
  const { data: notifications } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread/count'],
    enabled: true,
  });
  
  const unreadCount = notifications?.count || 0;
  
  return (
    <button className="relative p-2 text-gray-600 rounded-full hover:bg-gray-100">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full text-xs text-white flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

import { useQuery } from "@tanstack/react-query";
