const ALLOWED_INTENTS = [
  'CREATE_REMINDER',
  'SNOOZE_REMINDER',
  'RESCHEDULE_REMINDER',
  'CLARIFY',
  'REJECT'
];

function validateOutputSchema(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { valid: false, errors: ['Output must be a non-null JSON object.'] };
  }

  // 1. Check intent
  if (typeof output.intent !== 'string' || !ALLOWED_INTENTS.includes(output.intent)) {
    errors.push(`Invalid intent '${output.intent}'. Must be one of: ${ALLOWED_INTENTS.join(', ')}.`);
  }

  // 2. Check title
  if (typeof output.title !== 'string') {
    errors.push("Field 'title' must be a string.");
  }

  // 3. Check scheduledTime
  if (output.scheduledTime !== null && typeof output.scheduledTime !== 'string') {
    errors.push("Field 'scheduledTime' must be an ISO 8601 string or null.");
  } else if (typeof output.scheduledTime === 'string') {
    const parsed = new Date(output.scheduledTime);
    if (Number.isNaN(parsed.getTime())) {
      errors.push("Field 'scheduledTime' is not a valid ISO 8601 date string.");
    }
  }

  // 4. Check relativeOffsetMinutes
  if (output.relativeOffsetMinutes !== null && typeof output.relativeOffsetMinutes !== 'number') {
    errors.push("Field 'relativeOffsetMinutes' must be an integer or null.");
  }

  // 5. Check missingFields
  if (!Array.isArray(output.missingFields)) {
    errors.push("Field 'missingFields' must be an array of strings.");
  }

  // 6. Check clarificationPrompt
  if (output.clarificationPrompt !== null && typeof output.clarificationPrompt !== 'string') {
    errors.push("Field 'clarificationPrompt' must be a string or null.");
  }

  // 7. Check confidence
  if (typeof output.confidence !== 'number' || output.confidence < 0 || output.confidence > 1) {
    errors.push("Field 'confidence' must be a number between 0.0 and 1.0.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  ALLOWED_INTENTS,
  validateOutputSchema
};
