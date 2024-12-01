// commands.js

export const commands = {
    help(terminal) {
      terminal.print(
        "Available commands: help, mkdir [name], touch [name], ls, cat [name], rm [name], clear, cd [dir], cd .., add [file] [content]"
      );
    },
  
    async mkdir(terminal, args) {
      if (args.length < 1) throw new Error("Usage: mkdir [name]");
      const dirPath = terminal._getFullPath(args[0]);
      const dirExists = await terminal._checkIfPathExists(dirPath);
      if (dirExists) throw new Error("Path already exists");
      await terminal.fileSystem.createDirectory(dirPath);
      await terminal._updateParentDirectory(dirPath);
      terminal.print(`Directory '${args[0]}' created.`);
    },
  
    async touch(terminal, args) {
      if (args.length < 1) throw new Error("Usage: touch [name]");
      const filePath = terminal._getFullPath(args[0]);
      const fileExists = await terminal._checkIfPathExists(filePath);
      if (fileExists) throw new Error("Path already exists");
      await terminal.fileSystem.createFile(filePath, "");
      await terminal._updateParentDirectory(filePath);
      terminal.print(`File '${args[0]}' created.`);
    },
  
    async add(terminal, args) {
      if (args.length < 2) throw new Error("Usage: add [file] [content]");
      const fileToAdd = terminal._getFullPath(args[0]);
      const contentToAdd = args.slice(1).join(" ");
      const fileExistsForAdd = await terminal._checkIfPathExists(fileToAdd);
      if (!fileExistsForAdd) throw new Error("File does not exist");
  
      let existingContent = await terminal.fileSystem.readFile(fileToAdd);
      existingContent += "\n" + contentToAdd;
      await terminal.fileSystem.writeFile(fileToAdd, existingContent);
      terminal.print(`Content added to '${args[0]}'`);
    },
  
    async ls(terminal) {
      const contents = await terminal.fileSystem.listContents(terminal.currentDirectory);
      if (contents.length === 0) {
        terminal.print("Directory is empty.");
      } else {
        terminal.print(contents.map(entry => entry.split('/').pop()).join("\n"));
      }
    },
  
    async cat(terminal, args) {
      if (args.length < 1) throw new Error("Usage: cat [name]");
      const data = await terminal.fileSystem.readFile(terminal._getFullPath(args[0]));
      const formattedData = data.replace(/\n/g, "<br>");
      terminal.print(formattedData);
    },
  
    async rm(terminal, args) {
      if (args.length < 1) throw new Error("Usage: rm [name]");
      await terminal.fileSystem.deleteEntry(terminal._getFullPath(args[0]));
      terminal.print(`'${args[0]}' deleted.`);
    },
  
    clear(terminal) {
      terminal.clearScreen();
    },
  
    async cd(terminal, args) {
      if (args.length < 1) throw new Error("Usage: cd [dir]");
      if (args[0] === "..") {
        if (terminal.currentDirectory === "root") {
          throw new Error("Already at root directory.");
        } else {
          const parentDir = terminal._getParentDirectory(terminal.currentDirectory);
          terminal.currentDirectory = parentDir;
          terminal.print(`Changed directory to '${parentDir}'`);
        }
      } else {
        const targetPath = terminal._getFullPath(args[0]);
        const targetDir = await terminal._checkIfPathExists(targetPath);
        if (!targetDir) throw new Error("Directory not found");
        terminal.currentDirectory = targetPath;
        terminal.print(`Changed directory to '${args[0]}'`);
      }
    }
  };
  