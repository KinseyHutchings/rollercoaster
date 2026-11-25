const svgNamespace = 'http://www.w3.org/2000/svg';
const tabs = document.querySelectorAll('.view-tab');
const screens = {
  editor: document.querySelector('#editor-screen'),
  ride: document.querySelector('#ride-screen'),
};
const trackSvg = document.querySelector('#editor-track');
const trackCard = document.querySelector('#editor-screen .track-card');
const trackFill = document.querySelector('#editor-fill');
const trackSupport = document.querySelector('#editor-support');
const trackRail = document.querySelector('#editor-rail');
const trackTies = document.querySelector('#editor-ties');
const controlGroup = document.querySelector('#editor-control-points');
const cart = document.querySelector('#editor-cart');
const finishFlag = document.querySelector('#editor-finish');
const rideFill = document.querySelector('#ride-fill');
const rideSupport = document.querySelector('#ride-support');
const rideRail = document.querySelector('#ride-rail');
const rideCart = document.querySelector('#ride-cart');
const rideFinishFlag = document.querySelector('#ride-finish');
const rideFailureMarker = document.querySelector('#ride-failure-marker');
const rideRollbackMarker = document.querySelector('#ride-rollback-marker');
const rollbackNotice = document.querySelector('#rollback-notice');
const trackStatus = document.querySelector('#track-validation');
const trackStatusIcon = document.querySelector('#track-status-icon');
const selectedPointName = document.querySelector('#selected-point-name');
const addPointButton = document.querySelector('#add-point');
const removePointButton = document.querySelector('#remove-point');
const riderMassInput = document.querySelector('#rider-mass');
const riderMassValue = document.querySelector('#rider-mass-value');
const startButton = document.querySelector('#preview-ride');
const newTrackButton = document.querySelector('#new-track');
const editCurrentTrackButton = document.querySelector('#edit-current-track');
const pauseButton = document.querySelector('#toggle-ride');
const resetButton = document.querySelector('#reset-ride');
const rideStatus = document.querySelector('.ride-status-pill');
const ridePositionLabel = document.querySelector('#ride-position-label');
const rideControlHint = document.querySelector('#ride-control-hint');
const velocityReadouts = document.querySelectorAll('[data-readout="velocity"]');
const gForceReadouts = document.querySelectorAll('[data-readout="g-force"]');
const potentialEnergyReadouts = document.querySelectorAll('[data-readout="potential-energy"]');
const idealSpeedReadouts = document.querySelectorAll('[data-readout="ideal-speed"]');
const riderMassReadouts = document.querySelectorAll('[data-readout="rider-mass"]');
const totalMassReadouts = document.querySelectorAll('[data-readout="total-mass"]');

const world = {
  minX: 0,
  maxX: 100,
  minHeight: 0,
  maxHeight: 45,
  screenMinX: 56,
  screenMaxX: 944,
  screenBaseY: 400,
  pixelsPerMeter: 8.4,
  fillBaseY: 420,
};

const starterTrack = [
  { x: 0, height: 40 },
  { x: 26, height: 30 },
  { x: 45, height: 37 },
  { x: 64, height: 30 },
  { x: 82, height: 36 },
  { x: 100, height: 19 },
];
const controlPoints = starterTrack.map(point => ({ ...point }));

const gravity = 9.81;
const cartMassKg = 225;
const metersPerSecondToMph = 2.2369362921;
const simulationStep = 1 / 120;
const liftSpeed = 5;
const liftReleaseSpeed = 3;
const liftReleaseNudgeDistance = 0.05;
const rollingResistanceCoefficient = 0.005;
const airDensityKgPerCubicMeter = 1.225;
const dragAreaSquareMeters = 0.8;
const finishBrakeDeceleration = 4;
const gForceLimits = { maximum: 4, minimum: -1 };

let selectedIndex = 0;
let draggingPointerId = null;
let trackIsValid = true;
let trackIsRideSafe = true;
let motionTable = [];
let trackLength = 0;
let lowestTrackHeight = 0;
let startingHeight = 0;
let simulationDistance = 0;
let simulationVelocity = 0;
let idealStartVelocity = 0;
let liftJustReleased = false;
let simulationState = 'idle';
let gForceFailureLimit = null;
let rollbackDistance = null;
let finishBraking = false;
let simulationFrame = null;
let lastFrameTime = null;
let timeAccumulator = 0;
let liftConfiguration = null;
let liftActive = false;

function showScreen(name) {
  for (const [screenName, screen] of Object.entries(screens)) {
    const active = screenName === name;
    screen.hidden = !active;
    screen.classList.toggle('is-hidden', !active);
    document.querySelector(`[data-screen="${screenName}"]`).setAttribute('aria-selected', String(active));
  }
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, String(value));
  }
  return element;
}

function toScreen(point) {
  return {
    x: world.screenMinX + (point.x - world.minX) / (world.maxX - world.minX) * (world.screenMaxX - world.screenMinX),
    y: world.screenBaseY - point.height * world.pixelsPerMeter,
  };
}

function pointDistance(a, b) {
  return Math.hypot(b.x - a.x, b.height - a.height);
}

function reflectedPoint(a, b) {
  return { x: 2 * a.x - b.x, height: 2 * a.height - b.height };
}

function safeInterval(a, b) {
  return Math.max(Math.sqrt(pointDistance(a, b)), 0.0001);
}

function tangentAt(pointBefore, point, pointAfter, intervalBefore, intervalAfter, span) {
  const intervalAcross = intervalBefore + intervalAfter;
  return {
    x: ((point.x - pointBefore.x) / intervalBefore
      - (pointAfter.x - pointBefore.x) / intervalAcross
      + (pointAfter.x - point.x) / intervalAfter) * span,
    height: ((point.height - pointBefore.height) / intervalBefore
      - (pointAfter.height - pointBefore.height) / intervalAcross
      + (pointAfter.height - point.height) / intervalAfter) * span,
  };
}

function buildSplineSegments() {
  const segments = [];

  for (let index = 0; index < controlPoints.length - 1; index += 1) {
    const start = controlPoints[index];
    const end = controlPoints[index + 1];
    const before = index === 0 ? reflectedPoint(start, end) : controlPoints[index - 1];
    const after = index + 2 >= controlPoints.length
      ? reflectedPoint(end, start)
      : controlPoints[index + 2];
    const intervalBefore = safeInterval(before, start);
    const interval = safeInterval(start, end);
    const intervalAfter = safeInterval(end, after);
    const startTangent = tangentAt(before, start, end, intervalBefore, interval, interval);
    const endTangent = tangentAt(start, end, after, interval, intervalAfter, interval);

    segments.push({
      start,
      control1: {
        x: start.x + startTangent.x / 3,
        height: start.height + startTangent.height / 3,
      },
      control2: {
        x: end.x - endTangent.x / 3,
        height: end.height - endTangent.height / 3,
      },
      end,
    });
  }

  return segments;
}

function cubicPoint(segment, amount) {
  const inverse = 1 - amount;
  const a = inverse ** 3;
  const b = 3 * inverse ** 2 * amount;
  const c = 3 * inverse * amount ** 2;
  const d = amount ** 3;

  return {
    x: a * segment.start.x + b * segment.control1.x + c * segment.control2.x + d * segment.end.x,
    height: a * segment.start.height + b * segment.control1.height + c * segment.control2.height + d * segment.end.height,
  };
}

function sampleSegments(segments, stepsPerSegment = 24) {
  const samples = [];

  for (const segment of segments) {
    for (let step = samples.length === 0 ? 0 : 1; step <= stepsPerSegment; step += 1) {
      samples.push(cubicPoint(segment, step / stepsPerSegment));
    }
  }

  return samples;
}

function createArcLengthTable(samples) {
  let distance = 0;
  const table = samples.map((point, index) => {
    if (index > 0) {
      distance += pointDistance(samples[index - 1], point);
    }
    return { ...point, distance };
  });

  return { table, length: distance };
}

function tableIndexAtDistance(distance) {
  let lower = 0;
  let upper = motionTable.length - 1;

  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2);
    if (motionTable[middle].distance < distance) {
      lower = middle + 1;
    } else {
      upper = middle;
    }
  }

  return Math.max(0, lower - 1);
}

function trackPointAtDistance(distance) {
  const clampedDistance = Math.max(0, Math.min(trackLength, distance));
  const index = tableIndexAtDistance(clampedDistance);
  const left = motionTable[index];
  const right = motionTable[Math.min(index + 1, motionTable.length - 1)];
  const segmentLength = right.distance - left.distance;
  const fraction = segmentLength > 0 ? (clampedDistance - left.distance) / segmentLength : 0;

  return {
    x: left.x + (right.x - left.x) * fraction,
    height: left.height + (right.height - left.height) * fraction,
  };
}

function trackSlopeAtDistance(distance) {
  const lowDistance = Math.max(0, distance - 0.1);
  const highDistance = Math.min(trackLength, distance + 0.1);
  if (highDistance <= lowDistance) {
    return 0;
  }
  return (trackPointAtDistance(highDistance).height - trackPointAtDistance(lowDistance).height)
    / (highDistance - lowDistance);
}

function trackTangentAngleAtDistance(distance) {
  const halfSpan = 0.5;
  const before = trackPointAtDistance(Math.max(0, distance - halfSpan));
  const after = trackPointAtDistance(Math.min(trackLength, distance + halfSpan));
  return Math.atan2(after.height - before.height, after.x - before.x);
}

function trackCurvatureAtDistance(distance) {
  const halfSpan = 1.5;
  const lowDistance = Math.max(0, distance - halfSpan);
  const highDistance = Math.min(trackLength, distance + halfSpan);
  if (highDistance <= lowDistance) {
    return 0;
  }

  const lowAngle = trackTangentAngleAtDistance(lowDistance);
  const highAngle = trackTangentAngleAtDistance(highDistance);
  const angleChange = Math.atan2(Math.sin(highAngle - lowAngle), Math.cos(highAngle - lowAngle));
  return angleChange / (highDistance - lowDistance);
}

function tangentialAccelerationAt(distance, velocity, braking = false) {
  const gravityAcceleration = -gravity * trackSlopeAtDistance(distance);
  const rollingAcceleration = rollingResistanceCoefficient
    * gravity * Math.max(0, Math.cos(trackTangentAngleAtDistance(distance)));
  const totalMassKg = cartMassKg + Number(riderMassInput.value);
  const dragAcceleration = airDensityKgPerCubicMeter * dragAreaSquareMeters
    / (2 * totalMassKg) * velocity * Math.abs(velocity);

  if (Math.abs(velocity) < 0.001) {
    return gravityAcceleration;
  }

  const naturalAcceleration = gravityAcceleration
    - Math.sign(velocity) * rollingAcceleration
    - dragAcceleration;
  return braking && velocity > 0
    ? Math.min(naturalAcceleration, -finishBrakeDeceleration)
    : naturalAcceleration;
}

function findLiftConfiguration() {
  if (controlPoints.length < 2 || controlPoints[1].height <= controlPoints[0].height) {
    return null;
  }

  let ascendingDistance = null;
  const sampleSpacing = 0.05;
  for (let distance = sampleSpacing; distance < trackLength; distance += sampleSpacing) {
    const slope = trackSlopeAtDistance(distance);
    if (slope > 0.005) {
      ascendingDistance = distance;
    } else if (ascendingDistance !== null && slope < -0.005) {
      let lowDistance = ascendingDistance;
      let highDistance = distance;
      for (let iteration = 0; iteration < 20; iteration += 1) {
        const midpoint = (lowDistance + highDistance) / 2;
        if (trackSlopeAtDistance(midpoint) > 0) {
          lowDistance = midpoint;
        } else {
          highDistance = midpoint;
        }
      }

      const crestDistance = (lowDistance + highDistance) / 2;
      return {
        distance: crestDistance,
        releaseHeight: trackPointAtDistance(crestDistance).height,
      };
    }
  }

  return { distance: null, releaseHeight: null };
}

function riderGForceAt(distance, velocity) {
  const normalVerticalComponent = Math.cos(trackTangentAngleAtDistance(distance));
  return normalVerticalComponent + velocity ** 2 * trackCurvatureAtDistance(distance) / gravity;
}

function exceedsGForceLimits(gForce) {
  return gForce > gForceLimits.maximum || gForce < gForceLimits.minimum;
}

function previewRide() {
  const sampleSpacing = 0.05;
  const liftEndDistance = liftConfiguration?.distance ?? 0;

  if (liftConfiguration && liftConfiguration.distance === null) {
    return {
      issue: null,
      message: 'A lift hill must reach a clear crest before the finish.',
    };
  }

  if (liftConfiguration) {
    for (let distance = 0; distance <= liftEndDistance; distance += sampleSpacing) {
      const gForce = riderGForceAt(distance, liftSpeed);
      if (exceedsGForceLimits(gForce)) {
        return { issue: { distance, gForce } };
      }
    }
  }

  const energyStartHeight = liftConfiguration?.releaseHeight ?? controlPoints[0].height;
  for (let distance = liftEndDistance + sampleSpacing; distance <= trackLength; distance += sampleSpacing) {
    const position = trackPointAtDistance(distance);
    if (position.height > energyStartHeight + 0.001) {
      break;
    }

    const releaseSpeed = liftConfiguration ? liftReleaseSpeed : 0;
    const idealSpeed = Math.sqrt(
      releaseSpeed ** 2 + 2 * gravity * Math.max(0, energyStartHeight - position.height),
    );
    const gForce = riderGForceAt(distance, idealSpeed);
    if (exceedsGForceLimits(gForce)) {
      return { issue: { distance, gForce } };
    }
  }

  return { issue: null };
}

function trackGForceIssueMessage(issue) {
  const limit = issue.gForce > gForceLimits.maximum ? '+4 g' : '−1 g';
  const adjustment = issue.gForce > gForceLimits.maximum
    ? 'Widen the valley or soften the drop.'
    : 'Widen the crest or reduce the preceding drop.';
  return `Predicted ${issue.gForce.toFixed(1)} g at ${issue.distance.toFixed(1)} m (${limit} limit). ${adjustment}`;
}

function updateReadouts() {
  const position = trackPointAtDistance(simulationDistance);
  const idealSpeed = Math.sqrt(
    idealStartVelocity ** 2 + 2 * gravity * Math.max(0, startingHeight - position.height),
  );
  const idealSpeedMph = idealSpeed * metersPerSecondToMph;
  const speedMph = Math.abs(simulationVelocity) * metersPerSecondToMph;
  const riderGForce = riderGForceAt(simulationDistance, simulationVelocity);
  const riderMassKg = Number(riderMassInput.value);
  const totalMassKg = cartMassKg + riderMassKg;
  const potentialEnergyKj = totalMassKg * gravity
    * Math.max(0, position.height - lowestTrackHeight) / 1000;

  velocityReadouts.forEach(readout => {
    readout.textContent = speedMph.toFixed(1);
  });
  gForceReadouts.forEach(readout => {
    readout.textContent = riderGForce.toFixed(2);
  });
  idealSpeedReadouts.forEach(readout => {
    readout.textContent = liftActive ? '—' : idealSpeedMph.toFixed(1);
  });
  potentialEnergyReadouts.forEach(readout => {
    readout.textContent = potentialEnergyKj.toFixed(1);
  });
  riderMassValue.value = `${riderMassKg} kg`;
  riderMassReadouts.forEach(readout => {
    readout.textContent = riderMassKg.toFixed(0);
  });
  totalMassReadouts.forEach(readout => {
    readout.textContent = totalMassKg.toFixed(0);
  });
  return position;
}

function setCartPosition(element, position, tangentAngle, direction = 1) {
  const screenPosition = toScreen(position);
  const pixelsPerMeterX = (world.screenMaxX - world.screenMinX) / (world.maxX - world.minX);
  const angle = Math.atan2(
    -Math.sin(tangentAngle) * world.pixelsPerMeter,
    Math.cos(tangentAngle) * pixelsPerMeterX,
  ) * 180 / Math.PI;
  const orientedAngle = angle + (direction < 0 ? 180 : 0);
  element.setAttribute(
    'transform',
    `translate(${screenPosition.x.toFixed(2)} ${screenPosition.y.toFixed(2)}) rotate(${orientedAngle.toFixed(2)}) translate(-24 -42)`,
  );
}

function estimatedFinishBrakingDistance(startDistance, startVelocity) {
  let distance = startDistance;
  let velocity = startVelocity;

  while (distance < trackLength && velocity > 0.01) {
    const currentAcceleration = tangentialAccelerationAt(distance, velocity, true);
    let nextVelocity = velocity + currentAcceleration * simulationStep;
    let nextDistance = distance + 0.5 * (velocity + nextVelocity) * simulationStep;
    const nextAcceleration = tangentialAccelerationAt(nextDistance, nextVelocity, true);
    nextVelocity = velocity
      + 0.5 * (currentAcceleration + nextAcceleration) * simulationStep;
    nextDistance = distance + 0.5 * (velocity + nextVelocity) * simulationStep;

    if (nextVelocity <= 0.01) {
      const stopFraction = velocity <= 0.01
        ? 0
        : (velocity - 0.01) / (velocity - nextVelocity);
      const stopDistance = distance + (nextDistance - distance) * stopFraction;
      return Math.max(0, stopDistance - startDistance);
    }

    if (nextDistance >= trackLength) {
      return trackLength - startDistance;
    }

    distance = nextDistance;
    velocity = nextVelocity;
  }

  return Math.max(0, distance - startDistance);
}

function updateRideScene() {
  const position = updateReadouts();
  const tangentAngle = trackTangentAngleAtDistance(simulationDistance);
  const direction = simulationVelocity < 0 ? -1 : 1;
  setCartPosition(rideCart, position, tangentAngle, direction);
  setCartPosition(cart, position, tangentAngle, direction);
  rideCart.dataset.height = position.height.toFixed(5);
  rideCart.dataset.simulationVelocity = simulationVelocity.toFixed(7);
  rideCart.dataset.gForce = riderGForceAt(simulationDistance, simulationVelocity).toFixed(5);
  const finish = toScreen(controlPoints[controlPoints.length - 1]);
  rideFinishFlag.setAttribute('transform', `translate(${finish.x.toFixed(2)} ${finish.y.toFixed(2)})`);
  rideFailureMarker.setAttribute('transform', `translate(${finish.x.toFixed(2)} ${finish.y.toFixed(2)})`);
  const failureMarkerVisible = simulationState === 'failed';
  rideFailureMarker.classList.toggle('is-visible', failureMarkerVisible);
  if (failureMarkerVisible) {
    const failurePosition = toScreen(position);
    rideFailureMarker.setAttribute('transform', `translate(${failurePosition.x.toFixed(2)} ${failurePosition.y.toFixed(2)})`);
  }
  const rollbackMarkerVisible = rollbackDistance !== null;
  rideRollbackMarker.classList.toggle('is-visible', rollbackMarkerVisible);
  rollbackNotice.hidden = !rollbackMarkerVisible;
  if (rollbackMarkerVisible) {
    const rollbackPosition = toScreen(trackPointAtDistance(rollbackDistance));
    rideRollbackMarker.setAttribute('transform', `translate(${rollbackPosition.x.toFixed(2)} ${rollbackPosition.y.toFixed(2)})`);
  }

  if (simulationState === 'running' && finishBraking) {
    ridePositionLabel.textContent = `BRAKING · FINISH · ${position.x.toFixed(1)} m`;
  } else if (simulationState === 'running' && liftActive) {
    ridePositionLabel.textContent = `LIFT HILL · ${position.x.toFixed(1)} m`;
  } else if (simulationState === 'running') {
    ridePositionLabel.textContent = `CART POSITION · ${position.x.toFixed(1)} m`;
  } else if (simulationState === 'paused') {
    ridePositionLabel.textContent = `PAUSED · ${position.x.toFixed(1)} m`;
  } else if (simulationState === 'failed') {
    const limit = gForceFailureLimit === gForceLimits.maximum ? '+4.0 g' : '−1.0 g';
    ridePositionLabel.textContent = `G-FORCE FAILURE · ${limit} · ${position.x.toFixed(1)} m`;
  } else if (simulationState === 'stopped') {
    ridePositionLabel.textContent = `TRACK END · ${position.x.toFixed(1)} m`;
  } else if (simulationState === 'completed') {
    ridePositionLabel.textContent = `RIDE COMPLETE · ${position.x.toFixed(1)} m`;
  } else {
    ridePositionLabel.textContent = 'READY AT START';
  }
}

function updateRideControls() {
  const isRunning = simulationState === 'running';
  const isPaused = simulationState === 'paused';
  rideStatus.classList.toggle('is-failed', simulationState === 'failed');
  rideStatus.classList.toggle('is-rollback', rollbackDistance !== null && simulationState !== 'failed');
  rideStatus.classList.toggle('is-completed', simulationState === 'completed');
  pauseButton.disabled = !isRunning && !isPaused;
  resetButton.disabled = simulationState === 'idle';
  pauseButton.innerHTML = isPaused ? '▶ <span>Resume</span>' : 'Ⅱ <span>Pause</span>';
  pauseButton.setAttribute('aria-label', isPaused ? 'Resume ride' : 'Pause ride');

  if (simulationState === 'failed') {
    rideStatus.textContent = 'G-FORCE FAILURE';
    rideControlHint.textContent = gForceFailureLimit === gForceLimits.maximum
      ? 'Ride stopped after exceeding the +4.0 g limit.'
      : 'Ride stopped after dropping below the −1.0 g limit.';
  } else if (rollbackDistance !== null) {
    rideStatus.textContent = isPaused ? 'PAUSED · ROLLBACK' : 'ROLLBACK';
    rideControlHint.textContent = 'The cart did not have enough velocity to clear the next hill.';
  } else if (finishBraking) {
    rideStatus.textContent = isPaused ? 'PAUSED · BRAKING' : 'BRAKING';
    rideControlHint.textContent = 'The cart is slowing before the finish and will brake to a stop.';
  } else if (simulationState === 'completed') {
    rideStatus.textContent = 'RIDE COMPLETE';
    rideControlHint.textContent = 'The cart crossed the finish and came to a stop.';
  } else if (isRunning) {
    rideStatus.textContent = liftActive ? 'LIFT HILL' : 'RUNNING · WITH LOSSES';
    rideControlHint.textContent = liftActive
      ? 'Powered lift at 5 m/s · 3 m/s push at the first crest.'
      : 'Gravity, rolling resistance, and air drag after lift release.';
  } else if (isPaused) {
    rideStatus.textContent = 'PAUSED';
    rideControlHint.textContent = 'Ride paused.';
  } else if (simulationState === 'stopped') {
    rideStatus.textContent = 'AT TRACK END';
    rideControlHint.textContent = 'Track endpoint reached; finish braking is a later stage.';
  } else {
    rideStatus.textContent = 'READY';
    rideControlHint.textContent = 'Start your ride to begin.';
  }
}

function stopAnimation() {
  if (simulationFrame !== null) {
    cancelAnimationFrame(simulationFrame);
    simulationFrame = null;
  }
  lastFrameTime = null;
  timeAccumulator = 0;
}

function lockEditor(locked) {
  addPointButton.disabled = locked;
  removePointButton.disabled = locked || controlPoints.length <= 2
    || selectedIndex === 0 || selectedIndex === controlPoints.length - 1;
  riderMassInput.disabled = locked;
  controlGroup.querySelectorAll('.control-handle').forEach(handle => {
    handle.setAttribute('aria-disabled', String(locked));
    handle.setAttribute('tabindex', locked ? '-1' : '0');
  });
}

function heightLimitCrossing(startDistance, endDistance, heightLimit) {
  let low = 0;
  let high = 1;

  for (let iteration = 0; iteration < 24; iteration += 1) {
    const fraction = (low + high) / 2;
    const distance = startDistance + (endDistance - startDistance) * fraction;
    if (trackPointAtDistance(distance).height > heightLimit) {
      high = fraction;
    } else {
      low = fraction;
    }
  }

  return startDistance + (endDistance - startDistance) * ((low + high) / 2);
}

function gForceLimitCrossing(startDistance, endDistance, startVelocity, endVelocity) {
  let low = 0;
  let high = 1;

  for (let iteration = 0; iteration < 24; iteration += 1) {
    const fraction = (low + high) / 2;
    const distance = startDistance + (endDistance - startDistance) * fraction;
    const velocity = startVelocity + (endVelocity - startVelocity) * fraction;
    if (exceedsGForceLimits(riderGForceAt(distance, velocity))) {
      high = fraction;
    } else {
      low = fraction;
    }
  }

  const fraction = (low + high) / 2;
  return {
    distance: startDistance + (endDistance - startDistance) * fraction,
    velocity: startVelocity + (endVelocity - startVelocity) * fraction,
  };
}

function stopAtGForceLimit(startDistance, endDistance, startVelocity, endVelocity, violatingGForce) {
  const crossing = gForceLimitCrossing(startDistance, endDistance, startVelocity, endVelocity);
  simulationDistance = crossing.distance;
  simulationVelocity = crossing.velocity;
  simulationState = 'failed';
  gForceFailureLimit = violatingGForce > gForceLimits.maximum
    ? gForceLimits.maximum
    : gForceLimits.minimum;
  stopAnimation();
  updateRideScene();
  updateRideControls();
}

function advanceSimulation() {
  if (liftActive) {
    const nextDistance = Math.min(trackLength, simulationDistance + liftSpeed * simulationStep);
    const nextGForce = riderGForceAt(nextDistance, liftSpeed);
    if (exceedsGForceLimits(nextGForce)) {
      stopAtGForceLimit(simulationDistance, nextDistance, liftSpeed, liftSpeed, nextGForce);
      return;
    }
    simulationDistance = nextDistance;
    simulationVelocity = liftSpeed;
    if (simulationDistance >= liftConfiguration.distance) {
      simulationDistance = liftConfiguration.distance;
      simulationVelocity = liftReleaseSpeed;
      liftActive = false;
      liftJustReleased = true;
      updateRideControls();
    }
    return;
  }

  if (!finishBraking && simulationVelocity > 0) {
    const remainingDistance = trackLength - simulationDistance;
    const stoppingDistance = estimatedFinishBrakingDistance(simulationDistance, simulationVelocity);
    if (stoppingDistance >= remainingDistance) {
      finishBraking = true;
      updateRideControls();
    }
  }

  if (finishBraking && simulationDistance >= trackLength) {
    simulationVelocity = Math.max(0, simulationVelocity - finishBrakeDeceleration * simulationStep);
    if (simulationVelocity === 0) {
      finishBraking = false;
      simulationState = 'completed';
      stopAnimation();
      updateRideScene();
      updateRideControls();
    }
    return;
  }

  let releasedFromLiftThisStep = false;
  const previousDistance = simulationDistance;
  const previousVelocity = simulationVelocity;
  const currentAcceleration = tangentialAccelerationAt(previousDistance, previousVelocity, finishBraking);
  let nextVelocity = previousVelocity + currentAcceleration * simulationStep;
  let nextDistance = previousDistance + 0.5 * (previousVelocity + nextVelocity) * simulationStep;
  if (liftJustReleased) {
    liftJustReleased = false;
    releasedFromLiftThisStep = true;
    const forwardDistance = Math.min(trackLength, simulationDistance + liftReleaseNudgeDistance);
    if (trackPointAtDistance(forwardDistance).height < startingHeight) {
      nextDistance = forwardDistance;
    }
  }

  const nextAcceleration = tangentialAccelerationAt(nextDistance, nextVelocity, finishBraking);
  nextVelocity = previousVelocity
    + 0.5 * (currentAcceleration + nextAcceleration) * simulationStep;
  if (releasedFromLiftThisStep) {
    nextVelocity = Math.max(0, nextVelocity);
  } else {
    nextDistance = previousDistance + 0.5 * (previousVelocity + nextVelocity) * simulationStep;
  }

  if (nextDistance <= 0 || nextDistance >= trackLength) {
    const boundaryDistance = Math.max(0, Math.min(trackLength, nextDistance));
    const boundaryFraction = nextDistance === previousDistance
      ? 0
      : (boundaryDistance - previousDistance) / (nextDistance - previousDistance);
    const boundaryVelocity = previousVelocity
      + (nextVelocity - previousVelocity) * Math.max(0, Math.min(1, boundaryFraction));
    const boundaryGForce = riderGForceAt(boundaryDistance, boundaryVelocity);
    if (exceedsGForceLimits(boundaryGForce)) {
      stopAtGForceLimit(
        previousDistance,
        boundaryDistance,
        previousVelocity,
        boundaryVelocity,
        boundaryGForce,
      );
      return;
    }

    simulationDistance = boundaryDistance;
    if (boundaryDistance === trackLength && boundaryVelocity > 0) {
      simulationVelocity = boundaryVelocity;
      finishBraking = true;
      updateRideScene();
      updateRideControls();
    } else {
      simulationVelocity = 0;
      simulationState = 'stopped';
      stopAnimation();
      updateRideScene();
      updateRideControls();
    }
    return;
  }

  const currentHeight = trackPointAtDistance(simulationDistance).height;
  const nextHeight = trackPointAtDistance(nextDistance).height;
  const maximumReachableHeight = startingHeight + idealStartVelocity ** 2 / (2 * gravity);
  if (currentHeight <= maximumReachableHeight && nextHeight > maximumReachableHeight) {
    simulationDistance = heightLimitCrossing(
      simulationDistance,
      nextDistance,
      maximumReachableHeight,
    );
    simulationVelocity = 0;
    return;
  }

  const projectedNextGForce = riderGForceAt(nextDistance, nextVelocity);
  if (exceedsGForceLimits(projectedNextGForce)) {
    stopAtGForceLimit(
      previousDistance,
      nextDistance,
      previousVelocity,
      nextVelocity,
      projectedNextGForce,
    );
    return;
  }

  if (rollbackDistance === null && previousVelocity >= 0 && nextVelocity < 0) {
    const turnFraction = previousVelocity === 0
      ? 0
      : previousVelocity / (previousVelocity - nextVelocity);
    const turnTime = turnFraction * simulationStep;
    const turnAcceleration = (nextVelocity - previousVelocity) / simulationStep;
    rollbackDistance = previousDistance + previousVelocity * turnTime
      + 0.5 * turnAcceleration * turnTime ** 2;
    updateRideControls();
  }

  simulationVelocity = nextVelocity;
  simulationDistance = nextDistance;
}

function animationFrame(timestamp) {
  if (simulationState !== 'running') {
    return;
  }

  if (lastFrameTime === null) {
    lastFrameTime = timestamp;
  }
  const elapsed = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
  lastFrameTime = timestamp;
  timeAccumulator += elapsed;

  while (timeAccumulator >= simulationStep && simulationState === 'running') {
    advanceSimulation();
    timeAccumulator -= simulationStep;
  }

  updateRideScene();
  if (simulationState === 'running') {
    simulationFrame = requestAnimationFrame(animationFrame);
  }
}

function startRide() {
  if (!trackIsValid || !trackIsRideSafe || motionTable.length < 2 || trackLength <= 0) {
    return;
  }

  stopAnimation();
  simulationDistance = 0;
  liftActive = Boolean(liftConfiguration);
  liftJustReleased = false;
  rollbackDistance = null;
  finishBraking = false;
  simulationVelocity = liftActive ? liftSpeed : 0;
  idealStartVelocity = liftActive ? liftReleaseSpeed : 0;
  startingHeight = liftConfiguration?.releaseHeight ?? controlPoints[0].height;
  simulationState = 'running';
  gForceFailureLimit = null;
  lockEditor(true);
  showScreen('ride');
  updateRideScene();
  updateRideControls();
  simulationFrame = requestAnimationFrame(animationFrame);
}

function toggleRide() {
  if (simulationState === 'running') {
    simulationState = 'paused';
    stopAnimation();
  } else if (simulationState === 'paused') {
    simulationState = 'running';
    lastFrameTime = null;
    simulationFrame = requestAnimationFrame(animationFrame);
  } else {
    return;
  }
  updateRideScene();
  updateRideControls();
}

function resetRide() {
  stopAnimation();
  simulationDistance = 0;
  simulationVelocity = 0;
  idealStartVelocity = 0;
  liftActive = false;
  finishBraking = false;
  simulationState = 'idle';
  gForceFailureLimit = null;
  rollbackDistance = null;
  lockEditor(false);
  renderTrack();
  updateRideControls();
  showScreen('editor');
}

function startNewTrack() {
  const confirmed = window.confirm('Start over with the starter track? Your current track will be replaced. Rider mass will be kept.');
  if (!confirmed) {
    return;
  }

  stopAnimation();
  controlPoints.splice(0, controlPoints.length, ...starterTrack.map(point => ({ ...point })));
  selectedIndex = 0;
  draggingPointerId = null;
  simulationDistance = 0;
  simulationVelocity = 0;
  idealStartVelocity = 0;
  liftActive = false;
  finishBraking = false;
  simulationState = 'idle';
  gForceFailureLimit = null;
  rollbackDistance = null;
  lockEditor(false);
  showScreen('editor');
  renderTrack();
  updateRideControls();
}

function editCurrentTrack() {
  stopAnimation();
  simulationDistance = 0;
  simulationVelocity = 0;
  idealStartVelocity = 0;
  liftActive = false;
  finishBraking = false;
  simulationState = 'idle';
  gForceFailureLimit = null;
  rollbackDistance = null;
  lockEditor(false);
  renderTrack();
  updateRideControls();
  showScreen('editor');
}

function validateTrack(samples) {
  if (controlPoints.length < 2) {
    return 'Add at least two control points.';
  }

  if (liftConfiguration && liftConfiguration.distance === null) {
    return 'A lift hill must reach a clear crest before the finish.';
  }

  for (let first = 0; first < controlPoints.length; first += 1) {
    for (let second = first + 1; second < controlPoints.length; second += 1) {
      if (pointDistance(controlPoints[first], controlPoints[second]) < 0.25) {
        return 'Control points must be distinct.';
      }
    }
  }

  for (let index = 1; index < controlPoints.length; index += 1) {
    if (controlPoints[index].x <= controlPoints[index - 1].x) {
      return 'Keep control points ordered from start to finish.';
    }
    if (controlPoints[index].x < world.minX || controlPoints[index].x > world.maxX) {
      return 'Keep control points inside the horizontal design area.';
    }
  }

  if (samples.length < 2) {
    return 'The track must have a nonzero length.';
  }

  let length = 0;
  for (let index = 1; index < samples.length; index += 1) {
    length += pointDistance(samples[index], samples[index - 1]);
    if (samples[index].height < world.minHeight - 0.02 || samples[index].height > world.maxHeight + 0.02) {
      return 'The curve leaves the design area; move points inward.';
    }
  }

  if (length < 0.25) {
    return 'The track must have a nonzero length.';
  }

  return '';
}

function makePathData(segments) {
  const screenPoint = point => {
    const mapped = toScreen(point);
    return `${mapped.x.toFixed(2)} ${mapped.y.toFixed(2)}`;
  };
  const first = screenPoint(segments[0].start);
  const commands = [`M ${first}`];

  for (const segment of segments) {
    commands.push(`C ${screenPoint(segment.control1)}, ${screenPoint(segment.control2)}, ${screenPoint(segment.end)}`);
  }

  return commands.join(' ');
}

function drawTies(samples) {
  trackTies.replaceChildren();
  let distanceSinceTie = 0;

  for (let index = 1; index < samples.length - 1; index += 1) {
    const current = toScreen(samples[index]);
    const previous = toScreen(samples[index - 1]);
    const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
    distanceSinceTie += distance;
    if (distanceSinceTie < 72) {
      continue;
    }
    distanceSinceTie = 0;

    const next = toScreen(samples[index + 1]);
    const tangentX = next.x - previous.x;
    const tangentY = next.y - previous.y;
    const tangentLength = Math.max(Math.hypot(tangentX, tangentY), 0.001);
    const normalX = -tangentY / tangentLength * 11;
    const normalY = tangentX / tangentLength * 11;
    trackTies.append(svgElement('path', {
      d: `M ${(current.x - normalX).toFixed(2)} ${(current.y - normalY).toFixed(2)} L ${(current.x + normalX).toFixed(2)} ${(current.y + normalY).toFixed(2)}`,
    }));
  }
}

function pointLabel(index) {
  if (index === 0) {
    return 'Start';
  }
  if (index === controlPoints.length - 1) {
    return 'Finish';
  }
  return `Point ${index + 1}`;
}

function drawControlPoints() {
  controlGroup.replaceChildren();

  controlPoints.forEach((point, index) => {
    const position = toScreen(point);
    const handle = svgElement('g', {
      class: `control-handle${index === selectedIndex ? ' is-selected' : ''}${index === 0 ? ' point-start' : ''}${index === controlPoints.length - 1 ? ' point-finish' : ''}`,
      transform: `translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})`,
      'data-point-index': index,
      role: 'button',
      tabindex: 0,
      'aria-label': `${pointLabel(index)}, ${point.height.toFixed(1)} meters high. Use arrow keys to adjust.`,
    });
    handle.append(
      svgElement('circle', { class: 'handle-ring', r: index === selectedIndex ? 13 : 10 }),
      svgElement('circle', { class: 'handle-core', r: 3.5 }),
    );

    handle.addEventListener('pointerdown', event => {
      if (addPointButton.disabled || event.button !== 0) {
        return;
      }
      event.preventDefault();
      selectedIndex = index;
      draggingPointerId = event.pointerId;
      trackSvg.setPointerCapture(event.pointerId);
      renderTrack();
    });

    handle.addEventListener('keydown', event => {
      if (addPointButton.disabled) {
        return;
      }

      const step = event.shiftKey ? 5 : 1;
      let changed = true;
      if (event.key === 'ArrowUp') {
        controlPoints[index].height = Math.min(world.maxHeight, controlPoints[index].height + step);
      } else if (event.key === 'ArrowDown') {
        controlPoints[index].height = Math.max(world.minHeight, controlPoints[index].height - step);
      } else if (event.key === 'ArrowLeft' && index > 0 && index < controlPoints.length - 1) {
        controlPoints[index].x = Math.max(controlPoints[index - 1].x + 1, controlPoints[index].x - step);
      } else if (event.key === 'ArrowRight' && index > 0 && index < controlPoints.length - 1) {
        controlPoints[index].x = Math.min(controlPoints[index + 1].x - 1, controlPoints[index].x + step);
      } else if (event.key === 'Enter' || event.key === ' ') {
        selectedIndex = index;
      } else {
        changed = false;
      }

      if (changed) {
        event.preventDefault();
        selectedIndex = index;
        renderTrack();
        controlGroup.querySelector(`[data-point-index="${index}"]`)?.focus({ preventScroll: true });
      }
    });

    controlGroup.append(handle);
  });
}

function setValidationMessage(message, gForceIssue) {
  trackIsValid = !message;
  trackIsRideSafe = !gForceIssue;
  const hasIssue = !trackIsValid || !trackIsRideSafe;
  trackCard.classList.toggle('is-invalid', hasIssue);
  trackStatusIcon.classList.toggle('is-invalid', hasIssue);
  trackStatusIcon.textContent = hasIssue ? '!' : '✓';
  trackStatus.textContent = message
    || (gForceIssue ? trackGForceIssueMessage(gForceIssue) : `Track ready · ${controlPoints.length} control points`);
  startButton.disabled = hasIssue;
}

function renderTrack() {
  const segments = buildSplineSegments();
  const pathData = makePathData(segments);
  const samples = sampleSegments(segments);
  const motionSamples = sampleSegments(segments, 96);
  const arcLengthData = createArcLengthTable(motionSamples);
  const message = validateTrack(samples);
  const areaPath = `${pathData} L ${world.screenMaxX} ${world.fillBaseY} L ${world.screenMinX} ${world.fillBaseY} Z`;

  motionTable = arcLengthData.table;
  trackLength = arcLengthData.length;
  lowestTrackHeight = Math.min(...motionSamples.map(point => point.height));
  liftConfiguration = findLiftConfiguration();
  if (simulationState === 'idle') {
    startingHeight = liftConfiguration?.releaseHeight ?? controlPoints[0].height;
  }
  const preview = message ? { issue: null } : previewRide();
  trackFill.setAttribute('d', areaPath);
  trackSupport.setAttribute('d', pathData);
  trackRail.setAttribute('d', pathData);
  rideFill.setAttribute('d', areaPath);
  rideSupport.setAttribute('d', pathData);
  rideRail.setAttribute('d', pathData);
  drawTies(samples);
  drawControlPoints();

  const finish = toScreen(controlPoints[controlPoints.length - 1]);
  const startTangent = trackTangentAngleAtDistance(0);
  setCartPosition(cart, controlPoints[0], startTangent);
  finishFlag.setAttribute('transform', `translate(${finish.x.toFixed(2)} ${finish.y.toFixed(2)})`);
  selectedPointName.textContent = pointLabel(selectedIndex);
  removePointButton.disabled = controlPoints.length <= 2
    || selectedIndex === 0 || selectedIndex === controlPoints.length - 1;
  setValidationMessage(message || preview.message, preview.issue);
  updateRideScene();
}

function worldPointFromPointer(event) {
  const point = trackSvg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const svgPoint = point.matrixTransform(trackSvg.getScreenCTM().inverse());

  return {
    x: (svgPoint.x - world.screenMinX) / (world.screenMaxX - world.screenMinX) * (world.maxX - world.minX),
    height: (world.screenBaseY - svgPoint.y) / world.pixelsPerMeter,
  };
}

function updatePoint(index, point) {
  const current = controlPoints[index];
  current.height = Math.max(world.minHeight, Math.min(world.maxHeight, point.height));

  if (index > 0 && index < controlPoints.length - 1) {
    current.x = Math.max(
      controlPoints[index - 1].x + 1,
      Math.min(controlPoints[index + 1].x - 1, point.x),
    );
  }
}

function addPoint() {
  const insertionIndex = selectedIndex === controlPoints.length - 1
    ? selectedIndex
    : selectedIndex + 1;
  const left = controlPoints[insertionIndex - 1];
  const right = controlPoints[insertionIndex];

  if (pointDistance(left, right) < 2) {
    trackStatus.textContent = 'Move neighboring points apart before adding another point.';
    return;
  }

  controlPoints.splice(insertionIndex, 0, {
    x: (left.x + right.x) / 2,
    height: (left.height + right.height) / 2,
  });
  selectedIndex = insertionIndex;
  renderTrack();
}

function removePoint() {
  if (controlPoints.length <= 2 || selectedIndex === 0 || selectedIndex === controlPoints.length - 1) {
    return;
  }

  controlPoints.splice(selectedIndex, 1);
  selectedIndex = Math.min(selectedIndex, controlPoints.length - 1);
  renderTrack();
}

trackSvg.addEventListener('pointermove', event => {
  if (event.pointerId !== draggingPointerId) {
    return;
  }
  updatePoint(selectedIndex, worldPointFromPointer(event));
  renderTrack();
});

function endDrag(event) {
  if (event.pointerId !== draggingPointerId) {
    return;
  }
  draggingPointerId = null;
  if (trackSvg.hasPointerCapture(event.pointerId)) {
    trackSvg.releasePointerCapture(event.pointerId);
  }
}

trackSvg.addEventListener('pointerup', endDrag);
trackSvg.addEventListener('pointercancel', endDrag);
addPointButton.addEventListener('click', addPoint);
removePointButton.addEventListener('click', removePoint);
riderMassInput.addEventListener('input', updateReadouts);
startButton.addEventListener('click', startRide);
newTrackButton.addEventListener('click', startNewTrack);
editCurrentTrackButton.addEventListener('click', editCurrentTrack);
pauseButton.addEventListener('click', toggleRide);
resetButton.addEventListener('click', resetRide);

for (const tab of tabs) {
  tab.addEventListener('click', () => showScreen(tab.dataset.screen));
}

document.querySelector('#back-to-editor').addEventListener('click', () => showScreen('editor'));
renderTrack();
updateRideControls();
