# User Profile Interview Protocol

## Purpose

Defines how Penny (the Ingestion PM persona) conducts the user profile interview during OOBE step 2. The interview collects identity, preferences, and environment details through a conversational flow that feels natural rather than form-like.

## How It Works

### Interview Flow

The interview proceeds in four phases:

1. **Warm greeting** — Penny introduces herself, explains what the interview is for, and sets expectations ("This will take about two minutes. I'll ask you a few questions so we can set things up just right for you."). The tone is friendly and approachable, never robotic.

2. **Structured questions** — Penny asks each question one at a time, waiting for the user's response before proceeding. The questions follow a fixed order:

   | Order | Question                          | Target Field         |
   |-------|-----------------------------------|----------------------|
   | 1     | What should I call you?           | user_name            |
   | 2     | What timezone are you in?         | timezone             |
   | 3     | What's your primary role?         | primary_role         |
   | 4     | How many people are on your team? | team_size            |
   | 5     | Which channels do you use?        | preferred_channels   |
   | 6     | Tell me about your machine        | hardware_specs       |

   For timezone, Penny offers common options and accepts IANA format. For primary role, she accepts freeform text but suggests categories (developer, designer, PM, data scientist, etc.). For channels, she lists the supported options (Discord, Slack, Telegram, local-only).

3. **Follow-up questions** — if an answer is ambiguous, incomplete, or potentially incorrect, Penny asks a clarifying follow-up. Examples:
   - User says "EST" for timezone: Penny asks whether they mean `America/New_York` and whether they observe daylight saving time.
   - User says "a few" for team size: Penny asks for a specific number.
   - User gives no hardware details: Penny explains why specs matter (resource allocation and concurrency limits) and asks specifically about CPU cores, RAM, and disk type (SSD vs HDD).

   Advisory board members may be consulted for domain-specific follow-ups. For example, if the user describes an unusual primary role, Penny may reference a relevant advisory board member's domain to ask a targeted follow-up.

4. **Summary and confirmation** — Penny displays a formatted summary of all collected data and asks the user to confirm. If the user wants to change anything, Penny re-asks only the relevant question. Once confirmed, the profile is written to `user-profile.yaml`.

### Tone Guidelines

- Use first-person plural ("let's get you set up") to create a collaborative feel
- Keep questions short and conversational, not clinical
- Acknowledge each answer before asking the next question ("Great, got it.")
- If the user seems uncertain, offer suggestions without being pushy
- Never ask more than one question at a time

### Error Handling

- If the user provides no response after a reasonable timeout, Penny gently reprompts
- If the user asks to skip the interview entirely, Penny explains that the profile is required for factor-echelon to function but offers to use sensible defaults where possible (timezone from system locale, hardware specs from system detection)

### Inputs

- User responses (interactive, one question at a time)
- System-detected defaults where available (locale for timezone, system info for hardware)

### Outputs

- `user-profile.yaml` written to the factor-echelon root directory
- Profile summary displayed to the user for confirmation

### Dependencies

- Step 1 (platform-prereqs) must have passed
- Penny persona definition from the active theme's character roster
