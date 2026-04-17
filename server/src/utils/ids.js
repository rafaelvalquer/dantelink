function randomPart() {
  return Math.random().toString(36).slice(2, 8);
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${randomPart()}`;
}

export function createLinkId() {
  return createId("link");
}

export function createSecondaryLinkId() {
  return createId("secondary_link");
}
