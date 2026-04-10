# UI Functionality Review Gate

## Owner

**Emily Sweeney** — ux-designer

## Type

5-star rating (minimum 4 stars to pass)

## Focus Areas

- UI consistency across components and pages
- Accessibility compliance (WCAG AA minimum)
- Responsive design across standard breakpoints
- User flow coherence (navigation, feedback, error states)
- Visual polish and design system adherence

## Rating Guide

| Stars | Meaning |
|-------|---------|
| 5 | **Pixel-perfect and fully accessible.** UI changes are visually consistent with the design system, meet WCAG AA across all criteria, render correctly at all standard breakpoints, and user flows are intuitive with clear feedback at every step. |
| 4 | **Good UX with minor polish needed.** The UI is functional, accessible, and responsive. Minor issues exist — small alignment inconsistencies, slightly imperfect transitions, or a missing focus indicator on a non-critical element. Nothing blocks usability or accessibility compliance. |
| 3 | **Usable but accessibility gaps.** The core user flow works, but accessibility issues are present — missing alt text, insufficient color contrast, keyboard navigation gaps, or missing ARIA labels. Requires fixes before merge. |
| 2 | **Confusing UX or a11y violations.** The UI has significant usability problems — unclear navigation, missing error states, broken responsive layouts — or multiple WCAG AA violations that affect real users. |
| 1 | **Broken UI.** The interface is non-functional, renders incorrectly, or is completely inaccessible. Core user flows cannot be completed. |

## Pass Criteria

A submission passes the UI functionality review with a rating of 4 or higher when:

- UI changes are visually consistent with the existing design system (spacing, typography, color palette, component patterns).
- Accessibility requirements are met at the WCAG AA level — proper color contrast ratios, keyboard navigability, screen reader compatibility, focus management, and ARIA attributes where needed.
- Responsive behavior is correct at standard breakpoints (mobile, tablet, desktop) with no layout breakage or content overflow.
- User flows are coherent — actions have clear feedback, error states are communicated, loading states are handled, and navigation is intuitive.
- No regressions to existing UI behavior in adjacent components or pages.

## Fail Signals

A submission receives a rating below 4 when any of the following are detected:

- **Accessibility violations**: Missing alt text on images, color contrast ratios below WCAG AA thresholds (4.5:1 for normal text, 3:1 for large text), interactive elements unreachable by keyboard, missing or incorrect ARIA labels, or focus traps.
- **Broken responsive layout**: Content overflows its container, elements overlap at certain breakpoints, touch targets are too small on mobile, or critical content is hidden without a way to access it.
- **Design system inconsistency**: Non-standard spacing, colors outside the palette, custom components that duplicate existing design system components, or typography that deviates from established scales.
- **Poor user flow**: Actions that produce no visible feedback, error states that are silent or cryptic, forms that lose user input on validation failure, or navigation that dead-ends.
- **Visual regressions**: Existing UI elements that render differently after the change without intentional justification.

## Special Behavior

This gate only triggers for PRs that touch UI files — components, styles, layouts, templates, and related assets. If a submission contains no UI file changes, this gate is automatically skipped and reports a pass with a note indicating it was not applicable.

## Escalation Rules

- On a rating below 4, the submission bounces back to the original assignee with the rating, specific UI/UX findings, and screenshots or descriptions of the issues where applicable.
- The assignee addresses the findings and resubmits.
- If this gate rates below 4 five times on the same submission, the issue escalates to the Counselor for mediation.

## Example Scenarios

### 5 Stars — Pixel-Perfect and Fully Accessible

A developer adds a new settings page. The layout follows the existing page template, uses design system components for all form elements, meets WCAG AA contrast ratios, supports keyboard navigation through all interactive elements, includes proper ARIA labels for screen readers, and renders correctly on mobile, tablet, and desktop. The UI functionality review awards 5 stars.

### 4 Stars — Good UX with Minor Polish

A developer updates a data table component. The table is responsive (horizontal scroll on mobile), sortable columns have accessible sort indicators, and the overall design matches the system. However, the reviewer notes that the empty-state illustration is slightly misaligned with the text below it. The gate passes at 4 stars with a polish recommendation.

### 2 Stars — Confusing UX

A developer adds a multi-step form wizard. Step 2 has no back button, validation errors appear only after attempting to submit the final step (not inline), and the progress indicator does not update visually when advancing steps. On mobile, the form fields extend beyond the viewport. The gate fails at 2 stars.
