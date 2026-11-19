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

  // markii-pack-source:src/next.tsx
  var next_exports = {};
  __export(next_exports, {
    Next: () => Next
  });
  function stillSource(path, resolve) {
    try {
      const answer = resolve?.(path);
      if (typeof answer === "string") return answer;
      if (answer !== void 0) return answer.src;
    } catch {
    }
    return path;
  }
  function Next({ attributes, children, resolveImageSrc }) {
    const img = typeof attributes?.img === "string" && attributes.img.trim() !== "" ? attributes.img.trim() : void 0;
    return /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-page_next" }, /* @__PURE__ */ __markiiJSX.createElement("div", { className: img === void 0 ? "mk-page_next__card" : "mk-page_next__card mk-page_next__card--still" }, img !== void 0 && /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-page_next__still" }, /* @__PURE__ */ __markiiJSX.createElement("img", { src: stillSource(img, resolveImageSrc), alt: "", loading: "lazy", decoding: "async" })), /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-page_next__text" }, /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-page_next__label" }, "Next"), /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-page_next__body" }, children))));
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
    window.__markiiRegisterPack('{\n  "name": "page",\n  "version": "1.0.0",\n  "engine": "react",\n  "components": {\n    "back": {\n      "source": "./src/back.tsx",\n      "description": "One quiet line that leads back to the parent page: a left arrow, the muted label \\"Back to\\", and the page name as the link.",\n      "kind": "leaf",\n      "attributes": []\n    },\n    "next": {\n      "source": "./src/next.tsx",\n      "description": "A wide card for the next page: an optional still on the left, then the label \\"Next\\", the page name as the link, and a muted preview line. The whole card is the link.",\n      "kind": "container",\n      "attributes": [\n        {\n          "name": "img",\n          "description": "A still shown on the left half of the card, as a path relative to the note. Decorative, so it has no alt text. Left out, the card is text only."\n        }\n      ]\n    }\n  }\n}\n', __markiiEntries);
  }
  var __markiiEntries;
  var __markiiInline;
  var __markiiLocalName;
})();
