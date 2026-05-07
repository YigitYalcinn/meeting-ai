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
  icon: string;
}[] = [
  {
    value: "manual",
    label: "Manual notes",
    description: "Paste or write meeting notes directly.",
    icon: "T",
  },
  {
    value: "text_file",
    label: "Text file",
    description: "Import a .txt or .md file into the record.",
    icon: "F",
  },
  {
    value: "audio_file",
    label: "Audio file",
    description: "Upload audio now and transcribe it later.",
    icon: "A",
  },
];

function getSubmitLabel(sourceType: MeetingInputMode, isPending: boolean) {
  if (isPending) {
    return "Saving...";
  }

  if (sourceType === "audio_file") {
    return "Create audio record";
  }

  if (sourceType === "text_file") {
    return "Import text record";
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
    <form onSubmit={handleSubmit} className="surface rounded-2xl">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <p className="eyebrow">Create</p>
        <h2 className="mt-2 text-2xl font-black tracking-normal text-slate-950">
          New meeting record
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Select the input source, save the record, then continue with transcript
          and analysis from the detail page.
        </p>
      </div>

      <div className="space-y-6 px-5 py-5 sm:px-6">
        <section className="space-y-3">
          <p className="text-sm font-black text-slate-900">Input source</p>

          <div className="grid gap-2">
            {inputModes.map((mode) => {
              const isSelected = formState.sourceType === mode.value;

              return (
                <label
                  key={mode.value}
                  className={`grid cursor-pointer grid-cols-[2.5rem_1fr_auto] items-start gap-3 rounded-xl border px-3 py-3 transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-slate-950 shadow-[0_12px_28px_rgba(29,78,216,0.12)]"
                      : "border-slate-200 bg-white text-slate-950 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-black ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {mode.icon}
                  </span>

                  <span>
                    <span className="block text-sm font-black">{mode.label}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-600">
                      {mode.description}
                    </span>
                  </span>

                  <span
                    className={`mt-1 h-4 w-4 rounded-full border ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 shadow-[inset_0_0_0_3px_white]"
                        : "border-slate-300 bg-white"
                    }`}
                  />

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

        <section className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-black text-slate-900">
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
              className="field"
            />
          </div>

          {formState.sourceType === "manual" ? (
            <div className="space-y-2">
              <label
                htmlFor="rawText"
                className="text-sm font-black text-slate-900"
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
                placeholder="Paste meeting content, decisions, blockers, owners, and metrics..."
                rows={10}
                className="field resize-y leading-6"
              />
            </div>
          ) : null}

          {formState.sourceType === "text_file" ? (
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-black text-slate-900">
                Upload text file
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
                className="field file-field border-dashed"
              />
              <p className="text-xs leading-5 text-slate-500">
                Supported file types: .txt and .md.
              </p>
            </div>
          ) : null}

          {formState.sourceType === "audio_file" ? (
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-black text-slate-900">
                Upload audio file
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
                className="field file-field border-dashed"
              />
              <p className="text-xs leading-5 text-slate-500">
                Supported file types: .mp3, .wav, and .m4a.
              </p>
            </div>
          ) : null}
        </section>

        <section className="surface-muted rounded-xl p-4">
          <p className="text-sm font-black text-slate-900">Next steps</p>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
            <p>1. Save the meeting record.</p>
            <p>2. Generate a transcript for audio uploads.</p>
            <p>3. Run AI analysis when usable text is available.</p>
          </div>
        </section>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={isPending} className="btn-primary">
            {getSubmitLabel(formState.sourceType, isPending)}
          </button>
          <p className="text-sm text-slate-500">
            Saves and opens the meeting detail page.
          </p>
        </div>
      </div>
    </form>
  );
}
