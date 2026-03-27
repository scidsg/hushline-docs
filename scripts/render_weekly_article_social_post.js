#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

function parseArgs(argv) {
  const args = {
    article: "",
    articleUrl: "",
    date: "",
    outputDir: "",
    socialRepo: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--article") {
      args.article = argv[index + 1] || "";
      index += 1;
    } else if (value === "--article-url") {
      args.articleUrl = argv[index + 1] || "";
      index += 1;
    } else if (value === "--date") {
      args.date = argv[index + 1] || "";
      index += 1;
    } else if (value === "--output-dir") {
      args.outputDir = argv[index + 1] || "";
      index += 1;
    } else if (value === "--social-repo") {
      args.socialRepo = argv[index + 1] || "";
      index += 1;
    } else if (value === "--help" || value === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (!args.article) {
    throw new Error("Missing required argument: --article");
  }
  if (!args.articleUrl) {
    throw new Error("Missing required argument: --article-url");
  }
  if (!args.date) {
    throw new Error("Missing required argument: --date");
  }
  if (!args.outputDir) {
    throw new Error("Missing required argument: --output-dir");
  }
  if (!args.socialRepo) {
    throw new Error("Missing required argument: --social-repo");
  }

  return args;
}

function printHelp() {
  process.stdout.write(
    [
      "Usage:",
      "  node scripts/render_weekly_article_social_post.js \\",
      "    --article docs/blog/2026-03-26-example/index.md \\",
      "    --article-url https://hushline.app/library/blog/example \\",
      "    --date 2026-03-26 \\",
      "    --output-dir /tmp/weekly-article-social \\",
      "    --social-repo /path/to/hushline-social",
      "",
    ].join("\n"),
  );
}

function readArticle(articlePath) {
  const markdown = fs.readFileSync(articlePath, "utf8");
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!frontmatterMatch) {
    throw new Error(`Missing frontmatter in article: ${articlePath}`);
  }

  return {
    body: markdown.slice(frontmatterMatch[0].length),
    frontmatter: frontmatterMatch[1],
    markdown,
  };
}

function frontmatterField(frontmatter, fieldName) {
  const match = frontmatter.match(new RegExp(`^${fieldName}:\\s*(.+)$`, "m"));
  if (!match) {
    return "";
  }

  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

function extractFirstScreenshot(markdown) {
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match = imagePattern.exec(markdown);

  while (match) {
    const alt = String(match[1] || "").trim();
    const imagePath = String(match[2] || "").trim();

    if (imagePath.startsWith("/img/screenshots/")) {
      const screenshotFile = imagePath.slice("/img/screenshots/".length);
      if (!path.basename(screenshotFile).endsWith("-fold.png")) {
        throw new Error(
          `Weekly article social share requires a current above-the-fold -fold screenshot; found ${imagePath}.`,
        );
      }

      return { alt, screenshotFile };
    }

    match = imagePattern.exec(markdown);
  }

  throw new Error("Weekly article social share requires at least one /img/screenshots/... image in the article.");
}

function stripMarkdown(markdown) {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<!--\s*truncate\s*-->/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[#>*-]\s*/gm, "")
    .replace(/[_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstNonEmptyParagraphs(body, count) {
  return body
    .split(/\n\s*\n/)
    .map((entry) => stripMarkdown(entry))
    .filter((entry) => entry && !entry.startsWith("##") && !entry.startsWith("*"))
    .slice(0, count);
}

function clamp(value, limit) {
  const normalized = String(value || "").trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function fitCopy(limit, segments) {
  const normalized = segments.map((entry) => String(entry || "").trim());
  const joinWithBreaks = (values) => values.filter(Boolean).join("\n\n");
  const lastIndex = normalized.length - 1;
  const tail = normalized[lastIndex];
  const head = normalized.slice(0, lastIndex);

  let candidate = joinWithBreaks([...head, tail]);
  if (candidate.length <= limit) {
    return candidate;
  }

  for (let index = head.length - 1; index >= 0; index -= 1) {
    const otherLength = joinWithBreaks([
      ...head.slice(0, index),
      ...head.slice(index + 1),
      tail,
    ]).length;
    const reserve = otherLength > 0 ? otherLength + 2 : tail.length;
    const available = Math.max(0, limit - reserve);
    head[index] = clamp(head[index], available);
    candidate = joinWithBreaks([...head, tail]);
    if (candidate.length <= limit) {
      return candidate;
    }
  }

  return joinWithBreaks([clamp(tail, limit)]);
}

function inferViewport(screenshotFile) {
  if (screenshotFile.includes("-mobile-")) {
    return "mobile";
  }
  if (screenshotFile.includes("-desktop-")) {
    return "desktop";
  }
  return "desktop";
}

function inferTheme(screenshotFile) {
  if (screenshotFile.includes("-dark-")) {
    return "dark";
  }
  return "light";
}

function weekdayLabel(date) {
  const parsed = new Date(`${date}T12:00:00`);
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][parsed.getDay()];
}

function buildCopy({ articleUrl, excerpt, title }) {
  const sentences = excerpt
    .split(/(?<=[.!?])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const first = sentences[0] || excerpt;
  const second = sentences[1] || "";
  const shortExcerpt = [first, second].filter(Boolean).join(" ");

  return {
    bluesky: fitCopy(
      300,
      [title, first, `Read the new article: ${articleUrl}`],
    ),
    linkedin: fitCopy(
      3000,
      [title, shortExcerpt, `Read the new article: ${articleUrl}`],
    ),
    mastodon: fitCopy(
      500,
      ["New Hush Line article:", title, first, `Read more: ${articleUrl}`],
    ),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const articlePath = path.resolve(args.article);
  const outputDir = path.resolve(args.outputDir);
  const socialRepo = path.resolve(args.socialRepo);
  const requireFromSocial = createRequire(path.join(socialRepo, "package.json"));
  const { renderPost } = requireFromSocial("./scripts/lib/render-social-post.js");

  const article = readArticle(articlePath);
  const title = frontmatterField(article.frontmatter, "title");
  const slug = frontmatterField(article.frontmatter, "slug") || path.basename(path.dirname(articlePath));
  const { alt, screenshotFile } = extractFirstScreenshot(article.markdown);
  const opening = article.body.split(/<!--\s*truncate\s*-->/i)[0] || article.body;
  const excerpt = clamp(firstNonEmptyParagraphs(opening, 2).join(" "), 260);

  if (!title) {
    throw new Error(`Missing title frontmatter in article: ${articlePath}`);
  }
  if (!excerpt) {
    throw new Error(`Could not derive article excerpt from: ${articlePath}`);
  }

  const post = {
    slot: weekdayLabel(args.date),
    planned_date: args.date,
    screenshot_file: screenshotFile,
    content_key: `weekly-article-${slug}`,
    headline: clamp(title, 120),
    subtext: excerpt,
    image_alt_text: clamp(alt || `Screenshot from the Hush Line article "${title}".`, 350),
    social: buildCopy({
      articleUrl: args.articleUrl,
      excerpt,
      title,
    }),
    rationale: `Share the newly published Hush Line article "${title}" on social media after the docs site goes live.`,
    audience_scope: "article-share",
    concept_key: "weekly-article-share",
    copy_brief: "Share the new article directly, with the article URL as the CTA.",
    theme: inferTheme(screenshotFile),
    title,
    viewport: inferViewport(screenshotFile),
    article_url: args.articleUrl,
  };

  await renderPost(post, outputDir);
  process.stdout.write(`${outputDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
