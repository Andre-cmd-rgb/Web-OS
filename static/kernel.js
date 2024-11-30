// kernel.js
class Kernel {
    constructor(displayElement) {
      this.display = displayElement;
      this.prompt = "> ";
      this.init();
    }
  
    init() {
      this.print("Welcome to WebTerminal OS!");
      this.print("Type 'help' for a list of commands.");
      this.newPrompt();
      this.setupInputListener();
    }
  
    setupInputListener() {
      document.addEventListener("keydown", (e) => {
        const inputElement = document.getElementById("input-line");
        if (!inputElement) return;
  
        if (e.key === "Enter") {
          const command = inputElement.innerText.trim();
          this.executeCommand(command);
          inputElement.removeAttribute("id");
          this.newPrompt();
        } else if (e.key === "Backspace") {
          e.preventDefault();
          inputElement.innerText = inputElement.innerText.slice(0, -1);
        } else if (e.key.length === 1) {
          inputElement.innerText += e.key;
        }
      });
    }
  
    executeCommand(command) {
      this.print(`${this.prompt}${command}`);
      switch (command.toLowerCase()) {
        case "help":
          this.print("Available commands: help, clear, echo [text]");
          break;
        case "clear":
          this.clearScreen();
          break;
        case "":
          break;
        default:
          if (command.startsWith("echo ")) {
            this.print(command.substring(5));
          } else {
            this.print(`Unknown command: ${command}`);
          }
      }
    }
  
    newPrompt() {
      const newLine = document.createElement("div");
      newLine.innerHTML = `${this.prompt}<span id="input-line" contenteditable="true"></span>`;
      this.display.appendChild(newLine);
      const inputLine = newLine.querySelector("#input-line");
      inputLine.focus();
    }
  
    print(text) {
      const line = document.createElement("div");
      line.textContent = text;
      this.display.appendChild(line);
    }
  
    clearScreen() {
      this.display.innerHTML = "";
    }
  }
  
  // Initialize the kernel
  window.onload = () => {
    const terminalDisplay = document.getElementById("terminal");
    new Kernel(terminalDisplay);
  };
  