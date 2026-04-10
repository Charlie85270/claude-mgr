// build/oobe/steps/user-profile-interview.ts — Step 2: Collect user profile
import type { OOBEStep, OOBEContext } from "../state-machine.ts";

export interface UserProfile {
  name: string;
  timezone: string;
  role: string;
  team_size: number;
  preferred_channels: string[];
}

export type ProfileProvider = () => Promise<UserProfile>;

let profileProvider: ProfileProvider = async () => ({
  name: "Default User",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  role: "developer",
  team_size: 1,
  preferred_channels: ["local"],
});

export function setProfileProvider(provider: ProfileProvider): void {
  profileProvider = provider;
}

export const userProfileInterview: OOBEStep = {
  id: "USER_PROFILE_INTERVIEW",
  mandatory: true,
  async run(ctx: OOBEContext) {
    const profile = await profileProvider();
    ctx.state.user_profile = profile;
  },
};
