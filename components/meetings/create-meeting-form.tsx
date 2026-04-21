"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type MeetingInputMode = "manual" | "text_file" | "audio_file";

type FormState = {
  title: string;
  sourceType: MeetingInputMode;
  rawText: string;
  file: File | null;
};

const initialFormState: FormState = {
  title: "",
  sourceType: "manual",
  rawText: "",
  file: null,
};

const inputModes: {
  value: MeetingInputMode;
  label: string;
  description: string;
}[] = [
  {
    value: "manual",
    label: "Manual text",
    description: "Paste or write meeting notes directly.",
  },
  {
    value: "text_file",
    label: "Text file",
    description: "Upload a .txt or .md file and save its contents as meeting text.",
  },
  {
    value: "audio_file",
    label: "Audio file",
    description: "Upload audio now and transcribe it later.",
  },
];

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
        const body = new FormData();
        body.append("title", formState.title);
        body.append("sourceType", formState.sourceType);

        if (formState.sourceType === "manual") {
          body.append("rawText", formState.rawText);
        }

        if (
          (formState.sourceType === "text_file" ||
            formState.sourceType === "audio_file") &&
          formState.file
        ) {
          body.append("file", formState.file);
        }

        const response = await fetch("/api/meetings", {
          method: "POST",
          body,
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
          Add a meeting from text or file upload
        </h2>
        <p className="text-sm text-zinc-600">
          Manual text, text file upload, and audio upload all create the same meeting record.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-zinc-800">Input mode</p>
        <div className="grid gap-3">
          {inputModes.map((mode) => {
            const isSelected = formState.sourceType === mode.value;

            return (
              <label
                key={mode.value}
                className={`block cursor-pointer rounded-2xl border p-4 transition ${
                  isSelected
                    ? "border-sky-500 bg-sky-50"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="sourceType"
                    value={mode.value}
                    checked={isSelected}
                    onChange={() =>
                      setFormState((current) => ({
                        ...current,
                        sourceType: mode.value,
                        rawText: mode.value === "manual" ? current.rawText : "",
                        file: null,
                      }))
                    }
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-950">
                      {mode.label}
                    </p>
                    <p className="text-sm leading-6 text-zinc-600">
                      {mode.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
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

      {formState.sourceType === "manual" ? (
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
          <p className="text-xs leading-5 text-zinc-500">
            Use this when you want to paste notes directly into the app.
          </p>
        </div>
      ) : null}

      {formState.sourceType === "text_file" ? (
        <div className="space-y-2">
          <label htmlFor="file" className="text-sm font-medium text-zinc-800">
            Text file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                file: event.target.files?.[0] ?? null,
              }))
            }
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
          <p className="text-xs leading-5 text-zinc-500">
            Supported for now: `.txt` and `.md`. The file contents will be saved into raw meeting text.
          </p>
        </div>
      ) : null}

      {formState.sourceType === "audio_file" ? (
        <div className="space-y-2">
          <label htmlFor="file" className="text-sm font-medium text-zinc-800">
            Audio file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-wav,audio/mp4"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                file: event.target.files?.[0] ?? null,
              }))
            }
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
          <p className="text-xs leading-5 text-zinc-500">
            Supported for now: `.mp3`, `.wav`, `.m4a`. The file will be stored locally and marked as pending transcription.
          </p>
        </div>
      ) : null}

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
