"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        pin: formData.get("pin"),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-page">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface p-8 rounded-lg shadow border border-border">
        <h1 className="text-2xl font-bold mb-6 text-navy">Create your Nimbus account</h1>
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <label className="block mb-2 text-sm font-medium text-text">Full name</label>
        <input
          name="name"
          type="text"
          required
          className="w-full mb-4 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <label className="block mb-2 text-sm font-medium text-text">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full mb-4 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <label className="block mb-2 text-sm font-medium text-text">Password</label>
        <div className="mb-4">
          <PasswordInput name="password" required minLength={6} />
        </div>

        <label className="block mb-2 text-sm font-medium text-text">4-digit login PIN</label>
        <div className="mb-6">
          <PasswordInput name="pin" required minLength={4} placeholder="e.g. 1234" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
        <p className="mt-4 text-sm text-center text-text">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:text-primary-dark underline">
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}