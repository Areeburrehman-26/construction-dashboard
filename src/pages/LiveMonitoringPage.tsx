import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { InspectionCard } from "../components/InspectionCard";
import { SafetyMetricCard } from "../components/SafetyMetricCard";
import type { DatasetCategory, InferenceMode } from "../utils/jobs";

/** Swap this URL for your Ngrok tunnel (must be `wss://`, not `https://`). */
const WS_URL =
  import.meta.env.VITE_WS_URL ?? "wss://fadedly-unarticulative-nicolas.ngrok-free.dev/ws";

export function LiveMonitoringPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"static" | "live">("static");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiMode, setAiMode] = useState<InferenceMode>("both");
  const aiModeRef = useRef<InferenceMode>(aiMode);
  aiModeRef.current = aiMode;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState<Id<"inferences"> | null>(
    null,
  );
  const [negativeChoice, setNegativeChoice] = useState<Record<string, DatasetCategory>>({});
  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const createJob = useMutation(api.jobs.createJob);
  const submitFeedback = useMutation(api.jobs.submitFeedback);

  const jobs = useQuery(api.jobs.getRecentJobs);
  const overview = useQuery(api.jobs.getSafetyOverview);

  const stopLiveStream = useCallback(() => {
    if (frameIntervalRef.current !== null) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setIsLiveConnected(false);
  }, []);

  const startLiveStream = async () => {
    if (isStreaming) return;

    try {
      setLiveError(null);
      setLiveFrame(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      mediaStreamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setIsStreaming(true);

      ws.onopen = () => {
        setIsLiveConnected(true);
        frameIntervalRef.current = window.setInterval(() => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas) return;
          if (ws.readyState !== WebSocket.OPEN) return;
          if (video.videoWidth === 0 || video.videoHeight === 0) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Image = canvas.toDataURL("image/jpeg", 0.6);
          ws.send(
            JSON.stringify({
              mode: aiModeRef.current,
              image: base64Image,
            }),
          );
        }, 100);
      };

      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          setLiveFrame(event.data);
        }
      };

      ws.onerror = () => {
        setLiveError("Live stream connection failed. Please try again.");
      };

      ws.onclose = () => {
        setIsLiveConnected(false);
      };
    } catch {
      stopLiveStream();
      setLiveError("Could not access webcam. Please allow camera permission.");
    }
  };

  useEffect(() => {
    if (activeTab !== "live") {
      stopLiveStream();
    }
  }, [activeTab, stopLiveStream]);

  useEffect(() => {
    return () => {
      stopLiveStream();
    };
  }, [stopLiveStream]);

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
      await createJob({ storageId, mode: aiMode });

      setSelectedFile(null);
      setAiMode("both");
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
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold">Construction Site AI Monitor</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use static scans for deep inspection or live camera for real-time safety watch.
        </p>
        <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("static")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              activeTab === "static"
                ? "bg-amber-500 text-slate-950"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            Static Analysis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              activeTab === "live"
                ? "bg-amber-500 text-slate-950"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            Live Camera
          </button>
        </div>
      </section>

      {activeTab === "static" ? (
        <>
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
                  value={aiMode}
                  onChange={(event) => setAiMode(event.target.value as InferenceMode)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ring-amber-200 focus:border-amber-400 focus:outline-none focus:ring-2"
                >
                  <option value="both">Full Analysis (PPE + Cracks)</option>
                  <option value="ppe_only">Worker Safety Only (PPE)</option>
                  <option value="crack_only">Infrastructure Only (Cracks)</option>
                </select>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {uploading ? "Uploading..." : "Run Safety Check"}
                </button>
              </div>
              {uploadError ? (
                <p className="text-sm font-semibold text-red-700">{uploadError}</p>
              ) : null}
            </form>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Recent Scans</h2>
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
        </>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Live Camera Monitoring</h2>
          <p className="mt-1 text-sm text-slate-600">
            Real-time PPE detection from your laptop camera.
          </p>

          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            {liveFrame ? (
              <img
                src={liveFrame}
                alt="Live AI annotated frame"
                className="h-[22rem] w-full object-contain md:h-[30rem]"
              />
            ) : (
              <div className="flex h-[22rem] w-full items-center justify-center text-slate-300 md:h-[30rem]">
                Camera Offline
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-1.5 sm:max-w-md">
              <label
                htmlFor="live-ai-mode"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                AI analysis mode
              </label>
              <select
                id="live-ai-mode"
                value={aiMode}
                onChange={(event) => setAiMode(event.target.value as InferenceMode)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm ring-amber-200 focus:border-amber-400 focus:outline-none focus:ring-2"
              >
                <option value="both">Full Analysis (PPE + Cracks)</option>
                <option value="ppe_only">Worker Safety Only (PPE)</option>
                <option value="crack_only">Infrastructure Only (Cracks)</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startLiveStream}
              disabled={isStreaming}
              className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Start Stream
            </button>
            <button
              type="button"
              onClick={stopLiveStream}
              disabled={!isStreaming}
              className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Stop Stream
            </button>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                isLiveConnected
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {isLiveConnected ? "Connected" : "Not Connected"}
            </span>
            </div>
          </div>

          {liveError ? <p className="mt-3 text-sm font-semibold text-red-700">{liveError}</p> : null}
        </section>
      )}
    </div>
  );
}
