# Faksy project instructions

## Required context

- Before changing product behavior, data models, routes, or user flows, read `docs/PRD.md`.
- Before starting milestone work, read `docs/milestones/README.md` and the matching milestone file.
- Before generating, redesigning, or materially restyling any page, you MUST use the `design-taste-frontend` skill at `/Users/hukeming.5/.codex/skills/taste-skill/SKILL.md`.
- Read that skill completely before page work. Declare its one-line Design Read and explicit `DESIGN_VARIANCE`, `MOTION_INTENSITY`, and `VISUAL_DENSITY` values before writing page code.
- Apply the skill contextually to this mobile product UI. Use its visual language, accessibility, responsive, motion, theme, icon, copy, and pre-flight requirements without forcing landing-page-only layouts onto the editor.
- Run the skill's final pre-flight check before considering a generated page complete. Fix any applicable failed check instead of merely documenting the failure.
- Treat `docs/PRD.md` as the product source of truth. If implementation and PRD conflict, stop and surface the conflict before broadening scope.

## Product scope

- The MVP supports two-person chat image creation only.
- Keep participant and message models extensible to group chats. Do not encode the model as fixed `leftUser` and `rightUser` fields.
- WeChat-style and WhatsApp-style templates are MVP requirements.
- Forum generation, custom sticker images, and group chat are post-MVP features unless the user explicitly changes the milestone scope.
- Generated content is fictional. Do not add misleading platform verification or official-brand claims.

## Engineering conventions

- Use React and TypeScript for new production components. Migrate prototype JSX incrementally when implementing the MVP.
- Implement pages through composed components. Do not place a whole page, all editor panels, persistence logic, and export logic in one `App` or page component.
- Keep components highly cohesive and loosely coupled:
  - `App` owns view selection and top-level orchestration only.
  - Page components compose features and pass explicit props.
  - Domain components own one coherent UI responsibility, such as chat preview, message editing, participant editing, draft listing, or export results.
  - IndexedDB access stays in the data layer and must not be implemented inside visual components.
  - Pagination and export planning stay in pure domain modules where possible.
  - Platform templates provide tokens and small template-specific components instead of branching throughout every editor component.
- Prefer feature folders with local components, hooks, and tests. Extract shared components only after two or more features genuinely share the same behavior.
- Avoid hidden coupling through mutable module globals. Pass project state, callbacks, asset URLs, and template tokens through typed interfaces or focused hooks.
- Keep editor-only state separate from the serializable project document. Dialog state, selected tabs, toasts, and temporary export results do not belong in persisted project data.
- Store drafts and uploaded image blobs in IndexedDB. Do not place uploaded images or full projects in `localStorage`.
- Give participants, messages, drafts, forum posts, and replies stable IDs.
- Preserve message order using an explicit ordered array. Do not derive order from object keys or timestamps.
- Keep editor-only controls outside the export render tree. Trash buttons, selection outlines, handles, and dialogs must never appear in generated images.
- Build export pages from measured message blocks before rasterization. Never create one long image and crop it at arbitrary pixel offsets.
- Wait for fonts and uploaded images to finish loading before measuring or exporting.

## Visual and interaction rules

- Mobile-first layout must work at 375px and 390px widths without horizontal overflow.
- After a user selects a format, the editor must not repeat the format-selection header.
- The editor back action must open a save-draft dialog when the current project has unsaved changes.
- Use one accent color and one documented radius system per page.
- Use Phosphor icons. Do not hand-roll SVG icon paths.
- Support light and dark modes and respect reduced-motion preferences.
- Visible product copy must not use em dashes.

## Verification

- Run `npm run build` after code changes.
- For UI work, inspect the page at 375px and 390px widths.
- For export work, test all of the following:
  - one-page conversation;
  - conversation spanning multiple pages;
  - a message that exactly fits the remaining page space;
  - a message that moves intact to the next page;
  - an oversized single message that must block export;
  - avatars and background images loaded from IndexedDB;
  - identical exported dimensions across every page;
  - stable chronological order with no missing or duplicated messages;
  - no editor-only controls in exported images.

## Documentation maintenance

- Update `docs/PRD.md` when accepted product behavior changes.
- Update the relevant milestone checklist when implementation status changes.
- Record newly discovered technical constraints in the PRD instead of leaving them only in task transcripts.
