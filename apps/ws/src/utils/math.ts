import type { GameDifficulty } from "@quickmath/common";

export type Difficulty = GameDifficulty;

export interface Question {
  id: number; // idx
  question: string;
  answer: number;
  difficulty: Difficulty;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function easyQuestion(): { question: string; answer: number } {
  const ops = ["+", "-", "*", "/"] as const;
  const op = ops[randInt(0, 3)];

  if (op === "+") {
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    return { question: `${a} + ${b}`, answer: a + b };
  }

  if (op === "-") {
    let a = randInt(10, 99);
    let b = randInt(10, 99);
    if (b > a) [a, b] = [b, a];
    return { question: `${a} - ${b}`, answer: a - b };
  }

  if (op === "*") {
    const a = randInt(10, 20);
    const b = randInt(2, 9);
    return { question: `${a} * ${b}`, answer: a * b };
  }

  const b = randInt(2, 9);
  const answer = randInt(10, 20);
  const a = b * answer;
  return { question: `${a} / ${b}`, answer };
}

function mediumQuestion(): { question: string; answer: number } {
  const ops = ["+", "-", "*"] as const;
  const op = ops[randInt(0, 2)];
  let a = op === "*" ? randInt(2, 12) : randInt(10, 99);
  let b = op === "*" ? randInt(2, 12) : randInt(10, 99);
  if (op === "-" && b > a) [a, b] = [b, a];
  const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
  return { question: `${a} ${op} ${b}`, answer };
}

function hardQuestion(): { question: string; answer: number } {
  const type = randInt(0, 3);

  if (type === 0) {
    const a = randInt(12, 25);
    const b = randInt(12, 25);
    return { question: `${a} * ${b}`, answer: a * b };
  }

  if (type === 1) {
    const b = randInt(3, 12);
    const answer = randInt(3, 20);
    const a = b * answer;
    return { question: `${a} / ${b}`, answer };
  }

  if (type === 2) {
    const base = randInt(2, 9);
    const exp = randInt(2, 3);
    return { question: `${base} ^ ${exp}`, answer: Math.pow(base, exp) };
  }

  const a = randInt(10, 50);
  const b = randInt(2, 12);
  const c = randInt(2, 20);
  return { question: `${a} + ${b} * ${c}`, answer: a + b * c };
}

function generateOne(id: number, difficulty: Difficulty): Question {
  const generator =
    difficulty === "easy" ? easyQuestion : difficulty === "medium" ? mediumQuestion : hardQuestion;

  const { question, answer } = generator();

  return { id, question, answer, difficulty };
}

export function generateQuiz(numQuestions: number, difficulty: Difficulty): Question[] {
  if (numQuestions <= 0) return [];

  const questions: Question[] = [];
  const seen = new Set<string>();

  while (questions.length < numQuestions) {
    const q = generateOne(questions.length, difficulty);
    if (seen.has(q.question)) continue;
    seen.add(q.question);
    questions.push(q);
  }

  return questions;
}