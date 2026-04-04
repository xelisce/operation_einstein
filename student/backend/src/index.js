import "dotenv/config";
import express from "express";
import cors from "cors";
import supabase from "./supabaseClient.js";
import { Resend } from "resend";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { authenticate } from "./authMiddleware.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());
const upload = multer();
const resend = new Resend(process.env.RESEND_API_KEY);

//dummy api
app.get("/api/hello", (req, res) => {
  res.json({ ok: true, message: "Hello from the backend!" });
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, password_hash")
    .eq("email", email)
    .single();

  if (error || !data)
    return res.status(401).json({ error: "Invalid credentials" });
  if (!data.password_hash)
    return res.status(401).json({ error: "Account not set up for password login" });

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { sub: data.id, email: data.email, role: data.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return res.json({ token, role: data.role });
});

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  const { email, password, role = "student" } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) return res.status(409).json({ error: "Email already registered" });

  const id = randomUUID();
  const password_hash = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from("profiles")
    .insert({ id, email, role, password_hash });

  if (error) return res.status(500).json({ error: error.message });

  const token = jwt.sign(
    { sub: id, email, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return res.status(201).json({ token, role });
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

//GET dashboard data for a specific student
app.get("/api/dashboard", authenticate, async (req, res) => {
  const studentId = req.user.sub;
  const { data: enrollments, error: eErr } = await supabase
    .from("enrollments")
    .select("workshop_id")
    .eq("student_id", studentId);

  if (eErr) return res.status(500).json({ error: eErr.message });

  const workshopIds = enrollments.map((e) => e.workshop_id);

  if (workshopIds.length === 0) {
    return res.json({ workshops: [], todoList: [] });
  }

  const { data: workshops, error: wErr } = await supabase
    .from("workshops")
    .select("workshop_id,title,code,color,term")
    .in("workshop_id", workshopIds);

  if (wErr) return res.status(500).json({ error: wErr.message });

  const workshopCodeById = new Map(
    workshops.map((w) => [w.workshop_id, w.code])
  );

  const { data: assignments, error: aErr } = await supabase
    .from("assignments")
    .select("assignment_id,workshop_id,title,points,due_date,assignment_type")
    .in("workshop_id", workshopIds);

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

//POST save/update responses for an assignment per student
app.post('/api/assignments/:assignmentId/responses', authenticate, async (req, res) => {
  const { assignmentId } = req.params;
  const studentId = req.user.sub;
  const { responses } = req.body;

  if (!responses) {
    return res.status(400).json({ error: "Responses are required." });
  }

  try {
    const { data, error } = await supabase
      .from('responses')
      .insert(responses.map(response => ({
        question_id: response.questionId,
        student_id: studentId,
        answer_text: response.answerText,
      })));
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: 'Responses updated successfully', data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

// POST save/update responses for a project per student
app.post("/api/projects/:projectId/responses", authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const studentId = req.user.sub;
    const { responses } = req.body;
    if (!Array.isArray(responses)) return res.status(400).json({ error: "responses must be an array" });

    const rows = responses.map((r) => ({
      project_id: projectId,
      question_id: r.questionId,
      content_html: r.contentHtml ?? "",
      content_delta: r.contentDelta ?? null,
      student_id: studentId,
    }));

    const { data, error } = await supabase
      .from("project_responses")
      .upsert(rows, { onConflict: "question_id,student_id" });
    //.select("response_id, project_id, question_id");

    if (error) return res.status(400).json({ error: error.message });

    return res.json({ saved: data?.length ?? 0, rows: data ?? [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET all responses for a project for a specific student
app.get("/api/projects/:projectId/responses", authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const studentId = req.user.sub;

    const { data, error } = await supabase
      .from("project_responses")
      .select("response_id, project_id, question_id, content_html, content_delta, student_id")
      .eq("project_id", projectId)
      .eq("student_id", studentId);

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

//Email PDF endpoint
app.post("/api/email/send-report", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file" });

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.ADMIN_EMAIL,
      subject: `Final Report: ${file.originalname.replace(".pdf", "")}`,
      text: "A new final report has been submitted. See attached.",
      attachments: [{ filename: file.originalname, content: file.buffer }],
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Email send failed:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
});


//Start server
app.listen(process.env.PORT || 4000, () => {
  console.log(`Backend listening on port ${process.env.PORT || 4000}`);
});