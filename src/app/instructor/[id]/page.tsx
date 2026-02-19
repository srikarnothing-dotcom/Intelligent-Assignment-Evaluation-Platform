"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, FileText, Users, ChevronDown, ChevronUp } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  maxScore: number;
  createdAt: string;
  _count?: { submissions: number };
}

interface Submission {
  id: string;
  content: string;
  status: string;
  submittedAt: string;
  assignment: { title: string; id: string };
  student: { name: string; email: string };
  feedback?: { score: number; plagiarismRisk: number; feedbackSummary: string } | null;
}

export default function InstructorDashboard({ params }: { params: { id: string } }) {
  const instructorId = params.id;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    fetch(`/api/assignments?instructorId=${instructorId}`)
      .then((r) => r.json())
      .then(setAssignments)
      .catch(() => {});
  }, [instructorId]);

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then(setSubmissions)
      .catch(() => {});
  }, []);

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          createdById: instructorId,
          maxScore: 100,
        }),
      });
      setNewTitle("");
      setNewDesc("");
      setShowCreate(false);
      fetch(`/api/assignments?instructorId=${instructorId}`).then((r) => r.json()).then(setAssignments);
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  const submissionsByAssignment = assignments.reduce(
    (acc, a) => {
      acc[a.id] = submissions.filter((s) => s.assignment.id === a.id);
      return acc;
    },
    {} as Record<string, Submission[]>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Instructor Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Create Assignment */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 text-slate-100 hover:text-emerald-400 transition"
          >
            <Plus className="w-5 h-5" />
            Create Assignment
            {showCreate ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showCreate && (
            <form onSubmit={createAssignment} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Assignment title"
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Assignment description"
                  rows={3}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </form>
          )}
        </section>

        {/* Assignments & Submissions */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
          <h2 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Assignments & Submissions
          </h2>

          {assignments.length === 0 ? (
            <p className="text-slate-500">No assignments yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const subs = submissionsByAssignment[a.id] ?? [];
                const isExpanded = expandedAssignment === a.id;
                return (
                  <div
                    key={a.id}
                    className="rounded-lg bg-slate-800/60 border border-slate-700 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedAssignment(isExpanded ? null : a.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/80 transition"
                    >
                      <div>
                        <p className="font-medium text-slate-100">{a.title}</p>
                        <p className="text-sm text-slate-500">{a.description || "No description"}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400">{subs.length} submission(s)</span>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {isExpanded && subs.length > 0 && (
                      <div className="border-t border-slate-700 p-4 space-y-4 bg-slate-900/50">
                        {subs.map((s) => (
                          <div
                            key={s.id}
                            className="p-4 rounded-lg bg-slate-800 border border-slate-700"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-slate-100">{s.student.name}</p>
                                <p className="text-sm text-slate-500">{s.student.email}</p>
                                <p className="text-xs text-slate-600">
                                  {new Date(s.submittedAt).toLocaleString()}
                                </p>
                              </div>
                              {s.feedback && (
                                <div className="text-right">
                                  <p className="font-medium text-slate-100">Score: {s.feedback.score}</p>
                                  <p className="text-sm text-amber-400">Plagiarism: {s.feedback.plagiarismRisk}%</p>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 mb-2 line-clamp-2">{s.content}</p>
                            {s.feedback && (
                              <p className="text-sm text-emerald-300/90 border-t border-slate-700 pt-2">
                                {s.feedback.feedbackSummary}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
