import nlp from 'compromise';
import datePlugin from 'compromise-dates';
nlp.plugin(datePlugin);

export const processCommand = (text) => {
    const doc = nlp(text);
    const lowercaseText = text.toLowerCase();

    let intent = 'UNKNOWN';
    let entities = {};

    // Intent: SET_REMINDER or ADD_TASK (both work the same way now)
    // Try to extract time from text
    let timeStr = null;

    // Method 1: Use compromise-dates plugin
    const dates = doc.dates().json();
    if (dates.length > 0 && dates[0].date && dates[0].date.start) {
        timeStr = dates[0].date.start;
        console.log('📅 Compromise parsed time:', timeStr);
    }

    // Method 2: Manual parsing for "at HH:MM AM/PM" format
    const timeMatch = text.match(/at\s+(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toLowerCase();

        // Convert to 24-hour format
        if (period === 'pm' && hours !== 12) {
            hours += 12;
        } else if (period === 'am' && hours === 12) {
            hours = 0;
        }

        // Create date for today at specified time
        const now = new Date();
        const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

        // If time has passed today, set for tomorrow
        if (reminderDate < now) {
            reminderDate.setDate(reminderDate.getDate() + 1);
        }

        timeStr = reminderDate.toISOString();
        console.log('⏰ Manual parsed time:', timeMatch[0], '→', timeStr);
        console.log('   Reminder will trigger at:', reminderDate.toLocaleString());
    }

    entities.time = timeStr;

    // Extract content (remove time-related words)
    let content = text
        .replace(/at\s+\d{1,2}:\d{2}\s*(am|pm)/i, '')
        .replace(/remind me (to)?/i, '')
        .replace(/in \d+ (minutes|seconds|hours)/i, '')
        .trim();

    entities.content = content || text;

    console.log('🔍 NLP Result:', { intent, entities });

    return { intent, entities, original: text };
};

