// console.log("*** i18n-tools ***");
// console.log("Choose what you would like to do:");
// console.log("h See this message again");
// console.log("f Find unused tokens");
// console.log("p Purge unused tokens");
// console.log("q Quit");

const readline = require('readline');
const child_process = require('child_process');

function runUnusedTokenFinder() {
    const utf = child_process.exec('node unused-i18n-token-finder');

    utf.stdout.on('data', (data) => {
        console.log(`${data}`);
    });

    utf.stderr.on('data', (data) => {
        console.error(`${data}`);
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Selection: '
});

rl.prompt();

rl.on('line', (line) => {
    switch (line.trim()) {
        case 'f':
            console.log('looking for unused tokens...');
            runUnusedTokenFinder();
            break;
        case '2':
            console.log('number two!');
            break;
        case 'Q':
        case 'q':
            rl.close();
        default:
            console.log('Please make a valid selection');
            break;
    }
    rl.prompt();
}).on('close', () => {
    console.log('Have a great day!');
    process.exit(0);
});

