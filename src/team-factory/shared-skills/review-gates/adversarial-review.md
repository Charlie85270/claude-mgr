# Adversarial Review Gate

## Owner

**Wil Wheaton** — adversarial-reviewer

## Type

5-star rating (minimum 4 stars to pass)

## Focus Areas

- Attempting to break the code through unexpected inputs and usage patterns
- Fuzzy and malformed inputs (Unicode edge cases, extremely long strings, binary data where text is expected)
- Race conditions and concurrency hazards
- Resource exhaustion (memory leaks, unbounded loops, unthrottled requests)
- Malicious use scenarios (abuse vectors, privilege escalation attempts)
- Assumption validation (what does the code assume that an attacker would not honor?)

## Rating Guide

| Stars | Meaning |
|-------|---------|
| 5 | **Bulletproof.** No exploitable gaps found despite thorough adversarial testing. Input validation is comprehensive, concurrency is safe, resources are bounded, and abuse vectors are blocked. |
| 4 | **Solid with minor edge cases.** The code handles adversarial inputs well. Minor edge cases exist but are low-severity and unlikely to be exploited in practice. May include recommendations for additional hardening. |
| 3 | **Some exploitable gaps.** The code handles common cases but has gaps that a motivated attacker or unusual usage pattern could exploit. Requires fixes before merge. |
| 2 | **Significant vulnerabilities.** Multiple exploitable weaknesses found. The code makes unsafe assumptions about inputs, does not handle concurrency correctly, or has clear resource exhaustion vectors. |
| 1 | **Trivially breakable.** Minimal effort required to cause failures, crashes, or unintended behavior. Fundamental assumptions are wrong. |

## Pass Criteria

A submission passes the adversarial review with a rating of 4 or higher when:

- Input validation covers malformed, oversized, and unexpected input types.
- Concurrent access patterns do not produce data corruption, deadlocks, or race conditions.
- Resource usage is bounded — loops terminate, allocations are limited, request rates are throttled where needed.
- The code does not enable privilege escalation or abuse beyond its intended scope.
- Assumptions about callers, inputs, and environment are explicitly validated rather than implicitly trusted.

## Fail Signals

A submission receives a rating below 4 when any of the following are detected:

- **Unvalidated inputs**: Code processes user input without checking type, length, format, or content.
- **Race conditions**: Shared mutable state accessed without synchronization, TOCTOU vulnerabilities, or non-atomic check-then-act sequences.
- **Resource exhaustion**: Unbounded loops, unlimited memory allocation based on user-controlled values, or missing rate limiting on expensive operations.
- **Abuse vectors**: Features that can be misused for denial of service, data exfiltration, or privilege escalation.
- **Fragile assumptions**: Code that assumes inputs are always well-formed, callers are always trusted, or the environment is always stable.

## Special Behavior

This gate can recommend additional hardening measures even when awarding a 4+ rating. These recommendations are advisory and do not block merge, but they are recorded for future consideration.

## Escalation Rules

- On a rating below 4, the submission bounces back to the original assignee with the rating, specific adversarial findings, and reproduction steps where applicable.
- The assignee addresses the findings and resubmits.
- If this gate rates below 4 five times on the same submission, the issue escalates to the Counselor for mediation.

## Example Scenarios

### 5 Stars — Bulletproof

A developer adds a file upload endpoint. It validates file type by content inspection (not just extension), enforces a maximum file size, limits upload rate per user, sanitizes the filename to prevent path traversal, and stores files outside the web root. Concurrent uploads to the same destination are handled atomically. The adversarial review awards 5 stars.

### 4 Stars — Solid with Minor Edge Cases

A developer adds a search endpoint. Input is validated and sanitized, results are paginated with a maximum page size, and rate limiting is applied. However, the reviewer notes that extremely long query strings (10K+ characters) are accepted without truncation, which could cause minor performance degradation. The gate passes at 4 stars with a hardening recommendation to cap query length.

### 2 Stars — Significant Vulnerabilities

A developer adds a webhook handler that processes JSON payloads. The handler does not validate the payload size before parsing, does not verify the webhook signature, and stores the parsed data without sanitization. A malicious actor could send arbitrarily large payloads to exhaust memory or inject crafted data. The gate fails at 2 stars.
