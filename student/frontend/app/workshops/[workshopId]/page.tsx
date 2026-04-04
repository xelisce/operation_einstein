import { notFound } from "next/navigation";
import Link from "next/link";
import type { Workshop, Assignment } from "../../models/types";

export const dynamic = "force-dynamic";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getWorkshop(workshopId: string): Promise<Workshop | null> {
  const res = await fetch(`${API_BASE}/api/workshops/${workshopId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch workshop");
  return res.json();
}

async function getAssignments(workshopId: string): Promise<Assignment[]> {
  const res = await fetch(`${API_BASE}/api/workshops/${workshopId}/assignments`, { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error("Failed to fetch assignments");
  return res.json();
}

async function getProjects(workshopId: string) {
  const res = await fetch(`${API_BASE}/api/workshops/${workshopId}/projects`, { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json() as Promise<{ projectId: string; title: string }[]>;
}

export default async function WorkshopPage({
  params,
}: {
  params: Promise<{ workshopId: string }>;
}) {
  const { workshopId } = await params;
  const [workshop, assignments, projects] = await Promise.all([
    getWorkshop(workshopId),
    getAssignments(workshopId),
    getProjects(workshopId),
  ]);

  if (!workshop) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{workshop.title}</h1>
          <p className="text-gray-500 mt-1">{workshop.code} • {workshop.term}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Projects */}
        {projects.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Projects</h2>
            <div className="grid grid-cols-1 gap-3">
              {projects.map((p) => (
                <Link
                  key={p.projectId}
                  href={`/projects/${p.projectId}`}
                  className="block border border-gray-200 p-4 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <span className="text-xs text-indigo-600 font-medium">Open &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Assignments */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Assignments</h2>
          {assignments.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded border-2 border-dashed">
              No assignments yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {assignments.map((a) => (
                <Link
                  key={a.assignmentId}
                  href={`/assignments/${a.assignmentId}`}
                  className="block border border-gray-200 p-4 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      {a.dueDate && (
                        <p className="text-sm text-gray-500 mt-0.5">Due: {a.dueDate}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-right shrink-0">
                      {a.points > 0 && (
                        <span className="text-sm text-gray-500">{a.points} pts</span>
                      )}
                      <span className="text-xs text-indigo-600 font-medium">Start &rarr;</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
