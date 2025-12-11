"use client";

import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignUpPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signUpWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await signUpWithCredentials({
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      setError("This email may already be registered. Try signing in instead.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4 font-inter">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-[#EAECF0]"
      >
        <h1 className="mb-8 text-center text-2xl font-semibold text-[#101828]">
          Create Account
        </h1>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#344054]">
              Email
            </label>
            <input
              required
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2.5 border border-[#D0D5DD] rounded-lg text-base outline-none focus:border-[#357AFF] focus:ring-1 focus:ring-[#357AFF] transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#344054]">
              Password
            </label>
            <input
              required
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#D0D5DD] rounded-lg text-base outline-none focus:border-[#357AFF] focus:ring-1 focus:ring-[#357AFF] transition-colors"
              placeholder="Create a password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#357AFF] px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#2E69DE] focus:outline-none focus:ring-2 focus:ring-[#357AFF] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
          <p className="text-center text-sm text-[#667085]">
            Already have an account?{" "}
            <a
              href="/account/signin"
              className="text-[#357AFF] hover:text-[#2E69DE] font-medium"
            >
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
