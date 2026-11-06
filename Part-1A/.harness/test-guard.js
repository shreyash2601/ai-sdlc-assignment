const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function runTestGuard(targetDir) {
  const testFile = path.join(targetDir, 'tests/task.test.js');
  if (!fs.existsSync(testFile)) {
    return {
      gate: 'TEST_GUARD',
      passed: false,
      findings: [{
        gate: 'TEST_GUARD',
        code: 'MISSING_TEST_SUITE',
        file: 'tests/task.test.js',
        message: 'Contract and unit test suite tests/task.test.js does not exist.'
      }],
      stdout: '',
      stderr: 'Test file missing.'
    };
  }

  const result = spawnSync(process.execPath, ['--test', 'tests/task.test.js'], {
    cwd: targetDir,
    encoding: 'utf8',
    timeout: 30000
  });

  const passed = result.status === 0;
  const findings = [];

  if (!passed) {
    findings.push({
      gate: 'TEST_GUARD',
      code: 'TEST_ASSERTION_FAILURE',
      file: 'tests/task.test.js',
      message: `Automated test suite failed with exit code ${result.status}.`,
      stdout: result.stdout || '',
      stderr: result.stderr || ''
    });
  }

  return {
    gate: 'TEST_GUARD',
    passed,
    exitCode: result.status,
    findings,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

if (require.main === module) {
  const targetDir = path.resolve(process.argv[2] || path.join(__dirname, '..'));
  const result = runTestGuard(targetDir);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

module.exports = { runTestGuard };
