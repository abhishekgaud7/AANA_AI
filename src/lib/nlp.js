import nlp from 'compromise';
import datePlugin from 'compromise-dates';
nlp.plugin(datePlugin);

export const processCommand = (text) => {
    const doc = nlp(text);
    const lowercaseText = text.toLowerCase();

    let intent = 'UNKNOWN';
    let entities = {};

    // Intent: SET_REMINDER
    if (doc.has('(remind|alert|alarm)') || lowercaseText.includes('remind me')) {
        intent = 'SET_REMINDER';
        const dates = doc.dates().json();
        if (dates.length > 0) {
            entities.time = dates[0].date.start;
        }

        let content = lowercaseText
            .replace(/remind me (to)?/i, '')
            .replace(entities.time || '', '')
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

    // Intent: CALCULATE
    else if (lowercaseText.match(/(\d+)\s*(\+|\-|\*|\/)\s*(\d+)/)) {
        intent = 'CALCULATE';
        entities.expression = lowercaseText.match(/(\d+)\s*(\+|\-|\*|\/)\s*(\d+)/)[0];
    }

    // Intent: TIME
    else if (lowercaseText.includes('time') || lowercaseText.includes('date')) {
        intent = 'get_time';
    }

    return { intent, entities, original: text };
};
