const fs = require('fs');
const path = require('path');

function runSecurityGuard(targetDir) {
  const findings = [];
  const srcDir = path.join(targetDir, 'src');

  if (!fs.existsSync(srcDir)) {
    return {
      gate: 'SECURITY_GUARD',
      passed: false,
      findings: [{
        gate: 'SECURITY_GUARD',
        code: 'MISSING_SRC',
        file: 'src',
        message: 'Source directory src does not exist.'
      }]
    };
  }

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const code = fs.readFileSync(fullPath, 'utf8');
        const relPath = path.relative(targetDir, fullPath);

        // Rule 1: No dynamic eval or Function constructor
        if (/\beval\s*\(/.test(code) || /new\s+Function\s*\(/.test(code)) {
          findings.push({
            gate: 'SECURITY_GUARD',
            code: 'DANGEROUS_EVAL',
            file: relPath,
            message: 'Forbidden dynamic code evaluation (eval / Function constructor) detected.'
          });
        }

        // Rule 2: No prototype pollution vectors
        if (/__proto__|prototype\s*\[/.test(code)) {
          findings.push({
            gate: 'SECURITY_GUARD',
            code: 'PROTOTYPE_POLLUTION_RISK',
            file: relPath,
            message: 'Potential prototype pollution pattern detected.'
          });
        }

        // Rule 3: No hardcoded secrets or API tokens
        const secretPattern = /(?:api[_-]?key|secret|password|bearer|auth[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{8,}['"]/i;
        if (secretPattern.test(code)) {
          findings.push({
            gate: 'SECURITY_GUARD',
            code: 'HARDCODED_SECRET_DETECTED',
            file: relPath,
            message: 'Potential hardcoded credential or secret detected in source file.'
          });
        }

        // Rule 4: Business code must not spawn arbitrary shell commands
        if (/require\s*\(\s*['"]child_process['"]\s*\)/.test(code)) {
          findings.push({
            gate: 'SECURITY_GUARD',
            code: 'DISALLOWED_PROCESS_SPAWN',
            file: relPath,
            message: 'Application source file requires child_process, violating sandbox policy.'
          });
        }
      }
    }
  }

  scanDirectory(srcDir);

  return {
    gate: 'SECURITY_GUARD',
    passed: findings.length === 0,
    findings
  };
}

if (require.main === module) {
  const targetDir = path.resolve(process.argv[2] || path.join(__dirname, '..'));
  const result = runSecurityGuard(targetDir);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

module.exports = { runSecurityGuard };
