# Step 3: Theme Selection

## Purpose

Presents the available character themes and lets the user choose which cast of personas will populate their factor-echelon teams. The selected theme determines which characters fill each archetype role during season spawns.

## How It Works

### Available Themes

| Theme         | Status                | Description                                      |
|---------------|-----------------------|--------------------------------------------------|
| TBBT          | Default, Recommended  | The Big Bang Theory cast — fully implemented     |
| Young Sheldon | Companion             | Young Sheldon cast — fully implemented           |
| Star Wars     | Stub                  | Star Wars universe cast — placeholder, not yet playable |
| Custom        | Disabled in v0.1      | User-defined themes — planned for a future release |

The user is shown all themes with their status. Only themes marked as fully implemented can be selected. Stub and disabled themes are displayed but grayed out with a note about availability.

### Selection Flow

1. Display the theme list with descriptions and status badges
2. Recommend TBBT as the default for first-time users
3. Accept the user's choice
4. Write the selection to `user-profile.yaml` under the `theme` key
5. Confirm the selection and preview two or three character names from the chosen cast

### Inputs

- User's theme selection (interactive)

### Outputs

- `theme` field written to `user-profile.yaml`
- Theme confirmation message displayed to the user

### Dependencies

- Step 2 (user-profile-interview) must have completed — the profile file must exist

## Step Properties

| Property  | Value |
|-----------|-------|
| Required  | Yes   |
| Skippable | No    |
| Retryable | Yes   |
| Blocking  | Yes   |
