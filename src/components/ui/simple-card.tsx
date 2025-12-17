import { cn } from "../utils";

interface SimpleCardProps {
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
}

export const SimpleCard = ({
  title,
  description,
  className,
}: SimpleCardProps) => {
  return (
    <div>
      <div className="relative border-[0.5px] border-zinc-400 shadow-[4px_4px_0px_0px_rgba(0,0,0)] dark:border-white/70 dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.7)]">
        <div className={cn("p-6 text-left", className)}>
          <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <div className="text-gray-700 dark:text-gray-300">{description}</div>
        </div>
      </div>
    </div>
  );
};
