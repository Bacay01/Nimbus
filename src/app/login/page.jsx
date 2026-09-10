"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleCredentialsSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target);
    setEmail(formData.get("email"));
    setPassword(formData.get("password"));
    setStage("pin");
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const res = await signIn("credentials", {
      email,
      password,
      pin: formData.get("pin"),
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email, password, or PIN");
      setStage("credentials");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-page">
      <div className="w-full max-w-sm bg-surface p-8 rounded-lg shadow border border-border">
        <h1 className="text-2xl font-bold mb-6 text-navy">Log in to Nimbus</h1>
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        {stage === "credentials" && (
          <form onSubmit={handleCredentialsSubmit}>
            <label className="block mb-2 text-sm font-medium text-text">Email</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={email}
              className="w-full mb-4 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <label className="block mb-2 text-sm font-medium text-text">Password</label>
            <div className="mb-2">
              <PasswordInput name="password" required />
            </div>
            <p className="mb-6 text-right text-sm">
              <a href="/forgot-password" className="text-primary hover:text-primary-dark underline">
                Forgot password?
              </a>
            </p>

            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {stage === "pin" && (
          <form onSubmit={handlePinSubmit}>
            <p className="mb-4 text-sm text-text-secondary">Enter your 4-digit login PIN</p>
            <div className="mb-6">
              <PasswordInput name="pin" required minLength={4} placeholder="e.g. 1234" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
            <button
              type="button"
              onClick={() => setStage("credentials")}
              className="w-full mt-2 text-sm text-text-secondary hover:text-text underline"
            >
              Back
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-center text-text">
          No account?{" "}
          <a href="/signup" className="text-primary hover:text-primary-dark underline">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}