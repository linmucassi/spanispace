/**
 * The space in SpaniSpace.
 *
 * Spani is work in isiZulu and Space is the galaxy, so the landing page has
 * always wanted to feel like deep space. It used to get there with a Three.js
 * particle network: a 25 MB dependency drawing a moving web of dots, which is
 * both a real download on a South African data bundle and the thing that made
 * the page feel busy. This is the same idea in pure CSS and one inline SVG, no
 * JavaScript, no animation, nothing moving behind the words you are reading.
 *
 * Star positions are baked in as literals rather than generated at runtime.
 * Math.random would differ between the server render and the browser, and even
 * a seeded Math.sin hash can disagree between V8 on the server and
 * JavaScriptCore on an iPhone, which shows up as a hydration mismatch.
 *
 * Each entry is [x%, y%, radius, opacity].
 */
const STARS: [number, number, number, number][] = [
  [3.66, 68.03, 1.44, 0.53],
  [39.96, 77.67, 1.32, 0.45],
  [11.82, 49.41, 0.67, 0.14],
  [47.48, 13.89, 1.45, 0.38],
  [17.32, 27.76, 0.68, 0.22],
  [23.18, 37.5, 1.12, 0.19],
  [75.51, 75.06, 1.43, 0.35],
  [39.67, 96.72, 0.57, 0.26],
  [71.01, 95.7, 1.13, 0.24],
  [36.16, 10.05, 0.86, 0.41],
  [34.94, 21.66, 0.84, 0.4],
  [61.63, 39, 0.67, 0.48],
  [71.32, 35.21, 0.8, 0.32],
  [11.96, 71.93, 1.23, 0.17],
  [48.85, 93.16, 0.82, 0.29],
  [17.86, 38.82, 0.59, 0.35],
  [96.53, 38.97, 1.24, 0.15],
  [15.19, 27.5, 0.5, 0.58],
  [76.4, 72.82, 1.48, 0.59],
  [54.5, 55.95, 0.41, 0.62],
  [28.51, 72.88, 0.58, 0.29],
  [17.07, 50.54, 0.7, 0.22],
  [55.71, 71.46, 1.42, 0.32],
  [55.7, 39.7, 1.15, 0.47],
  [99.37, 75.32, 0.7, 0.44],
  [79.84, 9.35, 1.3, 0.61],
  [30.02, 50.87, 0.4, 0.58],
  [47.08, 25.11, 0.59, 0.59],
  [54.76, 44.01, 1.13, 0.18],
  [28.92, 30.06, 0.75, 0.13],
  [88.69, 21.52, 1.27, 0.17],
  [72.36, 44.38, 1.45, 0.4],
  [13.29, 57.42, 1.37, 0.16],
  [59.23, 69.4, 0.95, 0.56],
  [21.32, 56.62, 0.58, 0.47],
  [11.31, 55.05, 1.01, 0.17],
  [71.74, 63.22, 1.06, 0.4],
  [23.32, 11.79, 0.5, 0.32],
  [35.51, 24.63, 0.76, 0.56],
  [56.45, 81.52, 1.32, 0.44],
  [70.31, 30.4, 0.9, 0.42],
  [77.03, 90.96, 1.36, 0.21],
  [88.3, 48.96, 1, 0.59],
  [91.7, 30.29, 0.91, 0.6],
  [87.63, 30.16, 0.81, 0.15],
  [47.11, 85.66, 1.4, 0.32],
  [96.35, 57.59, 0.81, 0.38],
  [4.85, 97.18, 1.18, 0.21],
  [23.47, 32.8, 1.07, 0.17],
  [86.52, 93.54, 1.3, 0.22],
  [92.71, 51.44, 0.7, 0.19],
  [31.01, 45.57, 1.49, 0.33],
  [8.38, 57.37, 1.08, 0.25],
  [88.79, 38.57, 0.44, 0.56],
  [12.61, 63.45, 0.85, 0.57],
  [53.5, 16.12, 1.29, 0.2],
  [16.01, 86.33, 0.97, 0.31],
  [98.04, 64.96, 0.96, 0.3],
  [96.82, 68.61, 1.2, 0.36],
  [76.52, 33.87, 0.82, 0.32],
  [14.79, 73.15, 0.83, 0.14],
  [49.24, 87.74, 1.36, 0.28],
  [32.59, 28.72, 1.33, 0.18],
  [34.71, 22.74, 0.49, 0.37],
  [23.54, 29.09, 0.75, 0.22],
  [24.72, 27.03, 1.44, 0.27],
  [48.34, 84.31, 1.5, 0.55],
  [11.47, 30.17, 1.23, 0.59],
  [4.48, 84.96, 0.77, 0.19],
  [10.21, 83.99, 0.42, 0.15],
  [90.82, 75.58, 0.57, 0.17],
  [6.97, 47.54, 0.62, 0.17],
  [61.19, 47.8, 0.73, 0.59],
  [94.97, 30.42, 1.38, 0.51],
  [88.11, 10.46, 0.8, 0.3],
  [95.58, 98.88, 0.71, 0.35],
  [14.56, 41.7, 1.16, 0.19],
  [20.89, 63.63, 0.81, 0.46],
  [98.94, 38.58, 0.84, 0.34],
  [62.47, 45.07, 0.91, 0.62],
  [53.62, 68.88, 0.64, 0.46],
  [31.25, 95.81, 0.64, 0.21],
  [40.11, 5.96, 0.41, 0.44],
  [1.06, 9.13, 0.69, 0.27],
  [92.73, 93.26, 1.45, 0.6],
  [39.3, 78.84, 0.63, 0.17],
  [3.43, 58.37, 0.5, 0.56],
  [84.38, 81.46, 1.28, 0.37],
  [40.06, 24.56, 1.15, 0.56],
  [83.07, 74.03, 1.36, 0.17],
];

export default function SpaceBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* The deep field. Brand navy rather than black, so it belongs to the logo. */}
      <div className="absolute inset-0 bg-ink-950" />

      {/* A nebula, off centre so the composition is not a bullseye. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 72% 18%, rgba(0,112,200,0.28) 0%, transparent 62%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 15% 78%, rgba(0,90,165,0.20) 0%, transparent 60%)",
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        {STARS.map(([x, y, r, o], i) => (
          <circle
            key={i}
            cx={`${x}%`}
            cy={`${y}%`}
            r={r}
            fill="#fff"
            opacity={o}
          />
        ))}
      </svg>

      {/* A planet edge rising from below, which is what stops it reading as
          confetti on a dark rectangle and starts it reading as orbit. */}
      <div
        className="absolute left-1/2 h-[120vw] w-[160vw] -translate-x-1/2 rounded-[50%]"
        style={{
          top: "88%",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(0,112,200,0.38) 0%, rgba(11,26,46,0.9) 45%, #0b1a2e 70%)",
          boxShadow: "0 -1px 60px rgba(0,112,200,0.35)",
        }}
      />
    </div>
  );
}
