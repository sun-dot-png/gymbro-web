const fs = require("fs");
const path = require("path");

const viewDir = path.join(__dirname, "view");
const assets = new Set(fs.readdirSync(path.join(viewDir, "assets")));
const lowerMap = new Map([...assets].map((a) => [a.toLowerCase(), a]));

const targets = [
  ...fs.readdirSync(viewDir)
    .filter((f) => /\.(html|css)$/i.test(f))
    .map((f) => path.join(viewDir, f)),
  ...fs.readdirSync(path.join(viewDir, "js"))
    .filter((f) => f.endsWith(".js"))
    .map((f) => path.join(viewDir, "js", f)),
];

let problems = 0;
for (const file of targets) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/assets\/([^"'()<>?#]+)/g)) {
    let name;
    try { name = decodeURIComponent(m[1]).trim(); } catch { name = m[1].trim(); }
    if (assets.has(name)) continue;
    problems++;
    const fix = lowerMap.get(name.toLowerCase());
    console.log(
      `${path.basename(file)}: "${name}" -> ` +
      (fix ? `ตัวพิมพ์ไม่ตรง ไฟล์จริงคือ "${fix}"` : "ไม่พบไฟล์")
    );
  }
}
console.log(problems === 0 ? "ทุกการอ้างอิงรูปตรงกับไฟล์จริง" : `พบปัญหา ${problems} จุด`);