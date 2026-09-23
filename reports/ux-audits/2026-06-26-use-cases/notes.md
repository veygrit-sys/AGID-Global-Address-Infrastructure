# AGID Use-Case UX Audit

Date: 2026-06-26
Scope: local browser operation on `http://127.0.0.1:3000/`

## Captured Steps

1. `01-home-map.png`
   - Scenario: first-time user opens AGID Map.
   - Health: partial.
   - Notes: The map loads and the search bar is immediately visible. Primary use is understandable, but icon-only buttons lack accessible names and the address registration path is not visible without opening the menu.

2. `02-side-menu.png`
   - Scenario: user looks for saved places, AOID, address registration, settings, and help.
   - Health: partial.
   - Notes: The menu is calm and readable, but it hides key work actions. Address registration is discoverable only after opening the side menu. The menu-open button itself has an empty accessible name.

3. `03-address-registration.png`
   - Scenario: user starts address registration.
   - Health: usable but heavy.
   - Notes: The form opens full-screen and the fields are near the top, which is good. The first viewport still contains a large AOID explanation panel and shipping-label preview before the user reaches the core form. For field use, this delays typing.

4. `04-registration-postcode.png`
   - Scenario: user enters a Japanese postcode.
   - Health: partial.
   - Notes: Postal autofill appears and confirms that fields were filled from postal data. The character-by-character postcode UI is precise, but the visible segmented boxes can look incomplete or confusing when focus remains on an extra box. A paste-friendly single input with optional segmentation would be safer.

5. `05-route-mismatch-developer.png`
   - Scenario: developer or OSS evaluator opens `/developer` on the already-running `127.0.0.1:3000` server.
   - Health: environment mismatch, not confirmed as a current-worktree app bug.
   - Notes: Direct navigation to `/developer`, `/open-source`, `/portal`, `/pos`, `/field`, `/postal-zones`, and `/research` all kept rendering the map screen on port 3000. Follow-up process inspection showed port 3000 was served from a different worktree: `C:\Users\kitau\.codex\worktrees\1a6e\AGID`, not this audited workspace. Treat this as a dev-environment provenance risk.

6. `06-current-worktree-developer-5174.png`
   - Scenario: developer opens `/developer` on the current workspace started locally on port 5174.
   - Health: usable.
   - Notes: The current worktree rendered the Developer Console after the lazy route loaded. Other checked routes also rendered their intended surfaces on port 5174. The remaining risk is that the user-facing port can silently point to an older worktree.

## Use Cases Checked

- Consumer registering an address: possible, but hidden behind side menu and too much non-form content appears before typing.
- Postal-code-assisted registration: partially works; needs clearer completion and paste behavior.
- OSS evaluator opening docs/developer page: usable on the current worktree; blocked only when port 3000 points to an older worktree.
- POS / field / hotel / postal-zone operator: usable on the current worktree; blocked only when the visible app server is not the audited workspace.
- Map-first search user: initial map is usable, but icon-only actions need stronger labels and role clarity.

## Highest Priority Improvements

1. Add a visible dev-server provenance indicator or startup check so port 3000 cannot silently show a different worktree.
2. Add route smoke tests that load `/developer`, `/open-source`, `/portal`, `/pos`, `/field`, `/postal-zones`, and `/research` in a browser and assert the expected screen is visible.
3. Make address registration a clear first-class action from the map without requiring the side menu.
4. Add proper `aria-label` to all icon-only buttons.
5. Compress address registration first viewport to country, language tabs, and first input fields.
6. Replace segmented postcode-only entry with a paste-friendly input that still supports fixed-length character display.
7. Keep status, trust, and algorithm metadata below the form until the user asks for detail.
