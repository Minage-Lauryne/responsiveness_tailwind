/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Image from "next/image";
import shuffleIcon from "@/images/blocks-shuffle.svg";

export function LoadingCardSpinner({ text }: { text?: string }) {
  return (
    <div className="mt-32 flex flex-col items-center justify-center">
      {text && <div className="mb-8">{text}</div>}
      <Image className="h-16 w-16" priority src={shuffleIcon} alt="loading" />
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Image className="h-16 w-16" priority src={shuffleIcon} alt="loading" />
    </div>
  );
}
