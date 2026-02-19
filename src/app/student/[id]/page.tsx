"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Send, CheckCircle, Clock, Upload } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  maxScore: number;
  _count?: { submissions: number };
}

interface Submission {
  id: string;
  status: string;
  submittedAt: string;
  assignment: { title: string; id: string };
  feedback?: { score: number; plagiarismRisk: number; feedbackSummary: string } | null;
}

export default function StudentDashboard({ params }: { params: { id: string } }) {
  const studentId = params.id;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!studentId) return;
    fetch("/api/assignments")
      .then((r) => r.json())
      .then(setAssignments)
      .catch(() => {});
    fetch(`/api/submissions?studentId=${studentId}`)
      .then((r) => r.json())
      .then(setSubmissions)
      .catch(() => {});
  }, [studentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAssignment || !content.trim() || content.trim().length < 10) {
      setMessage({ type: "error", text: "Select an assignment and enter at least 10 characters." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment,
          studentId,
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setMessage({ type: "success", text: `Submitted! Score: ${data.evaluation?.score ?? "—"}, Plagiarism: ${data.evaluation?.plagiarism_risk ?? "—"}` });
      setContent("");
      setSelectedAssignment("");
      fetch(`/api/submissions?studentId=${studentId}`).then((r) => r.json()).then(setSubmissions);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Student Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Submit Assignment */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
          <h2 className="text-lg font-medium text-slate-100 mb-4">Submit Assignment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Assignment</label>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select assignment...</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-slate-400">Your Answer (text)</label>
                <label className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload .txt"}
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploading(true);
                      setMessage(null);
                      try {
                        const form = new FormData();
                        form.append("file", f);
                        const res = await fetch("/api/upload", { method: "POST", body: form });
                        const data = await res.json();
                        if (data.content) setContent(data.content);
                        else setMessage({ type: "error", text: data.error || "Upload failed" });
                      } catch {
                        setMessage({ type: "error", text: "Upload failed" });
                      } finally {
                        setUploading(false);
                        e.target.value = "";
                      }
                    }}
                    disabled={uploading}
                  />
                </label>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your assignment content here... (min 10 characters)"
                rows={6}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"}`}
            >
              {message.text}
            </div>
          )}
        </section>

        {/* My Submissions */}
        <section className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
          <h2 className="text-lg font-medium text-slate-100 mb-4">My Submissions</h2>
          {submissions.length === 0 ? (
            <p className="text-slate-500">No submissions yet.</p>
          ) : (
            <ul className="space-y-3">
              {submissions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/60 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    {s.status === "evaluated" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium text-slate-100">{s.assignment.title}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(s.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {s.feedback ? (
                      <>
                        <p className="font-medium text-slate-100">Score: {s.feedback.score}</p>
                        <p className="text-sm text-slate-400">Plagiarism: {s.feedback.plagiarismRisk}%</p>
                        <p className="text-xs text-slate-500 max-w-[200px] truncate" title={s.feedback.feedbackSummary}>
                          {s.feedback.feedbackSummary}
                        </p>
                      </>
                    ) : (
                      <span className="text-slate-500">Pending</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
