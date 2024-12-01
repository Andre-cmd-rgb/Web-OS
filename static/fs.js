class FileSystem {
    constructor() {
      this.dbName = "WebOSFileSystem";
      this.storeName = "FileSystemStore";
      this.init();
    }
  
    async init() {
      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1);
  
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: "path" });
          }
        };
  
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(new Error("Failed to open database: " + event.target.error));
      });
    }
  
    // Method to interact with the database
    async performTransaction(storeName, operation, mode = "readonly") {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = operation(store);
  
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(new Error("Transaction failed: " + event.target.error));
      });
    }
  
    // Create a directory
    async createDirectory(path) {
      if (path.startsWith("/")) {
        path = path.slice(1); // Remove slash for storage
      }
  
      const existingEntry = await this.performTransaction(this.storeName, (store) => store.get(path));
      if (existingEntry) {
        throw new Error("Path already exists");
      }
  
      const entry = { path, type: "directory", contents: [] };
      await this.performTransaction(this.storeName, (store) => store.add(entry), "readwrite");
    }
  
    // Create a file
    async createFile(path, data) {
      if (path.startsWith("/")) {
        path = path.slice(1); // Remove slash for storage
      }
  
      const existingEntry = await this.performTransaction(this.storeName, (store) => store.get(path));
      if (existingEntry) {
        throw new Error("Path already exists");
      }
  
      const parentDirPath = this._getParentDirectory(path);
      if (parentDirPath) {
        const parentDir = await this.performTransaction(this.storeName, (store) => store.get(parentDirPath));
        if (!parentDir || parentDir.type !== "directory") {
          throw new Error("Parent directory does not exist");
        }
        parentDir.contents.push(path);
        await this.performTransaction(this.storeName, (store) => store.put(parentDir), "readwrite");
      }
  
      const entry = { path, type: "file", content: data };
      await this.performTransaction(this.storeName, (store) => store.add(entry), "readwrite");
    }
  
    // Write (update) file content
    async writeFile(path, data) {
      const entry = await this.performTransaction(this.storeName, (store) => store.get(path));
      if (!entry || entry.type !== "file") {
        throw new Error("File not found");
      }
  
      entry.content = data;
      await this.performTransaction(this.storeName, (store) => store.put(entry), "readwrite");
    }
  
    // Read file content
    async readFile(path) {
      const entry = await this.performTransaction(this.storeName, (store) => store.get(path));
      if (!entry || entry.type !== "file") {
        throw new Error("File not found");
      }
      return entry.content;
    }
  
    // List contents of a directory
    async listContents(path) {
      const directory = await this.performTransaction(this.storeName, (store) => store.get(path));
      if (!directory || directory.type !== "directory") {
        throw new Error("Directory not found");
      }
      return directory.contents || [];
    }
  
    // Delete file or directory
    async deleteEntry(path) {
      const entry = await this.performTransaction(this.storeName, (store) => store.get(path));
      if (!entry) {
        throw new Error("Entry not found");
      }
  
      if (entry.type === "directory") {
        if (entry.contents.length > 0) {
          throw new Error("Directory is not empty");
        }
      }
  
      await this.performTransaction(this.storeName, (store) => store.delete(path), "readwrite");
  
      const parentDirPath = this._getParentDirectory(path);
      if (parentDirPath) {
        const parentDir = await this.performTransaction(this.storeName, (store) => store.get(parentDirPath));
        if (parentDir && parentDir.type === "directory") {
          const index = parentDir.contents.indexOf(path);
          if (index !== -1) {
            parentDir.contents.splice(index, 1);
            await this.performTransaction(this.storeName, (store) => store.put(parentDir), "readwrite");
          }
        }
      }
    }
  
    // Helper: Get parent directory from a given path
    _getParentDirectory(path) {
      const parts = path.split("/");
      parts.pop(); // Remove file/directory name
      return parts.join("/") || "/";  // Default to "/" if at the root
    }
  }
  
  export default FileSystem;
  