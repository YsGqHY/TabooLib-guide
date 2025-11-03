/**
 * Git 文档同步配置
 * 
 * 使用方法：
 * 1. 配置需要同步的仓库
 * 2. 使用 docsPath 指定仓库中文档的具体路径（支持子目录）
 * 3. 运行 npm run build 或 npm start
 */

module.exports = {
  repos: [
    {
      url: 'https://github.com/Bkm016/purtmars-plugins',
      branch: 'main',
      docsPath: 'docs/plugin/adyeshach',
      targetPath: 'adyeshach',
      format: 'auto',
    },
    {
      url: 'https://github.com/Micalhl/polarastrum-plugins',
      branch: 'main',
      docsPath: 'docs/plugin/aiyatsbus',
      targetPath: 'aiyatsbus',
      format: 'auto',
    },
    {
      url: 'https://github.com/Micalhl/polarastrum-plugins',
      branch: 'main',
      docsPath: 'docs/plugin/chesed',
      targetPath: 'chesed',
      format: 'auto',
    },
    {
      url: 'https://github.com/Bkm016/purtmars-plugins',
      branch: 'main',
      docsPath: 'docs/plugin/chemdah',
      targetPath: 'chemdah',
      format: 'auto',
    },
    {
      url: 'https://github.com/BukkitWiki/BukkitWiki',
      branch: 'main',
      docsPath: 'src/plugins/plugins/trmenu',
      targetPath: 'TrMenu',
      format: 'auto',
    },
    {
      url: 'https://github.com/ItsFlicker/document-trchat',
      branch: 'main',
      docsPath: 'guide',
      targetPath: 'TrChat',
      format: 'auto',
    },
  ],

  docsDir: 'docs',
  cacheDir: '.docscache',
  cleanCache: false,
  cleanTarget: true,
};

