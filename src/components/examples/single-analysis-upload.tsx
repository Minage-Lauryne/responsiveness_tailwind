

"use client";

import { useState } from "react";
import { useSingleAnalysisWithFiles } from "@/hooks/use-single-analysis-with-files";
import { AnalysisType } from "@/types/single-analysis";
import { useRouter } from "next/navigation";

export function SingleAnalysisUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState("");
  const [chatType, setChatType] = useState<AnalysisType>("ANALYSIS");
  const router = useRouter();

  const { uploadAndAnalyze, loading, progress, error } = useSingleAnalysisWithFiles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0 && !query.trim()) {
      alert("Please upload files or enter a question");
      return;
    }

    try {
      const analysis = await uploadAndAnalyze(files, {
        query: query.trim() || undefined,
        chatType,
        onProgress: (prog) => {
          console.log("Upload progress:", prog);
        },
      });

      router.push(`/app/subject/${analysis.id}/analysis`);
    } catch (err) {
      console.error("Analysis error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Analysis Type
        </label>
        <select
          value={chatType}
          onChange={(e) => setChatType(e.target.value as AnalysisType)}
          className="w-full rounded border p-2"
        >
          <option value="ANALYSIS">General Analysis</option>
          <option value="FINANCIAL_ANALYSIS">Financial Analysis</option>
          <option value="BIAS">Bias Detection</option>
          <option value="COUNTERPOINT">Counterpoint Analysis</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Upload Documents (Optional)
        </label>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            if (e.target.files) {
              setFiles(Array.from(e.target.files));
            }
          }}
          className="w-full"
        />
        {files.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {files.length} file(s) selected
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Ask a Question (Optional)
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., What are the key financial risks in these documents?"
          className="w-full rounded border p-2"
          rows={3}
        />
      </div>

      {progress.length > 0 && (
        <div className="space-y-2">
          {progress.map((p) => (
            <div key={p.filename} className="flex items-center gap-2">
              <span className="text-sm flex-1">{p.filename}</span>
              <span className="text-xs text-gray-500">
                {p.status === "pending" && "Waiting..."}
                {p.status === "uploading" && `${p.progress}%`}
                {p.status === "completed" && "✓ Done"}
                {p.status === "error" && "✗ Error"}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm">
          Error: {error.message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating Analysis..." : "Create Analysis"}
      </button>
    </form>
  );
}
