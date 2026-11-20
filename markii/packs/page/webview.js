(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // markii-pack-source:__markii-jsx-shim.js
  var __markiiJSX = {
    get createElement() {
      return (typeof window !== "undefined" && window.__markiiReact || {}).createElement;
    },
    get Fragment() {
      return (typeof window !== "undefined" && window.__markiiReact || {}).Fragment;
    }
  };

  // markii-pack-source:src/back.tsx
  var back_exports = {};
  __export(back_exports, {
    Back: () => Back
  });
  function Back({ children }) {
    return /* @__PURE__ */ __markiiJSX.createElement("p", { className: "mk-page_back" }, /* @__PURE__ */ __markiiJSX.createElement("svg", { className: "mk-page_back__arrow", viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ __markiiJSX.createElement("path", { d: "M10 3 5 8l5 5", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })), /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-page_back__label" }, "Back to"), /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-page_back__name" }, children));
  }

  // markii-pack-source:src/prev.tsx
  var prev_exports = {};
  __export(prev_exports, {
    Prev: () => Prev
  });

  // markii-pack-source:src/card.tsx
  function stillSource(path, resolve) {
    try {
      const answer = resolve?.(path);
      if (typeof answer === "string") return answer;
      if (answer !== void 0) return answer.src;
    } catch {
    }
    return path;
  }
  var CHEVRON = {
    prev: "M10 3 5 8l5 5",
    next: "M6 3l5 5-5 5"
  };
  function PageCard({ direction, label, attributes, children, resolveImageSrc }) {
    const img = typeof attributes?.img === "string" && attributes.img.trim() !== "" ? attributes.img.trim() : void 0;
    const chevron = /* @__PURE__ */ __markiiJSX.createElement("svg", { className: "mk-page_card__chevron", viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ __markiiJSX.createElement("path", { d: CHEVRON[direction], fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }));
    return /* @__PURE__ */ __markiiJSX.createElement("div", { className: `mk-page_card-wrap mk-page_${direction}` }, /* @__PURE__ */ __markiiJSX.createElement("div", { className: img === void 0 ? "mk-page_card" : "mk-page_card mk-page_card--still" }, img !== void 0 && /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-page_card__still" }, /* @__PURE__ */ __markiiJSX.createElement("img", { src: stillSource(img, resolveImageSrc), alt: "", loading: "lazy", decoding: "async" })), /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-page_card__text" }, /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-page_card__label" }, direction === "prev" && chevron, label, direction === "next" && chevron), /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-page_card__body" }, children))));
  }

  // markii-pack-source:src/prev.tsx
  function Prev(props) {
    return /* @__PURE__ */ __markiiJSX.createElement(PageCard, { ...props, direction: "prev", label: "Previous" });
  }

  // markii-pack-source:src/next.tsx
  var next_exports = {};
  __export(next_exports, {
    Next: () => Next
  });
  function Next(props) {
    return /* @__PURE__ */ __markiiJSX.createElement(PageCard, { ...props, direction: "next", label: "Next" });
  }

  // page-pack-entry.js
  function __markiiPick(mod) {
    if (mod && typeof mod["default"] === "function") return mod["default"];
    for (var key in mod) {
      if (Object.prototype.hasOwnProperty.call(mod, key) && typeof mod[key] === "function") return mod[key];
    }
    return void 0;
  }
  var __markiiComponents = {
    "back": __markiiPick(back_exports),
    "prev": __markiiPick(prev_exports),
    "next": __markiiPick(next_exports)
  };
  if (typeof window !== "undefined" && typeof window.__markiiRegisterPack === "function") {
    __markiiEntries = {};
    __markiiInline = {};
    for (__markiiLocalName in __markiiComponents) {
      if (!Object.prototype.hasOwnProperty.call(__markiiComponents, __markiiLocalName)) continue;
      if (typeof __markiiComponents[__markiiLocalName] !== "function") continue;
      __markiiEntries[__markiiLocalName] = { component: __markiiComponents[__markiiLocalName], inline: __markiiInline[__markiiLocalName] === true };
    }
    window.__markiiRegisterPack('{\n  "name": "page",\n  "version": "1.0.0",\n  "engine": "react",\n  "components": {\n    "back": {\n      "source": "./src/back.tsx",\n      "description": "One quiet line that leads back to the parent page: a left arrow, the muted label \\"Back to\\", and the page name as the link.",\n      "kind": "leaf",\n      "attributes": []\n    },\n    "prev": {\n      "source": "./src/prev.tsx",\n      "description": "A card for the previous page: an optional still, then the label \\"Previous\\" with a left chevron, and the page name as the link. In a card narrower than 34rem the still sits on top. The whole card is the link.",\n      "kind": "container",\n      "attributes": [\n        {\n          "name": "img",\n          "description": "A still shown in the card, as a path relative to the note. Decorative, so it has no alt text. Left out, the card is text only."\n        }\n      ]\n    },\n    "next": {\n      "source": "./src/next.tsx",\n      "description": "A card for the next page: an optional still, then the label \\"Next\\" with a right chevron, the page name as the link, and an optional muted preview line. In a card narrower than 34rem the still sits on top and the text is right-aligned. The whole card is the link.",\n      "kind": "container",\n      "attributes": [\n        {\n          "name": "img",\n          "description": "A still shown on the left half of the card, as a path relative to the note. Decorative, so it has no alt text. Left out, the card is text only."\n        }\n      ]\n    }\n  }\n}\n', __markiiEntries);
  }
  var __markiiEntries;
  var __markiiInline;
  var __markiiLocalName;
})();
