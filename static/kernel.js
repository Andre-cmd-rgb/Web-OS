import FileSystem from './fs.js';
import CommandHistoryManager from './history.js'; 
import { commands } from './commands.js';

class StarOS {
  constructor(terminalElement) {
    this.terminal = terminalElement;
    this.prompt = "> ";
    this.fileSystem = new FileSystem();
    this.currentDirectory = "root";
    this.commandHistoryManager = new CommandHistoryManager();
    this.init();
  }

  async init() {
    await this.fileSystem.init();

    try {
      await this.fileSystem.createDirectory("root");
    } catch (error) {}

    this.print("Welcome to Web OS!");
    this.print("Type 'help' for a list of commands.");
    this.newPrompt();
    this.setupInputListener();
  }

  setupInputListener() {
    document.addEventListener("keydown", async (event) => {
      const inputElement = document.querySelector("#input-line");
      if (!inputElement) return;

      switch (event.key) {
        case "Enter":
          event.preventDefault();
          const command = inputElement.textContent.trim();
          await this.processCommand(command);
          await this.commandHistoryManager.saveCommandToHistory(command);
          inputElement.removeAttribute("contenteditable");
          inputElement.removeAttribute("id");
          this.newPrompt();
          break;
        case "Backspace":
          event.preventDefault();
          inputElement.textContent = inputElement.textContent.slice(0, -1);
          break;
        case "ArrowUp":
        case "ArrowDown":
          this.commandHistoryManager.handleArrowKeyNavigation(event, inputElement);
          break;
        default:
          if (event.key.length === 1) {
            event.preventDefault();
            inputElement.textContent += event.key;
          }
      }
    });
  }

  async processCommand(command) {
    if (!command) return;

    const [cmd, ...args] = command.split(" ");
    try {
      if (commands[cmd]) {
        await commands[cmd](this, args); // Call the command from commands.js
      } else {
        this.commandNotFound(cmd);
      }
    } catch (error) {
      this.print(`Error: ${error.message}`);
    }
  }

  commandNotFound(cmd) {
    this.print(`Unknown command: ${cmd}`);
  }

  newPrompt() {
    const promptLine = document.createElement("div");
    promptLine.classList.add("prompt-line");
    promptLine.innerHTML = `${this.prompt}<span id="input-line" contenteditable="true"></span>`;
    this.terminal.appendChild(promptLine);

    const inputLine = document.querySelector("#input-line");
    inputLine.focus();

    this.scrollTerminal();
  }

  print(text) {
    const outputLine = document.createElement("div");
    outputLine.innerHTML = text;
    this.terminal.appendChild(outputLine);
    this.scrollTerminal();
  }
  
  clearScreen() {
    this.terminal.innerHTML = "";
    this.print("Screen cleared.");
  }

  scrollTerminal() {
    this.terminal.scrollTop = this.terminal.scrollHeight;
  }

  _getFullPath(path) {
    if (path.startsWith("/")) {
      return path;
    } else {
      return `${this.currentDirectory}/${path}`;
    }
  }

  async _updateParentDirectory(filePath) {
    const parentPath = this._getParentDirectory(filePath);
    const parentDir = await this.fileSystem.performTransaction(this.fileSystem.storeName, (store) => store.get(parentPath));

    if (parentDir && parentDir.type === "directory") {
      if (!parentDir.contents.includes(filePath)) {
        parentDir.contents.push(filePath);
        await this.fileSystem.performTransaction(this.fileSystem.storeName, (store) => store.put(parentDir), "readwrite");
      }
    }
  }

  async _checkIfPathExists(path) {
    const entry = await this.fileSystem.performTransaction(this.fileSystem.storeName, (store) => store.get(path));
    return entry !== undefined;
  }

  _getParentDirectory(path) {
    const parts = path.split("/");
    parts.pop();
    return parts.join("/") || "root";
  }
}

window.onload = () => {
  const terminalElement = document.getElementById("terminal");
  new StarOS(terminalElement);
};
