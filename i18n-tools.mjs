console.log("");
console.log("*** i18n-tools ***");
console.log("f Find unused tokens");
console.log("p Purge unused tokens");
console.log("");

import { findUnusedTokens } from './unused-i18n-token-finder.mjs';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'q Quit | h Instructions: '
});

rl.prompt();

rl.on('line', (line) => {
    switch (line.trim()) {
        case 'f':
            console.log('looking for unused tokens...');
            findUnusedTokens();
            break;
        case '2':
            console.log('number two!');
            break;
        case 'Q':
        case 'q':
            rl.close();
        default:
            console.log('Please make a valid selection.');
            break;
    }
    rl.prompt();
}).on('close', () => {
    console.log('Have a great day!');
    process.exit(0);
});

