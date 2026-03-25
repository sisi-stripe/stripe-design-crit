export type SessionStatus = "upcoming" | "live" | "closed";

export type LevelOfConcern =
  | "kudos"
  | "question"
  | "idea"
  | "consider"
  | "blocking";

export interface CritChannel {
  id: string;
  name: string;
  category: "local" | "regional" | "global";
}

export interface Session {
  id: string;
  critId: string;
  title: string;
  date: string; // ISO "YYYY-MM-DD" — always a Thursday
  durationMinutes: number;
  figmaUrl: string;
  prototypeUrl: string;
  slidesUrl: string;
}

export const CRIT_CHANNELS: CritChannel[] = [
  { id: "mm", name: "Money Management", category: "local" },
  { id: "connect", name: "Connect", category: "local" },
  { id: "link", name: "Link", category: "local" },
  { id: "ocs", name: "Optimized Checkout Suite", category: "local" },
  { id: "maas", name: "MaaS", category: "regional" },
  { id: "xr", name: "Experience Review", category: "global" },
];

export const CRIT_CATEGORIES: { key: CritChannel["category"]; label: string }[] = [
  { key: "local", label: "Local Crit" },
  { key: "regional", label: "Regional Crit" },
  { key: "global", label: "Global Crit" },
];

export interface ConversationMessage {
  role: "user" | "assistant";
  text: string;
}

export interface Feedback {
  id: string;
  sessionId: string;
  reviewerName: string;
  level: LevelOfConcern;
  text: string;
  timestamp: string;
  upvotes: number;
  screenshotUrl?: string;
  figmaNodeId?: string;
  // AI-generated fields
  source?: "human" | "ai";
  approved?: boolean; // true = implement, false = dismissed, undefined = pending
  rationale?: string;
  figmaNote?: string;
  conversationThread?: ConversationMessage[];
  isRefining?: boolean; // loading state during Claude refinement
}

export interface ActionItem {
  id: string;
  text: string;
  level: LevelOfConcern;
  done: boolean;
}

// --- Scheduling constants ---

export const CRIT_DAY = 4; // Thursday (0=Sun)
export const CRIT_START_HOUR = 15;
export const CRIT_START_MIN = 30;
export const CRIT_END_HOUR = 16;
export const CRIT_END_MIN = 30;
export const CRIT_TOTAL_MINUTES = 60;

// --- Status helpers ---

export function getSessionStatus(dateIso: string): SessionStatus {
  const now = new Date();
  const critStart = new Date(`${dateIso}T${pad(CRIT_START_HOUR)}:${pad(CRIT_START_MIN)}:00`);
  const critEnd = new Date(`${dateIso}T${pad(CRIT_END_HOUR)}:${pad(CRIT_END_MIN)}:00`);

  if (now >= critStart && now <= critEnd) return "live";
  if (now > critEnd) return "closed";
  return "upcoming";
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// --- Date helpers ---

export function formatSessionDate(dateIso: string): string {
  const d = new Date(dateIso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatSessionTime(): string {
  return `${CRIT_START_HOUR % 12 || 12}:${pad(CRIT_START_MIN)}–${CRIT_END_HOUR % 12 || 12}:${pad(CRIT_END_MIN)} PM`;
}

export function getUpcomingThursdays(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d = new Date(today);
  const dayOfWeek = d.getDay();
  const daysUntilThursday = (CRIT_DAY - dayOfWeek + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilThursday);

  // If today is Thursday and the crit hasn't ended yet, include today
  if (dayOfWeek === CRIT_DAY) {
    const now = new Date();
    const critEnd = new Date();
    critEnd.setHours(CRIT_END_HOUR, CRIT_END_MIN, 0, 0);
    if (now < critEnd) {
      d.setDate(d.getDate() - 7);
    }
  }

  for (let i = 0; i < count; i++) {
    dates.push(toIso(d));
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// --- Capacity helpers ---

export function getUsedMinutes(sessions: Session[], dateIso: string): number {
  return sessions
    .filter((s) => s.date === dateIso)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

export function getRemainingMinutes(sessions: Session[], dateIso: string): number {
  return CRIT_TOTAL_MINUTES - getUsedMinutes(sessions, dateIso);
}

// --- Level config ---

export const LEVEL_CONFIG: Record<
  LevelOfConcern,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  kudos: {
    label: "Kudos",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  question: {
    label: "Question",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  idea: {
    label: "Idea",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  consider: {
    label: "Consider",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  blocking: {
    label: "Blocking",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};
