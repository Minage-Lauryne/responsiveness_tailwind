import React from "react";
import { cn } from "../utils";
import { Checkbox } from "./checkbox";

export type ButtonOption = {
  title: string;
  description?: string;
  icon?: React.ElementType;
};

export type BooleanButtonSelectProps = {
  option: ButtonOption;
  isSelected: boolean;
  disabled?: boolean;
  id?: string;
  onToggle: () => void;
};

export type BooleanButtonSelectContainerProps = {
  trueOption: ButtonOption;
  falseOption: ButtonOption;
  selectedValue?: boolean;
  onChange: (value: boolean | undefined) => void;
  className?: string;
  disabled?: boolean;
  switchOrder?: boolean;
  id?: string;
};

const BooleanButtonSelect: React.FC<BooleanButtonSelectProps> = ({
  option,
  isSelected,
  disabled,
  onToggle,
  id,
}) => {
  return (
    <label
      className={cn(
        `mb-4 block w-full cursor-pointer rounded-lg bg-white p-4 text-left shadow-md`,
        isSelected ? "border border-primary" : "border border-white bg-white",
        disabled ? "bg-gray-50" : "hover:border hover:border-primary",
      )}
      htmlFor={`${option.title}-${id}`}
    >
      <div className="flex items-start">
        <Checkbox
          id={`${option.title}-${id}`}
          checked={isSelected}
          disabled={disabled}
          onCheckedChange={() => {
            onToggle();
          }}
          className="pointer-events-none mr-4 mt-1 h-5 w-5 text-primary"
        />
        <div className="flex-grow">
          <div className="mb-2 flex items-center">
            {option.icon && (
              <option.icon className="mr-2 h-6 w-6 text-primary" />
            )}
            <h3 className="text-lg font-semibold">{option.title}</h3>
          </div>
          <p className="text-sm text-gray-600">{option.description}</p>
        </div>
      </div>
    </label>
  );
};

export const BooleanButtonSelectContainer: React.FC<
  BooleanButtonSelectContainerProps
> = ({
  trueOption,
  disabled,
  falseOption,
  selectedValue,
  onChange,
  className,
  id,
  switchOrder = false,
}) => {
  const handleToggle = (value: boolean) => {
    if (selectedValue === value) {
      onChange(undefined);
    } else {
      onChange(value);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {switchOrder ? (
        <>
          <BooleanButtonSelect
            id={id}
            disabled={disabled}
            option={falseOption}
            isSelected={selectedValue === false}
            onToggle={() => handleToggle(false)}
          />
          <BooleanButtonSelect
            id={id}
            disabled={disabled}
            option={trueOption}
            isSelected={selectedValue === true}
            onToggle={() => handleToggle(true)}
          />
        </>
      ) : (
        <>
          <BooleanButtonSelect
            id={id}
            disabled={disabled}
            option={trueOption}
            isSelected={selectedValue === true}
            onToggle={() => handleToggle(true)}
          />
          <BooleanButtonSelect
            id={id}
            disabled={disabled}
            option={falseOption}
            isSelected={selectedValue === false}
            onToggle={() => handleToggle(false)}
          />
        </>
      )}
    </div>
  );
};
