// build/oobe/steps/channel-config.ts — Step 8: Configure communication channels
// OPTIONAL/SKIPPABLE: defaults to local-only if skipped
import type { OOBEStep, OOBEContext } from "../state-machine.ts";

export interface ChannelConfig {
  discord_token?: string;
  slack_token?: string;
  telegram_token?: string;
}

export type ChannelConfigProvider = () => Promise<ChannelConfig>;

let configProvider: ChannelConfigProvider = async () => ({});

export function setChannelConfigProvider(provider: ChannelConfigProvider): void {
  configProvider = provider;
}

export const channelConfig: OOBEStep = {
  id: "CHANNEL_CONFIG",
  mandatory: false, // skippable
  async run(ctx: OOBEContext) {
    const config = await configProvider();
    const configured: string[] = [];

    if (config.discord_token) configured.push("discord");
    if (config.slack_token) configured.push("slack");
    if (config.telegram_token) configured.push("telegram");

    ctx.state.channels_configured = configured;
    ctx.state.channels_mode = configured.length > 0 ? "remote" : "local-only";
  },
};
