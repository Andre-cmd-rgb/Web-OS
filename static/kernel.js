import FileSystem from './fs.js';

class StarOS {
  constructor(terminalElement) {
    this.terminal = terminalElement;
    this.prompt = "> ";
    this.fileSystem = new FileSystem();
    this.currentDirectory = "root"; // Start in the root directory
    this.init();
  }

  async init() {
    await this.fileSystem.init(); // Ensure the filesystem is ready

    // Create the root directory if it doesn't exist
    try {
      await this.fileSystem.createDirectory("root");
    } catch (error) {
      // Ignore error if root already exists
    }

    this.print("Welcome to Star OS!");
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
          inputElement.removeAttribute("contenteditable");
          inputElement.removeAttribute("id");
          this.newPrompt();
          break;
        case "Backspace":
          event.preventDefault();
          inputElement.textContent = inputElement.textContent.slice(0, -1);
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
      switch (cmd) {
        case "help":
          this.print(
            "Available commands: help, mkdir [name], touch [name], ls, cat [name], rm [name], clear, cd [dir], cd .., add [file] [content]"
          );
          break;
        case "mkdir":
          if (args.length < 1) throw new Error("Usage: mkdir [name]");
          const dirPath = this._getFullPath(args[0]);
          const dirExists = await this._checkIfPathExists(dirPath);
          if (dirExists) throw new Error("Path already exists");
          await this.fileSystem.createDirectory(dirPath);
          await this._updateParentDirectory(dirPath);
          this.print(`Directory '${args[0]}' created.`);
          break;
        case "touch":
          if (args.length < 1) throw new Error("Usage: touch [name]");
          const filePath = this._getFullPath(args[0]);
          const fileExists = await this._checkIfPathExists(filePath);
          if (fileExists) throw new Error("Path already exists");
          await this.fileSystem.createFile(filePath, "");
          await this._updateParentDirectory(filePath);
          this.print(`File '${args[0]}' created.`);
          break;
        case "add":
          if (args.length < 2) throw new Error("Usage: add [file] [content]");
          const fileToAdd = this._getFullPath(args[0]);
          const contentToAdd = args.slice(1).join(" "); // Join all parts of the content
          const fileExistsForAdd = await this._checkIfPathExists(fileToAdd);
          if (!fileExistsForAdd) throw new Error("File does not exist");
          
          // Read the existing file content, append the new content, and write it back
          let existingContent = await this.fileSystem.readFile(fileToAdd);
          existingContent += "\n" + contentToAdd; // Append the new content
          await this.fileSystem.writeFile(fileToAdd, existingContent); // Save the updated content

          this.print(`Content added to '${args[0]}'`);
          break;
        case "ls":
          const contents = await this.fileSystem.listContents(this.currentDirectory);
          if (contents.length === 0) {
            this.print("Directory is empty.");
          } else {
            // Show only the names of files and dirs inside the current directory (relative to current dir)
            this.print(contents.map(entry => entry.split('/').pop()).join("\n"));
          }
          break;
        case "cat":
          if (args.length < 1) throw new Error("Usage: cat [name]");
          const data = await this.fileSystem.readFile(this._getFullPath(args[0]));
          // Replace newline characters with <br> for HTML rendering
          const formattedData = data.replace(/\n/g, "<br>");
          this.print(formattedData);
          break;
        case "rm":
          if (args.length < 1) throw new Error("Usage: rm [name]");
          await this.fileSystem.deleteEntry(this._getFullPath(args[0]));
          this.print(`'${args[0]}' deleted.`);
          break;
        case "clear":
          this.clearScreen();
          break;
        case "cd":
          if (args.length < 1) throw new Error("Usage: cd [dir]");
          if (args[0] === "..") {
            if (this.currentDirectory === "root") {
              throw new Error("Already at root directory.");
            } else {
              // Handle moving up to the parent directory
              const parentDir = this._getParentDirectory(this.currentDirectory);
              this.currentDirectory = parentDir;
              this.print(`Changed directory to '${parentDir}'`);
            }
          } else {
            const targetPath = this._getFullPath(args[0]);
            const targetDir = await this._checkIfPathExists(targetPath);
            if (!targetDir) throw new Error("Directory not found");
            this.currentDirectory = targetPath;  // Update the current directory
            this.print(`Changed directory to '${args[0]}'`);
          }
          break;
        default:
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
    outputLine.innerHTML = text;  // Use innerHTML to handle HTML tags like <br>
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

  // Helper method to get full path
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

  // Helper: Get parent directory from a given path
  _getParentDirectory(path) {
    const parts = path.split("/");
    parts.pop(); // Remove file/directory name
    return parts.join("/") || "root";  // Default to "root" if at the root
  }
}

// Initialize Star OS
window.onload = () => {
  const terminalElement = document.getElementById("terminal");
  new StarOS(terminalElement);
};
