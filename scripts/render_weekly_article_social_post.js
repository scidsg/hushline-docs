#!/usr/bin/env node

"use strict";

const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const CODEX_MODEL = process.env.HUSHLINE_CODEX_MODEL || "gpt-5.4";
const CODEX_REASONING_EFFORT = process.env.HUSHLINE_CODEX_REASONING_EFFORT || "high";
const SOCIAL_COPY_MAX_ATTEMPTS = 3;
const BANNED_PLAIN_LANGUAGE_PHRASES = [
  "sort private outreach",
  "private outreach",
  "turning intake into chat",
  "chat workflow",
  "intake shape",
  "operational context",
  "who reviewed",
  "reviewed them",
  "team assignment",
  "shared queue",
];
const BANNED_PLAIN_LANGUAGE_PATTERNS = [
  /\bsort\b.+\boutreach\b/i,
  /\bchat\b/i,
];

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

function articleHeadings(markdown) {
  return String(markdown || "")
    .split("\n")
    .filter((line) => /^##\s+/.test(line))
    .map((line) => line.replace(/^##\s+/, "").trim())
    .filter(Boolean);
}

function buildSocialCopyPrompt({ articleUrl, excerpt, feedback, headings, markdown, subtitle, title }) {
  const lines = [
    "You are writing social post copy for one newly published Hush Line article.",
    "",
    "Return JSON only with exactly these keys:",
    '{"question":"...","article_line":"..."}',
    "",
    "Rules:",
    "- `question` must be one engaging, grammatical question ending with `?`.",
    "- `question` must name the actual subject directly. Do not use vague placeholders like `this`, `that`, `before launch`, or `set this up` unless the subject is explicit in the same sentence.",
    "- `article_line` must be one sentence that starts exactly with `We just published an article`.",
    "- `article_line` must complement the question instead of repeating the same core phrase verbatim.",
    "- Use plain language. Prefer everyday wording over product, marketing, legal, or operations jargon.",
    "- Name the concrete thing the article helps with. Do not rely on abstract phrasing like `workflow`, `operational context`, or `intake shape` unless you explain it in plain language.",
    "- Do not use phrases like `turning intake into chat`, `chat workflow`, or similar internal shorthand. Say plainly what the tool helps the team do.",
    "- If a phrase would sound unclear to a normal reader scrolling LinkedIn, rewrite it more simply.",
    "- Do not imply unsupported product behavior such as multi-user assignment, reviewer tracking, shared queues, or per-user audit state unless the docs in this repo explicitly support it.",
    "- If you mention the product name, spell it exactly `Hush Line`.",
    "- Do not include the link, emojis, hashtags, bullets, markdown, code fences, or extra keys.",
    "- Keep the combined `question` and `article_line` concise enough that adding a third line `Read it here 👉 <url>` will still fit within 500 characters total.",
    "- Use the article content as the source of truth. Do not invent unsupported product behavior.",
    "",
    "Article context:",
    `Title: ${title}`,
    `Subtitle: ${subtitle || "(none)"}`,
    `Excerpt: ${excerpt}`,
    `URL: ${articleUrl}`,
    `Section headings: ${headings.length ? headings.join(" | ") : "(none)"}`,
    "",
    "Article markdown:",
    markdown,
    "",
  ];

  if (feedback) {
    lines.push("Revision feedback:");
    lines.push(feedback);
    lines.push("");
  }

  return lines.join("\n");
}

function stripCodeFences(value) {
  const trimmed = String(value || "").trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseCodexJson(output) {
  const trimmed = stripCodeFences(output);

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error(`Could not parse Codex JSON output:\n${trimmed}`);
  }
}

function assertBrandCasing(value, fieldName) {
  const text = String(value || "");
  if (/hush line/i.test(text) && !/Hush Line/.test(text)) {
    throw new Error(`Codex ${fieldName} used invalid Hush Line capitalization: ${text}`);
  }
}

function assertPlainLanguage(value, fieldName) {
  const raw = String(value || "");
  const text = raw.toLowerCase();

  for (const phrase of BANNED_PLAIN_LANGUAGE_PHRASES) {
    if (text.includes(phrase)) {
      throw new Error(`Codex ${fieldName} used banned vague phrase "${phrase}": ${value}`);
    }
  }

  for (const pattern of BANNED_PLAIN_LANGUAGE_PATTERNS) {
    if (pattern.test(raw)) {
      throw new Error(`Codex ${fieldName} used banned vague pattern ${pattern}: ${value}`);
    }
  }
}

function validateGeneratedCopy(copy) {
  if (!copy || typeof copy !== "object" || Array.isArray(copy)) {
    throw new Error("Codex social copy response must be a JSON object.");
  }

  const question = String(copy.question || "").trim();
  const articleLine = String(copy.article_line || "").trim();

  if (!question) {
    throw new Error("Codex social copy response is missing `question`.");
  }
  if (!articleLine) {
    throw new Error("Codex social copy response is missing `article_line`.");
  }
  if (question.includes("\n") || articleLine.includes("\n")) {
    throw new Error("Codex social copy fields must be single-line strings.");
  }
  if (!question.endsWith("?")) {
    throw new Error(`Codex social question must end with '?': ${question}`);
  }
  if (!articleLine.startsWith("We just published an article")) {
    throw new Error(`Codex social article_line must start with 'We just published an article': ${articleLine}`);
  }
  if (/https?:\/\//i.test(question) || /https?:\/\//i.test(articleLine)) {
    throw new Error("Codex social copy must not include the article URL.");
  }

  assertBrandCasing(question, "question");
  assertBrandCasing(articleLine, "article_line");
  assertPlainLanguage(question, "question");
  assertPlainLanguage(articleLine, "article_line");

  return {
    articleLine,
    question,
  };
}

function generateCodexSocialCopy({ articlePath, articleUrl, excerpt, headings, markdown, subtitle, title }) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "weekly-article-copy."));
  const outputPath = path.join(tempDir, "codex-output.txt");

  try {
    let feedback = "";
    let lastError = "";

    for (let attempt = 1; attempt <= SOCIAL_COPY_MAX_ATTEMPTS; attempt += 1) {
      const prompt = buildSocialCopyPrompt({
        articleUrl,
        excerpt,
        feedback,
        headings,
        markdown,
        subtitle,
        title,
      });
      const result = cp.spawnSync(
        "codex",
        [
          "exec",
          "--model",
          CODEX_MODEL,
          "-c",
          `model_reasoning_effort="${CODEX_REASONING_EFFORT}"`,
          "--full-auto",
          "--sandbox",
          "workspace-write",
          "-C",
          REPO_ROOT,
          "-o",
          outputPath,
          "-",
        ],
        {
          cwd: REPO_ROOT,
          encoding: "utf8",
          input: prompt,
          maxBuffer: 10 * 1024 * 1024,
        },
      );

      if (result.error) {
        throw result.error;
      }
      if (result.status !== 0) {
        const details = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        throw new Error(
          `Codex social copy generation failed for ${articlePath} (exit ${result.status}).${details ? `\n${details}` : ""}`,
        );
      }
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Codex social copy output was not written: ${outputPath}`);
      }

      try {
        return validateGeneratedCopy(parseCodexJson(fs.readFileSync(outputPath, "utf8")));
      } catch (error) {
        lastError = error.message || String(error);
        feedback = [
          `The previous answer was rejected on attempt ${attempt}.`,
          `Problem: ${lastError}`,
          "Rewrite both lines in simpler, more concrete language and return JSON only.",
        ].join("\n");
      }
    }

    throw new Error(`Codex social copy validation failed for ${articlePath} after ${SOCIAL_COPY_MAX_ATTEMPTS} attempts.\n${lastError}`);
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
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

function buildCopy({ articlePath, articleUrl, excerpt, headings, markdown, subtitle, title }) {
  const generated = generateCodexSocialCopy({
    articlePath,
    articleUrl,
    excerpt,
    headings,
    markdown,
    subtitle,
    title,
  });
  const question = generated.question;
  const articleLine = generated.articleLine;
  const lines = [question, articleLine, `Read it here 👉 ${articleUrl}`];

  return {
    bluesky: fitCopy(
      300,
      lines,
    ),
    linkedin: fitCopy(
      3000,
      lines,
    ),
    mastodon: fitCopy(
      500,
      lines,
    ),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const articlePath = path.resolve(args.article);
  const outputDir = path.resolve(args.outputDir);

  const article = readArticle(articlePath);
  const title = frontmatterField(article.frontmatter, "title");
  const subtitle = frontmatterField(article.frontmatter, "subtitle");
  const slug = frontmatterField(article.frontmatter, "slug") || path.basename(path.dirname(articlePath));
  const opening = article.body.split(/<!--\s*truncate\s*-->/i)[0] || article.body;
  const excerpt = clamp(firstNonEmptyParagraphs(opening, 2).join(" "), 260);
  const headings = articleHeadings(article.markdown);

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
      articlePath,
      articleUrl: args.articleUrl,
      excerpt,
      headings,
      markdown: article.markdown,
      subtitle,
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
