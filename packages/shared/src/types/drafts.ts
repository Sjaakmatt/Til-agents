export type Channel =
  | "email"
  | "x_post"
  | "x_thread"
  | "instagram_post"
  | "youtube_short"
  | "tiktok"
  | "instagram_reel"
  | "reddit_suggestion";

export type AgentId =
  | "signal"
  | "analyst"
  | "historian"
  | "profiler"
  | "editor"
  | "community"
  | "growth_analyst"
  | "video";

export interface NumericClaim {
  value: number;
  context: string;
  sourceToolCall: string;
}

export interface Draft {
  id: string;
  agentId: AgentId;
  sourceTriggerId: string | null;
  text: string;
  channels: Channel[];
  confidenceScore: number;
  angleTags: string[];
  numericClaims: NumericClaim[];
  sourceUrls: string[];
  createdAt: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "published" | "edited";

export type Priority = "low" | "normal" | "high";

export interface ApprovalItem {
  id: string;
  draftId: string;
  kanaal: Channel;
  status: ApprovalStatus;
  priority: Priority;
  bundleId: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  editedText: string | null;
  createdAt: string;
}
