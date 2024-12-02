// commands

export const commands = {
  help(terminal) {
    terminal.print(`
      <strong>Available Commands:</strong>
      <ul>
        <li><strong>help</strong>: Displays this list of commands.</li>
        <li><strong>mkdir [name]</strong>: Creates a new directory named <em>[name]</em>.</li>
        <li><strong>touch [name]</strong>: Creates a new empty file named <em>[name]</em>.</li>
        <li><strong>add [file] [content]</strong>: Appends <em>[content]</em> to the file <em>[file]</em>. Creates a new line for the content.</li>
        <li><strong>ls</strong>: Lists the contents of the current directory.</li>
        <li><strong>cat [name]</strong>: Displays the content of the file <em>[name]</em>. If the file is Markdown (<em>.md</em>), it is rendered with basic formatting.</li>
        <li><strong>rm [name]</strong>: Deletes the file or directory <em>[name]</em>.</li>
        <li><strong>clear</strong>/<strong>cls</strong>: Clears the terminal screen.</li>
        <li><strong>cd [dir]</strong>: Changes the current directory to <em>[dir]</em>.</li>
        <li><strong>cd ..</strong>: Moves up to the parent directory.</li>
        <li><strong>wget [url] [filename]</strong>: Fetches the content from the specified <em>[url]</em> and saves it to a file named <em>[filename]</em>.</li>
        <li><strong>clone [repo-url] [optional-directory-name]</strong>: Clones the GitHub repository from the specified <em>[repo-url]</em> into an optional directory name.</li>
      </ul>
    `);
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
    async run(terminal, args) {
      if (args.length < 1) throw new Error("Usage: run [file]");
      const filePath = terminal._getFullPath(args[0]);
      terminal.print(`Trying to run file at path: ${filePath}`); // Debugging line
      const fileExists = await terminal._checkIfPathExists(filePath);
      if (!fileExists) {
        terminal.print(`Error: File '${filePath}' not found.`);
        return;
      }
    
      try {
        terminal.print(`Running script '${args[0]}'...`);
        const data = await terminal.fileSystem.readFile(filePath);
        eval(data);  // Run the script
        //terminal.print(data);
        terminal.print(`Script '${args[0]}' executed successfully.`);
      } catch (error) {
        terminal.print(`Error: ${error.message}`);
      }
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
      const filePath = terminal._getFullPath(args[0]);
      const fileExists = await terminal._checkIfPathExists(filePath);
    
      if (!fileExists) throw new Error("File does not exist");
    
      const data = await terminal.fileSystem.readFile(filePath);
    
      // Check if file ends with `.md`
      if (args[0].endsWith(".md")) {
        const rendered = data
          .replace(/^# (.+)/gm, "<h1>$1</h1>") // Render # Header
          .replace(/^## (.+)/gm, "<h2>$1</h2>") // Render ## Header
          .replace(/^### (.+)/gm, "<h3>$1</h3>") // Render ### Header
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") // Render **bold**
          .replace(/\*(.+?)\*/g, "<em>$1</em>") // Render *italic*
          .replace(/!\[(.*?)\]\((.+?)\)/g, '<img alt="$1" src="$2" />') // Render ![alt](url)
          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>') // Render [text](url)
          .replace(/\n/g, "<br>"); // Replace newlines with <br> for display
    
        terminal.print(rendered);
      } else {
        // For plain text files, preserve line breaks
        const formattedData = data.replace(/\n/g, "<br>");
        terminal.print(formattedData);
      }
    },

    async rm(terminal, args) {
      if (args.length < 1) throw new Error("Usage: rm [name]");
      await terminal.fileSystem.deleteEntry(terminal._getFullPath(args[0]));
      terminal.print(`'${args[0]}' deleted.`);
    },
  
    clear(terminal) {
      terminal.clearScreen();
    },
    cls(terminal) {
      terminal.clearScreen();
    },
    async wget(terminal, args) {
      if (args.length < 2) throw new Error("Usage: wget [url] [filename]");
      const url = args[0];
      const fileName = args[1];
      const filePath = terminal._getFullPath(fileName);
  
      // Check if the file already exists
      const fileExists = await terminal._checkIfPathExists(filePath);
      if (fileExists) throw new Error("File already exists");
  
      try {
        terminal.print(`Fetching content from '${url}'...`);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }
        const content = await response.text();
  
        // Save the content to the file system
        await terminal.fileSystem.createFile(filePath, content);
        await terminal._updateParentDirectory(filePath);
  
        terminal.print(`Content from '${url}' saved to '${fileName}'.`);
      } catch (error) {
        terminal.print(`Error: ${error.message}`);
      }
    },
    async clone(terminal, args) {
      if (args.length < 1) throw new Error("Usage: clone [repo-url] [optional-directory-name]");
    
      const repoUrl = args[0].replace(/^['"]|['"]$/g, ""); // Remove quotes
      const repoName = args[1] || repoUrl.split('/').pop().replace('.git', '');
      const targetPath = terminal._getFullPath(repoName);
    
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) throw new Error("Invalid GitHub repository URL.");
    
      const [_, owner, repo] = match;
    
      const metadataUrl = `https://api.github.com/repos/${owner}/${repo}`;
      try {
        terminal.print(`Cloning repository '${repoUrl}'...`);
    
        // Fetch repository metadata
        const metadataResponse = await fetch(metadataUrl);
        if (!metadataResponse.ok) {
          throw new Error(`Failed to fetch repository metadata: ${metadataResponse.status}`);
        }
    
        const metadata = await metadataResponse.json();
        const branch = metadata.default_branch || "main";
    
        // Fetch repository tree
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch repository: ${response.status} ${response.statusText}`);
        }
    
        const repoData = await response.json();
        if (!repoData.tree) throw new Error("Failed to retrieve repository structure.");
    
        // Create root directory
        await terminal.fileSystem.createDirectory(targetPath);
        await terminal._updateParentDirectory(targetPath);
    
        // Save repository files
        for (const item of repoData.tree) {
          const itemPath = `${targetPath}/${item.path}`;
          if (item.type === "tree") {
            await terminal.fileSystem.createDirectory(itemPath);
            await terminal._updateParentDirectory(itemPath);
            terminal.print(`Created directory: ${item.path}`);
          } else if (item.type === "blob") {
            const fileResponse = await fetch(item.url, {
              headers: { Accept: "application/vnd.github.v3.raw" },
            });
            if (!fileResponse.ok) throw new Error(`Failed to fetch file: ${item.path}`);
            const fileContent = await fileResponse.text();
            await terminal.fileSystem.createFile(itemPath, fileContent);
            await terminal._updateParentDirectory(itemPath);
            terminal.print(`Fetched file: ${item.path}`);
          }
        }
    
        terminal.print(`Repository '${repoUrl}' cloned into '${repoName}'.`);
      } catch (error) {
        terminal.print(`Error: ${error.message}`);
      }
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
  