// Tag this version and push the tag — that push is what starts the Draft
// release workflow (.github/workflows/draft-release.yml), which builds the
// .deb and the AppImage on CI and attaches both to a DRAFT release. Nothing
// is published from here: download the files from the draft, and publish the
// release from GitHub's Releases page when it looks right.
//
//   pnpm run publish                 check, tag, push the tag
//   pnpm run publish -- --dry-run    say what would happen, change nothing
//
// Plain `pnpm publish` is pnpm's own npm-publish command and cannot be
// overridden by a script, hence the `run`.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

const fail = (message) => {
  console.error(`publish: ${message}`);
  process.exit(1);
};
/** git that is allowed to print nothing on success */
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const gitStep = (label, ...args) => {
  try {
    return git(...args);
  } catch (error) {
    fail(`${label} failed: ${(error.stderr || error.message || "").toString().trim()}`);
  }
};

const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const slug =
  /^https:\/\/github\.com\/([^/]+\/[^/.]+?)(?:\.git)?$/.exec(pkg.repository?.url ?? "")?.[1] ??
  "";
if (!slug) fail("package.json repository.url is not a GitHub repository");
const tag = `v${pkg.version}`;
const workflow = ".github/workflows/draft-release.yml";
if (!existsSync(path.join(root, workflow))) fail(`${workflow} is missing — CI would not build`);

// Everything that follows must happen on a committed main, so the tag lands
// on a ref GitHub can build and the release matches what the repo shows.
if (git("status", "--porcelain")) fail("the working tree is not clean — commit (or stash) first");
const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== "main") fail(`on branch "${branch}" — run this from main`);
try {
  gitStep("fetching origin", "fetch", "origin", "--tags", "--quiet");
} catch {
  /* fetching already failed through gitStep */
}
const [behind, ahead] = git("rev-list", "--left-right", "--count", "origin/main...HEAD")
  .split(/\s+/)
  .map(Number);
if (behind > 0) fail(`main is ${behind} commit(s) behind origin/main — pull first`);
if (ahead > 0) {
  console.warn(`publish: ${ahead} local commit(s) are not on origin/main yet (the tag carries them; push main when you can)`);
}
if (git("tag", "--list", tag).split("\n").includes(tag)) {
  fail(
    `tag ${tag} already exists — bump "version" in package.json, or delete it first:\n` +
      `  git tag -d ${tag} && git push origin :refs/tags/${tag}`,
  );
}

const plan = [
  `repository:  ${slug}`,
  `version:     ${pkg.version}`,
  `tag:         ${tag}  (from ${git("rev-parse", "--short", "HEAD")})`,
  "",
  dryRun ? "would push the tag, which triggers:" : "pushing the tag, which triggers:",
  `  ${workflow} → builds the .deb and AppImage and attaches them to a DRAFT release`,
];
console.log(plan.join("\n"));

if (dryRun) {
  console.log("\ndry run — nothing was tagged or pushed");
  process.exit(0);
}

gitStep("creating the tag", "tag", "-a", tag, "-m", `Release ${tag}`);
gitStep("pushing the tag", "push", "origin", `refs/tags/${tag}`);
console.log(
  [
    "",
    `tag ${tag} pushed — watch the build:`,
    `  https://github.com/${slug}/actions/workflows/draft-release.yml`,
    "when it is green, download from the draft:",
    `  https://github.com/${slug}/releases`,
  ].join("\n"),
);
