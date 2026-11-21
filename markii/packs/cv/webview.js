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

  // markii-pack-source:src/entry.tsx
  var entry_exports = {};
  __export(entry_exports, {
    Entry: () => Entry
  });
  function logoSource(path, resolve) {
    try {
      const answer = resolve?.(path);
      if (typeof answer === "string") return answer;
      if (answer !== void 0) return answer.src;
    } catch {
    }
    return path;
  }
  function Entry({ attributes, children, resolveImageSrc }) {
    const logo = typeof attributes?.logo === "string" && attributes.logo.trim() !== "" ? attributes.logo.trim() : void 0;
    return /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-cv_entry" }, /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-cv_entry__rail" }, logo === void 0 ? /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-cv_entry__dot", "aria-hidden": "true" }) : /* @__PURE__ */ __markiiJSX.createElement("img", { className: "mk-cv_entry__logo", src: logoSource(logo, resolveImageSrc), alt: "", width: "48", height: "48", loading: "lazy", decoding: "async" })), /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-cv_entry__body" }, children));
  }

  // markii-pack-source:src/layer.tsx
  var layer_exports = {};
  __export(layer_exports, {
    Layer: () => Layer
  });

  // markii-pack-source:src/levels.tsx
  var LEVELS = {
    work: "Used at work",
    project: "Built a project with it",
    studied: "Studied"
  };
  var text = (value) => typeof value === "string" && value.trim() !== "" ? value.trim() : void 0;
  var levelOf = (value) => (text(value) ?? "studied") in LEVELS ? text(value) ?? "studied" : "studied";
  function Dot({ level }) {
    return /* @__PURE__ */ __markiiJSX.createElement("span", { className: `mk-cv_dot mk-cv_dot--${level}`, "aria-hidden": "true" });
  }

  // markii-pack-source:src/layer.tsx
  function Layer({ attributes, children }) {
    const name = text(attributes?.name) ?? "";
    return /* @__PURE__ */ __markiiJSX.createElement("section", { className: "mk-cv_layer", "aria-label": name }, /* @__PURE__ */ __markiiJSX.createElement("h3", { className: "mk-cv_layer__name" }, name), /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-cv_layer__tools" }, children));
  }

  // markii-pack-source:src/skill.tsx
  var skill_exports = {};
  __export(skill_exports, {
    Skill: () => Skill
  });
  function Skill({ attributes, children }) {
    const level = levelOf(attributes?.level);
    const used = text(attributes?.used);
    const label = /* @__PURE__ */ __markiiJSX.createElement(__markiiJSX.Fragment, null, /* @__PURE__ */ __markiiJSX.createElement(Dot, { level }), /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-cv_skill__name" }, children), /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-cv_skill__level" }, LEVELS[level]));
    if (used === void 0) return /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-cv_skill" }, label);
    return /* @__PURE__ */ __markiiJSX.createElement("details", { className: "mk-cv_skill mk-cv_skill--used" }, /* @__PURE__ */ __markiiJSX.createElement("summary", null, label), /* @__PURE__ */ __markiiJSX.createElement("p", { className: "mk-cv_skill__used" }, used));
  }

  // markii-pack-source:src/legend.tsx
  var legend_exports = {};
  __export(legend_exports, {
    Legend: () => Legend
  });
  function Legend() {
    return /* @__PURE__ */ __markiiJSX.createElement("ul", { className: "mk-cv_legend" }, Object.keys(LEVELS).map((level) => /* @__PURE__ */ __markiiJSX.createElement("li", { key: level }, /* @__PURE__ */ __markiiJSX.createElement(Dot, { level }), LEVELS[level])));
  }

  // cv-pack-entry.js
  function __markiiPick(mod) {
    if (mod && typeof mod["default"] === "function") return mod["default"];
    for (var key in mod) {
      if (Object.prototype.hasOwnProperty.call(mod, key) && typeof mod[key] === "function") return mod[key];
    }
    return void 0;
  }
  var __markiiComponents = {
    "entry": __markiiPick(entry_exports),
    "layer": __markiiPick(layer_exports),
    "skill": __markiiPick(skill_exports),
    "legend": __markiiPick(legend_exports)
  };
  if (typeof window !== "undefined" && typeof window.__markiiRegisterPack === "function") {
    __markiiEntries = {};
    __markiiInline = {};
    for (__markiiLocalName in __markiiComponents) {
      if (!Object.prototype.hasOwnProperty.call(__markiiComponents, __markiiLocalName)) continue;
      if (typeof __markiiComponents[__markiiLocalName] !== "function") continue;
      __markiiEntries[__markiiLocalName] = { component: __markiiComponents[__markiiLocalName], inline: __markiiInline[__markiiLocalName] === true };
    }
    window.__markiiRegisterPack(`{
  "name": "cv",
  "version": "1.0.0",
  "engine": "react",
  "components": {
    "entry": {
      "source": "./src/entry.tsx",
      "description": "One entry of a career, education, or certification list: a square logo tile on the left, and the Markdown inside on the right, usually a heading, a role line, bullets, and links. Consecutive entries are joined by a rail below each logo, so the list reads as a timeline.",
      "kind": "container",
      "attributes": [
        {
          "name": "logo",
          "description": "The organization's logo as a square image, as a path relative to the note. The tile's own background is part of the image. Decorative, because the heading beside it names the organization."
        }
      ]
    },
    "layer": {
      "source": "./src/layer.tsx",
      "description": "One layer of a skills stack, such as Process or Store: its name on the left and the cv_skill lines inside it as a wrapping row of tools.",
      "kind": "container",
      "attributes": [
        {
          "name": "name",
          "description": "The layer's name, shown as its heading."
        }
      ]
    },
    "skill": {
      "source": "./src/skill.tsx",
      "description": "One tool in a layer, with a dot for how deep it went: used at work, built a project with it, or studied. With used, the tool opens on tap to show where it was used.",
      "kind": "leaf",
      "attributes": [
        {
          "name": "level",
          "description": "work, project, or studied. Anything else counts as studied."
        },
        {
          "name": "used",
          "description": "Where the tool was used, such as \\"KDM Force, Aqueduct\\". Left out, the tool does not open."
        }
      ]
    },
    "legend": {
      "source": "./src/legend.tsx",
      "description": "What each dot means: used at work, built a project with it, or studied.",
      "kind": "leaf",
      "attributes": []
    }
  }
}
`, __markiiEntries);
  }
  var __markiiEntries;
  var __markiiInline;
  var __markiiLocalName;
})();
