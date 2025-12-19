import { collectFrames } from "./frameScanner.js";
import { waitForDomStable } from "./waitForDomStable.js";
import {
  queryByCss,
  queryById,
  queryByRole,
  queryByText,
} from "./locatorStrategies.js";
import { scoreCandidate } from "./scoreMatch.js";

const DEFAULT_TIMEOUT = 8000;
const DEFAULT_RETRIES = 3;

export async function resolveTarget(stepTarget, options = {}) {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const start = Date.now();
  let attempt = 0;
  let lastError = null;
  const debug = [];

  while (attempt <= retries) {
    const remaining = timeoutMs - (Date.now() - start);
    if (remaining <= 0) break;
    try {
      const res = await attemptResolve(stepTarget, remaining, debug);
      if (res) return { status: "SUCCESS", element: res.el, frame: res.frame, debug };
    } catch (e) {
      lastError = e;
      debug.push({ type: "error", message: e?.message });
    }
    attempt++;
    await wait(200 * attempt);
  }
  return {
    status: "HARD_FAIL",
    element: null,
    frame: null,
    debug,
    error: lastError ? String(lastError) : "Unable to resolve target",
  };
}

async function attemptResolve(stepTarget, timeoutMs, debug) {
  const timer = createTimeout(timeoutMs, "resolveTarget timeout");
  try {
    await waitForDomStable({ timeoutMs: Math.min(timeoutMs, 1500) });
    const frames = collectFrames();
    for (const frame of frames) {
      const res = resolveInFrame(frame, stepTarget, debug);
      if (res) {
        timer.clear();
        return res;
      }
    }
  } finally {
    timer.clear();
  }
  return null;
}

function resolveInFrame(frame, target, debug) {
  const win = frame.win;
  const candidates = [];
  const seenElements = new Map();
  const locatorsRaw = Array.isArray(target.preferredLocators)
    ? target.preferredLocators
    : [];

  // Sort locators so the most specific (data-card-id/list-id, exact text) run first.
  const locators = locatorsRaw.slice().sort((a, b) => {
    return locatorSpecificity(b) - locatorSpecificity(a);
  });

  const pushCandidates = (list, why, confidence = 0.5) => {
    list.forEach((el) => {
      let candidate = seenElements.get(el);
      if (!candidate) {
        const baseScore = scoreCandidate({ el, target });
        candidate = { el, score: baseScore, why };
        seenElements.set(el, candidate);
        candidates.push(candidate);
      }
      candidate.score += confidence * 2;
    });
  };

  for (const loc of locators) {
    if (!loc || !loc.type) continue;
    let confidence = typeof loc.confidence === "number" ? loc.confidence : 0.5;
    const val = String(loc.value || "").toLowerCase();
    if (val.includes("data-card-id") || val.includes("data-list-id")) {
      confidence = Math.max(confidence, 0.95);
    }
    if (loc.type === "id") {
      pushCandidates(queryById(win, loc.value), "id", confidence);
    } else if (loc.type === "css") {
      pushCandidates(queryByCss(win, loc.value), "css", confidence);
    } else if (loc.type === "role") {
      pushCandidates(queryByRole(win, loc.role || loc.value, loc.name), "role", confidence);
    } else if (loc.type === "text") {
      pushCandidates(queryByText(win, loc.value, loc.tag), "text", confidence);
    } else if (loc.type === "xpath") {
      const nodes = queryByXPath(win, loc.value);
      pushCandidates(nodes, "xpath", confidence);
    }
  }

  if (!candidates.length && target.context?.ancestorTrail?.length) {
    try {
      const anchor = findAncestorAnchor(win, target.context.ancestorTrail);
      if (anchor) {
        const sub = anchor.querySelectorAll(target.fingerprint.tag || "*");
        pushCandidates(Array.from(sub), "ancestorTrail", 0.3);
      }
    } catch (e) {
      debug.push({ type: "warn", message: "ancestor search failed" });
    }
  }

  if (!candidates.length && target.fingerprint?.text) {
    pushCandidates(queryByText(win, target.fingerprint.text), "fingerprint-text", 0.2);
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0];
  if (!top || !top.el || top.score < 2) return null;
  return { el: top.el, frame };
}

function locatorSpecificity(loc) {
  if (!loc) return 0;
  const val = String(loc.value || "").toLowerCase();
  let score = loc.confidence || 0;
  if (val.includes("data-card-id") || val.includes("data-list-id")) score += 5;
  if (val.includes("data-testid")) score += 2;
  if (loc.type === "id") score += 3;
  if (loc.type === "text") score += 1.5;
  return score;
}

function queryByXPath(win, xpath) {
  if (!xpath) return [];
  try {
    const doc = win.document;
    const res = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const out = [];
    for (let i = 0; i < res.snapshotLength; i++) {
      const node = res.snapshotItem(i);
      if (node instanceof win.Element) out.push(node);
    }
    return out;
  } catch (e) {
    return [];
  }
}

function findAncestorAnchor(win, trail) {
  if (!Array.isArray(trail) || !trail.length) return null;
  let current = win.document.body;
  for (const seg of trail) {
    if (!current) break;
    const children = current.children;
    const idx = Math.min(seg.index || 0, children.length - 1);
    current = children[idx];
  }
  return current;
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function createTimeout(ms, label) {
  const id = setTimeout(() => {
    console.warn(label || "timeout");
  }, ms);
  return { clear: () => clearTimeout(id) };
}
