# Security Review Gate

## Owner

**Barry Kripke** — appsec-engineer

## Type

Pass/fail

## Focus Areas

- OWASP Top 10 vulnerability categories
- Injection attacks (SQL, XSS, command injection, template injection)
- Authentication and authorization correctness
- Secrets exposure (hardcoded credentials, API keys, tokens)
- Dependency vulnerabilities (known CVEs in new or updated dependencies)
- Data exposure and privacy concerns

## Pass Criteria

A submission passes the security review when:

- No injection risks are present — all user input is properly sanitized, parameterized, or escaped before use in queries, commands, or templates.
- No secrets, credentials, API keys, or tokens appear in the code or configuration files committed to the repository.
- Authentication and authorization checks are correctly applied to all protected endpoints and operations.
- New dependencies have no known CVEs at the time of submission.
- Sensitive data is handled appropriately — no unnecessary logging, no exposure in error messages, proper encryption where required.
- File operations, network calls, and system commands use safe patterns (no path traversal, no SSRF vectors).

## Fail Signals

A submission fails the security review when any of the following are detected:

- **Injection vulnerabilities**: Raw user input concatenated into SQL queries, shell commands, HTML output, or template expressions.
- **Hardcoded credentials**: API keys, passwords, tokens, or connection strings embedded directly in source code or committed configuration files.
- **Vulnerable dependencies**: New or updated packages with known CVEs that have available patches.
- **Missing auth checks**: Protected operations accessible without proper authentication or authorization verification.
- **Data exposure**: Sensitive data logged in plaintext, included in error responses, or stored without encryption where encryption is required.
- **Path traversal / SSRF**: File operations or network requests that accept user-controlled paths or URLs without validation.

## Escalation Rules

- On fail, the submission bounces back to the original assignee with specific security findings, severity ratings, and remediation guidance.
- The assignee addresses the findings and resubmits.
- If this gate fails 5 times on the same submission, the issue escalates to the Counselor for mediation.

## Example Scenarios

### Pass

A developer adds a new database query endpoint. All query parameters are passed through parameterized queries. The endpoint requires authentication via the existing auth middleware. No secrets are present in the code. Dependencies are up to date. The security review passes.

### Fail — SQL Injection

A developer constructs a database query by concatenating user-supplied search terms directly into a SQL string: `SELECT * FROM users WHERE name = '${input}'`. The gate fails, flagging the injection risk and recommending parameterized queries.

### Fail — Hardcoded Credentials

A developer adds a third-party integration and embeds the API key directly in the source file: `const API_KEY = "sk-live-abc123..."`. The gate fails, recommending the key be moved to environment variables or a secrets manager and the committed key be rotated immediately.
