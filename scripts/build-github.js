const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 备份原始配置
const originalConfig = path.join(__dirname, '..', 'next.config.mjs');
const githubConfig = path.join(__dirname, '..', 'next.config.github.mjs');
const backupConfig = path.join(__dirname, '..', 'next.config.mjs.backup');
const outDir = path.join(__dirname, '..', 'out');

try {
  console.log('📦 准备 GitHub Pages 构建...');
  
  // 备份原始配置
  fs.copyFileSync(originalConfig, backupConfig);
  console.log('✅ 已备份原始配置');
  
  // 使用 GitHub 配置
  fs.copyFileSync(githubConfig, originalConfig);
  console.log('✅ 已切换到 GitHub Pages 配置');
  
  // 执行构建
  console.log('🔨 开始构建...');
  execSync('next build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  // 检查 out 目录是否生成
  if (fs.existsSync(outDir)) {
    console.log('✅ 构建完成，out 目录已生成');
    const files = fs.readdirSync(outDir);
    console.log(`📁 out 目录包含 ${files.length} 个文件/目录`);
  } else {
    throw new Error('out 目录未生成');
  }
  
  // 恢复原始配置
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
    console.log('✅ 已恢复原始配置');
  }
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  
  // 恢复原始配置
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
    console.log('✅ 已恢复原始配置');
  }
  
  process.exit(1);
}
