# Prompt Log

This log records requests and their outcomes in this workspace. Earlier entries are reconstructed from the conversation available when the log was created.

## 1. Review the initial roller-coaster spec

- **What I asked:** Review an initial Roller Coaster Designer outline describing a cart starting at the first hill and reporting speed and rider G-forces.
- **What you changed:** No project files were changed; the spec file was not found during the initial lookup.
- **Whether it worked:** The review was not completed because I asked you to stop.

## 2. Stop the review

- **What I asked:** “Wait stop. don't do anything”
- **What you changed:** No files were changed; work stopped after the directory lookup.
- **Whether it worked:** Yes. No further review or edits were made at that point.

## 3. Review the expanded draft

- **What I asked:** Review a draft describing editable track control points, a starting cart, and the frictionless speed equation; the Outputs section was still blank.
- **What you changed:** No project files were changed for this draft.
- **Whether it worked:** This draft was superseded by the later, more complete spec request.

## 4. Suggest improvements and create the spec

- **What I asked:** Review the fuller roller-coaster spec, suggest additions, wait for my review, then create a polished `spec.md` using my content and the accepted suggestions. I also asked to add a finish line and have the cart brake to a stop after crossing it.
- **What you changed:** Created [spec.md](./spec.md) with track editing, physics and G-force definitions, ride outcomes, outputs, validation, and finish-line braking.
- **Whether it worked:** Yes. The file was created after I approved the suggestions and added the finish-line requirement.

## 5. Summarize and stage the build

- **What I asked:** Read `spec.md`, write a short overview of the app, and suggest 4–6 implementation stages starting with a page-layout mockup; describe what to build and what to check at each stage. I specified not to write code.
- **What you changed:** No code or project files were changed; provided an overview and a five-stage build plan.
- **Whether it worked:** Yes. The response followed the requested scope and began with a layout mockup stage.

## 6. Create this prompt log

- **What I asked:** Create `AGENTS.md` instructions for maintaining a prompt log in `prompts.md`, including earlier and future requests with what was asked, what changed, and whether it worked.
- **What you changed:** Created `AGENTS.md` with logging instructions and this `prompts.md` with the requests available in this conversation.
- **Whether it worked:** Yes. Both files were created; future requests should be logged after they are handled.

## 7. Add overview and build stages to the spec

- **What I asked:** Add the app overview to the top of `spec.md` and the five build stages at the end under a Build stages heading.
- **What you changed:** Added an Overview section and a Build stages section to `spec.md`.
- **Whether it worked:** Yes. Both sections were added while preserving the existing specification.

## 8. Review build-stage feasibility

- **What I asked:** Review the Build stages and assess the feasibility of the planned app.
- **What you changed:** No app or specification changes; provided a feasibility review and implementation risks.
- **Whether it worked:** Yes. The stages were assessed against the app's scope and physics requirements.

## 9. Revise stages for feasibility

- **What I asked:** Make necessary changes after reviewing the feasibility of the planned app stages.
- **What you changed:** Reworked the Build stages in `spec.md` into six incremental steps, separating track geometry, ideal motion, G-force behavior, resistance and ride outcomes, and final feedback.
- **Whether it worked:** Yes. The revised sequence isolates the higher-risk geometry and physics work and gives each stage concrete checks.

## 10. Build Stage 1 mockup

- **What I asked:** Build only Stage 1 from the Build stages section of `spec.md`.
- **What you changed:** Added a static responsive editor and ride-preview layout in `index.html` and `styles.css`, with simple view switching in `app.js`. Track editing controls and ride controls are visual placeholders; no track editing or physics simulation was implemented.
- **Whether it worked:** Yes. Opened the page in a browser, verified the Start ride and screen-switch navigation, and checked that common viewport widths do not cause horizontal overflow.

## 11. Show ride measurements beside the track

- **What I asked:** Adjust the design so velocity, G-force, and total potential energy appear on the same screen as the drawn roller coaster.
- **What you changed:** Reworked the ride view into a track-and-dashboard layout with placeholders for velocity, rider G-force, total potential energy, and ideal speed. Updated `spec.md` to define potential energy relative to the track's lowest point and include it in outputs and validation.
- **Whether it worked:** Yes. Browser checks confirmed that the track and all measurement cards are present together at 390px, 768px, and 1280px widths, with no horizontal overflow.
