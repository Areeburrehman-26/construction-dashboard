import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const enrichJob = async <
  T extends {
    storageId: any;
    resultImageId?: any;
  },
>(
  ctx: any,
  job: T,
) => {
  return {
    ...job,
    originalImageUrl: await ctx.storage.getUrl(job.storageId),
    resultImageUrl: job.resultImageId
      ? await ctx.storage.getUrl(job.resultImageId)
      : null,
  };
};

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createJob = mutation({
  args: {
    storageId: v.id("_storage"),
    mode: v.union(v.literal("both"), v.literal("ppe_only"), v.literal("crack_only")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inferences", {
      storageId: args.storageId,
      mode: args.mode,
      status: "pending",
      needsRetraining: false,
    });
  },
});

export const getRecentJobs = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query("inferences").order("desc").take(10);
    return await Promise.all(jobs.map(async (job) => await enrichJob(ctx, job)));
  },
});

export const getHistoryJobs = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("processing"), v.literal("completed")),
    ),
    mode: v.optional(
      v.union(v.literal("both"), v.literal("ppe_only"), v.literal("crack_only")),
    ),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db.query("inferences").order("desc").take(args.limit ?? 50);
    const search = args.search?.toLowerCase().trim();

    const filtered = jobs.filter((job) => {
      if (args.status && job.status !== args.status) return false;
      if (args.mode && job.mode !== args.mode) return false;
      if (!search) return true;
      return (
        job._id.toLowerCase().includes(search) ||
        (job.results?.structural_status ?? "").toLowerCase().includes(search)
      );
    });

    return await Promise.all(filtered.map(async (job) => await enrichJob(ctx, job)));
  },
});

export const getJobById = query({
  args: { jobId: v.id("inferences") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    return await enrichJob(ctx, job);
  },
});

export const getSafetyOverview = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query("inferences").order("desc").take(120);
    const completed = jobs.filter((job) => job.status === "completed");
    const crackAlerts = completed.filter((job) =>
      (job.results?.structural_status ?? "").toLowerCase().includes("crack"),
    ).length;
    const totalWorkers = completed.reduce(
      (sum, job) => sum + (job.results?.worker_safety?.person ?? 0),
      0,
    );
    const totalHardhats = completed.reduce(
      (sum, job) => sum + (job.results?.worker_safety?.hardhat ?? 0),
      0,
    );
    const totalVests = completed.reduce(
      (sum, job) => sum + (job.results?.worker_safety?.vest ?? 0),
      0,
    );
    const pendingActions = jobs.filter((job) => job.status !== "completed").length;

    return {
      totalInspections: jobs.length,
      completedInspections: completed.length,
      crackAlerts,
      pendingActions,
      totalWorkers,
      totalHardhats,
      totalVests,
      ppeComplianceRate:
        totalWorkers === 0
          ? 0
          : Math.round(
              ((Math.min(totalHardhats, totalWorkers) +
                Math.min(totalVests, totalWorkers)) /
                (2 * totalWorkers)) *
                100,
            ),
    };
  },
});

export const getAlerts = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query("inferences").order("desc").take(60);
    const alerts = jobs
      .map((job) => {
        const structuralIssue = (job.results?.structural_status ?? "")
          .toLowerCase()
          .includes("crack");
        const workers = job.results?.worker_safety?.person ?? 0;
        const hardhats = job.results?.worker_safety?.hardhat ?? 0;
        const vests = job.results?.worker_safety?.vest ?? 0;
        const ppeIssue = workers > 0 && (hardhats < workers || vests < workers);
        if (!structuralIssue && !ppeIssue) return null;
        return {
          jobId: job._id,
          createdAt: job._creationTime,
          issue: structuralIssue && ppeIssue ? "Crack + PPE risk" : structuralIssue ? "Crack risk" : "PPE risk",
          severity: structuralIssue ? "high" : "medium",
          action:
            structuralIssue
              ? "Request civil engineer re-check immediately"
              : "Conduct toolbox talk and PPE correction",
          mode: job.mode,
        };
      })
      .filter((item) => item !== null)
      .slice(0, 25);
    return alerts;
  },
});

export const submitFeedback = mutation({
  args: {
    jobId: v.id("inferences"),
    feedbackStatus: v.union(v.literal("positive"), v.literal("negative")),
    datasetCategory: v.union(
      v.literal("ppe"),
      v.literal("crack"),
      v.literal("both"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      needsRetraining: true,
      feedbackStatus: args.feedbackStatus,
      datasetCategory: args.datasetCategory,
    });
  },
});

export const claimPendingJob = mutation({
  args: {},
  handler: async (ctx) => {
    const pendingJob = await ctx.db
      .query("inferences")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("asc")
      .first();

    if (!pendingJob) {
      return null;
    }

    await ctx.db.patch(pendingJob._id, {
      status: "processing",
    });

    return {
      ...pendingJob,
      status: "processing" as const,
      originalImageUrl: await ctx.storage.getUrl(pendingJob.storageId),
    };
  },
});

export const completeJob = mutation({
  args: {
    jobId: v.id("inferences"),
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
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "completed",
      resultImageId: args.resultImageId,
      results: args.results,
    });
  },
});
