# Roller Coaster Designer

## Overview

The app lets users shape a 2D roller-coaster track with hills and valleys, then ride it while viewing speed, signed G-force, and potential energy. If the track begins uphill, a powered lift pulls the cart to the first crest before gravity takes over. The app blocks tracks predicted to exceed the +4 g / −1 g safety limits.

## Purpose

Let a user design and ride a 2D roller coaster with hills and valleys, including a powered lift hill when the starting track rises, and observe the cart's speed and rider G-force.

## Inputs and Track Editing

- The opening screen shows an editable track line near the top of the screen, with control points along it.
- The user can select and drag control points to shape the track, add points, and remove selected interior points. The track is drawn as a smooth curve through the control points, which remain ordered from start to finish.
- The first point is the start and the last point is the finish. Neither endpoint can be removed, and both remain at their horizontal bounds.
- A track must contain at least two distinct points and have a nonzero length.
- The cart is shown as a square with a stick-figure rider. It is placed at the starting point before the ride begins.
- Selecting **Start** finishes editing and begins the simulation. The user can pause, resume, or reset the ride.
- If the first point is lower than the next control point, automatically engage a powered lift hill that pulls the cart up to the first crest at 5 m/s, then releases it from rest. Otherwise, start from rest at the first point. An uphill start without a clear crest before the finish is invalid.
- The cart is constrained to follow the track.

## Calculations

- Use meters, seconds, kilograms, and meters per second internally. Use gravitational acceleration \(g = 9.81\ \mathrm{m/s^2}\). World height increases upward; screen coordinates are transformed for display.
- Calculate speed from the cart's change in mechanical energy. In the ideal, frictionless case, with the cart starting from rest at height \(h_0\), speed at height \(h\) is:

  \[
  v = \sqrt{2g(h_0-h)}
  \]

- During the powered lift, constrain the cart to 5 m/s. The lift supplies external energy; after release, use the crest's release height as \(h_0\) in the ideal gravity equation.
- Model rolling resistance as \(a_r = C_{rr}g\cos(\theta)\), with a fixed coefficient \(C_{rr}=0.005\). Model air drag as \(F_d = \frac{1}{2}\rho C_dA v^2\), using fixed air density \(\rho=1.225\ \mathrm{kg/m^3}\) and drag area \(C_dA=0.8\ \mathrm{m^2}\); use total vehicle mass to calculate drag acceleration.
- Begin braking when the remaining track distance is within the estimated stopping distance \(v^2/(2a_b)\), using a net braking deceleration of at least \(a_b=4\ \mathrm{m/s^2}\). Continue braking after finish crossing if needed, and report completion when the cart reaches rest.
- Use a fixed cart mass of 225 kg and let the user set rider mass from 20–200 kg (default 75 kg). Use their sum as the total vehicle mass for potential energy and dynamics.
- The ride simulation includes rolling resistance and air drag. Use documented, fixed model parameters for rolling resistance and drag; the total vehicle mass is the fixed cart mass plus the user's rider mass. The ideal equation above is the no-friction reference and validation case, not the speed calculation for a ride with losses.
- Calculate total gravitational potential energy for the cart and rider relative to the track's lowest point: \(U = m_{\text{total}}g(h-h_{\min})\). Display this value in kilojoules. In gravity-only mode, changing rider mass changes potential energy but not speed; normalized G-force in units of \(g\) is also independent of rider mass. The corresponding support/restraint force in newtons does scale with rider mass.
- Treat the cart and rider as a simplified rigid system that follows the track. Calculate the signed rider G-force as the track-normal support/restraint force divided by the rider's weight. Positive values press the rider into the seat; negative values represent restraint loading. For track tangent angle \(\theta\) from horizontal and signed curvature \(\kappa\):

  \[
  n = \cos(\theta) + \frac{v^2\kappa}{g}
  \]

  Curvature is positive for a valley (concave up) and negative for a crest (concave down); estimate it from the local change in tangent angle along the sampled track. At a horizontal valley with radius \(R\):

  \[
  n = 1 + \frac{v^2}{gR}
  \]

  At a horizontal crest:

  \[
  n = 1 - \frac{v^2}{gR}
  \]

- Enforce the same +4 g and −1 g limits during both powered-lift and gravity-driven motion.
- If the cart cannot reach the next crest, it slows, stops, and rolls back along the track under gravity and the modeled resistance.
- If G-force exceeds \(+4g\) or falls below \(-1g\), end the run, mark the location, and report a G-force failure. Do not treat this as an energy-related rollback.
- Before enabling Start, estimate the signed G-force along the reachable ideal run from rest and block tracks predicted to cross either limit. Identify the first predicted violation and suggest widening the valley/crest or reducing the drop that produced it.
- When the cart crosses the finish line at the last point, apply braking and smoothly bring it to rest. Report the ride as completed once it stops.

## Outputs

- Show the cart and rider moving along the track.
- During the ride, display speed in mph, signed rider G-force in g, and total gravitational potential energy in kJ. Convert speed from the internal units for display.
- Provide a rider-mass control in kilograms and show rider and total vehicle mass beside the potential-energy readout.
- Provide an optional spoken readout of speed and G-force, with a control to enable or disable narration.
- Show plots of speed (mph) and G-force (g) against distance along the track. Label both axes and identify the current cart position.
- Provide an ideal, frictionless speed reference based on conservation of energy.
- Mark the location of a rollback, G-force failure, or finish crossing on the track, and state the outcome. For a rollback, explain that the cart lacked enough velocity to clear the next hill and suggest increasing the starting drop or lowering the next crest.
- Provide an Edit current track action on the ride drawing; selecting it stops and resets the current run and returns to the editor without losing the track or rider-mass setting.

## Look and Feel

- Use a simple, cartoon-like visual style and a stick-figure rider.
- Keep the track editor uncluttered, with clear controls for adding and removing points.
- Explain that the start and finish are fixed endpoints and that an uphill start uses a powered lift hill to reach its first crest.

- Make the cart, current position, finish line, and any failure marker visually distinct.
- Keep live measurements and plots readable while the ride is running.

## Validation

- In ideal mode, verify that a cart starting from rest follows \(v = \sqrt{2g(h_0-h)}\) at points below the starting height.
- Verify speed decreases on uphill sections as height increases and that changing rider mass does not change ideal speed.
- On a horizontal valley, verify the G-force against \(n = 1 + v^2/(gR)\); on a horizontal crest, verify it against \(n = 1 - v^2/(gR)\).
- Verify that potential energy is zero at the track's lowest point, increases with cart height, and scales linearly with total vehicle mass.
- Verify that modeled rolling resistance and air drag do not increase the cart's mechanical energy.
- Verify that the cart rolls back when it cannot reach the next crest.
- Verify that crossing either G-force limit ends the run and marks the failure location.
- Verify that the editor blocks tracks predicted to exceed either G-force limit and reports the first unsafe location with a useful track-shaping hint.
- Verify that an uphill start uses a 5 m/s lift to the first crest, releases from rest, and then follows the ideal energy equation relative to the release height.
- Verify that neither endpoint can be removed, while interior points remain removable.
- Verify that Edit current track returns to an unlocked editor while preserving the current track and rider-mass setting.
- Verify that crossing the finish line starts braking and the cart comes to rest with a completed outcome.
- Reject tracks with fewer than two distinct points or zero length, and verify that users receive a clear explanation.

## Out of Scope

- Three-dimensional tracks.
- Vertical loops and thrill scoring.
- Wind and environmental effects.
- Detailed structural engineering, restraint design, or biomechanical modeling of riders.

## Build stages

### 1. Mock up the page layout

- **Build:** Static editor and ride-screen layouts, including the track area, point-editing controls, rider-mass input, Start button, cart, finish marker, live-readout placeholders for velocity, G-force, potential energy, and ideal speed, and graph placeholders.
- **Check:** Editing and ride controls are easy to find, and the coaster drawing and all four ride measurements are visible together and remain readable on both screens. The rider-mass control communicates its range and units. Do not depend on working physics in this stage.

### 2. Build the track model and editor

- **Build:** Store control points in world coordinates (horizontal distance and height in meters) and map them to the screen. Interpolate them with a centripetal Catmull–Rom spline, represented as cubic Bézier spans and sampled in world coordinates for validation and later motion/curvature calculations. Keep points ordered, protect the fixed start and finish endpoints from removal, and support selecting/dragging points, keyboard adjustments, adding/removing interior points, and basic validation. Add a Start over action that restores the starter track after confirmation.
- **Check:** Points remain anchored while edited; the curve updates predictably; the start and finish stay at the horizontal bounds and cannot be removed; invalid, out-of-bounds, or zero-length tracks are rejected with a clear explanation; the Start button is unavailable for invalid tracks. Canceling Start over preserves the current design; confirming it stops any run and restores the starter layout.

### 3. Add ideal motion

- **Build:** Start-at-rest behavior and time-based cart movement constrained to the edited track, pause/resume/reset controls, a rider-mass input, live speed and ideal-speed readouts, and total gravitational potential energy relative to the track's lowest point. Use gravity only; rolling resistance and air drag are not part of this stage.
- **Check:** At points below the starting height, including uphill sections, speed matches \(v = \sqrt{2g(h_0-h)}\); changing rider mass changes potential energy but not ideal speed; ideal total mechanical energy remains constant within numerical tolerance; the cart remains on the track and responds correctly to pause, resume, and reset.

### 4. Add G-force calculations and limits

- **Build:** Signed track-normal G-force calculations using the local track tangent and curvature, live G-force display, pre-ride safety validation over the reachable ideal trajectory, and termination with a marked location if either limit is crossed during a run. Provide guidance for revising a track that is predicted to be unsafe and an Edit current track action on the ride drawing. If reporting support/restraint force in newtons, calculate it using the configured rider mass.
- **Check:** Valley and crest results match the specified equations and normalized G-force is independent of rider mass; support/restraint force in newtons scales with rider mass; the starter layout contains multiple hills and valleys and remains within both G-force limits; ordinary track sections produce stable readings; unsafe tracks cannot start and identify the first unsafe location; crossing either limit stops the run, marks the track location, and reports a G-force failure rather than an energy-related rollback; Edit current track preserves the design and unlocks editing.

### 5. Add the powered lift hill

- **Build:** When the start point is below the next point, automatically use a powered lift hill to pull the cart to the first crest at 5 m/s, then release it from rest. Tracks without an uphill start begin from rest at the start point.
- **Check:** The lift stops at the first crest and releases the cart from rest; after release, speed follows the ideal energy equation relative to the release height; an uphill start without a clear crest is rejected.

### 6. Add resistance and ride outcomes

- **Build:** Rolling resistance (\(C_{rr}=0.005\)) and air drag (\(\rho=1.225\ \mathrm{kg/m^3}\), \(C_dA=0.8\ \mathrm{m^2}\)) using the configured total vehicle mass, energy-loss behavior, rollback when the cart cannot reach a crest, and braking that begins within the estimated stopping distance of the finish with at least \(4\ \mathrm{m/s^2}\) net deceleration.
- **Check:** Resistance never adds mechanical energy; a cart unable to reach a crest stops and rolls back with its location marked; the cart begins slowing before the finish, then brakes to rest and reports completion.

### 7. Complete ride feedback and validation

- **Build:** Speed readout in mph, total potential-energy readout in kJ, optional spoken readouts, labeled speed and G-force plots with a current-position indicator, outcome markers, and final visual polish.
- **Check:** Plotted values and units match the live readouts; potential energy follows cart height; narration can be enabled and disabled; rollback, failure, and completion locations are clear; all validation cases in this spec pass.
