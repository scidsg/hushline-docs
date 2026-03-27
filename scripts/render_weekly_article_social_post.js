#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

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

function fitCopy(limit, segments, joiner = "\n\n") {
  const normalized = segments.map((entry) => String(entry || "").trim());
  const joinWithBreaks = (values) => values.filter(Boolean).join(joiner);
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

function weekdayLabel(date) {
  const parsed = new Date(`${date}T12:00:00`);
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][parsed.getDay()];
}

function leadingQuestion(title) {
  const trimmed = String(title || "").trim();

  if (!trimmed) {
    return "What does this look like in practice?";
  }

  if (trimmed.endsWith("?")) {
    return trimmed;
  }

  if (/^(what|how|why|when|where|who|should|can|does|do|is|are)\b/i.test(trimmed)) {
    return `${trimmed}?`;
  }

  return "What does this look like in practice?";
}

function publishedLine(title) {
  if (/^how\b/i.test(title)) {
    return "We just published an article showing how Hush Line handles this.";
  }

  if (/^(what|why)\b/i.test(title)) {
    return "We just published an article explaining this.";
  }

  return "We just published an article describing this.";
}

function buildTxt(post) {
  return [
    `Slot: ${post.slot}`,
    `Planned date: ${post.planned_date}`,
    `Publish mode: ${post.publish_mode}`,
    `Article URL: ${post.article_url}`,
    `Content key: ${post.content_key}`,
    `Headline: ${post.headline}`,
    `Subtext: ${post.subtext}`,
    "",
    "Social post copy",
    "",
    `LinkedIn (${post.social.linkedin.length}/3000)`,
    post.social.linkedin,
    "",
    `Mastodon (${post.social.mastodon.length}/500)`,
    post.social.mastodon,
    "",
    `Bluesky (${post.social.bluesky.length}/300)`,
    post.social.bluesky,
    "",
  ].join("\n");
}

function buildCopy({ articleUrl, excerpt, title }) {
  const question = leadingQuestion(title);
  const articleLine = publishedLine(title);
  const lines = [question, articleLine, `read it here: ${articleUrl}`];

  return {
    bluesky: fitCopy(
      300,
      lines,
      "\n",
    ),
    linkedin: fitCopy(
      3000,
      lines,
      "\n",
    ),
    mastodon: fitCopy(
      500,
      lines,
      "\n",
    ),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const articlePath = path.resolve(args.article);
  const outputDir = path.resolve(args.outputDir);

  const article = readArticle(articlePath);
  const title = frontmatterField(article.frontmatter, "title");
  const slug = frontmatterField(article.frontmatter, "slug") || path.basename(path.dirname(articlePath));
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
    content_key: `weekly-article-${slug}`,
    headline: clamp(title, 120),
    subtext: excerpt,
    social: buildCopy({
      articleUrl: args.articleUrl,
      excerpt,
      title,
    }),
    rationale: `Share the newly published Hush Line article "${title}" on social media after the docs site goes live.`,
    audience_scope: "article-share",
    concept_key: "weekly-article-share",
    copy_brief: "Share the new article directly, with the article URL as the CTA.",
    title,
    article_url: args.articleUrl,
    publish_mode: "text",
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "post.json"), `${JSON.stringify(post, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, "post-copy.txt"), `${buildTxt(post)}\n`);
  process.stdout.write(`${outputDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
