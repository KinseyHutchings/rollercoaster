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
