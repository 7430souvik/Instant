import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Landing from "./Landing";
import { AuthContext } from "../context/AuthContext";

export default function SignUp() {
  const navigate = useNavigate();

  const { handleRegister } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Check passwords
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await handleRegister(
        formData.name,
        formData.email,
        formData.password
      );

      navigate("/signin");

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* ================= LEFT SIDE ================= */}
      <div className="relative hidden overflow-hidden md:block">

        <Landing />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Text */}
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-bold">
            Join Peers
          </h2>

          <p className="mt-3 max-w-md text-lg text-white/80">
            Create an account and start connecting with people
            who are building something great.
          </p>
        </div>

      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="flex min-h-screen items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Create an account
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Enter your details below to create your account.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Full name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

          </form>

          {/* Sign In */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}

            <Link
              to="/signin"
              className="font-medium text-black hover:underline"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}