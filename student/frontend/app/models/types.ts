export type Workshop = {
  workshopId: string;
  title: string;
  code: string;
  color: string;
  term: string;
};
export type Assignment = {
  assignmentId: string;
  workshopId: string;
  title: string;
  workshop: string;
  points: number;
  dueDate: string;
  type: "assignment" | "announcement";
};

export type QuestionType = "multiple_choice" | "text";

export type Question = {
  questionId: string;
  assignmentId: string;
  questionText: string;
  type: QuestionType;
  questionOrder: number;
};

export type QuestionOption = {
  questionOptionId: string;
  questionId: string;
  optionOrder: number;
  optionText: string;
};

export type Project = {
  projectId: string;
  title: string;
};

export type ProjectQuestion = {
  projectQuestionId: string;
  projectId: string;
  prompt: string;
  position: number;
};

export type ProjectResponseRow = {
  response_id: string;
  project_id: string;
  question_id: string;
  content_html: string;
  content_delta: unknown;
};
