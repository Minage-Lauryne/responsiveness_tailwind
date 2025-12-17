import * as React from "react";

import { Button } from "./button";
import { XIcon } from "lucide-react";

export function EnableButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const [isOpened, setIsOpened] = React.useState(false);
  return (
    <div>
      {isOpened && children}
      <Button
        className="mt-2"
        onClick={(event) => {
          event.preventDefault();
          setIsOpened(!isOpened);
        }}
        variant="outline"
        size={isOpened ? "sm" : "lg"}
      >
        {isOpened ? <XIcon /> : label}
      </Button>
    </div>
  );
}
