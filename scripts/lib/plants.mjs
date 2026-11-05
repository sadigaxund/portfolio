// Known defects planted into the page, to prove the instrument can see a problem.

const BLOCK = `
  document.addEventListener("line:transition-start", () =>
    setTimeout(() => { const until = performance.now() + 200; while (performance.now() < until); }, 300));
`;

// The animation library keeps the function it finds at load, so the wrapper goes in before it.
const NO_RAF = `
  const real = window.requestAnimationFrame.bind(window);
  let removed = false;
  window.requestAnimationFrame = (callback) => (removed ? 0 : real(callback));
  document.addEventListener("line:transition-start", () => { removed = true; });
`;

// A compositor-driven animation keeps presenting frames while the main thread is blocked.
const COMPOSITOR = `${BLOCK}
  document.addEventListener("DOMContentLoaded", () => {
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;top:0;left:0;width:40px;height:40px;will-change:transform;background:currentColor";
    document.documentElement.append(box);
    box.animate([{ transform: "translateX(0)" }, { transform: "translateX(300px)" }], { duration: 1000, iterations: Infinity });
  });
`;

export const PLANTS = {
  block200: { script: BLOCK, note: "main thread blocked for 200 ms, 300 ms into the transition" },
  noraf: { script: NO_RAF, note: "requestAnimationFrame removed when the transition starts" },
  compositor: { script: COMPOSITOR, note: "200 ms block plus a compositor-only animation, so presented frames continue while rAF stops" },
};
