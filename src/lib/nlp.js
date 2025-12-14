import nlp from 'compromise';
import datePlugin from 'compromise-dates';
nlp.plugin(datePlugin);

// Basic Intent Classification
export const processCommand = (text) => {
    const doc = nlp(text);
    const lowercaseText = text.toLowerCase();

    let intent = 'UNKNOWN';
    let entities = {};

    // Intent: SET_REMINDER
    if (doc.has('(remind|alert|alarm)') || lowercaseText.includes('remind me')) {
        intent = 'SET_REMINDER';
        // Entity Extraction
        const dates = doc.dates().json();
        if (dates.length > 0) {
            // compromise returns .date (ISO string)
            entities.time = dates[0].date.start;
        } else {
            // Fallback: If user says "in 5 minutes" or "at 5pm", compromise usually catches it.
            // If not, we might need manual regex or just default to null.
        }

        // Extract content (what to remind about)
        // Simplify: Remove "remind me to" and "at <time>"
        let content = lowercaseText
            .replace(/remind me (to)?/i, '')
            .replace(entities.time || '', '') // This might not match exact text string if we replaced with ISO
            // So we rely on the original logic slightly modified or better: just remove known patterns
            .replace(/at \d+(:\d+)? ?(am|pm)?/i, '')
            .replace(/in \d+ (minutes|seconds|hours)/i, '')
            .trim();
        entities.content = content;
    }

    // Intent: ADD_NOTE
    else if (doc.has('(note|write|jot)') || lowercaseText.includes('make a note')) {
        intent = 'ADD_NOTE';
        let content = lowercaseText.replace(/(make a )?note (to|that)?/i, '').trim();
        entities.content = content;
    }

    // Intent: STORE_FACT
    else if (lowercaseText.includes('my name is')) {
        intent = 'STORE_FACT';
        const name = lowercaseText.split('my name is')[1].trim();
        entities.key = 'userName';
        entities.value = name;
    }

    // Intent: QUERY_FACT
    else if (lowercaseText.includes('what is my name') || lowercaseText.includes('who am i')) {
        intent = 'QUERY_FACT';
        entities.key = 'userName';
    }

    // Intent: TIME
    else if (lowercaseText.includes('time') || lowercaseText.includes('date')) {
        intent = 'get_time';
    }

    // Intent: CALCULATE
    else if (lowercaseText.match(/(\d+)\s*(\+|\-|\*|\/)\s*(\d+)/)) {
        intent = 'CALCULATE';
        entities.expression = lowercaseText.match(/(\d+)\s*(\+|\-|\*|\/)\s*(\d+)/)[0];
    }

    // Intent: OPEN_URL
    else if (lowercaseText.includes('open google') || lowercaseText.includes('open browser')) {
        intent = 'OPEN_URL';
        entities.url = 'https://google.com';
    }

    return { intent, entities, original: text };
};
