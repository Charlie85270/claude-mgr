// build/advisory-board/consultation.ts — Advisory Board consultation dispatcher
import { routeQuery } from "./sme-router.ts";

export interface ConsultationRequest {
  query: string;
  tags: string[];
  season_id?: string;
  requester_character: string;
}

export interface ConsultationResponse {
  sme: string;
  response: string;
  domains: string[];
  duration_ms: number;
}

export type SMEHandler = (sme: string, query: string) => Promise<string>;

// Default handler: returns a stub response (real impl dispatches to advisory board character agents)
const defaultHandler: SMEHandler = async (sme, query) => {
  return `[${sme}] Advisory response for: ${query.slice(0, 100)}...`;
};

export async function consultAdvisoryBoard(
  request: ConsultationRequest,
  handler: SMEHandler = defaultHandler,
  maxSMEs: number = 3,
): Promise<ConsultationResponse[]> {
  const smes = routeQuery(request.query, request.tags);
  const topSMEs = smes.slice(0, maxSMEs);

  if (topSMEs.length === 0) {
    return [];
  }

  const responses: ConsultationResponse[] = [];

  for (const sme of topSMEs) {
    const start = Date.now();
    const response = await handler(sme, request.query);
    responses.push({
      sme,
      response,
      domains: request.tags,
      duration_ms: Date.now() - start,
    });
  }

  return responses;
}
