//commands history

class CommandHistory {
    constructor(dbName = "WebOSCommandHistory", storeName = "history") {
      this.dbName = dbName;
      this.storeName = storeName;
      this.db = null;
      this.history = [];
      this.historyIndex = -1;
      this.init();
    }
  
    // Initialize IndexedDB and create the object store if it doesn't exist
    async init() {
      this.db = await this.openDB();
      await this.loadHistory();
    }
  
    // Open the IndexedDB and create object store if needed
    async openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1);
  
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
            store.createIndex("commands", "commands", { unique: false });
          }
        };
  
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
  
        request.onerror = (event) => {
          reject("Error opening IndexedDB: " + event.target.error);
        };
      });
    }
  
    // Load command history from IndexedDB
    async loadHistory() {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
  
      request.onsuccess = (event) => {
        this.history = event.target.result.map(entry => entry.commands);
        this.historyIndex = this.history.length;
      };
      
      request.onerror = (event) => {
        console.error("Error loading history: " + event.target.error);
      };
    }
  
    // Save the command to IndexedDB
    async saveCommand(command) {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const commandData = { commands: command };
      
      const request = store.add(commandData);
      
      request.onsuccess = () => {
        this.history.push(command); // Update in-memory history after saving to DB
        this.historyIndex = this.history.length;
      };
      
      request.onerror = (event) => {
        console.error("Error saving command: " + event.target.error);
      };
    }
  
    // Get the previous command from history
    getPreviousCommand() {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        return this.history[this.historyIndex];
      }
      return null;
    }
  
    // Get the next command from history
    getNextCommand() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        return this.history[this.historyIndex];
      }
      return null;
    }
  
    // Manually set the history index (useful for arrow key navigation)
    setHistoryIndex(index) {
      this.historyIndex = index;
    }
  
    // Return the current history
    getHistory() {
      return this.history;
    }
  }
  
  // Example usage of CommandHistory class in StarOS:
  export default class CommandHistoryManager {
    constructor() {
      this.history = new CommandHistory();
    }
  
    // Handle arrow key navigation
    handleArrowKeyNavigation(event, inputElement) {
      if (event.key === "ArrowUp") {
        const prevCommand = this.history.getPreviousCommand();
        if (prevCommand !== null) {
          inputElement.textContent = prevCommand;
        }
      } else if (event.key === "ArrowDown") {
        const nextCommand = this.history.getNextCommand();
        if (nextCommand !== null) {
          inputElement.textContent = nextCommand;
        } else {
          inputElement.textContent = '';
        }
      }
    }
  
    // Save the current command to history
    async saveCommandToHistory(command) {
      await this.history.saveCommand(command);
    }
  }
  
  // Initialize the history manager
  const historyManager = new CommandHistoryManager();
  
  // Set up arrow key listener for command input
  document.addEventListener("keydown", (event) => {
    const inputElement = document.querySelector("#input-line");
    if (inputElement) {
      historyManager.handleArrowKeyNavigation(event, inputElement);
    }
  });
  
  async function saveCommand(command) {
    await historyManager.saveCommandToHistory(command);
  }
