import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSelection,
  extractLatestTopicUsage,
  selectTopic,
  slugify,
} from './select_weekly_article_topic.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function makeTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'weekly-article-topic-'));
}

function writeBlogIndex(repoRoot, folderName, frontmatter) {
  const dirPath = path.join(repoRoot, 'docs', 'blog', folderName);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'index.md'), `---\n${frontmatter}\n---\n`);
}

test('slugify normalizes titles for blog folder names', () => {
  assert.equal(slugify('Why Verified Tip Lines Matter for Newsrooms'), 'why-verified-tip-lines-matter-for-newsrooms');
});

test('extractLatestTopicUsage returns latest known date per topic', () => {
  const repoRoot = makeTempRepo();
  writeBlogIndex(repoRoot, '2026-01-01-topic-a', 'agent_topic_id: topic-a');
  writeBlogIndex(repoRoot, '2026-03-01-topic-a', 'agent_topic_id: topic-a');
  writeBlogIndex(repoRoot, '2026-02-01-topic-b', 'agent_topic_id: topic-b');

  const usage = extractLatestTopicUsage(path.join(repoRoot, 'docs', 'blog'));
  assert.equal(usage.get('topic-a'), '2026-03-01');
  assert.equal(usage.get('topic-b'), '2026-02-01');
});

test('selectTopic prefers topics that have never been used', () => {
  const topics = [
    { id: 'topic-a' },
    { id: 'topic-b' },
    { id: 'topic-c' },
  ];
  const usage = new Map([
    ['topic-a', '2026-03-01'],
    ['topic-b', '2026-02-01'],
  ]);

  assert.equal(selectTopic({ topics, usage, forcedTopicId: '' }).id, 'topic-c');
});

test('selectTopic falls back to least recently used topic when all have been used', () => {
  const topics = [
    { id: 'topic-a' },
    { id: 'topic-b' },
    { id: 'topic-c' },
  ];
  const usage = new Map([
    ['topic-a', '2026-03-01'],
    ['topic-b', '2026-02-01'],
    ['topic-c', '2026-04-01'],
  ]);

  assert.equal(selectTopic({ topics, usage, forcedTopicId: '' }).id, 'topic-b');
});

test('buildSelection returns the final article path and slug', () => {
  const selection = buildSelection({
    repoRoot: '/repo',
    date: '2026-04-06',
    topic: {
      id: 'topic-a',
      slug: 'topic-a-story',
      title_seed: 'Topic A Story',
    },
    usage: new Map(),
  });

  assert.equal(selection.articleDirName, '2026-04-06-topic-a-story');
  assert.equal(selection.articleRelativePath, 'docs/blog/2026-04-06-topic-a-story/index.md');
});

test('CLI prints selection JSON when invoked directly', () => {
  const repoRoot = makeTempRepo();
  const catalogPath = path.join(repoRoot, 'weekly_article_topics.json');
  fs.writeFileSync(
    catalogPath,
    JSON.stringify([
      {
        id: 'topic-a',
        slug: 'topic-a-story',
        title_seed: 'Topic A Story',
      },
    ]),
  );

  const output = execFileSync(
    process.execPath,
    [
      path.join(__dirname, 'select_weekly_article_topic.mjs'),
      '--repo-root',
      repoRoot,
      '--catalog',
      catalogPath,
      '--date',
      '2026-04-06',
    ],
    { encoding: 'utf8' },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.topic.id, 'topic-a');
  assert.equal(parsed.articleRelativePath, 'docs/blog/2026-04-06-topic-a-story/index.md');
});
