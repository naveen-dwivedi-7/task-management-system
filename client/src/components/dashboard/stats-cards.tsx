import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type StatsCardProps = {
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  title: string;
  value: number | string;
};

function StatsCard({ icon, iconBgColor, iconColor, title, value }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} p-3 rounded-md`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-600">{title}</h2>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const { data: stats } = useQuery<{
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  }>({
    queryKey: ["/api/tasks/stats"],
    enabled: true,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard
        icon={<ListChecks className="h-6 w-6" />}
        iconBgColor="bg-primary-light/20"
        iconColor="text-primary"
        title="Total Tasks"
        value={stats?.total ?? "—"}
      />
      <StatsCard
        icon={<CheckCircle className="h-6 w-6" />}
        iconBgColor="bg-success-light/20"
        iconColor="text-success"
        title="Completed"
        value={stats?.completed ?? "—"}
      />
      <StatsCard
        icon={<Clock className="h-6 w-6" />}
        iconBgColor="bg-warning-light/20"
        iconColor="text-warning"
        title="In Progress"
        value={stats?.inProgress ?? "—"}
      />
      <StatsCard
        icon={<AlertCircle className="h-6 w-6" />}
        iconBgColor="bg-destructive-light/20"
        iconColor="text-destructive"
        title="Overdue"
        value={stats?.overdue ?? "—"}
      />
    </div>
  );
}
