"use client";

import { useState } from "react";
import Link from "next/link";
import { FileCheck, GraduationCap, UserCog } from "lucide-react";

export default function HomePage() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function loadUsers() {
    if (loaded) return;
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 text-blue-400 mb-6">
          <FileCheck className="w-5 h-5" />
          <span className="font-medium">AI-Powered Evaluation</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent mb-3">
          Assignment Evaluation Platform
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Submit assignments, get automated feedback, and plagiarism risk analysis.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <button
          onClick={loadUsers}
          className="w-full py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          {loaded ? "Refresh Users" : "Load Demo Users"}
        </button>

        {users.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm text-slate-400">Select user to continue</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full py-3 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            {selectedUserId && (
              <div className="flex gap-2 pt-2">
                {users.find((u) => u.id === selectedUserId)?.role === "student" ? (
                  <Link
                    href={`/student/${selectedUserId}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
                  >
                    <GraduationCap className="w-5 h-5" />
                    Student Dashboard
                  </Link>
                ) : (
                  <Link
                    href={`/instructor/${selectedUserId}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
                  >
                    <UserCog className="w-5 h-5" />
                    Instructor Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {loaded && users.length === 0 && (
          <div className="p-4 rounded-lg bg-amber-900/30 border border-amber-700/50 text-amber-200 text-sm">
            No users found. Run the seed script: <code className="bg-slate-800 px-2 py-1 rounded">npx prisma db push && node scripts/seed.js</code>
          </div>
        )}
      </div>

      <p className="mt-12 text-slate-500 text-sm">
        Built with Next.js · Prisma · TF-IDF · Cosine Similarity
      </p>
    </div>
  );
}
