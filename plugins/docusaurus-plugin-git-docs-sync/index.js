const path = require('path');
const fs = require('fs-extra');
const simpleGit = require('simple-git');

module.exports = function pluginGitDocsSync(context, options) {
  const {
    repos = [],
    docsDir = 'docs',
    cacheDir = '.docscache',
    cleanCache = false,
    cleanTarget = true,
  } = options;

  return {
    name: 'docusaurus-plugin-git-docs-sync',

    async loadContent() {
      const logger = console;
      const rootDir = context.siteDir;
      const cacheRoot = path.join(rootDir, cacheDir);
      const docsRoot = path.join(rootDir, docsDir);

      if (cleanCache && await fs.pathExists(cacheRoot)) {
        logger.info('[GitDocsSync] 清理缓存目录');
        await fs.remove(cacheRoot);
      }

      await fs.ensureDir(cacheRoot);

      for (const repo of repos) {
        try {
          await syncRepository(repo, cacheRoot, docsRoot, cleanTarget, logger);
        } catch (error) {
          logger.error(`[GitDocsSync] 同步仓库失败: ${repo.url}`, error);
          if (repo.required !== false) {
            throw error;
          }
        }
      }

      logger.info('[GitDocsSync] ✅ 所有文档同步完成');
    },
  };
};

async function syncRepository(repo, cacheRoot, docsRoot, cleanTarget, logger) {
  const {
    url,
    branch = 'main',
    docsPath = '.',
    targetPath,
    format = 'auto',
  } = repo;

  const repoName = url.split('/').pop().replace('.git', '');
  const repoCache = path.join(cacheRoot, repoName);
  const git = simpleGit();

  logger.info(`[GitDocsSync] 📦 同步: ${url}`);

  if (await fs.pathExists(repoCache)) {
    logger.info(`[GitDocsSync] 🔄 更新仓库: ${repoName}`);
    await simpleGit(repoCache).pull('origin', branch);
  } else {
    logger.info(`[GitDocsSync] 📥 克隆仓库: ${repoName}`);
    await git.clone(url, repoCache, ['--depth', '1', '--branch', branch]);
  }

  const sourcePath = path.join(repoCache, docsPath);
  if (!await fs.pathExists(sourcePath)) {
    throw new Error(`文档路径不存在: ${sourcePath}`);
  }

  const detectedFormat = format === 'auto' 
    ? await detectDocsFormat(sourcePath)
    : format;

  logger.info(`[GitDocsSync] 📄 文档格式: ${detectedFormat}`);

  const target = path.join(docsRoot, targetPath || repoName);

  if (cleanTarget && await fs.pathExists(target)) {
    logger.info(`[GitDocsSync] 🗑️  清理目标目录: ${targetPath || repoName}`);
    await fs.remove(target);
  }

  await fs.ensureDir(target);

  if (detectedFormat === 'gitbook') {
    await convertGitBookToDocs(sourcePath, target, logger);
  } else {
    await syncDocusaurusDocs(sourcePath, target, logger);
  }

  logger.info(`[GitDocsSync] ✅ 完成: ${targetPath || repoName}`);
}

async function detectDocsFormat(dirPath) {
  const summaryExists = await fs.pathExists(path.join(dirPath, 'SUMMARY.md'));
  const bookJsonExists = await fs.pathExists(path.join(dirPath, 'book.json'));
  
  if (summaryExists || bookJsonExists) {
    return 'gitbook';
  }
  
  return 'docusaurus';
}

async function syncDocusaurusDocs(source, target, logger) {
  await fs.copy(source, target, {
    overwrite: true,
    filter: (src) => {
      const basename = path.basename(src);
      return !basename.startsWith('.') && 
             basename !== 'node_modules' &&
             basename !== 'build' &&
             basename !== 'SUMMARY.md' &&
             basename !== '.gitbook';
    },
  });
  
  await fixDocusaurusLinks(target);
  await convertReadmeToIndex(target);
  
  logger.info(`[GitDocsSync] 已同步 Docusaurus 文档: ${target}`);
}

async function convertGitBookToDocs(source, target, logger) {
  await fs.copy(source, target, {
    overwrite: true,
    filter: (src) => {
      const basename = path.basename(src);
      return !basename.startsWith('.') && 
             basename !== 'node_modules' &&
             basename !== 'build' &&
             basename !== 'SUMMARY.md' &&
             basename !== 'book.json' &&
             basename !== '.gitbook';
    },
  });

  await convertAllMarkdownFiles(target);
  await convertReadmeToIndex(target);

  logger.info(`[GitDocsSync] 已转换 GitBook 文档: ${target}`);
}

function parseSummary(content) {
  const lines = content.split('\n');
  const structure = [];
  
  for (const line of lines) {
    const match = line.match(/\s*\*\s*\[(.+?)\]\((.+?)\)/);
    if (match) {
      const [, title, link] = match;
      const level = (line.match(/^\s*/)?.[0]?.length || 0) / 2;
      structure.push({ title, link, level });
    }
  }
  
  return structure;
}

async function processGitBookItem(item, source, target, logger) {
  const sourcePath = path.join(source, item.link);
  const targetPath = path.join(target, item.link);

  if (!await fs.pathExists(sourcePath)) {
    logger.warn(`[GitDocsSync] 文件不存在: ${sourcePath}`);
    return;
  }

  await fs.ensureDir(path.dirname(targetPath));
  
  let content = await fs.readFile(sourcePath, 'utf-8');
  content = convertGitBookSyntax(content, item.title);
  await fs.writeFile(targetPath, content, 'utf-8');
}

function convertGitBookSyntax(content, title) {
  if (!content.startsWith('---')) {
    content = `---\ntitle: ${title}\n---\n\n${content}`;
  }

  const codeBlocks = [];
  content = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });
  
  const inlineCodeBlocks = [];
  content = content.replace(/`[^`]+`/g, (match) => {
    inlineCodeBlocks.push(match);
    return `___INLINE_CODE_${inlineCodeBlocks.length - 1}___`;
  });
  
  content = content.replace(/\{/g, '\\{');
  content = content.replace(/\}/g, '\\}');
  
  content = content.replace(/___INLINE_CODE_(\d+)___/g, (match, index) => {
    return inlineCodeBlocks[parseInt(index)];
  });
  content = content.replace(/___CODE_BLOCK_(\d+)___/g, (match, index) => {
    return codeBlocks[parseInt(index)];
  });

  content = content.replace(
    /{% hint style="(.*?)" %}([\s\S]*?){% endhint %}/g,
    (match, style, body) => {
      const typeMap = {
        'info': 'info',
        'tip': 'tip',
        'warning': 'warning',
        'danger': 'danger',
        'success': 'tip',
      };
      const admonitionType = typeMap[style] || 'note';
      return `:::${admonitionType}\n${body.trim()}\n:::`;
    }
  );

  content = content.replace(
    /{% tabs %}([\s\S]*?){% endtabs %}/g,
    (match, tabsContent) => {
      const tabs = [];
      const tabRegex = /{% tab title="(.*?)" %}([\s\S]*?){% endtab %}/g;
      let tabMatch;
      
      while ((tabMatch = tabRegex.exec(tabsContent)) !== null) {
        tabs.push({
          title: tabMatch[1],
          content: tabMatch[2].trim(),
        });
      }

      if (tabs.length === 0) return match;

      let result = '<Tabs>\n';
      tabs.forEach(tab => {
        const value = tab.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        result += `<TabItem value="${value}" label="${tab.title}">\n\n${tab.content}\n\n</TabItem>\n`;
      });
      result += '</Tabs>';
      
      return result;
    }
  );

  content = content.replace(
    /{% code title="(.*?)" %}([\s\S]*?){% endcode %}/g,
    (match, fileName, code) => {
      return `\`\`\`title="${fileName}"\n${code.trim()}\n\`\`\``;
    }
  );

  content = content.replace(
    /{% embed url="(.*?)" %}/g,
    (match, url) => {
      return `<iframe src="${url}" width="100%" height="400"></iframe>`;
    }
  );

  content = content.replace(
    /{% page-ref page="(.*?)" %}/g,
    (match, page) => {
      const pagePath = page.replace(/\.md$/, '');
      return `[📄 查看文档](${pagePath})`;
    }
  );

  content = content.replace(/{% content-ref url="(.*?)" %}/g, '');
  content = content.replace(/{% endcontent-ref %}/g, '');

  content = content.replace(
    /\[([^\]]+)\]\((?!http)([^)]*?)README\.md\)/g,
    '[$1]($2)'
  );
  content = content.replace(
    /\[([^\]]+)\]\((?!http)([^)]+)\.md\)/g,
    '[$1]($2)'
  );

  content = content.replace(
    /!\[([^\]]*)\]\(\.gitbook\/assets\//g,
    '![$1](./assets/'
  );

  content = content.replace(
    /{% file src="(.*?)" %}(.*?){% endfile %}/g,
    (match, src, caption) => {
      return `[📎 ${caption || '下载文件'}](${src})`;
    }
  );

  content = content.replace(
    /{% swagger (.*?) %}/g,
    '<!-- Swagger API Documentation -->'
  );

  return content;
}

async function createCategoryConfig(dirPath, label) {
  const configPath = path.join(dirPath, '_category_.json');
  const config = {
    label,
    position: 2,
    link: {
      type: 'generated-index',
    },
  };
  
  await fs.writeJson(configPath, config, { spaces: 2 });
}

async function convertReadmeToIndex(dir) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      await convertReadmeToIndex(fullPath);
    } else if (item.name === 'README.md') {
      const indexPath = path.join(dir, 'index.md');
      await fs.move(fullPath, indexPath, { overwrite: true });
    }
  }
}

async function convertAllMarkdownFiles(dir) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      await convertAllMarkdownFiles(fullPath);
    } else if (item.name.endsWith('.md')) {
      try {
        let content = await fs.readFile(fullPath, 'utf-8');
        const title = item.name.replace('.md', '');
        content = convertGitBookSyntax(content, title);
        await fs.writeFile(fullPath, content, 'utf-8');
      } catch (error) {
        console.warn(`[GitDocsSync] 转换文件失败: ${fullPath}`, error.message);
      }
    }
  }
}

async function fixDocusaurusLinks(dir) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      await fixDocusaurusLinks(fullPath);
    } else if (item.name.endsWith('.md')) {
      try {
        let content = await fs.readFile(fullPath, 'utf-8');
        
        content = content.replace(
          /\[([^\]]+)\]\((?!http)([^)]*?)README\.md\)/g,
          '[$1]($2)'
        );
        
        const lines = content.split('\n');
        let inCodeBlock = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            continue;
          }
          if (!inCodeBlock && lines[i].includes('<>')) {
            lines[i] = lines[i].replace(/<>/g, '`<>`');
          }
        }
        content = lines.join('\n');
        
        await fs.writeFile(fullPath, content, 'utf-8');
      } catch (error) {
        console.warn(`[GitDocsSync] 链接修复失败: ${fullPath}`, error.message);
      }
    }
  }
}

