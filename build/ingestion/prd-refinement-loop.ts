// build/ingestion/prd-refinement-loop.ts — Malformed-PRD interactive refinement (§8.3)
import { parsePRD, type ParsedPRD } from "../lib/prd-parser.ts";

export interface PRDRefinementState {
  original_prd: string;
  clarifying_questions: string[];
  user_answers: Record<string, string>;
  confidence: number;
  iteration: number;
}

export type AskUser = (questions: string[]) => Promise<Record<string, string>>;

const MAX_ITERATIONS = 5;
const CONFIDENCE_THRESHOLD = 0.8;

export async function refineUntilConfident(
  initialPRD: string,
  askUser: AskUser,
): Promise<{ refined: ParsedPRD; state: PRDRefinementState }> {
  const state: PRDRefinementState = {
    original_prd: initialPRD,
    clarifying_questions: [],
    user_answers: {},
    confidence: 0,
    iteration: 0,
  };

  // First assessment
  const firstAssessment = assessPRD(initialPRD, state.user_answers);
  if (firstAssessment.confidence >= CONFIDENCE_THRESHOLD) {
    state.confidence = firstAssessment.confidence;
    return { refined: firstAssessment.parsed, state };
  }

  while (state.confidence < CONFIDENCE_THRESHOLD && state.iteration < MAX_ITERATIONS) {
    state.iteration++;
    const assessment = assessPRD(initialPRD, state.user_answers);
    state.confidence = assessment.confidence;

    if (assessment.confidence >= CONFIDENCE_THRESHOLD) {
      return { refined: assessment.parsed, state };
    }

    const questions = generateClarifyingQuestions(assessment);
    state.clarifying_questions.push(...questions);

    const answers = await askUser(questions);
    state.user_answers = { ...state.user_answers, ...answers };
  }

  // Final attempt after all iterations
  const finalAssessment = assessPRD(initialPRD, state.user_answers);
  if (finalAssessment.confidence >= CONFIDENCE_THRESHOLD) {
    return { refined: finalAssessment.parsed, state };
  }

  throw new Error(
    `Unable to reach scoping confidence (${finalAssessment.confidence.toFixed(2)}) after ${MAX_ITERATIONS} iterations`,
  );
}

interface PRDAssessment {
  confidence: number;
  parsed: ParsedPRD;
  missing_sections: string[];
}

function assessPRD(prd: string, answers: Record<string, string>): PRDAssessment {
  // Combine original PRD with any user-provided clarifications
  let enrichedPrd = prd;
  for (const [question, answer] of Object.entries(answers)) {
    enrichedPrd += `\n\n## Clarification: ${question}\n${answer}`;
  }

  const parsed = parsePRD(enrichedPrd);
  const missing: string[] = [];
  let score = 0;
  const maxScore = 5;

  // Check for key PRD sections
  if (parsed.title && parsed.title !== "Untitled PRD") score++;
  else missing.push("title");

  if (parsed.goals.length > 0 || parsed.user_stories.length > 0) score++;
  else missing.push("sections");

  if (parsed.scope_hints.tier_estimate) score++;
  else missing.push("scope estimation");

  if (parsed.scope_hints.technologies.length > 0) score++;
  else missing.push("technology stack");

  if (parsed.user_stories.length > 0) score++;
  else missing.push("detailed requirements");

  return {
    confidence: score / maxScore,
    parsed,
    missing_sections: missing,
  };
}

function generateClarifyingQuestions(assessment: PRDAssessment): string[] {
  return assessment.missing_sections.map((section) => {
    switch (section) {
      case "title":
        return "What is the name or title of this project?";
      case "sections":
        return "Can you break down the project into major feature areas?";
      case "scope estimation":
        return "Roughly how many distinct roles/specialties does this project need?";
      case "technology stack":
        return "What technologies, frameworks, or platforms will this project use?";
      case "detailed requirements":
        return "Can you list the key requirements or user stories for this project?";
      default:
        return `Can you provide more detail about: ${section}?`;
    }
  });
}
