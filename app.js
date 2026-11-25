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
const trackStatus = document.querySelector('#track-validation');
const trackStatusIcon = document.querySelector('#track-status-icon');
const selectedPointName = document.querySelector('#selected-point-name');
const addPointButton = document.querySelector('#add-point');
const removePointButton = document.querySelector('#remove-point');
const startButton = document.querySelector('#preview-ride');

const world = {
  minX: 0,
  maxX: 100,
  minHeight: 0,
  maxHeight: 45,
  screenMinX: 56,
  screenMaxX: 944,
  screenBaseY: 350,
  pixelsPerMeter: 5.4,
  fillBaseY: 420,
};

const controlPoints = [
  { x: 0, height: 40 },
  { x: 23, height: 0 },
  { x: 48, height: 30 },
  { x: 72, height: 5 },
  { x: 100, height: 19 },
];

let selectedIndex = 0;
let draggingPointerId = null;
let trackIsValid = true;

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

function validateTrack(samples) {
  if (controlPoints.length < 2) {
    return 'Add at least two control points.';
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
  }

  if (samples.length < 2) {
    return 'The track must have a nonzero length.';
  }

  let length = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const deltaX = samples[index].x - samples[index - 1].x;
    length += pointDistance(samples[index], samples[index - 1]);
    if (deltaX < -0.02) {
      return 'The track loops back horizontally; move points to remove the loop.';
    }
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
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      selectedIndex = index;
      draggingPointerId = event.pointerId;
      trackSvg.setPointerCapture(event.pointerId);
      renderTrack();
    });

    handle.addEventListener('keydown', event => {
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

function setValidationMessage(message) {
  trackIsValid = !message;
  trackCard.classList.toggle('is-invalid', !trackIsValid);
  trackStatusIcon.classList.toggle('is-invalid', !trackIsValid);
  trackStatusIcon.textContent = trackIsValid ? '✓' : '!';
  trackStatus.textContent = message || `Track ready · ${controlPoints.length} control points`;
  startButton.disabled = !trackIsValid;
}

function renderTrack() {
  const segments = buildSplineSegments();
  const pathData = makePathData(segments);
  const samples = sampleSegments(segments);
  const message = validateTrack(samples);
  const areaPath = `${pathData} L ${world.screenMaxX} ${world.fillBaseY} L ${world.screenMinX} ${world.fillBaseY} Z`;

  trackFill.setAttribute('d', areaPath);
  trackSupport.setAttribute('d', pathData);
  trackRail.setAttribute('d', pathData);
  drawTies(samples);
  drawControlPoints();

  const start = toScreen(controlPoints[0]);
  const finish = toScreen(controlPoints[controlPoints.length - 1]);
  cart.setAttribute('transform', `translate(${(start.x + 21).toFixed(2)} ${(start.y - 15).toFixed(2)})`);
  finishFlag.setAttribute('transform', `translate(${finish.x.toFixed(2)} ${finish.y.toFixed(2)})`);
  selectedPointName.textContent = pointLabel(selectedIndex);
  removePointButton.disabled = controlPoints.length <= 2;
  setValidationMessage(message);
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
    const minX = controlPoints[index - 1].x + 1;
    const maxX = controlPoints[index + 1].x - 1;
    current.x = Math.max(minX, Math.min(maxX, point.x));
  }
}

function addPoint() {
  const insertionIndex = selectedIndex === controlPoints.length - 1
    ? selectedIndex
    : selectedIndex + 1;
  const left = controlPoints[insertionIndex - 1];
  const right = controlPoints[insertionIndex];

  if (right.x - left.x < 2) {
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
  if (controlPoints.length <= 2) {
    return;
  }

  const removedEndpoint = selectedIndex === 0 || selectedIndex === controlPoints.length - 1;
  controlPoints.splice(selectedIndex, 1);
  if (removedEndpoint) {
    const firstX = controlPoints[0].x;
    const trackWidth = controlPoints[controlPoints.length - 1].x - firstX;
    controlPoints.forEach(point => {
      point.x = (point.x - firstX) / trackWidth * world.maxX;
    });
    controlPoints[0].x = world.minX;
    controlPoints[controlPoints.length - 1].x = world.maxX;
  }
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
startButton.addEventListener('click', () => {
  if (trackIsValid) {
    showScreen('ride');
  }
});

for (const tab of tabs) {
  tab.addEventListener('click', () => showScreen(tab.dataset.screen));
}

document.querySelector('#back-to-editor').addEventListener('click', () => showScreen('editor'));
renderTrack();
