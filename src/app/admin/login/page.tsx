"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@leaforganic.com");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await fetch("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }), headers: { "Content-Type": "application/json" } });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setErr(data.error || "Login failed");
    else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--brand-cream)] p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-[var(--brand-muted)]">
        <div className="text-center mb-6">
          <img src="/logo.jpg" alt="Leaf" className="h-14 w-14 rounded-full mx-auto object-cover" />
          <h1 className="font-display text-2xl mt-3">Admin Login</h1>
          <p className="text-sm text-zinc-500">Leaf Organic CMS</p>
        </div>
        {err && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl mb-4">{err}</div>}
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@leaforganic.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-xs text-center text-zinc-400">Demo: admin@leaforganic.com / admin123</p>
        </div>
      </form>
    </div>
  );
}
