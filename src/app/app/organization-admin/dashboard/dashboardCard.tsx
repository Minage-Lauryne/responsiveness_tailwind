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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mid-screen:pb-3 pt-4 mid-screen:pt-6 px-4 mid-screen:px-6">
        <CardTitle className="text-xs mid-screen:text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</CardTitle>
        <div className="rounded-full bg-gray-100 p-2 mid-screen:p-3">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-4 mid-screen:px-6 pb-4 mid-screen:pb-6">
        <div className="text-3xl mid-screen:text-4xl font-bold text-gray-900 mb-1 mid-screen:mb-2">{value.toLocaleString()}</div>
        <p className="text-xs mid-screen:text-sm text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}