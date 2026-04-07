import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const options = {
    repoRoot: path.resolve(__dirname, '..'),
    catalogPath: path.resolve(__dirname, 'weekly_article_topics.json'),
    date: new Date().toISOString().slice(0, 10),
    topicId: '',
    allowReuse: process.env.HUSHLINE_DOCS_WEEKLY_ALLOW_TOPIC_REUSE === '1',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--repo-root') {
      options.repoRoot = path.resolve(argv[index + 1]);
      index += 1;
    } else if (arg === '--catalog') {
      options.catalogPath = path.resolve(argv[index + 1]);
      index += 1;
    } else if (arg === '--date') {
      options.date = argv[index + 1];
      index += 1;
    } else if (arg === '--topic') {
      options.topicId = argv[index + 1];
      index += 1;
    } else if (arg === '--allow-reuse') {
      options.allowReuse = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function walkFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function extractLatestTopicUsage(blogRoot) {
  const usage = new Map();
  if (!fs.existsSync(blogRoot)) {
    return usage;
  }

  const articleFiles = walkFiles(blogRoot).filter((filePath) => filePath.endsWith('/index.md'));
  for (const filePath of articleFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^agent_topic_id:\s*(.+)\s*$/m);
    if (!match) {
      continue;
    }

    const topicId = match[1].trim().replace(/^['"]|['"]$/g, '');
    const folderName = path.basename(path.dirname(filePath));
    const datePrefix = folderName.slice(0, 10);
    const lastSeen = usage.get(topicId);
    if (!lastSeen || datePrefix > lastSeen) {
      usage.set(topicId, datePrefix);
    }
  }

  return usage;
}

function selectTopic({ topics, usage, forcedTopicId, allowReuse }) {
  if (forcedTopicId) {
    const forced = topics.find((topic) => topic.id === forcedTopicId);
    if (!forced) {
      throw new Error(`Topic id not found in catalog: ${forcedTopicId}`);
    }
    return forced;
  }

  const unusedTopics = topics.filter((topic) => !usage.has(topic.id));
  if (unusedTopics.length > 0) {
    return [...unusedTopics].sort((left, right) => left.id.localeCompare(right.id))[0];
  }

  if (!allowReuse) {
    throw new Error(
      'All weekly article topics in the catalog have already been used. Add more topics or set HUSHLINE_DOCS_WEEKLY_ALLOW_TOPIC_REUSE=1 to reuse the least recently used topic.',
    );
  }

  const ranked = [...topics].sort((left, right) => {
    const leftDate = usage.get(left.id) || '';
    const rightDate = usage.get(right.id) || '';
    if (leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }
    return left.id.localeCompare(right.id);
  });

  return ranked[0];
}

function buildSelection({ repoRoot, date, topic, usage }) {
  const articleSlug = topic.slug || slugify(topic.title_seed);
  const articleDirName = `${date}-${articleSlug}`;
  return {
    topic,
    articleDirName,
    articleRelativePath: path.posix.join('docs', 'blog', articleDirName, 'index.md'),
    articleSlug,
    lastUsedAt: usage.get(topic.id) || null,
    repoRoot,
    date,
  };
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const topics = JSON.parse(fs.readFileSync(options.catalogPath, 'utf8'));
  const usage = extractLatestTopicUsage(path.join(options.repoRoot, 'docs', 'blog'));
  const topic = selectTopic({
    topics,
    usage,
    forcedTopicId: options.topicId,
    allowReuse: options.allowReuse,
  });
  const selection = buildSelection({
    repoRoot: options.repoRoot,
    date: options.date,
    topic,
    usage,
  });
  process.stdout.write(`${JSON.stringify(selection, null, 2)}\n`);
}

const invokedScriptPath = process.argv[1] ? fs.realpathSync(process.argv[1]) : '';
const currentModulePath = fs.realpathSync(fileURLToPath(import.meta.url));

if (invokedScriptPath && currentModulePath === invokedScriptPath) {
  main();
}

export {
  buildSelection,
  extractLatestTopicUsage,
  main,
  parseArgs,
  selectTopic,
  slugify,
};
