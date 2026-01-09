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

//Start server
app.listen(process.env.PORT || 4000, () => {
  console.log(`Backend listening on port ${process.env.PORT || 4000}`);
});