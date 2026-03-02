import { notFound } from "next/navigation";
import Link from "next/link";
import BackButton from "../../components/BackButton";
import type { Workshop, Assignment } from "../../models/types";

export const dynamic = "force-dynamic";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getWorkshop(workshopId: string): Promise<Workshop | null> {
  const res = await fetch(`${API_BASE}/api/workshops/${workshopId}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch workshop");

  return res.json();
}

async function getAssignments(workshopId: string): Promise<Assignment[]> {
  const res = await fetch(`${API_BASE}/api/workshops/${workshopId}/assignments`, {
    cache: "no-store",
  });

  if (res.status === 404) return [];
  if (!res.ok) throw new Error("Failed to fetch assignments");

  return res.json();
}

async function getProjects(workshopId: string) {
  const res = await fetch(`${API_BASE}/api/workshops/${workshopId}/projects`, {
    cache: "no-store",
  });
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
    <div className="p-6">
      <BackButton href="/" />
      <h1 className="text-2xl font-bold mt-4">{workshop.title}</h1>
      <h2 className="mt-6 text-lg font-semibold">Projects</h2>
      {projects.length === 0 ? (
        <p className="mt-2 text-gray-600">No projects yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {projects.map((p) => (
            <li key={p.projectId} className="rounded border p-3">
              <Link
                href={`/projects/${p.projectId}`}
                className="font-medium hover:underline"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-6 text-lg font-semibold">Assignments</h2>
      {assignments.length === 0 ? (
        <p className="mt-2 text-gray-600">You have completed your work!</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {assignments.map((a) => (
            <li key={a.assignmentId} className="rounded border p-3">
              <Link
                href={`/assignments/${a.assignmentId}`}
                className="font-medium hover:underline"
              >
                {a.title}
              </Link>
              <div className="text-sm text-gray-600">{a.dueDate}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}