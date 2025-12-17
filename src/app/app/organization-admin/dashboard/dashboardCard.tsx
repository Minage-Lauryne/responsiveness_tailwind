import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
        <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide break-words">{title}</CardTitle>
        <div className="rounded-full bg-gray-100 p-3 ml-2 flex-shrink-0">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">{value.toLocaleString()}</div>
        <p className="text-sm text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}