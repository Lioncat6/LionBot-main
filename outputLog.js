const fs = require('node:fs');
const path = require('node:path');

function outputLog(text) {
    const logFilePath = path.join(__dirname, 'log.txt');
    console.log(text);
    fs.appendFile(logFilePath, text + '\n', (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
}

module.exports = {
    outputLog
};
