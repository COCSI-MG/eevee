import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFileStashKey(
  assignmentId: number,
  fileId: string,
  userId?: number
): string {
  return `assignment-${assignmentId}-file-${fileId}${userId ? `-${userId}` : ""}`;
}