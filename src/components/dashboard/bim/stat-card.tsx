import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{title}</p>
          <p className="text-2xl font-semibold text-zinc-950">{value}</p>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
