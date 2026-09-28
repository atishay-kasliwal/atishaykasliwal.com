// A quiet, monochrome background for the intro: thin orbital arcs drifting behind the
// greeting, with a few particles riding them. Rendering lives entirely here, independent
// of the greeting/timing logic in intro.js — it starts once and runs continuously through
// every greeting, and intro.js only ever calls pulse() or destroy() on it.
//
// The canvas draws the arcs and particles only. The static atmosphere glow, its brief
// pulse on a greeting change, the cursor halo, and the grain are plain CSS (see the
// .intro-canvas / .intro-glow / .intro-grain rules in style.css) — cheaper than redrawing
// gradients every frame, and it keeps this module from fighting the stylesheet over color.

const INK = "242, 242, 239"; // the greeting's off-white; only alpha varies from here

export function createIntroBackground(container) {
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const coarseQuery = matchMedia("(pointer: coarse)");

  const canvas = document.createElement("canvas");
  canvas.className = "intro-canvas";
  const glow = document.createElement("div");
  glow.className = "intro-glow";
  const grain = document.createElement("div");
  grain.className = "intro-grain";
  // Purely decorative: the loader already carries the accessible label.
  for (const layer of [canvas, glow, grain]) layer.setAttribute("aria-hidden", "true");
  container.append(canvas, glow, grain);
  const ctx = canvas.getContext("2d");
  const greetingEl = container.querySelector(".loader-greeting");

  let width = 0;
  let height = 0;
  let dpr = 1;
  let paths = [];
  let ambient = [];
  let travelers = [];
  let glowSprite = null;
  let raf = 0;
  let pulseTimer;
  // Pointer parallax: the whole scene eases toward the pointer instead of particles
  // chasing it directly. Values are in canvas pixels.
  let targetX = 0;
  let targetY = 0;
  let driftX = 0;
  let driftY = 0;

  // Keeps a drifting fraction inside [0, 1) so nodes re-enter the far edge.
  const wrap = (v) => ((v % 1) + 1) % 1;

  // Shortest signed distance between two angles, in radians.
  function angleDelta(a, b) {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
  }

  // Finds the start angle + sweep of the contiguous arc of circle (cx, cy, r)
  // that falls within the padded viewport rect — so a path we draw actually
  // enters through one edge and exits through another, rather than fading in
  // and out somewhere in the middle of the screen. Returns null if the circle
  // never crosses the (padded) rect at all.
  function arcRectSpan(cx, cy, r, w, h, pad) {
    const steps = 360;
    const step = (Math.PI * 2) / steps;
    const inside = (a) => {
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      return x > -pad && x < w + pad && y > -pad && y < h + pad;
    };
    let seed = -1;
    for (let i = 0; i < steps; i++) {
      const a = i * step;
      if (inside(a)) {
        seed = a;
        break;
      }
    }
    if (seed === -1) return null;
    let start = seed;
    let end = seed;
    let guard = 0;
    while (inside(start - step) && guard++ < steps) start -= step;
    guard = 0;
    while (inside(end + step) && guard++ < steps) end += step;
    if (end - start >= Math.PI * 2 - step) return null; // circle sits entirely inside — not a crossing arc
    return { start, sweep: end - start };
  }

  function mulberry32(seed) {
    let a = seed;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A small pre-rendered radial sprite, reused for every bright node instead of a
  // per-frame shadow/filter blur (far cheaper than canvas filter: blur each frame).
  function buildGlowSprite() {
    const size = Math.round(56 * dpr);
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = size;
    const sctx = sprite.getContext("2d");
    const r = size / 2;
    const g = sctx.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, `rgba(${INK}, 0.9)`);
    g.addColorStop(0.35, `rgba(${INK}, 0.35)`);
    g.addColorStop(1, `rgba(${INK}, 0)`);
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, size, size);
    return sprite;
  }

  // Each path is an arc of a large, mostly off-canvas circle, so what crosses the
  // viewport reads as a curve entering and leaving rather than a complete ring.
  function buildScene() {
    const mobile = coarseQuery.matches || width < 700;
    const pathCount = mobile ? 3 : 5;
    const rand = mulberry32(0x9e3779b9 ^ Math.round(width * 7 + height));
    const diag = Math.hypot(width, height);
    // On a phone the skip control sits close to the top-right corner with
    // little room to spare; keep arcs from aiming straight at it so they
    // don't read as randomly slicing through the UI.
    const avoidAngle = Math.atan2(-height * 0.36, width * 0.42);
    let tries = 0;
    paths = Array.from({ length: pathCount }, (_, i) => {
      let angle;
      do {
        angle = rand() * Math.PI * 2;
        tries++;
      } while (Math.abs(angleDelta(angle, avoidAngle)) < 0.5 && tries < 20);
      const dist = diag * (0.25 + rand() * 0.45);
      const cx = width / 2 + Math.cos(angle) * dist;
      const cy = height / 2 + Math.sin(angle) * dist;
      // Keep the ring within reach of the viewport, then aim the drawn sweep
      // roughly at screen centre, with enough jitter that some arcs still
      // clip a corner or miss entirely rather than all converging.
      const radius = Math.abs(dist + (rand() - 0.5) * diag * 0.78);
      let sweep = Math.PI * (0.35 + rand() * 0.5);
      const aim = Math.atan2(height / 2 - cy, width / 2 - cx);
      let start = aim - sweep / 2 + (rand() - 0.5) * sweep * 1.05;
      if (mobile) {
        // On a narrow screen a mid-air fade reads as a mistake, not a curve —
        // clip the arc to where it actually crosses the screen edges so it
        // always enters from one side and exits another, like a horizon line.
        const span = arcRectSpan(cx, cy, radius, width, height, 70);
        if (span) {
          start = span.start;
          sweep = span.sweep;
        }
      }
      const perParticle = mobile ? 2 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 3);
      return {
        cx,
        cy,
        radius,
        start,
        sweep,
        drift: (rand() - 0.5) * 0.00006, // slow rotation of the whole arc
        alpha: 0.045 + rand() * 0.05,
        particles: Array.from({ length: perParticle }, (_, p) => ({
          t: (p + rand() * 0.6) / perParticle,
          speed: 0.00004 + rand() * 0.00006,
          bright: rand() < 0.12,
          size: 1 + rand() * 1.4,
          flicker: rand() * Math.PI * 2,
        })),
      };
    });
    // A couple of particles move faster and continuously along their path, read as
    // something travelling rather than ambient drift.
    // Nodes that belong to no path: the dust the arcs move through. Positions
    // are fractions of the viewport so a resize repositions rather than rebuilds.
    const ambientCount = mobile ? 26 : 42;
    ambient = Array.from({ length: ambientCount }, () => ({
      x: rand(),
      y: rand(),
      size: 0.5 + rand() * 1.1,
      depth: 0.3 + rand() * 0.7, // drives parallax strength and apparent weight
      alpha: 0.07 + rand() * 0.17,
      vx: (rand() - 0.5) * 0.0000065,
      vy: -0.0000028 - rand() * 0.0000052,
      bright: rand() < 0.06,
      flicker: rand() * Math.PI * 2,
    }));

    const travelerCount = mobile ? 1 : 2;
    travelers = Array.from({ length: travelerCount }, (_, i) => ({
      pathIndex: (i * 3) % paths.length,
      t: rand(),
      speed: 0.00018 + rand() * 0.00012,
    }));
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    glowSprite = buildGlowSprite();
    buildScene();
  }

  function drawFrame(elapsed) {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(driftX, driftY);
    for (const path of paths) {
      const rotation = elapsed * path.drift;
      const a0 = path.start + rotation;
      ctx.beginPath();
      ctx.arc(path.cx, path.cy, path.radius, a0, a0 + path.sweep);
      ctx.strokeStyle = `rgba(${INK}, ${path.alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      for (const particle of path.particles) {
        const t = (particle.t + elapsed * particle.speed) % 1;
        const angle = a0 + path.sweep * t;
        const x = path.cx + Math.cos(angle) * path.radius;
        const y = path.cy + Math.sin(angle) * path.radius;
        const flicker = 0.75 + 0.25 * Math.sin(elapsed * 0.0006 + particle.flicker);
        if (particle.bright && glowSprite) {
          const s = 13 * particle.size;
          ctx.globalAlpha = 0.3 * flicker;
          ctx.drawImage(glowSprite, x - s / 2, y - s / 2, s, s);
          ctx.globalAlpha = 1;
        } else {
          ctx.beginPath();
          ctx.arc(x, y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${INK}, ${0.18 * flicker})`;
          ctx.fill();
        }
      }
    }

    for (const traveler of travelers) {
      const path = paths[traveler.pathIndex];
      if (!path) continue;
      const rotation = elapsed * path.drift;
      const a0 = path.start + rotation;
      const t = (traveler.t + elapsed * traveler.speed) % 1;
      const angle = a0 + path.sweep * t;
      const x = path.cx + Math.cos(angle) * path.radius;
      const y = path.cy + Math.sin(angle) * path.radius;
      const s = 20;
      if (glowSprite) {
        ctx.globalAlpha = 0.45;
        ctx.drawImage(glowSprite, x - s / 2, y - s / 2, s, s);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    // Ambient dust sits outside the shared translate so each node can carry its
    // own parallax weight — near nodes shift more than far ones, which is what
    // sells depth rather than a flat plane sliding around.
    for (const node of ambient) {
      const nx = wrap(node.x + node.vx * elapsed) * width + driftX * node.depth;
      const ny = wrap(node.y + node.vy * elapsed) * height + driftY * node.depth;
      const flicker = 0.78 + 0.22 * Math.sin(elapsed * 0.0005 + node.flicker);
      if (node.bright && glowSprite) {
        const s = 12 * node.size;
        ctx.globalAlpha = 0.26 * flicker;
        ctx.drawImage(glowSprite, nx - s / 2, ny - s / 2, s, s);
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(nx, ny, node.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${INK}, ${node.alpha * flicker})`;
      ctx.fill();
    }

    // Keep a soft clearing behind the greeting itself — lines and dust can
    // pass near it, but nothing should visibly cross the word.
    if (greetingEl) {
      const g = greetingEl.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      const gx = g.left - c.left + g.width / 2;
      const gy = g.top - c.top + g.height / 2;
      const rx = g.width / 2 + 56;
      const ry = g.height / 2 + 44;
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(rx, ry));
      grad.addColorStop(0, "rgba(0, 0, 0, 0.9)");
      grad.addColorStop(0.55, "rgba(0, 0, 0, 0.5)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(gx, gy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function frame(now) {
    // Touch devices get no pointer parallax, so give the scene a slow,
    // autonomous sway instead — small enough to read as breathing, not motion
    // chasing anything.
    if (coarseQuery.matches) {
      targetX = Math.sin(now * 0.00007) * 5;
      targetY = Math.cos(now * 0.00005) * 3.5;
    }
    driftX += (targetX - driftX) * 0.02;
    driftY += (targetY - driftY) * 0.02;
    drawFrame(now);
    raf = requestAnimationFrame(frame);
  }

  function drawStatic() {
    driftX = driftY = targetX = targetY = 0;
    drawFrame(0);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (reduceQuery.matches) drawStatic();
    else raf = requestAnimationFrame(frame);
  }

  function onPointerMove(event) {
    const rect = container.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    targetX = -nx * 14; // parallax only, eased toward in the frame loop above
    targetY = -ny * 14;
    container.style.setProperty("--cursor-x", `${(nx + 0.5) * 100}%`);
    container.style.setProperty("--cursor-y", `${(ny + 0.5) * 100}%`);
    container.classList.add("has-cursor-glow");
  }

  function onPointerLeave() {
    targetX = 0;
    targetY = 0;
    container.classList.remove("has-cursor-glow");
  }

  function onResize() {
    resize();
  }

  function onReduceChange() {
    start();
  }

  resize();
  start();
  window.addEventListener("resize", onResize);
  if (!coarseQuery.matches) {
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
  }
  reduceQuery.addEventListener("change", onReduceChange);

  return {
    // Called by intro.js on a greeting change: briefly swells the CSS atmosphere glow.
    // Restarting the CSS animation needs a remove → reflow → add, not just re-adding
    // the class, or a pulse that lands mid-animation would be silently ignored.
    pulse() {
      clearTimeout(pulseTimer);
      glow.classList.remove("is-pulsing");
      void glow.offsetWidth;
      glow.classList.add("is-pulsing");
      pulseTimer = setTimeout(() => glow.classList.remove("is-pulsing"), 900);
    },
    destroy() {
      cancelAnimationFrame(raf);
      clearTimeout(pulseTimer);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      reduceQuery.removeEventListener("change", onReduceChange);
      container.classList.remove("has-cursor-glow");
      container.style.removeProperty("--cursor-x");
      container.style.removeProperty("--cursor-y");
    },
  };
}
