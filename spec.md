# Roller Coaster Designer

## Overview

The app lets users shape a 2D roller-coaster track by editing control points, then run a cart from rest at the first hill. It displays the cart's speed and signed G-force, compares speed with an ideal frictionless calculation, and shows the ride's progress on graphs. The simulation includes rolling resistance and air drag, can roll back if the cart cannot reach a crest, stops on G-force-limit violations, and brakes the cart after it crosses the finish line.

## Purpose

Let a user design a 2D roller-coaster track, simulate a cart starting from rest at the first hill, and observe the cart's speed and the rider's g-force throughout the ride.

## Inputs and Track Editing

- The opening screen shows an editable track line near the top of the screen, with control points along it.
- The user can select and drag control points to shape the track, add points, and remove selected points. The track is drawn as a smooth curve through the control points.
- A track must contain at least two distinct points and have a nonzero length. The first point is the starting crest; the cart starts there at rest. The last point is the finish.
- The cart is shown as a square with a stick-figure rider. It is placed at the starting point before the ride begins.
- Selecting **Start** finishes editing and begins the simulation. The user can pause, resume, or reset the ride.
- The track must not contain loops. The cart is constrained to follow the track.

## Calculations

- Use meters, seconds, kilograms, and meters per second internally. Use gravitational acceleration \(g = 9.81\ \mathrm{m/s^2}\). World height increases upward; screen coordinates are transformed for display.
- Calculate speed from the cart's change in mechanical energy. In the ideal, frictionless case, with the cart starting from rest at height \(h_0\), speed at height \(h\) is:

  \[
  v = \sqrt{2g(h_0-h)}
  \]

- Use a fixed cart mass of 225 kg and let the user set rider mass from 20–200 kg (default 75 kg). Use their sum as the total vehicle mass for potential energy and dynamics.
- The ride simulation includes rolling resistance and air drag. Use documented, fixed model parameters for rolling resistance and drag; the total vehicle mass is the fixed cart mass plus the user's rider mass. The ideal equation above is the no-friction reference and validation case, not the speed calculation for a ride with losses.
- Calculate total gravitational potential energy for the cart and rider relative to the track's lowest point: \(U = m_{\text{total}}g(h-h_{\min})\). Display this value in kilojoules. In gravity-only mode, changing rider mass changes potential energy but not speed; normalized G-force in units of \(g\) is also independent of rider mass. The corresponding support/restraint force in newtons does scale with rider mass.
- Treat the cart and rider as a simplified rigid system that follows the track. Calculate the signed rider G-force as the track-normal support/restraint force divided by the rider's weight. Positive values press the rider into the seat; negative values represent restraint loading. At a horizontal valley with radius \(R\):

  \[
  n = 1 + \frac{v^2}{gR}
  \]

  At a horizontal crest:

  \[
  n = 1 - \frac{v^2}{gR}
  \]

- If the cart cannot reach the next crest, it slows, stops, and rolls back along the track under gravity and the modeled resistance.
- If G-force exceeds \(+4g\) or falls below \(-1g\), end the run, mark the location, and report a G-force failure. Do not treat this as an energy-related rollback.
- When the cart crosses the finish line at the last point, apply braking and smoothly bring it to rest. Report the ride as completed once it stops.

## Outputs

- Show the cart and rider moving along the track.
- During the ride, display speed in mph, signed rider G-force in g, and total gravitational potential energy in kJ. Convert speed from the internal units for display.
- Provide a rider-mass control in kilograms and show rider and total vehicle mass beside the potential-energy readout.
- Provide an optional spoken readout of speed and G-force, with a control to enable or disable narration.
- Show plots of speed (mph) and G-force (g) against distance along the track. Label both axes and identify the current cart position.
- Provide an ideal, frictionless speed reference based on conservation of energy.
- Mark the location of a rollback, G-force failure, or finish crossing on the track, and state the outcome.

## Look and Feel

- Use a simple, cartoon-like visual style and a stick-figure rider.
- Keep the track editor uncluttered, with clear controls for adding and removing points.
- Display this instruction at the top of the editing screen:

  > Drag a control point along the line, then move it to set the height and depth of the track. To remove a point, select it and press Delete. When you are finished, select Start.

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
- Verify that crossing the finish line starts braking and the cart comes to rest with a completed outcome.
- Reject tracks with fewer than two distinct points or zero length, and verify that users receive a clear explanation.

## Out of Scope

- Loops and three-dimensional tracks.
- Wind and environmental effects.
- Detailed structural engineering, restraint design, or biomechanical modeling of riders.

## Build stages

### 1. Mock up the page layout

- **Build:** Static editor and ride-screen layouts, including the track area, point-editing controls, rider-mass input, Start button, cart, finish marker, live-readout placeholders for velocity, G-force, potential energy, and ideal speed, and graph placeholders.
- **Check:** Editing and ride controls are easy to find, and the coaster drawing and all four ride measurements are visible together and remain readable on both screens. The rider-mass control communicates its range and units. Do not depend on working physics in this stage.

### 2. Build the track model and editor

- **Build:** Store control points in world coordinates (horizontal distance and height in meters) and map them to the screen. Interpolate them with a centripetal Catmull–Rom spline, represented as cubic Bézier spans and sampled in world coordinates for validation and later motion/curvature calculations. Render the track, support selecting and dragging points, keyboard adjustments, adding and removing points, and basic track validation. Add a Start over action that restores the starter track after confirmation.
- **Check:** Points remain anchored while edited; the curve updates predictably; the start and finish stay at the horizontal bounds, the starting crest is higher than the next point, and intermediate points remain ordered; invalid, zero-length, self-crossing, or looped tracks are rejected with a clear explanation; the Start button is unavailable for invalid tracks. Canceling Start over preserves the current design; confirming it stops any run and restores the starter layout.

### 3. Add ideal motion

- **Build:** Start-at-rest behavior and time-based cart movement constrained to the edited track, pause/resume/reset controls, a rider-mass input, live speed and ideal-speed readouts, and total gravitational potential energy relative to the track's lowest point. Use gravity only; rolling resistance and air drag are not part of this stage.
- **Check:** At points below the starting height, including uphill sections, speed matches \(v = \sqrt{2g(h_0-h)}\); changing rider mass changes potential energy but not ideal speed; ideal total mechanical energy remains constant within numerical tolerance; the cart remains on the track and responds correctly to pause, resume, and reset.

### 4. Add G-force calculations and limits

- **Build:** Signed track-normal G-force calculations, live G-force display, and termination with a marked location when either specified G-force limit is crossed. If reporting support/restraint force in newtons, calculate it using the configured rider mass.
- **Check:** Valley and crest results match the specified equations and normalized G-force is independent of rider mass; support/restraint force in newtons scales with rider mass; ordinary track sections produce stable readings; crossing either limit reports a G-force failure rather than an energy-related rollback.

### 5. Add resistance and ride outcomes

- **Build:** Rolling resistance and air drag using documented fixed parameter values, energy-loss behavior, rollback when the cart cannot reach a crest, and braking after the finish line.
- **Check:** Resistance never adds mechanical energy; a cart unable to reach a crest stops and rolls back; a cart crossing the finish line brakes to a stop and reports completion.

### 6. Complete ride feedback and validation

- **Build:** Speed readout in mph, total potential-energy readout in kJ, optional spoken readouts, labeled speed and G-force plots with a current-position indicator, outcome markers, and final visual polish.
- **Check:** Plotted values and units match the live readouts; potential energy follows cart height; narration can be enabled and disabled; rollback, failure, and completion locations are clear; all validation cases in this spec pass.
