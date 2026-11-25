# Roller Coaster Designer

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

- The ride simulation includes rolling resistance and air drag. Use documented, fixed model parameters for cart mass, rolling resistance, and drag; users do not need to enter them. The ideal equation above is the no-friction reference and validation case, not the speed calculation for a ride with losses.
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
- During the ride, display speed in mph and signed rider G-force in g. Convert speed from the internal units for display.
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
- On a horizontal valley, verify the G-force against \(n = 1 + v^2/(gR)\); on a horizontal crest, verify it against \(n = 1 - v^2/(gR)\).
- Verify that modeled rolling resistance and air drag do not increase the cart's mechanical energy.
- Verify that the cart rolls back when it cannot reach the next crest.
- Verify that crossing either G-force limit ends the run and marks the failure location.
- Verify that crossing the finish line starts braking and the cart comes to rest with a completed outcome.
- Reject tracks with fewer than two distinct points or zero length, and verify that users receive a clear explanation.

## Out of Scope

- Loops and three-dimensional tracks.
- Wind and environmental effects.
- Detailed structural engineering, restraint design, or biomechanical modeling of riders.
