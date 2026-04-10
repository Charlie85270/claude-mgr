# Step 2: User Profile Interview

## Purpose

Collects the user's identity, preferences, and environment details through a conversational interview conducted by Penny (the Ingestion PM persona). The profile informs resource allocation, theme defaults, and team sizing throughout factor-echelon.

## How It Works

### Data Collected

| Field              | Type     | Description                                              |
|--------------------|----------|----------------------------------------------------------|
| user_name          | string   | Display name used in greetings and commit attribution    |
| timezone           | string   | IANA timezone (e.g., `America/Chicago`) for scheduling   |
| primary_role       | string   | User's primary role (developer, designer, PM, etc.)      |
| team_size          | integer  | Number of people on the user's team (1 = solo)           |
| preferred_channels | string[] | Communication channels the user wants to use             |
| hardware_specs     | object   | CPU cores, RAM, and disk type — used for resource allocation and concurrency limits |

### Interview Style

The interview is conducted using Penny's conversational protocol (see `../user-profile-interview.md`). Questions are asked one at a time in a warm, approachable tone. Follow-up questions are asked when answers are ambiguous or incomplete.

### Inputs

- User responses (interactive, collected one at a time)

### Outputs

- A `user-profile.yaml` file written to the factor-echelon root directory
- Profile summary displayed to the user for confirmation before proceeding

### Dependencies

- Step 1 (platform-prereqs) must have passed

## Step Properties

| Property  | Value |
|-----------|-------|
| Required  | Yes   |
| Skippable | No    |
| Retryable | Yes   |
| Blocking  | Yes   |
