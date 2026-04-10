// build/multi-season/channel-multiplex.ts — Per-season channel sets

export interface SeasonChannels {
  season_id: string;
  primary: string;
  leonards_office: string;
  review_gates: string;
  escalation: string;
}

export function provisionChannels(seasonId: string): SeasonChannels {
  return {
    season_id: seasonId,
    primary: `#${seasonId}-pennys-apartment`,
    leonards_office: `#${seasonId}-leonards-office`,
    review_gates: `#${seasonId}-gates`,
    escalation: `#${seasonId}-escalation`,
  };
}

export function archiveChannels(channels: SeasonChannels): SeasonChannels {
  return {
    ...channels,
    primary: `${channels.primary}-archived`,
    leonards_office: `${channels.leonards_office}-archived`,
    review_gates: `${channels.review_gates}-archived`,
    escalation: `${channels.escalation}-archived`,
  };
}
