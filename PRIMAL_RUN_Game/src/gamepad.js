/* PRIMAL RUN gamepad helpers (2026-10-23, FEATURES.gamepadFull). Pure functions so they can be unit tested:
   which connected pad the player is using, a round dead zone, button names per controller family (Xbox, PlayStation,
   Nintendo; Steam Deck and unknown pads use Xbox names), held-direction repeat for menus, and spatial menu navigation.
   Buttons follow the Gamepad API "standard" layout by position: 0 south, 1 east, 2 west, 3 north, 4/5 shoulders,
   6/7 triggers, 8 view/select, 9 menu/start, 12-15 D-pad up/down/left/right. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PrimalGamepad = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const BUTTON = { south: 0, east: 1, west: 2, north: 3, lb: 4, rb: 5, lt: 6, rt: 7, view: 8, menu: 9, up: 12, down: 13, left: 14, right: 15 };
  // Symbols are bracket tokens so i18n keeps them as key names and sentences keep one dictionary entry.
  const LABELS = {
    xbox: { south: 'A', east: 'B', west: 'X', north: 'Y', lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT', view: '[⧉]', menu: '[☰]' },
    playstation: { south: '[✕]', east: '[○]', west: '[□]', north: '[△]', lb: '[L1]', rb: '[R1]', lt: '[L2]', rt: '[R2]', view: '[CREATE]', menu: '[OPTIONS]' },
    nintendo: { south: 'B', east: 'A', west: 'Y', north: 'X', lb: 'L', rb: 'R', lt: 'ZL', rt: 'ZR', view: '[−]', menu: '[+]' }
  };
  function family(id) {
    const s = String(id || '');
    if (/xbox|xinput|045e/i.test(s)) return 'xbox';
    if (/054c|sony|dualshock|dualsense|playstation/i.test(s)) return 'playstation';
    if (/057e|nintendo|joy-con|^pro controller/i.test(s)) return 'nintendo';
    return 'xbox';
  }
  function label(fam, button) { return (LABELS[fam] || LABELS.xbox)[button] || ''; }
  // Round dead zone: below `dead` is zero, above it the stick is rescaled so small diagonal moves stay diagonal.
  function radial(x, y, dead = 0.2) {
    const m = Math.hypot(x || 0, y || 0);
    if (m <= dead) return { x: 0, y: 0 };
    const k = Math.min(1, (m - dead) / (1 - dead)) / m;
    return { x: x * k, y: y * k };
  }
  // Remembers each pad's resting axes, so a pad (or a phantom device) whose axis rests at -1 never counts as input.
  function createTracker() {
    const rest = new Map();
    let active = -1;
    function used(pad) {
      if (!rest.has(pad.index)) rest.set(pad.index, Array.from(pad.axes || []).slice(0, 4));
      const base = rest.get(pad.index);
      return (pad.buttons || []).some(b => b && (b.pressed || b.value > 0.5)) || Array.from(pad.axes || []).slice(0, 4).some((a, i) => Math.abs(a - (base[i] || 0)) > 0.5);
    }
    // The pad that pressed something most recently; otherwise the one used before; otherwise a standard-mapped pad.
    function pick(list) {
      const pads = Array.from(list || []).filter(p => p && p.connected !== false);
      for (const index of Array.from(rest.keys())) if (!pads.some(p => p.index === index)) rest.delete(index);
      const busy = pads.filter(used).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      if (busy.length) active = busy[0].index;
      return pads.find(p => p.index === active) || pads.find(p => p.mapping === 'standard') || pads[0] || null;
    }
    return { pick, used, get active() { return active; } };
  }
  // One view of any pad in the standard layout: { buttons: [bool x17], axes: [lx, ly, rx, ry], raw }.
  // Chrome, Edge and Firefox on Windows give "standard" mapping for Xbox/PlayStation/Switch Pro pads. Without it
  // (Firefox on Linux, DirectInput pads) we read the Linux xpad order and the D-pad from axes 6/7 or a hat axis 9.
  function normalize(pad) {
    if (!pad) return null;
    const raw = Array.from(pad.buttons || []), ax = Array.from(pad.axes || []);
    const on = b => !!(b && (b.pressed || b.value > 0.5));
    let buttons = raw.map(on), axes = ax.slice(0, 4);
    if (pad.mapping !== 'standard') {
      if (ax.length >= 8 && raw.length <= 11) {
        // Linux xpad: A B X Y LB RB back start guide LS RS; axes LX LY LT RX RY RT dpadX dpadY.
        const b = buttons;
        buttons = [b[0], b[1], b[2], b[3], b[4], b[5], ax[2] > 0, ax[5] > 0, b[6], b[7], b[9], b[10], ax[7] < -0.5, ax[7] > 0.5, ax[6] < -0.5, ax[6] > 0.5, b[8]];
        axes = [ax[0], ax[1], ax[3], ax[4]];
      } else if (!(raw.length > 15) && ax.length >= 10 && Math.abs(ax[9]) <= 1.01) {
        // Hat switch: -1 up, then clockwise in steps of 2/7; anything above 1 is neutral.
        const step = Math.round((ax[9] + 1) * 3.5), dirs = [[1, 0, 0, 0], [1, 0, 0, 1], [0, 0, 0, 1], [0, 1, 0, 1], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [1, 0, 1, 0]][step % 8];
        for (let i = 0; i < 4; i++) buttons[12 + i] = buttons[12 + i] || !!dirs[i];
      }
    }
    while (buttons.length < 17) buttons.push(false);
    while (axes.length < 4) axes.push(0);
    return { index: pad.index, id: pad.id || '', mapping: pad.mapping || '', buttons: buttons.map(Boolean), axes: axes.map(a => a || 0), raw: pad };
  }
  // Short rumble where the browser supports it (Chrome/Edge: vibrationActuator; Firefox has none on most pads).
  function rumble(pad, strong, weak, ms) {
    const actuator = pad && pad.vibrationActuator;
    if (!actuator || !actuator.playEffect) return false;
    try { const p = actuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }); if (p && p.catch) p.catch(() => {}); return true; } catch (_) { return false; }
  }
  // Menu direction from D-pad or left stick (dominant axis past `threshold`). Takes a normalized pad.
  function direction(pad, threshold = 0.5) {
    if (!pad) return '';
    const b = i => !!pad.buttons[i];
    if (b(BUTTON.up)) return 'up';
    if (b(BUTTON.down)) return 'down';
    if (b(BUTTON.left)) return 'left';
    if (b(BUTTON.right)) return 'right';
    const x = pad.axes[0] || 0, y = pad.axes[1] || 0;
    if (Math.max(Math.abs(x), Math.abs(y)) < threshold) return '';
    return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
  }
  // Held direction: fires on press, then after `delay` s every `rate` s.
  function createRepeater(delay = 0.38, rate = 0.12) {
    let dir = '', held = 0, next = 0;
    return function step(current, dt) {
      if (current !== dir) { dir = current; held = 0; next = delay; return current; }
      if (!current) return '';
      held += dt;
      if (held >= next) { next += rate; return current; }
      return '';
    };
  }
  const VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  // Closest rect in a direction: distance along the direction plus a penalty for sideways offset.
  // Up/down wrap to the far end of the list when nothing lies further that way.
  function navigate(rects, current, dir) {
    const d = VEC[dir];
    if (!d || !rects.length) return -1;
    if (current < 0 || !rects[current]) return 0;
    const c = rects[current], cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    let best = -1, bestScore = Infinity, wrap = -1, wrapScore = -Infinity;
    rects.forEach((r, i) => {
      if (i === current) return;
      const vx = r.x + r.w / 2 - cx, vy = r.y + r.h / 2 - cy, along = vx * d[0] + vy * d[1], side = Math.abs(vx * d[1] - vy * d[0]);
      if (along > 4) { const score = along + side * 2; if (score < bestScore) { bestScore = score; best = i; } }
      else if (d[1] && along < -4) { const score = -along - side * 2; if (score > wrapScore) { wrapScore = score; wrap = i; } }
    });
    return best >= 0 ? best : wrap >= 0 ? wrap : current;
  }
  return { BUTTON, LABELS, family, label, radial, createTracker, normalize, rumble, direction, createRepeater, navigate };
});
