(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // scripts/jsx-shim.js
  var __markiiJSX;
  var init_jsx_shim = __esm({
    "scripts/jsx-shim.js"() {
      __markiiJSX = {
        get createElement() {
          return (typeof window !== "undefined" && window.__markiiReact || {}).createElement;
        },
        get Fragment() {
          return (typeof window !== "undefined" && window.__markiiReact || {}).Fragment;
        }
      };
    }
  });

  // markii-lazy-global:react
  var require_react = __commonJS({
    "markii-lazy-global:react"(exports, module) {
      init_jsx_shim();
      function __markiiTarget() {
        return typeof window !== "undefined" && window["__markiiReact"] || {};
      }
      var __markiiKeys = ["Children", "Component", "Fragment", "Profiler", "PureComponent", "StrictMode", "Suspense", "act", "cloneElement", "createContext", "createElement", "createFactory", "createRef", "forwardRef", "isValidElement", "lazy", "memo", "startTransition", "unstable_act", "useCallback", "useContext", "useDebugValue", "useDeferredValue", "useEffect", "useId", "useImperativeHandle", "useInsertionEffect", "useLayoutEffect", "useMemo", "useReducer", "useRef", "useState", "useSyncExternalStore", "useTransition", "version"];
      module.exports = new Proxy({}, {
        get(_t, prop) {
          if (__markiiKeys.indexOf(prop) === -1) return void 0;
          return __markiiTarget()[prop];
        },
        has(_t, prop) {
          return __markiiKeys.indexOf(prop) !== -1;
        },
        ownKeys() {
          return __markiiKeys;
        },
        getOwnPropertyDescriptor(_t, prop) {
          if (__markiiKeys.indexOf(prop) === -1) return void 0;
          return { enumerable: true, configurable: true };
        }
      });
    }
  });

  // packs/nav/nav-pack-entry.js
  init_jsx_shim();

  // packs/nav/index.tsx
  var nav_exports = {};
  __export(nav_exports, {
    NavIndex: () => NavIndex
  });
  init_jsx_shim();
  var import_react2 = __toESM(require_react(), 1);

  // packs/nav/children.ts
  init_jsx_shim();
  var import_react = __toESM(require_react(), 1);
  var MAX_WALK_DEPTH = 6;
  function parseAttrs(raw) {
    if (typeof raw !== "string" || raw === "") return {};
    try {
      const parsed = JSON.parse(raw);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      const result = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string" || value === null) result[key] = value;
      }
      return result;
    } catch {
      return {};
    }
  }
  function readDirectiveChild(node) {
    if (!(0, import_react.isValidElement)(
      node
    )) {
      return void 0;
    }
    const name = node.props["data-mk-name"];
    if (typeof name !== "string" || name === "") return void 0;
    return {
      name,
      attributes: parseAttrs(node.props["data-mk-attrs"]),
      children: node.props.children
    };
  }
  function findDirectiveChildren(node, names, depth = MAX_WALK_DEPTH) {
    const found = [];
    collect(node, names, depth, found);
    return found;
  }
  function collect(node, names, depth, found) {
    if (node === null || node === void 0 || typeof node === "boolean") return;
    import_react.Children.forEach(node, (child) => {
      const directive = safeReadDirectiveChild(child);
      if (directive !== void 0 && names.has(directive.name)) {
        found.push(directive);
        return;
      }
      if (depth <= 0) return;
      if ((0, import_react.isValidElement)(child)) {
        collect(child.props.children, names, depth - 1, found);
      }
    });
  }
  function safeReadDirectiveChild(node) {
    try {
      return readDirectiveChild(node);
    } catch {
      return void 0;
    }
  }
  function hasContent(node) {
    try {
      let found = false;
      import_react.Children.forEach(node, (child) => {
        if (found) return;
        if (child === null || child === void 0 || typeof child === "boolean") return;
        if (typeof child === "string") {
          if (child.trim() !== "") found = true;
          return;
        }
        found = true;
      });
      return found;
    } catch {
      return false;
    }
  }
  var MAX_TEXT_WALK_DEPTH = 6;
  var MAX_PLAIN_TEXT_LENGTH = 300;
  function plainText(node) {
    try {
      const state = { parts: [], length: 0, truncated: false };
      collectText(node, MAX_TEXT_WALK_DEPTH, state);
      return state.parts.join("").trim();
    } catch {
      return void 0;
    }
  }
  function collectText(node, depth, state) {
    if (state.truncated) return;
    if (node === null || node === void 0 || typeof node === "boolean") return;
    if (typeof node === "string" || typeof node === "number") {
      const text = String(node);
      const room = MAX_PLAIN_TEXT_LENGTH - state.length;
      if (room <= 0) {
        state.truncated = true;
        return;
      }
      const piece = text.length > room ? text.slice(0, room) : text;
      state.parts.push(piece);
      state.length += piece.length;
      if (piece.length < text.length) state.truncated = true;
      return;
    }
    import_react.Children.forEach(node, (child) => {
      if (state.truncated) return;
      if ((0, import_react.isValidElement)(child)) {
        if (depth <= 0) return;
        collectText(child.props.children, depth - 1, state);
      } else {
        collectText(child, depth, state);
      }
    });
  }

  // packs/nav/guard.ts
  init_jsx_shim();
  var MAX_TEXT_LENGTH = 500;
  function str(raw, fallback = "") {
    if (typeof raw !== "string") return fallback;
    const trimmed = raw.trim();
    if (trimmed === "") return fallback;
    return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
  }
  function optionalStr(raw) {
    if (typeof raw !== "string") return void 0;
    const trimmed = raw.trim();
    return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
  }
  function oneOf(raw, values, fallback) {
    if (typeof raw !== "string") return fallback;
    const trimmed = raw.trim().toLowerCase();
    return values.includes(trimmed) ? trimmed : fallback;
  }
  function hasAttribute(attributes, key) {
    try {
      return attributes !== null && typeof attributes === "object" && Object.prototype.hasOwnProperty.call(attributes, key);
    } catch {
      return false;
    }
  }
  function safely(read, fallback) {
    try {
      return read();
    } catch {
      return fallback();
    }
  }
  var MAX_HREF_LENGTH = 2e3;
  var SAFE_HREF_SCHEMES = /* @__PURE__ */ new Set(["http", "https", "mailto"]);
  function isControlChar(codePoint) {
    return codePoint >= 0 && codePoint <= 31 || codePoint === 127;
  }
  function isSpaceOrControl(codePoint) {
    return codePoint === 32 || isControlChar(codePoint);
  }
  function trimSpaceAndControl(value) {
    let start = 0;
    let end = value.length;
    while (start < end && isSpaceOrControl(value.charCodeAt(start))) start += 1;
    while (end > start && isSpaceOrControl(value.charCodeAt(end - 1))) end -= 1;
    return value.slice(start, end);
  }
  function hasControlChar(value) {
    for (let i = 0; i < value.length; i += 1) {
      if (isControlChar(value.charCodeAt(i))) return true;
    }
    return false;
  }
  function safeHref(raw) {
    if (typeof raw !== "string") return void 0;
    if (raw.length > MAX_HREF_LENGTH) return void 0;
    const trimmed = trimSpaceAndControl(raw);
    if (trimmed === "") return void 0;
    if (hasControlChar(trimmed)) return void 0;
    const colon = trimmed.indexOf(":");
    if (colon === -1) return trimmed;
    const slash = trimmed.indexOf("/");
    const question = trimmed.indexOf("?");
    const hash = trimmed.indexOf("#");
    const colonIsScheme = (slash === -1 || colon < slash) && (question === -1 || colon < question) && (hash === -1 || colon < hash);
    if (!colonIsScheme) return trimmed;
    const scheme = trimmed.slice(0, colon).toLowerCase();
    return SAFE_HREF_SCHEMES.has(scheme) ? trimmed : void 0;
  }

  // packs/nav/group-card.tsx
  init_jsx_shim();

  // packs/nav/icon.tsx
  init_jsx_shim();
  var ICON_NAMES = [
    "home",
    "doc",
    "book",
    "folder",
    "grid",
    "chart",
    "check",
    "star",
    "arrow",
    "none"
  ];
  var ICON_PATHS = {
    home: { d: "M2 8 L8 2.5 L14 8 M4 6.8 V14 H12 V6.8", strokeLinecap: "round", strokeLinejoin: "round" },
    doc: { d: "M4 1.5 H10 L12.5 4 V14.5 H4 Z M10 1.5 V4 H12.5", strokeLinecap: "round", strokeLinejoin: "round" },
    book: {
      d: "M8 3.3 C6 2.2 4 2 2 2.8 V12.8 C4 12 6 12.2 8 13.3 C10 12.2 12 12 14 12.8 V2.8 C12 2 10 2.2 8 3.3 Z M8 3.3 V13.3",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
    folder: { d: "M2 4 H6.5 L8 6 H14 V13 H2 Z", strokeLinecap: "round", strokeLinejoin: "round" },
    grid: { d: "M2 2 H7 V7 H2 Z M9 2 H14 V7 H9 Z M2 9 H7 V14 H2 Z M9 9 H14 V14 H9 Z", strokeLinejoin: "round" },
    chart: { d: "M4 14 V8.5 M8 14 V4.5 M12 14 V10.5", strokeLinecap: "round" },
    check: { d: "M3 8.5 L6.5 12 L13 4.5", strokeLinecap: "round", strokeLinejoin: "round" },
    star: {
      d: "M8 1.8 L9.7 5.9 L14.2 6.3 L10.8 9.2 L11.8 13.6 L8 11.2 L4.2 13.6 L5.2 9.2 L1.8 6.3 L6.3 5.9 Z",
      strokeLinejoin: "round"
    },
    arrow: { d: "M2 8 H13 M8.5 3.5 L13 8 L8.5 12.5", strokeLinecap: "round", strokeLinejoin: "round" }
  };
  function Icon({ name, className }) {
    const spec = ICON_PATHS[name];
    if (spec === void 0) return null;
    return /* @__PURE__ */ __markiiJSX.createElement(
      "svg",
      {
        viewBox: "0 0 16 16",
        stroke: "currentColor",
        fill: "none",
        strokeWidth: 1.5,
        "aria-hidden": "true",
        focusable: "false",
        className
      },
      /* @__PURE__ */ __markiiJSX.createElement("path", { d: spec.d, strokeLinecap: spec.strokeLinecap, strokeLinejoin: spec.strokeLinejoin })
    );
  }

  // packs/nav/group-card.tsx
  var TONES = ["accent", "info", "success", "warning", "danger", "neutral"];
  var EMPTY_HEADER = { title: "", desc: "", icon: "none", tone: "accent" };
  function resolveGroupHeader(attributes) {
    return safely(
      () => ({
        title: str(attributes?.title),
        desc: str(attributes?.desc),
        icon: oneOf(attributes?.icon, ICON_NAMES, "none"),
        tone: oneOf(attributes?.tone, TONES, "accent")
      }),
      () => EMPTY_HEADER
    );
  }
  function GroupCard({
    title,
    desc,
    icon,
    tone,
    children,
    hidden
  }) {
    const hasTitle = title !== "";
    return /* @__PURE__ */ __markiiJSX.createElement("div", { className: `mk-nav_group mk-nav_group--${tone}`, hidden }, /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-nav_group__head" }, icon !== "none" && /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-nav_group__icon-tile", "aria-hidden": "true" }, /* @__PURE__ */ __markiiJSX.createElement(Icon, { name: icon })), /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-nav_group__heading" }, /* @__PURE__ */ __markiiJSX.createElement(
      "span",
      {
        className: hasTitle ? "mk-nav_group__title" : "mk-nav_group__title mk-nav_group__title--placeholder"
      },
      hasTitle ? title : "untitled group"
    ), desc !== "" && /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-nav_group__desc" }, desc))), /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-nav_group__body" }, children));
  }

  // packs/nav/link-row.tsx
  init_jsx_shim();
  var REJECTED_HREF_REASON = "Link left out: its address is not a supported kind of URL.";
  var EMPTY_RESOLVED = {
    icon: "none",
    hasLabel: false,
    labelContent: void 0,
    desc: "",
    keyHint: "",
    href: void 0,
    hrefRejected: false,
    matchText: null
  };
  function resolveLink(attributes, children) {
    return safely(
      () => {
        const labelAttr = str(attributes?.label);
        const written = hasContent(children);
        const hasLabel = written || labelAttr !== "";
        const labelContent = written ? children : labelAttr;
        const desc = str(attributes?.desc);
        const keyHint = str(attributes?.key);
        const icon = oneOf(attributes?.icon, ICON_NAMES, "none");
        const rawHref = optionalStr(attributes?.href);
        const href = rawHref !== void 0 ? safeHref(rawHref) : void 0;
        const hrefRejected = rawHref !== void 0 && href === void 0;
        const extracted = written ? plainText(children) : void 0;
        const matchSource = !written ? labelAttr : extracted === void 0 ? null : extracted !== "" ? extracted : labelAttr;
        const matchText = matchSource === null ? null : `${matchSource} ${desc} ${keyHint}`.trim().toLowerCase();
        return { icon, hasLabel, labelContent, desc, keyHint, href, hrefRejected, matchText };
      },
      () => EMPTY_RESOLVED
    );
  }
  function LinkRow({
    icon,
    hasLabel,
    labelContent,
    desc,
    keyHint,
    href,
    hrefRejected,
    hidden
  }) {
    const inner = /* @__PURE__ */ __markiiJSX.createElement(__markiiJSX.Fragment, null, /* @__PURE__ */ __markiiJSX.createElement(Icon, { name: icon, className: "mk-nav_link__icon" }), /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-nav_link__text" }, /* @__PURE__ */ __markiiJSX.createElement("span", { className: hasLabel ? "mk-nav_link__label" : "mk-nav_link__label mk-nav_link__label--placeholder" }, hasLabel ? labelContent : "untitled link"), desc !== "" && /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-nav_link__desc", title: desc }, desc)), hrefRejected && /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-nav_link__unlinked", title: REJECTED_HREF_REASON }, "no link"), keyHint !== "" && /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-nav_link__key" }, keyHint));
    if (href !== void 0) {
      return /* @__PURE__ */ __markiiJSX.createElement("a", { className: "mk-nav_link", href, rel: "noopener noreferrer", hidden }, inner);
    }
    return /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-nav_link", hidden }, inner);
  }

  // packs/nav/index.tsx
  var GROUP_NAME = "nav_group";
  var LINK_NAME = "nav_link";
  function matches(matchText, query) {
    return query === "" || matchText === null || matchText.includes(query);
  }
  function collectNav(children) {
    const topLevel = findDirectiveChildren(children, /* @__PURE__ */ new Set([GROUP_NAME, LINK_NAME]));
    const groups = [];
    const looseLinks = [];
    for (const item of topLevel) {
      if (item.name === GROUP_NAME) {
        groups.push(buildGroup(item));
      } else {
        looseLinks.push(resolveLink(item.attributes, item.children));
      }
    }
    return { groups, looseLinks };
  }
  function buildGroup(group) {
    const header = resolveGroupHeader(group.attributes);
    const links = findDirectiveChildren(group.children, /* @__PURE__ */ new Set([LINK_NAME])).map(
      (link) => resolveLink(link.attributes, link.children)
    );
    return {
      header,
      matchText: `${header.title} ${header.desc}`.trim().toLowerCase(),
      links
    };
  }
  function NavIndex({ attributes, children }) {
    const [query, setQuery] = (0, import_react2.useState)("");
    const searchWritten = hasAttribute(attributes, "search");
    const placeholder = searchWritten ? str(attributes?.search, "Search") : void 0;
    const hint = str(attributes?.hint);
    const { groups, looseLinks } = safely(
      () => collectNav(children),
      () => ({ groups: [], looseLinks: [] })
    );
    if (groups.length === 0 && looseLinks.length === 0) {
      return /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-nav_index" }, children);
    }
    const normalizedQuery = query.trim().toLowerCase();
    const looseVisible = looseLinks.map((link) => matches(link.matchText, normalizedQuery));
    const groupVisible = groups.map(
      (group) => matches(group.matchText, normalizedQuery) || group.links.some((link) => matches(link.matchText, normalizedQuery))
    );
    const anyVisible = looseVisible.some(Boolean) || groupVisible.some(Boolean);
    return /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-nav_index" }, searchWritten && /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-nav_index__search" }, /* @__PURE__ */ __markiiJSX.createElement(
      "input",
      {
        type: "text",
        className: "mk-nav_index__input",
        placeholder,
        "aria-label": placeholder,
        value: query,
        onChange: (event) => setQuery(event.target.value)
      }
    ), hint !== "" && /* @__PURE__ */ __markiiJSX.createElement("span", { className: "mk-nav_index__hint" }, hint)), /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-nav_index__body" }, looseLinks.length > 0 && /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-nav_index__loose" }, looseLinks.map((link, index) => /* @__PURE__ */ __markiiJSX.createElement(LinkRow, { key: index, ...link, hidden: !looseVisible[index] }))), groups.map((group, groupIndex) => {
      const groupSelfMatches = matches(group.matchText, normalizedQuery);
      return /* @__PURE__ */ __markiiJSX.createElement(GroupCard, { key: groupIndex, ...group.header, hidden: !groupVisible[groupIndex] }, group.links.map((link, linkIndex) => /* @__PURE__ */ __markiiJSX.createElement(
        LinkRow,
        {
          key: linkIndex,
          ...link,
          hidden: !(groupSelfMatches || matches(link.matchText, normalizedQuery))
        }
      )));
    }), !anyVisible && normalizedQuery !== "" && /* @__PURE__ */ __markiiJSX.createElement("div", { className: "mk-nav_index__empty" }, "No matches")));
  }

  // packs/nav/group.tsx
  var group_exports = {};
  __export(group_exports, {
    NavGroup: () => NavGroup
  });
  init_jsx_shim();
  function NavGroup({ attributes, children }) {
    const header = resolveGroupHeader(attributes);
    return /* @__PURE__ */ __markiiJSX.createElement(GroupCard, { ...header }, children);
  }

  // packs/nav/link.tsx
  var link_exports = {};
  __export(link_exports, {
    NavLink: () => NavLink
  });
  init_jsx_shim();
  function NavLink({ attributes, children }) {
    const resolved = resolveLink(attributes, children);
    return /* @__PURE__ */ __markiiJSX.createElement(LinkRow, { ...resolved });
  }

  // packs/nav/nav-pack-entry.js
  function __markiiPick(mod) {
    if (mod && typeof mod["default"] === "function") return mod["default"];
    for (var key in mod) {
      if (Object.prototype.hasOwnProperty.call(mod, key) && typeof mod[key] === "function") return mod[key];
    }
    return void 0;
  }
  var __markiiComponents = {
    "index": __markiiPick(nav_exports),
    "group": __markiiPick(group_exports),
    "link": __markiiPick(link_exports)
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
  "name": "nav",
  "version": "1.0.0",
  "engine": "react",
  "components": {
    "index": {
      "source": "./index.tsx",
      "description": "A command-style index frame: an optional filter field over grouped and loose nav_link rows.",
      "kind": "container",
      "attributes": [
        {
          "name": "search",
          "description": "Shows the filter field, using this text as its placeholder. Written bare (no value), the field appears with the default placeholder \\"Search\\". Left out entirely, no field is shown.",
          "default": "Search"
        },
        {
          "name": "hint",
          "description": "A key-cap chip shown at the end of the search field. A label only; this pack binds no keyboard shortcut."
        }
      ]
    },
    "group": {
      "source": "./group.tsx",
      "description": "A card grouping nav_link rows under a heading with a tone-tinted icon tile.",
      "kind": "container",
      "attributes": [
        {
          "name": "title",
          "description": "The heading shown at the top of the card."
        },
        {
          "name": "desc",
          "description": "A muted line under the title."
        },
        {
          "name": "icon",
          "description": "The glyph shown in the heading's icon tile.",
          "values": ["home", "doc", "book", "folder", "grid", "chart", "check", "star", "arrow", "none"],
          "default": "none"
        },
        {
          "name": "tone",
          "description": "The color tint applied to the icon tile.",
          "values": ["accent", "info", "success", "warning", "danger", "neutral"],
          "default": "accent"
        }
      ]
    },
    "link": {
      "source": "./link.tsx",
      "description": "One row: an icon, a label, an optional description, an optional key-cap hint, and an optional link.",
      "kind": "leaf",
      "attributes": [
        {
          "name": "label",
          "description": "The row's label, used when the directive has no bracket content."
        },
        {
          "name": "desc",
          "description": "A muted description shown under the label."
        },
        {
          "name": "href",
          "description": "The row's destination. Only http(s), mailto, and relative/fragment addresses are accepted; anything else is left out and the row renders without a link."
        },
        {
          "name": "key",
          "description": "A key-cap hint shown at the end of the row. A label only; this pack binds no keyboard shortcut."
        },
        {
          "name": "icon",
          "description": "The glyph shown at the start of the row.",
          "values": ["home", "doc", "book", "folder", "grid", "chart", "check", "star", "arrow", "none"],
          "default": "none"
        }
      ]
    }
  }
}
`, __markiiEntries);
  }
  var __markiiEntries;
  var __markiiInline;
  var __markiiLocalName;
})();
