# Flag Quiz Enter-to-Next Design

## Goal

On the Country by flag and Flag by country quiz pages, pressing Enter advances to the next round only when the blue Next button is visible (after the user has selected an answer).

## Context

The Every Country Is Unique quiz already uses Enter after an answer to load the next puzzle, via `onKeyDown` on the search input. The flag quizzes have no text input; they show a blue Next button (`Next Flag` / `Next Country`) only when `selectedAnswer !== null`.

## Behavior

- Enter does nothing before an answer is selected.
- After an answer is selected (`selectedAnswer !== null`), Enter calls the same handler as the Next button (`handleNextRound`).
- No other keyboard shortcuts are added.
- No keyboard-controls help UI is added.

## Approach

Add a document-level `keydown` listener in each quiz page component via `useEffect`:

- Dependency: `selectedAnswer` (and the next-round handler as needed).
- Register the listener only when `selectedAnswer !== null`.
- On `key === 'Enter'`: `preventDefault()` and call `handleNextRound()`.
- Remove the listener on cleanup (including when `selectedAnswer` becomes `null`).

Apply the same pattern in both:

- `frontend/src/app/quiz/country-by-flag/page.tsx`
- `frontend/src/app/quiz/flag-by-country/page.tsx`

Do not extract a shared hook for this change; the two pages already duplicate structure.

## Out of scope

- Number-key option selection
- Keyboard help section
- Refactoring shared quiz logic between the two pages
- Changes to Every Country Is Unique quiz keyboard behavior

## Testing

Manually verify on both pages:

1. Before answering, Enter does not change the round.
2. After answering, Enter advances to a new round (new flag/options).
3. Clicking the Next button still works as before.
