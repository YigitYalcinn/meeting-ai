"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type GenerateTranscriptButtonProps = {
  meetingId: string;
};

export function GenerateTranscriptButton({
  meetingId,
}: GenerateTranscriptButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/meetings/${meetingId}/transcript`, {
          method: "POST",
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Failed to generate transcript.");
          return;
        }

        router.refresh();
      } catch (requestError) {
        console.error("Failed to generate transcript:", requestError);
        setError("Something went wrong while generating the transcript.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn-dark"
      >
        {isPending ? "Transcribing..." : "Generate transcript"}
      </button>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
