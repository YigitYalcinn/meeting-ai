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
        className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isPending ? "Transcribing..." : "Generate transcript"}
      </button>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
