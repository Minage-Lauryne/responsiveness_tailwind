import { Badge } from "@/components/ui/badge";


export const StatusPill = ({ status }: { status: string }) => {

    function getStatusClasses(status: string) {
        switch (status) {
            case "active":
                return "text-[#54B2F1] border-[#54B2F1]";
            case "inactive":
                return "text-gray-600 border-gray-600";
            case "canceled":
                return "text-[#FF661A] border-[#FF661A]";
            case "pending":
                return "text-yellow-600 border-yellow-600";
            default:
                return "text-gray-600 border-gray-600";
        }
    }

    const statusClasses = getStatusClasses(status.toLocaleLowerCase());
    return (
        <Badge variant="outline" className={statusClasses}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    )
}