const { validateOutputSchema } = require('./schema');

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous\s+)?instructions/i,
  /output\s+your\s+(?:raw\s+)?(?:internal\s+)?system\s+prompt/i,
  /you\s+are\s+now\s+dan/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /rm\s+-rf/i,
  /drop\s+database/i,
  /drop\s+tables?/i
];

class ReminderAgent {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || null;
    this.model = options.model || process.env.LLM_MODEL || 'gemini-2.0-flash';
  }

  detectAdversarial(input) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        return true;
      }
    }
    return false;
  }

  parseLocal(userInput, referenceTimestamp = new Date().toISOString()) {
    const refDate = new Date(referenceTimestamp);
    const text = String(userInput).trim();

    // 1. Guardrail / Adversarial Check
    if (this.detectAdversarial(text)) {
      return {
        intent: 'REJECT',
        title: '',
        scheduledTime: null,
        relativeOffsetMinutes: null,
        missingFields: [],
        clarificationPrompt: 'Request rejected due to prohibited instructions or unsafe payload.',
        confidence: 0.99
      };
    }

    // 2. Malformed / Gibberish Check (linear non-backtracking)
    const letters = (text.match(/[a-zA-Z]/g) || []).length;
    const hasRecognizedKeywords = /(remind|at|on|tomorrow|today|tonight|midnight|in|snooze|reschedule|call|meet|standup|buy|task|break|submit|review)/i.test(text);
    if (letters < 4 || (!hasRecognizedKeywords && /^[^a-zA-Z0-9\s]+$/.test(text))) {
      return {
        intent: 'CLARIFY',
        title: '',
        scheduledTime: null,
        relativeOffsetMinutes: null,
        missingFields: ['title', 'time'],
        clarificationPrompt: 'I could not understand your request. Please specify a task and a time for the reminder.',
        confidence: 0.3
      };
    }

    // 3. Snooze Intent
    const snoozeMatch = text.match(/snooze\s*(?:this\s*)?(?:reminder\s*)?(?:for\s*|by\s*)?(\d+)\s*(minutes?|mins?|hours?|hrs?)/i);
    if (snoozeMatch) {
      const amount = parseInt(snoozeMatch[1], 10);
      const unit = snoozeMatch[2].toLowerCase();
      const offsetMinutes = unit.startsWith('h') ? amount * 60 : amount;
      const scheduledDate = new Date(refDate.getTime() + offsetMinutes * 60000);
      return {
        intent: 'SNOOZE_REMINDER',
        title: 'Current active reminder',
        scheduledTime: scheduledDate.toISOString(),
        relativeOffsetMinutes: offsetMinutes,
        missingFields: [],
        clarificationPrompt: null,
        confidence: 0.95
      };
    }

    // 4. Missing Title (e.g., "Set a reminder for tomorrow at 4 PM")
    const missingTitleMatch = text.match(/^(?:set\s*a\s*reminder|remind\s*me)\s*(?:for\s*|at\s*|on\s*)((?:tomorrow|today|tonight|next|[0-9]).*)$/i);
    if (missingTitleMatch && !/(?:to|about)\s+[a-zA-Z]/i.test(text)) {
      return {
        intent: 'CLARIFY',
        title: '',
        scheduledTime: null,
        relativeOffsetMinutes: null,
        missingFields: ['title'],
        clarificationPrompt: 'What task would you like to be reminded about?',
        confidence: 0.9
      };
    }

    // 5. Missing Time (e.g., "Remind me to buy groceries and almond milk")
    const hasTemporalCue = /(tomorrow|today|tonight|midnight|in\s+\d+|at\s+\d+|on\s+[A-Z][a-z]+|next\s+[A-Z][a-z]+)/i.test(text);
    if (!hasTemporalCue) {
      const titleMatch = text.replace(/^(?:please\s*)?(?:remind\s*me\s*to\s*|set\s*a\s*reminder\s*to\s*)/i, '').trim();
      return {
        intent: 'CLARIFY',
        title: titleMatch,
        scheduledTime: null,
        relativeOffsetMinutes: null,
        missingFields: ['time'],
        clarificationPrompt: 'When would you like to be reminded about this task?',
        confidence: 0.9
      };
    }

    // 6. Reschedule Intent
    const isReschedule = /reschedule/i.test(text);
    const intent = isReschedule ? 'RESCHEDULE_REMINDER' : 'CREATE_REMINDER';

    // 7. Parse Temporal Expressions
    let scheduledDate = null;
    let title = text;

    // Relative minutes: "in (\d+) minutes"
    const relMinMatch = text.match(/in\s+(\d+)\s*(?:minutes?|mins?)/i);
    if (relMinMatch) {
      const mins = parseInt(relMinMatch[1], 10);
      scheduledDate = new Date(refDate.getTime() + mins * 60000);
      title = text.replace(/in\s+\d+\s*(?:minutes?|mins?)/i, '');
    }

    // Relative hours: "in (\d+) hours"
    const relHourMatch = text.match(/in\s+(\d+)\s*(?:hours?|hrs?)/i);
    if (relHourMatch) {
      const hrs = parseInt(relHourMatch[1], 10);
      scheduledDate = new Date(refDate.getTime() + hrs * 3600000);
      title = text.replace(/in\s+\d+\s*(?:hours?|hrs?)/i, '');
    }

    // "tomorrow at (\d+)(?::(\d+))?\s*(AM|PM)?"
    const tomorrowMatch = text.match(/tomorrow\s*(?:morning\s*)?(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (tomorrowMatch) {
      let hour = parseInt(tomorrowMatch[1], 10);
      const min = tomorrowMatch[2] ? parseInt(tomorrowMatch[2], 10) : 0;
      const meridiem = tomorrowMatch[3] ? tomorrowMatch[3].toUpperCase() : null;
      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;

      scheduledDate = new Date(refDate);
      scheduledDate.setUTCDate(scheduledDate.getUTCDate() + 1);
      scheduledDate.setUTCHours(hour, min, 0, 0);
      title = text.replace(/tomorrow\s*(?:morning\s*)?(?:at\s*)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i, '');
    }

    // "tonight at midnight"
    const midnightMatch = text.match(/(?:tonight\s*at\s*midnight|at\s*midnight)/i);
    if (midnightMatch) {
      scheduledDate = new Date(refDate);
      scheduledDate.setUTCDate(scheduledDate.getUTCDate() + 1);
      scheduledDate.setUTCHours(0, 0, 0, 0);
      title = text.replace(/(?:tonight\s*at\s*midnight|at\s*midnight)/i, '');
    }

    // "next Monday at 10 AM"
    const nextDayMatch = text.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (nextDayMatch) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = dayNames.indexOf(nextDayMatch[1].toLowerCase());
      let hour = parseInt(nextDayMatch[2], 10);
      const min = nextDayMatch[3] ? parseInt(nextDayMatch[3], 10) : 0;
      const meridiem = nextDayMatch[4] ? nextDayMatch[4].toUpperCase() : null;
      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;

      scheduledDate = new Date(refDate);
      let daysToAdd = (targetDay - scheduledDate.getUTCDay() + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7;
      scheduledDate.setUTCDate(scheduledDate.getUTCDate() + daysToAdd);
      scheduledDate.setUTCHours(hour, min, 0, 0);
      title = text.replace(/next\s+[a-z]+\s*(?:at\s*)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i, '');
    }

    // "on [Month] [Day], [Year] at [Time]"
    const explicitDateMatch = text.match(/on\s+([a-zA-Z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?\s*(?:at\s*)?(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (explicitDateMatch) {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const monthIndex = monthNames.indexOf(explicitDateMatch[1].toLowerCase());
      const day = parseInt(explicitDateMatch[2], 10);
      const year = explicitDateMatch[3] ? parseInt(explicitDateMatch[3], 10) : refDate.getUTCFullYear();
      let hour = parseInt(explicitDateMatch[4], 10);
      const min = parseInt(explicitDateMatch[5], 10);
      const meridiem = explicitDateMatch[6].toUpperCase();
      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;

      scheduledDate = new Date(Date.UTC(year, monthIndex, day, hour, min, 0, 0));
      title = text.replace(/on\s+[a-zA-Z]+\s+\d{1,2}(?:,\s*\d{4})?\s*(?:at\s*)?\d{1,2}:\d{2}\s*(?:am|pm)/i, '');
    }

    // "on [Month] [Day], [Year] at [Hour] [am/pm]"
    const explicitDateHourMatch = text.match(/on\s+([a-zA-Z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?\s*(?:at\s*)?(\d{1,2})\s*(am|pm)/i);
    if (!explicitDateMatch && explicitDateHourMatch) {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const monthIndex = monthNames.indexOf(explicitDateHourMatch[1].toLowerCase());
      const day = parseInt(explicitDateHourMatch[2], 10);
      const year = explicitDateHourMatch[3] ? parseInt(explicitDateHourMatch[3], 10) : refDate.getUTCFullYear();
      let hour = parseInt(explicitDateHourMatch[4], 10);
      const meridiem = explicitDateHourMatch[5].toUpperCase();
      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;

      scheduledDate = new Date(Date.UTC(year, monthIndex, day, hour, 0, 0, 0));
      title = text.replace(/on\s+[a-zA-Z]+\s+\d{1,2}(?:,\s*\d{4})?\s*(?:at\s*)?\d{1,2}\s*(?:am|pm)/i, '');
    }

    // "at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?"
    if (!scheduledDate) {
      const atTimeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (atTimeMatch) {
        let hour = parseInt(atTimeMatch[1], 10);
        const min = atTimeMatch[2] ? parseInt(atTimeMatch[2], 10) : 0;
        const meridiem = atTimeMatch[3] ? atTimeMatch[3].toUpperCase() : null;

        if (meridiem === 'PM' && hour < 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;
        if (!meridiem) {
          if (refDate.getUTCHours() < hour + 12) {
            hour += 12;
          }
        }

        scheduledDate = new Date(refDate);
        scheduledDate.setUTCHours(hour, min, 0, 0);
        if (scheduledDate <= refDate) {
          scheduledDate.setUTCDate(scheduledDate.getUTCDate() + 1);
        }
        title = text.replace(/at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i, '');
      }
    }

    // Clean up title
    title = title
      .replace(/^(?:please\s*)?(?:remind\s*me\s*(?:to\s*)?|set\s*a\s*reminder\s*(?:to\s*)?|reschedule\s*(?:the\s*)?)/i, '')
      .replace(/^(?:to\s+)/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      intent,
      title: title || 'Scheduled Reminder',
      scheduledTime: scheduledDate ? scheduledDate.toISOString() : null,
      relativeOffsetMinutes: null,
      missingFields: [],
      clarificationPrompt: null,
      confidence: 0.95
    };
  }

  async process(userInput, referenceTimestamp = new Date().toISOString()) {
    const result = this.parseLocal(userInput, referenceTimestamp);
    const validation = validateOutputSchema(result);
    if (!validation.valid) {
      throw new Error(`Agent produced invalid schema: ${validation.errors.join(', ')}`);
    }
    return result;
  }
}

module.exports = { ReminderAgent };
