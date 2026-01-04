import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Workshop = {
  workshopId: string;
  title: string;
  code: string;
  color: string;
  term: string;
};

type Assignment = {
  id: string;
  workshopId: string;
  title: string;
  workshop: string;
  points: number;
  dueDate: string; // keep string
  type: "assignment" | "announcement";
};

async function getWorkshop(workshopId: string): Promise<Workshop | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const res = await fetch(`${base}/api/workshops/${workshopId}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch workshop");

  return res.json();
}

async function getAssignments(workshopId: string): Promise<Assignment[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const res = await fetch(`${base}/api/workshops/${workshopId}/assignments`, {
    cache: "no-store",
  });

  if (res.status === 404) return [];
  if (!res.ok) throw new Error("Failed to fetch assignments");

  return res.json();
}

export default async function WorkshopPage({
  params,
}: {
  params: Promise<{ workshopId: string }>;
}) {
  const { workshopId } = await params;

  const [workshop, assignments] = await Promise.all([
    getWorkshop(workshopId),
    getAssignments(workshopId),
  ]);

  if (!workshop) notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{workshop.title}</h1>

      <h2 className="mt-6 text-lg font-semibold">Assignments</h2>
      {assignments.length === 0 ? (
        <p className="mt-2 text-gray-600">You have completed your work!</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {assignments.map((a) => (
            <li key={a.id} className="rounded border p-3">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-gray-600">{a.dueDate}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
