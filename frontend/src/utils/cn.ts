/**
 * shadcn-style `cn` helper — combines clsx + tailwind-merge for safe class
 * composition that resolves Tailwind conflicts.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}