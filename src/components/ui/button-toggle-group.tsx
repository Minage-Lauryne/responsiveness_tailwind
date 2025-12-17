import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "../utils";

export interface ButtonToggleGroupOption {
  value: string;
  label: string;
}

interface ButtonToggleGroupProps {
  options: ButtonToggleGroupOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;

  [key: string]: unknown;
}

export function ButtonToggleGroup({
  options,
  value,
  onChange,
  className,
  ...rest
}: ButtonToggleGroupProps) {
  return (
    <div
      className={cn("flex items-center justify-start space-x-4 p-8", className)}
    >
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(value) => onChange(value)}
        data-name={rest["data-name"] ?? ""}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            variant={"outline"}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

interface BooleanToggleGroupProps {
  trueLabel: string;
  falseLabel: string;
  value?: boolean;
  className?: string;
  onChange: (value: boolean) => void;
  [key: string]: unknown; // Para permitir cualquier otro atributo adicional
}

export function BooleanToggleGroup({
  trueLabel,
  falseLabel,
  value,
  onChange,
  className,
  ...rest
}: BooleanToggleGroupProps) {
  return (
    <div
      className={cn("flex items-center justify-start space-x-4 p-8", className)}
    >
      <ToggleGroup
        type="single"
        value={value === undefined ? undefined : value ? "true" : "false"}
        onValueChange={(value) => onChange(value === "true")}
        data-name={rest["data-name"] ?? ""}
      >
        <ToggleGroupItem
          value="true"
          variant={"outline"}
          className="text-black"
          aria-label={trueLabel}
          onClick={() => onChange(true)}
        >
          {trueLabel}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="false"
          variant={"outline"}
          aria-label={falseLabel}
          onClick={() => onChange(false)}
        >
          {falseLabel}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
