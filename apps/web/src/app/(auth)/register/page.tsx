"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useSocketStore } from "@/stores/socket";
import axios from "axios";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const connect = useSocketStore((s) => s.connect);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    try {
      const res = await axios.post("/api/auth/register", data);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      connect();
      router.push("/feed");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err)
          ? err.response?.data?.error ?? "Registration failed"
          : "Something went wrong";
      setError(message);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center lg:hidden">
        <span className="text-4xl">☀️</span>
        <h1 className="text-2xl font-bold text-primary mt-2">SummerMate</h1>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">Join SummerMate</h2>
        <p className="mt-2 text-muted-foreground">Start discovering activities today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Username"
          placeholder="coolexplorer42"
          error={errors.username?.message}
          hint="3-30 chars, letters, numbers, underscores"
          {...register("username")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="City (optional)"
          placeholder="e.g. Berlin, Tokyo, NYC"
          error={errors.city?.message}
          {...register("city")}
        />

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Create Account
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
