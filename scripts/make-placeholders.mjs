// Generates plain, labeled gray placeholder SVGs. Run: npm run placeholders
import { writeFileSync, mkdirSync } from "node:fs";
const box = (label, w = 1600, h = 1000) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">
<rect width="100%" height="100%" fill="#d9d6cf"/>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="#a9a59c" stroke-width="2"/>
<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, Menlo, monospace" font-size="${Math.round(w / 40)}" fill="#55524c">${label}</text>
<text x="50%" y="${h / 2 + w / 28}" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="${Math.round(w / 70)}" fill="#7a766e">${w} × ${h}</text>
</svg>`;
const files = {
  "public/images/site/featured-video.svg": box("[PLACEHOLDER: featured video]", 1600, 900),
  "public/images/projects/example-project-one/cover.svg": box("More things Coming Soon"),
  "public/images/projects/example-project-one/demo.svg": box("[PLACEHOLDER: project one demo]", 1600, 900),
  "public/images/projects/example-project-one/detail.svg": box("[PLACEHOLDER: detail / CAD image]"),
  "public/images/projects/example-project-two/cover.svg": box("More things Coming Soon"),
  "public/images/projects/example-project-two/demo.svg": box("[PLACEHOLDER: project two demo]", 1600, 900),
};
for (const [p, svg] of Object.entries(files)) {
  mkdirSync(p.split("/").slice(0, -1).join("/"), { recursive: true });
  writeFileSync(p, svg);
}
console.log("wrote", Object.keys(files).length, "placeholders");
