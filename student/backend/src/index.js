import "dotenv/config";
import express from "express";
import cors from "cors";
import supabase from "./supabaseClient.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

//dummy api
app.get("/api/hello", (req, res) => {
  res.json({ ok: true, message: "Hello from the backend!" });
});

//GET all workshops
app.get("/api/workshops", async (req, res) => {
  const { data, error } = await supabase
    .from("workshops")
    .select("workshop_id,title,code,color,term")
    .order("workshop_id", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  return res.json(
    data.map((w) => ({
      workshopId: w.workshop_id,
      title: w.title,
      code: w.code,
      color: w.color,
      term: w.term,
    }))
  );
});

//GET one workshop by id
app.get("/api/workshops/:workshopId", async (req, res) => {
  const { workshopId } = req.params;
  const { data, error } = await supabase
    .from("workshops")
    .select("workshop_id,title,code,color,term")
    .eq("workshop_id", workshopId)
    .single();

  if (error) return res.status(404).json({ error: "Workshop not found" });

  return res.json({
    workshopId: data.workshop_id,
    title: data.title,
    code: data.code,
    color: data.color,
    term: data.term,
  });
});

// GET assignments for a workshop
app.get("/api/workshops/:workshopId/assignments", async (req, res) => {
  const { workshopId } = req.params;

  const [{ data: assignments, error: aErr }, { data: workshop, error: wErr }] =
    await Promise.all([
      supabase
        .from("assignments")
        .select("assignment_id,workshop_id,title,points,due_date,assignment_type")
        .eq("workshop_id", workshopId),
      supabase
        .from("workshops")
        .select("code")
        .eq("workshop_id", workshopId)
        .single(),
    ]);
  if (wErr) return res.status(404).json({ error: "Workshop not found" });
  if (aErr) return res.status(500).json({ error: aErr.message });

  return res.json(
    (assignments ?? []).map((a) => ({
      assignmentId: a.assignment_id,
      workshopId: a.workshop_id,
      title: a.title,
      workshop: workshop.code,
      points: a.points,
      dueDate: a.due_date,
      type: a.assignment_type,
    }))
  );
});

//GET dashboard data
app.get("/api/dashboard", async (req, res) => {
  const { data: workshops, error: wErr } = await supabase
    .from("workshops")
    .select("workshop_id,title,code,color,term");

  if (wErr) return res.status(500).json({ error: wErr.message });

  const workshopCodeById = new Map(
    workshops.map((w) => [w.workshop_id, w.code])
  );

  const { data: assignments, error: aErr } = await supabase
    .from("assignments")
    .select("assignment_id,workshop_id,title,points,due_date,assignment_type");

  if (aErr) return res.status(500).json({ error: aErr.message });
  return res.json({
    workshops: workshops.map((w) => ({
      workshopId: w.workshop_id,
      title: w.title,
      code: w.code,
      color: w.color,
      term: w.term,
    })),
    todoList: assignments.map((a) => ({
      assignmentId: a.assignment_id,
      workshopId: a.workshop_id,
      title: a.title,
      workshop: workshopCodeById.get(a.workshop_id) ?? "",
      points: a.points,
      dueDate: a.due_date,
      type: a.assignment_type,
    })),
  });
});

//GET assignment by assignmentId
app.get("/api/assignments/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("assignment_id", assignmentId)
      .single();

    if (error) return res.status(404).json({ error: "Assignment not found" });
    if (!data) return res.status(404).json({ error: "Assignment not found" });
    const assignment = {
      assignmentId: data.assignment_id,
      workshopId: data.workshop_id,
      title: data.title,
      points: data.points,
      dueDate: data.due_date,
      type: data.assignment_type,
    };
    return res.json(assignment);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});


//GET all questions for an assignment
app.get("/api/assignments/:assignmentId/questions", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { data, error } = await supabase
      .from("questions")
      .select("question_id, assignment_id, question_text, type, question_order")
      .eq("assignment_id", assignmentId)
      .order("question_order", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    const questions = (data ?? []).map((q) => ({
      questionId: q.question_id,
      assignmentId: q.assignment_id,
      questionText: q.question_text,
      type: q.type,
      questionOrder: q.question_order,
    }));

    return res.json(questions);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

//GET all question options for a question
app.get("/api/questions/:questionId/options", async (req, res) => {
  try {
    const { questionId } = req.params;
    const { data, error } = await supabase
      .from("questionoptions")
      .select("questionoption_id, question_id, option_order, option_text")
      .eq("question_id", questionId)
      .order("option_order", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    const options = (data ?? []).map((o) => ({
      questionOptionId: o.questionoption_id,
      questionId: o.question_id,
      optionOrder: o.option_order,
      optionText: o.option_text,
    }));

    return res.json(options);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

//GET all projects for a workshop
app.get("/api/workshops/:workshopId/projects", async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { data, error } = await supabase
      .from("projects")
      .select("project_id, title")
      .eq("workshop_id", workshopId)

    if (error) return res.status(400).json({ error: error.message });

    return res.json(
      (data ?? []).map((p) => ({ projectId: p.project_id, title: p.title }))
    );
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

//GET project by id
app.get("/api/projects/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabase
      .from("projects")
      .select("project_id, title")
      .eq("project_id", projectId)
      .single();
    if (error) return res.status(404).json({ error: "Project not found" });
    const project = {
      projectId: data.project_id,
      title: data.title,
    };
    return res.json(project);

  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET all questions for a project
app.get("/api/projects/:projectId/questions", async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data, error } = await supabase
      .from("project_questions")
      .select("question_id, project_id, prompt, position")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    const questions = (data ?? []).map((q) => ({
      projectQuestionId: q.question_id,
      projectId: q.project_id,
      prompt: q.prompt,
      position: q.position,
    }));

    return res.json(questions);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST save/update responses for a project
app.post("/api/projects/:projectId/responses", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { responses } = req.body;

    if (!Array.isArray(responses)) {
      return res.status(400).json({ error: "responses must be an array" });
    }

    const rows = responses.map((r) => ({
      project_id: projectId,
      question_id: r.questionId,
      content_html: r.contentHtml ?? "",
      content_delta: r.contentDelta ?? null,
    }));

    const { data, error } = await supabase
      .from("project_responses")
      .upsert(rows, { onConflict: "project_id,question_id" })
      .select("response_id, project_id, question_id");

    if (error) return res.status(400).json({ error: error.message });

    return res.json({ saved: data?.length ?? 0, rows: data ?? [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET all responses for a project (1 per question)
app.get("/api/projects/:projectId/responses", async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data, error } = await supabase
      .from("project_responses")
      .select("response_id, project_id, question_id, content_html, content_delta")
      .eq("project_id", projectId);

    if (error) return res.status(400).json({ error: error.message });

    const responses = (data ?? []).map((r) => ({
      responseId: r.response_id,
      projectId: r.project_id,
      questionId: r.question_id,
      contentHtml: r.content_html ?? "",
      contentDelta: r.content_delta ?? null,
    }));

    return res.json(responses);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


//Start server
app.listen(process.env.PORT || 4000, () => {
  console.log(`Backend listening on port ${process.env.PORT || 4000}`);
});