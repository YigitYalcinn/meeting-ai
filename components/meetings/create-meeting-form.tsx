"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type FormState = {
  title: string;
  rawText: string;
};

const initialFormState: FormState = {
  title: "",
  rawText: "",
};

export function CreateMeetingForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/meetings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formState.title,
            sourceType: "manual",
            rawText: formState.rawText,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          const message =
            Array.isArray(result.errors) && result.errors.length > 0
              ? result.errors[0]
              : result.error || "Failed to create meeting.";

          setError(message);
          return;
        }

        setFormState(initialFormState);
        router.refresh();
        router.push(`/meetings/${result.id}`);
      } catch (submitError) {
        console.error("Failed to submit meeting:", submitError);
        setError("Something went wrong while creating the meeting.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-sky-700">Create meeting</p>
        <h2 className="text-2xl font-semibold text-zinc-950">
          Add a meeting note manually
        </h2>
        <p className="text-sm text-zinc-600">
          Start with manual text input. AI summary and action items come later.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-zinc-800">
          Meeting title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formState.title}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
          placeholder="Weekly product sync"
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-sky-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="rawText" className="text-sm font-medium text-zinc-800">
          Meeting notes
        </label>
        <textarea
          id="rawText"
          name="rawText"
          value={formState.rawText}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              rawText: event.target.value,
            }))
          }
          placeholder="Write the meeting content here..."
          rows={8}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-sky-500"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isPending ? "Saving..." : "Create meeting"}
      </button>
    </form>
  );
}
