import { generateQuiz } from "./src/utils/math";

function calculateAnswer(expression: string): number {
  const tokens = expression.split(" ");

  const values: number[] = [];
  const operators: string[] = [];

  const precedence: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "^": 3,
  };

  const applyOperator = () => {
    const operator = operators.pop();

    if (!operator) {
      throw new Error("Invalid expression");
    }

    const b = values.pop();
    const a = values.pop();

    if (a === undefined || b === undefined) {
      throw new Error("Invalid expression");
    }

    switch (operator) {
      case "+":
        values.push(a + b);
        break;

      case "-":
        values.push(a - b);
        break;

      case "*":
        values.push(a * b);
        break;

      case "/":
        values.push(a / b);
        break;

      case "^":
        values.push(Math.pow(a, b));
        break;

      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  };

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      values.push(Number(token));
      continue;
    }

    if (!(token in precedence)) {
      throw new Error(`Invalid token: ${token}`);
    }

    while (
      operators.length > 0 &&
      precedence[operators[operators.length - 1]!]! >= precedence[token!]!
    ) {
      applyOperator();
    }

    operators.push(token);
  }

  while (operators.length > 0) {
    applyOperator();
  }

  if (values.length !== 1) {
    throw new Error("Invalid expression");
  }

  return values[0] ?? 0;
}


// console.log(generateQuiz(100, "easy"));