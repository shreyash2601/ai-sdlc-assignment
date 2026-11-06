const fs = require('fs');
const path = require('path');
const vm = require('vm');

function runLintGuard(targetDir) {
  const findings = [];
  const filesToCheck = [
    'src/models/task.js',
    'src/storage/json-storage.js',
    'src/controllers/task-controller.js',
    'src/server.js',
    'src/index.js'
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(targetDir, relPath);
    if (!fs.existsSync(fullPath)) {
      findings.push({
        gate: 'LINT_GUARD',
        code: 'FILE_MISSING',
        file: relPath,
        message: `Mandatory source file ${relPath} is missing.`
      });
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // 1. Syntax check via vm.Script
    try {
      new vm.Script(content, { filename: relPath });
    } catch (err) {
      findings.push({
        gate: 'LINT_GUARD',
        code: 'SYNTAX_ERROR',
        file: relPath,
        message: `JavaScript syntax error in ${relPath}: ${err.message}`
      });
    }

    // 2. Strict CommonJS checks
    if (!content.includes('module.exports') && !content.includes('exports.')) {
      findings.push({
        gate: 'LINT_GUARD',
        code: 'MISSING_EXPORT',
        file: relPath,
        message: `File ${relPath} does not visibly export any module.`
      });
    }

    // 3. Tab indentation vs spaces (ensure consistency)
    if (/\t/.test(content)) {
      findings.push({
        gate: 'LINT_GUARD',
        code: 'DISALLOWED_TABS',
        file: relPath,
        message: `File ${relPath} contains tab characters. Use 2-space indentation.`
      });
    }
  }

  return {
    gate: 'LINT_GUARD',
    passed: findings.length === 0,
    findings
  };
}

if (require.main === module) {
  const targetDir = path.resolve(process.argv[2] || path.join(__dirname, '..'));
  const result = runLintGuard(targetDir);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

module.exports = { runLintGuard };
