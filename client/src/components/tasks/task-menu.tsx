import { useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

type TaskMenuProps = {
  position: { x: number; y: number };
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
  onAssigneeChange?: (assigneeId: number) => void;
};

export function TaskMenu({ 
  position,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onAssigneeChange
}: TaskMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Fetch team members
  const { data: teamMembers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: true,
  });
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
  
  return (
    <div
      ref={menuRef}
      className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
      }}
    >
      <div className="py-1">
        <button
          onClick={onEdit}
          className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
        >
          Edit task
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
              Change status
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={() => onStatusChange && onStatusChange("todo")}>
              To Do
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange && onStatusChange("in-progress")}>
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange && onStatusChange("review")}>
              Review
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange && onStatusChange("done")}>
              Done
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
              Reassign
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 max-h-48 overflow-y-auto">
            {teamMembers?.map((member) => (
              <DropdownMenuItem 
                key={member.id}
                onClick={() => onAssigneeChange && onAssigneeChange(member.id)}
              >
                {member.username}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenuSeparator />
        
        <button
          onClick={onDelete}
          className="text-destructive block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
