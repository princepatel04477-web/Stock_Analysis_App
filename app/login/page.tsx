"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again or contact support if the problem persists."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0E1117] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/25 p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-white/70">Sign in with your Supabase account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-white/85">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-[#111] px-3 py-2 outline-none ring-0 transition focus:border-[#39FF14]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-white/85">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-white/15 bg-[#111] px-3 py-2 outline-none ring-0 transition focus:border-[#39FF14]"
            />
          </div>

          {error ? (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#39FF14] px-4 py-2 font-semibold text-black transition hover:bg-[#32d913] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-white/70">
          Back to{" "}
          <Link href="/" className="text-[#39FF14] hover:underline">
            dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
