import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "HH:mm");
}

export function formatConversationTime(dateString: string): string {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, "HH:mm");
  }
  
  if (isYesterday(date)) {
    return "Ontem";
  }
  
  return format(date, "dd/MM/yyyy");
}

export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return "Hoje";
  }
  
  if (isYesterday(date)) {
    return "Ontem";
  }
  
  return format(date, "dd 'de' MMMM", { locale: ptBR });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function getUserInitials(firstName: string, lastName?: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
  
  return `${firstInitial}${lastInitial}`;
}

export function getFullName(firstName: string, lastName?: string): string {
  return `${firstName} ${lastName || ""}`.trim();
}

export const getRandomColor = (id: number): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-teal-500"
  ];
  
  return colors[id % colors.length];
};

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function generateTempId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
