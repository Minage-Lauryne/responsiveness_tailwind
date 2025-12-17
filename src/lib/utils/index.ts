import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChatSDKError, ErrorCode } from "../errors";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 0): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// https://medium.com/with-orus/the-5-commandments-of-clean-error-handling-in-typescript-93a9cbdf1af5

export function ensureError(value: unknown): Error {
  if (value instanceof Error) return value;

  let stringified = "[Unable to stringify the thrown value]";
  try {
    stringified = JSON.stringify(value);
  } catch {}

  const error = new Error(
    `This value was thrown as is, not through an Error: ${stringified}`,
  );
  return error;
}

export function displayNumber(num?: number): string {
  if (num === undefined) return "";
  num = Number(num);
  if (isNaN(num)) return "";
  return ("" + Math.round(num * 100) / 100).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );
}

export function formatDecimal(num: number, decimals = 2): number {
  return Number(num.toFixed(decimals));
}

export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isNonNullish<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

export function getFallbackAvatar(u?: string | null) {
  const userName = u ?? "";

  // Get the first initial of the first word, and last initial of the last word:
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("");

  if (initials.length > 1 && initials.length <= 3) {
    return initials;
  }

  return userName.slice(0, 2);
}

export const arrayToStringList = (arr: string[], connector = "and") => {
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr.join(` ${connector} `);
  return `${arr.slice(0, -1).join(", ")}, ${connector} ${arr[arr.length - 1]}`;
};

export function promiseWithTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Timeout after ${ms} ms`));
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const formatEmail = (email: string) => {
  return email.toLowerCase().trim();
};
interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data.",
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function sanitizeText(text: string) {
  return text.replace("<has_function_call>", "");
}

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new ChatSDKError("offline:chat");
    }

    throw error;
  }
}

export function truncateOrganizationName(name: string): string {
  if (!name) {
    return name;
  }

  const words = name.split(" ");

  if (words.length <= 2) {
    return name;
  }

  return words.slice(0, 2).join(" ") + "...";
}

export function formatCurrency(amount: bigint | number | null | undefined): string {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}