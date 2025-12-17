import * as React from "react";

import { FaDollarSign } from "react-icons/fa6";
import { InputBlock } from "./input";

export interface NumericInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value?: number) => void;
}
const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ onChange, onValueChange, value, max, min, ...props }, ref) => {
    const [privateValue, setPrivateValue] = React.useState<string>("");

    React.useEffect(() => {
      if (value !== undefined) {
        const newValue = formatNumberWithCommas(value.toString());
        setPrivateValue(newValue);
      } else {
        setPrivateValue("");
      }
    }, [value]);

    const formatNumberWithCommas = (value: string) => {
      const numberValue = value.replace(/\D/g, ""); // Remove non-numeric characters
      const numberWithoutLeadingZeros = numberValue.replace(/^0+(?!$)/, ""); // Remove leading zeros but keep a single 0 if the whole number is zero
      return numberWithoutLeadingZeros.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Handle input change and format the value
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const { value, selectionStart, selectionEnd } = input;

      // Guard clause for null values
      if (selectionStart === null || selectionEnd === null) {
        return;
      }

      let unformattedValue = value.replace(/\D/g, ""); // Remove non-numeric characters

      // Limit the value based on max and min
      if (max !== undefined && Number(unformattedValue) > Number(max)) {
        unformattedValue = max.toString();
      }
      if (min !== undefined && Number(unformattedValue) < Number(min)) {
        unformattedValue = min.toString();
      }

      const formattedValue = formatNumberWithCommas(unformattedValue);

      // Calculate the cursor position
      const cursorPosition =
        selectionStart + (formattedValue.length - value.length);

      // Create a synthetic event to pass the formatted value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: unformattedValue.length > 0 ? unformattedValue : undefined,
        },
      };

      setPrivateValue(formattedValue);
      if (onChange) {
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      }

      if (onValueChange) {
        onValueChange(
          unformattedValue.length > 0 ? Number(unformattedValue) : undefined,
        );
      }

      // Set the cursor position
      requestAnimationFrame(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
      });
    };

    // const Icon =
    //   StartIcon &&
    //   (typeof StartIcon === "string" ? (
    //     <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none text-muted-foreground">
    //       {StartIcon}
    //     </span>
    //   ) : (
    //     <div className="absolute left-1.5 top-1/2 -translate-y-1/2 transform ">
    //       <StartIcon size={18} className="text-muted-foreground" />
    //     </div>
    //   ));

    return (
      <div className="relative w-full">
        {/* {Icon} */}
        <InputBlock
          leftIcon={<FaDollarSign />}
          type="text"
          // className={cn(
          //   "my-2 flex h-10 w-full max-w-[400px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          //   startIcon ? "pl-8" : "",
          //   className,
          // )}
          ref={ref}
          onChange={handleChange}
          onWheel={(e: React.WheelEvent<HTMLInputElement>) => {
            e?.currentTarget?.blur();
          }}
          {...props}
          value={privateValue}
        />
      </div>
    );
  },
);
NumericInput.displayName = "NumericInput";

export { NumericInput };
