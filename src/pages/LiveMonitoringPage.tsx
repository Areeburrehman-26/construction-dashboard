import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { InspectionCard } from "../components/InspectionCard";
import { SafetyMetricCard } from "../components/SafetyMetricCard";
import type { DatasetCategory, InferenceMode } from "../utils/jobs";

export function LiveMonitoringPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<InferenceMode>("both");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState<Id<"inferences"> | null>(
    null,
  );
  const [negativeChoice, setNegativeChoice] = useState<Record<string, DatasetCategory>>({});

  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const createJob = useMutation(api.jobs.createJob);
  const submitFeedback = useMutation(api.jobs.submitFeedback);

  const jobs = useQuery(api.jobs.getRecentJobs);
  const overview = useQuery(api.jobs.getSafetyOverview);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadError("Please choose an image first.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type || "application/octet-stream" },
        body: selectedFile,
      });
      if (!uploadResponse.ok) throw new Error("Could not upload image. Try again.");

      const { storageId } = (await uploadResponse.json()) as { storageId: Id<"_storage"> };
      await createJob({ storageId, mode });

      setSelectedFile(null);
      setMode("both");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const sendPositiveFeedback = async (jobId: Id<"inferences">) => {
    setSubmittingFeedback(jobId);
    try {
      await submitFeedback({ jobId, feedbackStatus: "positive", datasetCategory: "both" });
    } finally {
      setSubmittingFeedback(null);
    }
  };

  const sendNegativeFeedback = async (jobId: Id<"inferences">, dataset: DatasetCategory) => {
    setSubmittingFeedback(jobId);
    try {
      await submitFeedback({ jobId, feedbackStatus: "negative", datasetCategory: dataset });
    } finally {
      setSubmittingFeedback(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SafetyMetricCard
          title="Total Checks"
          value={overview?.totalInspections ?? "--"}
          note="Latest site uploads"
        />
        <SafetyMetricCard
          title="Completed"
          value={overview?.completedInspections ?? "--"}
          tone="good"
          note="Finished reviews"
        />
        <SafetyMetricCard
          title="Open Risks"
          value={overview?.pendingActions ?? "--"}
          tone="warning"
          note="Need follow-up"
        />
        <SafetyMetricCard
          title="PPE Compliance"
          value={overview ? `${overview.ppeComplianceRate}%` : "--"}
          tone={overview && overview.ppeComplianceRate < 70 ? "danger" : "good"}
          note="Hardhat + vest coverage"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold">Start New Safety Check</h2>
        <p className="mt-1 text-sm text-slate-600">
          Upload a site photo and choose what to inspect.
        </p>
        <form onSubmit={handleUpload} className="mt-4 space-y-4">
          <label
            htmlFor="site-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 px-4 py-10 text-center"
          >
            <span className="text-base font-semibold text-slate-800">
              {selectedFile ? selectedFile.name : "Tap here to upload site image"}
            </span>
            <span className="mt-1 text-sm text-slate-500">JPG, PNG, WEBP supported</span>
            <input
              id="site-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as InferenceMode)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="both">Complete Safety Scan</option>
              <option value="ppe_only">Worker PPE Check</option>
              <option value="crack_only">Structural Crack Check</option>
            </select>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {uploading ? "Uploading..." : "Run Safety Check"}
            </button>
          </div>
          {uploadError ? <p className="text-sm font-semibold text-red-700">{uploadError}</p> : null}
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Live Site Feed</h2>
        {jobs === undefined ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading latest checks...
          </div>
        ) : null}
        {jobs?.map((job) => (
          <InspectionCard
            key={job._id}
            job={job}
            feedbackBusy={submittingFeedback === job._id}
            negativeChoice={negativeChoice[job._id]}
            onChangeNegativeChoice={(jobId, dataset) =>
              setNegativeChoice((prev) => ({ ...prev, [jobId]: dataset }))
            }
            onOpenDetails={(jobId) => navigate(`/history/${jobId}`)}
            onPositiveFeedback={sendPositiveFeedback}
            onNegativeFeedback={sendNegativeFeedback}
          />
        ))}
      </section>
    </div>
  );
}
