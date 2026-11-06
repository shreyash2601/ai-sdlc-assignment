const { validateOutputSchema } = require('../src/schema');

function evaluateStructural(output) {
  const result = validateOutputSchema(output);
  const score = result.valid ? 30 : 0; // Max 30 points for Layer 1
  return {
    layer: 'LAYER_1_STRUCTURAL',
    passed: result.valid,
    score,
    maxScore: 30,
    errors: result.errors
  };
}

module.exports = { evaluateStructural };
