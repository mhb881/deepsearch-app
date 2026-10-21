import { generateText, Output } from "ai";
import { createScorer } from "evalite";
import { z } from "zod";

import { getLanguageModel } from "~/lib/ai/model";

// 阶段一提示词：将长文本拆解为原子命题
export function generateEvaluationStatementsPrompt({
  output,
}: {
  output: string;
}) {
  return `Given the text, break it down into meaningful statements while preserving context and relationships.
Don't split too aggressively.
Split compound statements particularly when they:
- Are joined by "and"
- Contain multiple distinct facts or claims
- Have multiple descriptive elements about the subject
Handle special cases:
- A single word answer should be treated as a complete statement
- Error messages should be treated as a single statement
- Empty strings should return an empty list
- When splitting text, keep related information together
Example:
Example text: Look! A bird! Birds are an interesting animal.
{
  "statements": ["Look!", "A bird!", "Birds are interesting animals."]
}
Please return only JSON format with "statements" array.
Return empty list for empty input.
Text:
${output}
JSON:
`;
}

// 阶段二系统指令：定义裁判角色定位与仲裁基准原则
export const ANSWER_RELEVANCY_AGENT_INSTRUCTIONS = `You are a balanced and nuanced answer relevancy evaluator. Your job is to determine if LLM outputs are relevant to the input, including handling partially relevant or uncertain cases.
Key Principles:
1. Evaluate whether the output addresses what the input is asking for
2. Consider both direct answers and related context
3. Prioritize relevance to the input over correctness
4. Recognize that responses can be partially relevant
5. Empty inputs or error messages should always be marked as "no"
6. Responses that discuss the type of information being asked show partial relevance`;

// 阶段二评测提示词：提供精细化判定标准与 Few-Shot 示例
export function generateEvaluatePrompt({
  input,
  statements,
}: {
  input: string;
  statements: string[];
}) {
  return `Evaluate each statement's relevance to the input question, considering direct answers, related context, and uncertain cases.

    Return JSON with array of verdict objects. Each verdict must include:
    - "verdict": "yes", "no", or "unsure"
    - "reason": Clear explanation of the verdict

    Verdict Guidelines:
    - "yes": Statement explicitly and directly answers the input question when it:
        * Contains specific answer to the question asked
        * States explicit relationship between key concepts
        * Can stand alone as a complete answer

    - "unsure": Statement shows partial relevance when it:
        * Discusses the type of information being asked about
        * Contains information about the answer without explicit statement
        * References locations or entities in the same category
        * Is incorrect but shows understanding of the question


    - "no": Statement lacks meaningful connection to question when it:
        * Contains neither the subject nor the type of information being requested
        * Contains only general subject information without relating to what's being asked
        * Consists of empty or meaningless content

    REMEMBER: 
    - If the statement contains words or phrases that are relevant to the input, it is partially relevant.
    - If the statement is a direct answer to the input, it is relevant.
    - If the statement is completely unrelated to the input or contains nothing, it is not relevant.
    - DO NOT MAKE A JUDGEMENT ON THE CORRECTNESS OF THE STATEMENT, JUST THE RELEVANCY.

    STRICT RULES:
    - If a statement mentions the type of information being requested, it should be marked as "unsure" ONLY if it's discussing that type meaningfully (not just mentioning it)
    - Subject mentions alone are NOT enough for relevance - they must connect to what's being asked about
    - Empty or meaningless statements are always "no"
    - General facts about the subject without connection to the question type should be marked as "no"
    - ALWAYS mark a statement as "no" if it discusses the topic without any connection to the question type
    - Statements that mention neither the subject nor the type of information are always "no"
    - Type-level relevance overrides topic-only content
    - Measurement/quantity relevance counts as type-level relevance
    - Administrative/governance terms are only relevant if they relate to the question type
    - Descriptive facts about the subject should be marked as "no" unless they directly relate to the question type


    Examples of "no" statements:
        * "Japan has beautiful seasons" for "What is Japan's largest city?"
        * "Trees grow tall" for "How tall is Mount Everest?"
        * "The weather is nice" for "Who is the president?"

    Example:
    Input: "What color is the sky during daytime?"
    Statements: [
      "The sky is blue during daytime",
      "The sky is full of clouds", 
      "I had breakfast today",
    ]
    JSON:
    {{
        "verdicts": [
            {{
                "verdict": "yes",
                "reason": "This statement explicitly answers what color the sky is during daytime"
            }},
            {{
                "verdict": "unsure",
                "reason": "This statement describes the sky but doesn't address its color"
            }},
            {{
                "verdict": "no",
                "reason": "This statement about breakfast is completely unrelated to the sky"
            }},
        ]
    }}

The number of verdicts MUST MATCH the number of statements exactly.

  Input:
  ${input}

  Number of statements: ${statements.length === 0 ? "1" : statements.length}

  Statements:
  ${statements}

  JSON:
  `;
}

export async function checkAnswerRelevancy({
  question,
  submission,
}: {
  question: string;
  submission: string;
}) {
  // 第一阶段调用：将回答拆解为原子命题数组
  const { output: statementsOut } = await generateText({
    model: getLanguageModel("zai-org/GLM-5.3-Flash"),
    prompt: generateEvaluationStatementsPrompt({ output: submission }),
    // 它期望通过 z.array(z.string()) 拿到一堆 statements 回来
    output: Output.object({
      schema: z.object({
        statements: z
          .array(z.string())
          .describe("The extracted list of meaningful atomic statements."),
      }),
    }),
  });

  const statements = statementsOut.statements;

  // 防御性检查：若无任何有效命题，直接返回 0 分并终止，避免除以零错误
  if (statements.length === 0) {
    return {
      score: 0,
      metadata: {
        rationale: "未在模型回答中提取到任何有效命题",
        statements: [],
        verdicts: [],
      },
    };
  }

  // 第二阶段调用，批量审查每个命题的相关度裁决 (AI SDK v7 规范)
  const { output: verdictsOut } = await generateText({
    model: getLanguageModel("zai-org/GLM-5.3-Flash"),
    instructions: ANSWER_RELEVANCY_AGENT_INSTRUCTIONS,
    prompt: generateEvaluatePrompt({ input: question, statements }),
    output: Output.object({
      schema: z.object({
        verdicts: z.array(
          z
            .object({
              verdict: z
                .enum(["yes", "no", "unsure"])
                .describe("Relevance judgment of the statement."),
              reason: z
                .string()
                .describe("Explanation for the relevance judgment."),
            })
            .describe(
              "Array of verdict objects matching the number of statements.",
            ),
        ),
      }),
    }),
  });

  // 拿到传回来的 verdict 和 reason
  const verdicts = verdictsOut.verdicts;

  // 定义离散权重字典，计算加权算术平均分
  const weights: Record<"yes" | "no" | "unsure", number> = {
    yes: 1,
    no: 0,
    unsure: 0.5,
  };

  const totalScore = verdicts.reduce(
    (acc, cur) => acc + weights[cur.verdict],
    0,
  );

  const averageScore = totalScore / verdicts.length;

  return {
    score: averageScore,
    metadata: {
      statements,
      verdicts,
    },
  };
}

export const AnswerRelevancy = createScorer<
  string, // Type of 'input'
  string, // Type of 'output'
  string // Type of 'expected'
>({
  name: "answer-relevancy",
  description:
    "Evaluate the relevanceancy of the model response to the question.",
  scorer: async ({ input, output }) => {
    return await checkAnswerRelevancy({
      question: input,
      submission: output,
    });
  },
});
