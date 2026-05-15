"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };

    startTransition(async () => {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Authentication failed.");
        return;
      }

      window.location.assign("/workspace");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="surface rounded-2xl">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <p className="eyebrow">{isRegister ? "Create account" : "Sign in"}</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
          {isRegister ? "Start your workspace" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isRegister
            ? "Create a private workspace for your meeting records."
            : "Continue to your private meeting workspace."}
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {isRegister ? (
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-black text-slate-900">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="field"
              placeholder="Ada Lovelace"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-black text-slate-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="field"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-black text-slate-900">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="field"
            minLength={8}
            required
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending
            ? "Please wait..."
            : isRegister
              ? "Create account"
              : "Sign in"}
        </button>

        <p className="text-center text-sm text-slate-500">
          {isRegister ? "Already have an account?" : "Need an account?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-bold text-blue-700 hover:text-blue-900"
          >
            {isRegister ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </form>
  );
}
