import { processCommand } from './src/lib/nlp.js';

const test = () => {
    try {
        console.log("Testing: 'Remind me to call Mom in 5 minutes'");
        console.log(processCommand("Remind me to call Mom in 5 minutes"));

        console.log("Testing: 'Remind me to sleep at 10pm'");
        console.log(processCommand("Remind me to sleep at 10pm"));
    } catch (e) {
        console.error("Error:", e);
    }
};

test();
