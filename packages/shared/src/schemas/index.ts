import { z } from "zod";

export const triggerTypeSchema = z.enum([
  "cluster",
  "big_dollar",
  "timing_anomaly",
  "committee_match",
  "comeback_trade",
]);

export const suggestedAngleSchema = z.enum([
  "cross_filing",
  "track_record",
  "sector_rotation",
  "timing",
  "missed_opportunity",
]);

export const signalEventSchema = z.object({
  id: z.string(),
  triggerType: triggerTypeSchema,
  viralScore: z.number().min(0).max(1),
  relatedTrades: z.array(z.string()),
  relatedInsiders: z.array(z.string()),
  relatedTickers: z.array(z.string()),
  analysisBrief: z.string(),
  suggestedAngle: suggestedAngleSchema,
  hasBeenCoveredRecently: z.boolean(),
  createdAt: z.string(),
});

export const channelSchema = z.enum([
  "email",
  "x_post",
  "x_thread",
  "instagram_post",
  "youtube_short",
  "tiktok",
  "instagram_reel",
  "reddit_suggestion",
]);

export const agentIdSchema = z.enum([
  "signal",
  "analyst",
  "historian",
  "profiler",
  "editor",
  "community",
  "growth_analyst",
  "video",
]);

export const numericClaimSchema = z.object({
  value: z.number(),
  context: z.string(),
  sourceToolCall: z.string(),
});

export const draftSchema = z.object({
  id: z.string(),
  agentId: agentIdSchema,
  sourceTriggerId: z.string().nullable(),
  text: z.string(),
  channels: z.array(channelSchema),
  confidenceScore: z.number().min(0).max(1),
  angleTags: z.array(z.string()),
  numericClaims: z.array(numericClaimSchema),
  sourceUrls: z.array(z.string()),
  createdAt: z.string(),
});

export const approvalActionSchema = z.object({
  action: z.enum(["approve", "reject", "edit"]),
  editedText: z.string().optional(),
  approver: z.string().min(1),
});

export const killSwitchActionSchema = z.object({
  enable: z.boolean(),
  reason: z.string().min(1).max(500),
});

export type ApprovalAction = z.infer<typeof approvalActionSchema>;
export type KillSwitchAction = z.infer<typeof killSwitchActionSchema>;
