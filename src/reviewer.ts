import "dotenv/config"; // завантажує змінні середовища з .env
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic(); // читає ANTHROPIC_API_KEY з env

const SYSTEM_PROMPT = `Ти — сеньйор-інженер, що проводить архітектурне рев'ю коду.
Твоя задача — НЕ перевіряти синтаксис чи стиль (це робить лінтер),
а шукати архітектурні та структурні проблеми:

- N+1 запити до бази даних (особливо Prisma/TypeORM)
- Неправильне використання транзакцій (відсутність там, де потрібна атомарність)
- Відсутність індексів для полів, що часто фільтруються/сортуються
- Порушення розділення відповідальності (бізнес-логіка в контролерах/роутах)
- Потенційні проблеми масштабування (синхронні операції, що мають бути async/queue)
- Небезпечні патерни (SQL-ін'єкції, відсутність валідації вхідних даних)

Для кожної знайденої проблеми поверни JSON-об'єкт у масиві "issues" з полями:
- file: назва файлу
- severity: "critical" | "warning" | "suggestion"
- description: опис проблеми (2-3 речення)
- suggestion: конкретна пропозиція виправлення

Якщо проблем немає — поверни {"issues": []}.
Відповідай ЛИШЕ JSON, без жодного тексту навколо.`;

export interface ReviewIssue {
  file: string;
  severity: "critical" | "warning" | "suggestion";
  description: string;
  suggestion: string;
}

export async function reviewDiff(diff: string): Promise<ReviewIssue[]> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Ось git diff для рев'ю:\n\n${diff}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Модель не повернула текстову відповідь");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return parsed.issues ?? [];
}
