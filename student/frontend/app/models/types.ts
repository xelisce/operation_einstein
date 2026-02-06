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

// Mock Data
// export const workshops: Workshop[] = [
//     { workshopId: "1", title: "Intro to Physics: Mechanics", code: "PHY-101", term: "Sem 1 2025", color: "bg-emerald-600" },
//     { workshopId: "2", title: "Chemistry Lab Safety", code: "CHEM-LAB", term: "Sem 1 2025", color: "bg-orange-500" },
//     { workshopId: "3", title: "Biology: Plant Systems", code: "BIO-202", term: "Sem 1 2025", color: "bg-purple-700" },
//     { workshopId: "4", title: "Robotics & Embedded Systems", code: "ENG-300", term: "Sem 1 2025", color: "bg-blue-600" },
//     { workshopId: "5", title: "Environmental Science", code: "ENV-101", term: "Sem 1 2025", color: "bg-teal-700" },
//     { workshopId: "6", title: "Space Exploration Workshop", code: "ASTRO-09", term: "Sem 1 2025", color: "bg-indigo-600" },
// ];

// export const todoList: Assignment[] = [
//   { workshopId: "1", title: "Lab Report: Pendulum Motion", workshop: "PHY-101",  points: 50, dueDate: "Dec 24 at 11:59pm", type: "assignment" },
//   { workshopId: "2", title: "Safety Quiz", workshop: "CHEM-LAB", points: 10, dueDate: "Dec 25 at 10:00am", type: "assignment" },
//   { workshopId: "3", title: "Read: Photosynthesis Chapter", workshop: "BIO-202", points: 0, dueDate: "Dec 28 at 9:00am", type: "assignment" },
// ];

