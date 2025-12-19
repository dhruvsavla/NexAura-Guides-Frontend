import { normalizeText } from "../guideSchema.js";

/**
 * Scores an element candidate based on how well it matches the recorded target fingerprint.
 */
export function scoreCandidate({ el, target }) {
  if (!el || !target) return 0;
  let score = 0;
  const fp = target.fingerprint || {};

  // 1. Tag Match
  if (fp.tag && el.tagName && el.tagName.toLowerCase() === fp.tag) score += 2;

  // 2. Unique Href Match (Extremely powerful for Trello cards)
  // If the target is a link or contains a link, check if it points to the same card URL.
  if (target.context?.frame?.href && (el.tagName === 'A' || el.hasAttribute('href'))) {
    const elHref = el.getAttribute('href');
    const recordedUrl = target.context.frame.href;
    if (elHref && recordedUrl) {
      // Check if current href is a part of the recorded absolute URL or vice versa
      if (recordedUrl.includes(elHref) || elHref.includes(recordedUrl.split('trello.com')[1] || '___')) {
        score += 5.0; // Massive boost for matching the unique card identity
      }
    }
  }

  // 3. Attribute Match (Iterate through recorded stable attributes)
  if (fp.attrs && typeof fp.attrs === "object") {
    for (const [attrName, attrValue] of Object.entries(fp.attrs)) {
      const val = el.getAttribute(attrName);
      if (val && val === attrValue) {
        score += 2.0; 
      }
    }
  }

  // 4. Text Match
  if (fp.text) {
    const txt = normalizeText(el.textContent || el.value || "");
    if (txt) {
      if (txt === fp.text) score += 2.5; // Exact match
      else if (txt.includes(fp.text) || fp.text.includes(txt)) score += 1.2;
    }
  }

  // 5. Ancestor Similarity (Determines if it's in the right list/column)
  if (target.context?.ancestorTrail) {
    const similarity = computeAncestorSimilarity(el, target.context.ancestorTrail);
    score += similarity * 3.0; 
  }

  // 6. Classes and Visibility
  if (fp.classTokens && fp.classTokens.length) {
    const classes = new Set(Array.from(el.classList || []));
    const hits = fp.classTokens.filter((c) => classes.has(c)).length;
    score += hits * 0.4;
  }

  if (isVisible(el)) score += 1;

  return score;
}

function computeAncestorSimilarity(el, recordedTrail) {
  const actual = [];
  let node = el;
  for (let i = 0; i < recordedTrail.length && node && node.parentElement; i++) {
    node = node.parentElement;
    actual.push({ tag: node.tagName?.toLowerCase(), index: getIndex(node) });
  }
  let matches = 0;
  for (let i = 0; i < recordedTrail.length && i < actual.length; i++) {
    const rec = recordedTrail[i];
    const act = actual[i];
    if (rec.tag && act.tag && rec.tag === act.tag) matches += 0.6;
    if (typeof rec.index === "number" && typeof act.index === "number") {
      const diff = Math.abs(rec.index - act.index);
      matches += Math.max(0.4 - diff * 0.2, 0);
    }
  }
  const maxPossible = recordedTrail.length;
  return maxPossible ? Math.min(matches / maxPossible, 1) : 0;
}

function getIndex(el) {
  if (!el.parentElement) return 0;
  return Array.from(el.parentElement.children).indexOf(el);
}

export function isVisible(el) {
  if (!el || !(el instanceof Element)) return false;
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}