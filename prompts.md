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

## 12. Show measurements in the track editor

- **What I asked:** Show velocity, G-force, total potential energy, and ideal speed on the Track editor screen alongside the editable track.
- **What you changed:** Added a four-metric placeholder strip to the editor track card and updated the Stage 1 check in `spec.md` to require all four measurements alongside the track in both screens.
- **Whether it worked:** Yes. Browser checks confirmed all four labels are visible in the editor at 390px, 768px, and 1280px widths, with no horizontal overflow.

## 13. Build Stage 2 track editor

- **What I asked:** Build only Stage 2 from the Build stages section of `spec.md`.
- **What you changed:** Implemented meter-based track coordinates, a sampled centripetal Catmull–Rom spline, interactive point selection/dragging/keyboard adjustment, add/remove controls, and track validation. Updated Stage 2 in `spec.md` to document the interpolation and ordering checks. No ride physics was added.
- **Whether it worked:** Browser checks passed for add/remove, drag, keyboard edits, endpoint removal, the two-point minimum, invalid-track Start blocking, and responsive widths. A standalone `node --check` could not run because Node.js is unavailable; the browser loaded and exercised the script successfully.

## 14. Explain Node.js availability and review the editor script

- **What I asked:** Explain why Node.js was unavailable and review the JavaScript to ensure it works correctly.
- **What you changed:** Reviewed and exercised `app.js` in the browser, found that it allowed a track whose first section climbed above the starting point, and added a starting-crest validation with a clear message. Updated the Stage 2 check in `spec.md`.
- **Whether it worked:** The shell confirms `node`, `nodejs`, Bun, Deno, and other checked runtimes are not on `PATH`. Browser tests passed for editing actions, validation and Start blocking, recovery, responsive widths, and no page errors.

## 15. Build Stage 3 ideal motion

- **What I asked:** Build only Stage 3 from the Build stages section of `spec.md`.
- **What you changed:** Implemented gravity-only cart motion along the edited track, fixed-step simulation, live ideal-speed and potential-energy readouts, and pause/resume/reset controls. Updated `spec.md` with Stage 3 behavior and the prototype 300 kg combined cart-and-rider mass. G-force physics, resistance, charts, and narration remain out of this stage.
- **Whether it worked:** Browser checks confirmed the speed matches the ideal energy equation as the cart moves, the cart follows the edited track, controls work, and the run reports when it reaches the track endpoint. The editor and ride layouts had no horizontal overflow at 390px, 768px, or 1280px. A standalone Node.js syntax check was unavailable; browser runtime checks succeeded.

## 16. Validate uphill speed and add rider mass

- **What I asked:** Validate that the cart's velocity is correct on uphill sections, add a user-adjustable rider mass, and account for its effects on speed, potential energy, and future G-force calculations.
- **What you changed:** Changed the velocity readout to use the simulated speed while keeping ideal speed as a separate reference. Added a 20–200 kg rider-mass slider (default 75 kg), a fixed 225 kg cart mass, and mass-aware potential-energy readouts. Updated `spec.md` to document that rider mass changes potential energy and absolute support force, but not ideal speed or normalized G-force in gravity-only mode.
- **Whether it worked:** Browser checks sampled the full ride: measured speed matched the energy equation within 0.05 mph (display rounding), and speed decreased through the uphill section; at about 30 m high it read 31.4 mph, as predicted. Increasing rider mass from 75 kg to 125 kg raised total mass from 300 kg to 350 kg and potential energy from 117.8 kJ to 137.4 kJ, while ideal speed stayed unchanged. The mass control locks during a run, unlocks on reset, responsive widths showed no overflow, and there were no browser page errors. G-force calculation remains a future stage.

## 17. Add a start-over action

- **What I asked:** Add a button to start over or create a new track. I chose restoring the built-in starter track and requiring confirmation before replacing the current design.
- **What you changed:** Added a Start over button that confirms before replacing the current layout, stops any active run, restores the starter track, and preserves rider mass. Updated the Stage 2 build/check details in `spec.md`.
- **Whether it worked:** Browser checks confirmed canceling preserves the edited track and active run; confirming restores the starter layout, returns to the editor, resets the cart, and unlocks editing. No browser page errors occurred, and `git diff --check` passed.

## 18. Build Stage 4 G-force calculations

- **What I asked:** Build only Stage 4 from the Build stages section of `spec.md`.
- **What you changed:** Added signed track-normal G-force calculation from track tangent and local curvature, live G-force readouts in both screens, and stop-at-limit handling with a failure marker and explicit +4 g / −1 g status. Updated the stage badge and documented the general force equation and curvature convention in `spec.md`. Resistance, rollback behavior, charts, and narration remain out of scope.
- **Whether it worked:** Browser checks confirmed both limit paths stop and mark the cart location: the starter track stops at +4.0 g and a custom crest track stops at −1.0 g. The displayed force matched each boundary, failure reasons were correct, G-force was unchanged when rider mass changed, reset cleared the failure state, and there were no browser page errors.

## 19. Keep designed tracks within G-force limits

- **What I asked:** Prevent tracks from exceeding the +4 g/−1 g limits and add an Edit current track action on the ride drawing. I chose pre-ride validation and guidance rather than automatic braking.
- **What you changed:** Added a pre-run G-force scan over the reachable ideal trajectory that blocks unsafe tracks and reports the first unsafe location with advice to widen the curve or reduce the drop. Adjusted the starter track so it passes the limits. Added Edit current track to stop/reset a run and return to an unlocked editor without losing the design. Updated Stage 4 requirements in `spec.md`.
- **Whether it worked:** The starter ride reached the endpoint with sampled G-forces between 0.32 g and 3.32 g. Browser checks confirmed the editor blocks tracks predicted above +4 g and below −1 g, offers location-specific guidance, and that Edit current track preserves the track and makes its points editable. Responsive checks at 390px, 768px, and 1280px showed no horizontal overflow; there were no browser errors.

## 20. Reevaluate typical hills and valleys

- **What I asked:** Recheck the G-force calculations and ensure a normal roller-coaster layout with hills and valleys can be drawn.
- **What you changed:** Replaced the descending-only starter layout with a six-point track containing two clear valleys and two hills. Kept the signed normal-force equation and safety validator, and clarified that broad, smooth curves allow larger hills while meeting the G-force limits.
- **Whether it worked:** The starter track passed pre-ride safety validation and completed to the endpoint. Sampling every animation frame (694 samples) measured G-forces from −0.13 g to +3.25 g, within the −1 g/+4 g limits. Browser checks reported no page errors.

## 21. Specify only a lift hill

- **What I asked:** Adjust `spec.md` to include only a lift hill that pulls the car to the top of a hill.
- **What you changed:** Updated the specification to describe the automatic 2 m/s lift to the first crest and release from rest. Removed loop and thrill-score requirements and marked them out of scope; no application code was changed.
- **Whether it worked:** Yes. The specification now covers the lift hill without loops or thrill scoring, and `git diff --check` passes.

## 22. Remove loop capability

- **What I asked:** Remove loop capability and keep the track editor based on its control points on the line.
- **What you changed:** Removed loop creation and its radius control, restored left-to-right control-point ordering, and removed the paired thrill-score display and calculations to match the lift-only specification.
- **Whether it worked:** The code and UI changes are complete; browser checks are pending.

## 23. Increase lift-hill speed

- **What I asked:** Adjust the lift-hill speed to 5 m/s.
- **What you changed:** Set the simulated lift speed to 5 m/s and updated the interface and specification to match.
- **Whether it worked:** The source and specification now consistently use 5 m/s; `git diff --check` passes and no stale 2 m/s references remain. Browser validation was not run.
