import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  inferences: defineTable({
    storageId: v.id("_storage"),
    mode: v.union(v.literal("both"), v.literal("ppe_only"), v.literal("crack_only")),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
    ),
    resultImageId: v.optional(v.id("_storage")),
    results: v.optional(
      v.object({
        structural_status: v.optional(v.string()),
        worker_safety: v.optional(
          v.object({
            hardhat: v.number(),
            vest: v.number(),
            person: v.number(),
          }),
        ),
      }),
    ),
    needsRetraining: v.boolean(),
    feedbackStatus: v.optional(v.union(v.literal("positive"), v.literal("negative"))),
    datasetCategory: v.optional(
      v.union(v.literal("ppe"), v.literal("crack"), v.literal("both")),
    ),
  }),
});
