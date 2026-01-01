import { notFound } from "next/navigation";
import { workshops, todoList } from "../../models/data";

export default async function WorkshopPage({
  params,
}: {
  params: Promise<{ workshopId: string }>;
}) {
  const { workshopId } = await params;

  const workshop = workshops.find((w) => w.workshopId === workshopId);
  if (!workshop) notFound();

  const assignments = todoList.filter((a) => a.workshopId === workshopId);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{workshop.title}</h1>

      <h2 className="mt-6 text-lg font-semibold">Assignments</h2>
      {assignments.length === 0 ? (
        <p className="mt-2 text-gray-600">You have completed your work!</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {assignments.map((a) => (
            <li key={a.workshopId} className="rounded border p-3">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-gray-600">{a.dueDate}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
