// terminalGraphics.js

// Utility to set text color
const setColor = (color) => {
    const colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      reset: '\x1b[0m', // default
      bold: '\x1b[1m',
      dim: '\x1b[2m',
      underline: '\x1b[4m',
    };
    return colors[color] || colors.reset;
  };
  
  // Print colored text
  export const printColored = (text, color = 'reset') => {
    console.log(`${setColor(color)}${text}${setColor('reset')}`);
  };
  
  // Print bold text
  export const printBold = (text) => {
    console.log(`${setColor('bold')}${text}${setColor('reset')}`);
  };
  
  // Print a spinner animation
  export const printSpinner = (message, interval = 100) => {
    const spinnerChars = ['|', '/', '-', '\\'];
    let idx = 0;
    const spinnerInterval = setInterval(() => {
      process.stdout.write(`\r${message} ${spinnerChars[idx]}`);
      idx = (idx + 1) % spinnerChars.length;
    }, interval);
  
    return spinnerInterval; // Return the interval ID to stop it later
  };
  
  // Stop the spinner animation
  export const stopSpinner = (spinnerInterval) => {
    clearInterval(spinnerInterval);
    process.stdout.write('\r'); // Clear spinner
  };
  
  // Print a simple progress bar
  export const printProgressBar = (progress, total, length = 50) => {
    const progressLength = Math.floor((progress / total) * length);
    const progressBar = '█'.repeat(progressLength) + ' '.repeat(length - progressLength);
    process.stdout.write(`\r[${progressBar}] ${Math.round((progress / total) * 100)}%`);
  };
  
  // Clear the terminal screen
  export const clearScreen = () => {
    process.stdout.write('\x1b[2J\x1b[0f'); // ANSI escape codes to clear screen
  };
  