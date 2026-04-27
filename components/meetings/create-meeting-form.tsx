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
    description: "Import a `.txt` or `.md` file into the meeting record.",
  },
  {
    value: "audio_file",
    label: "Audio file",
    description: "Upload the recording now and transcribe it later.",
  },
];

function getSubmitLabel(sourceType: MeetingInputMode, isPending: boolean) {
  if (isPending) {
    return "Saving...";
  }

  if (sourceType === "audio_file") {
    return "Create audio meeting";
  }

  if (sourceType === "text_file") {
    return "Import text meeting";
  }

  return "Create meeting";
}

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
      className="rounded-[2rem] border border-slate-200/90 bg-white/96 shadow-[0_20px_60px_rgba(15,23,42,0.05)]"
    >
      <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-900">
          Create meeting
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Add a new meeting record
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose the source type, save the meeting, then continue with transcript
          and AI analysis on the detail page.
        </p>
      </div>

      <div className="space-y-8 px-6 py-6 sm:px-8">
        <section className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Source type</p>

          <div className="grid gap-3">
            {inputModes.map((mode) => {
              const isSelected = formState.sourceType === mode.value;

              return (
                <label
                  key={mode.value}
                  className={`flex cursor-pointer items-start gap-4 rounded-[1.2rem] border px-4 py-4 transition ${
                    isSelected
                      ? "border-[#162843] bg-[#0f1b2d] text-white shadow-[0_14px_32px_rgba(15,27,45,0.18)]"
                      : "border-slate-200 bg-slate-50 text-slate-950 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.7rem] ${
                      isSelected
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    {isSelected ? "•" : ""}
                  </span>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{mode.label}</p>
                    <p
                      className={`text-sm leading-6 ${
                        isSelected ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {mode.description}
                    </p>
                  </div>

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
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold text-slate-900">
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
              className="w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-300 focus:bg-white"
            />
          </div>

          {formState.sourceType === "manual" ? (
            <div className="space-y-2">
              <label
                htmlFor="rawText"
                className="text-sm font-semibold text-slate-900"
              >
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
                rows={11}
                className="w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-950 outline-none transition focus:border-blue-300 focus:bg-white"
              />
              <p className="text-xs leading-5 text-slate-500">
                Include decisions, blockers, owners, and metrics when available.
              </p>
            </div>
          ) : null}

          {formState.sourceType === "text_file" ? (
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-semibold text-slate-900">
                Upload a text file
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
                className="w-full rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-950 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#0f1b2d] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:border-blue-300 hover:bg-white"
              />
              <p className="text-xs leading-5 text-slate-500">
                Supported file types: `.txt` and `.md`.
              </p>
            </div>
          ) : null}

          {formState.sourceType === "audio_file" ? (
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-semibold text-slate-900">
                Upload an audio file
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
                className="w-full rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-950 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#0f1b2d] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:border-blue-300 hover:bg-white"
              />
              <p className="text-xs leading-5 text-slate-500">
                Supported file types: `.mp3`, `.wav`, `.m4a`.
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">What happens next</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <p>Save the meeting first.</p>
            <p>Generate a transcript if the source is audio.</p>
            <p>Run AI analysis once usable text is available.</p>
          </div>
        </section>

        {error ? (
          <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#0f1b2d] px-5 text-sm font-semibold text-white transition hover:bg-[#162843] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {getSubmitLabel(formState.sourceType, isPending)}
          </button>
          <p className="text-sm text-slate-500">
            You will land on the meeting detail page after save.
          </p>
        </div>
      </div>
    </form>
  );
}
