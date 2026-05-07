"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type GenerateAnalysisButtonProps = {
  meetingId: string;
};

export function GenerateAnalysisButton({
  meetingId,
}: GenerateAnalysisButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/meetings/${meetingId}/analysis`, {
          method: "POST",
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Failed to generate AI summary.");
          return;
        }

        router.refresh();
      } catch (requestError) {
        console.error("Failed to generate AI analysis:", requestError);
        setError("Something went wrong while generating the AI summary.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? "Generating..." : "Generate AI Summary"}
      </button>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
