import { CheckIcon } from "lucide-react";

export function FilterHeader({
  title,
  selectedCount,
}: {
  title: string;
  selectedCount?: number;
}) {
  return (
    <div className="flex h-8 items-center rounded-sm border border-dashed p-2 text-sm">
      {selectedCount !== undefined && selectedCount > 0 ? (
        <CheckIcon className="mr-2 h-4 w-4 bg-secondary" />
      ) : (
        <div className="mr-2 h-4 w-4" />
      )}
      {title}
    </div>
  );
}
