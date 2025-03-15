# **Simplified CRCT System - Set-up/Maintenance Plugin**

**This Plugin provides detailed instructions for the Set-up/Maintenance phase using JSON-based dependency tracking.**

---

## I. Entering and Exiting Set-up/Maintenance Phase

**Entering Set-up/Maintenance Phase:**
1. **Initial State**: Start here for new projects or if `.memory-bankrules.json` shows `currentPhase: "Set-up/Maintenance"`.
2. **`.memory-bankrules.json` Check**: Always read `.memory-bankrules.json` first. If `lastActionState.currentPhase` indicates "Set-up/Maintenance", proceed with these instructions.
3. **New Project**: If `.memory-bankrules.json` is missing/empty, assume this phase and initialize core files.

**Exiting Set-up/Maintenance Phase:**
1. **Completion Criteria:**
   - All core files exist and are initialized.
   - `dependencies.json` is populated with project structures.
   - Code root directories are identified.
2. **`.memory-bankrules.json` Update (MUP):**
   ```json
   {
     "lastActionState": {
       "lastAction": "Completed Set-up/Maintenance Phase",
       "currentPhase": "Set-up/Maintenance",
       "nextAction": "Phase Complete - User Action Required",
       "nextPhase": "Strategy"
     }
   }
   ```
3. **User Action**: Pause for user to trigger the next session.

---

## II. Initializing Core Required Files

**Action**: Ensure all core files exist, creating them if missing.

**Procedure:**
1. **Check for Existence**: Check if each core file exists.
2. **Create Missing Files:**
   
   - For `.memory-bankrules.json`:
     ```json
     {
       "lastActionState": {
         "lastAction": "System Initialized",
         "currentPhase": "Set-up/Maintenance",
         "nextAction": "Initialize Core Files",
         "nextPhase": "Set-up/Maintenance"
       },
       "codeRootDirectories": [],
       "learningJournal": [
         "memory-bank Project initialized on [date]."
       ]
     }
     ```

   - For `dependencies.json`:
     ```json
     {
       "moduleRelationships": {},
       "fileRelationships": {},
       "documentationRelationships": {}
     }
     ```

   - For Markdown files (`projectbrief.md`, `productContext.md`, `activeContext.md`, `changelog.md`):
     Create with appropriate headers and placeholder content.

3. **MUP**: Follow Core Prompt MUP after creating files.

---

## III. Populating `dependencies.json`

**Objective**: Analyze the project and populate the dependency tracker.

**Procedure:**
1. **Scan Code Roots**: For each directory in `codeRootDirectories`:
   - List all files within the directory (recursively).
   - Add each file to `dependencies.json` under `fileRelationships`.

2. **Initial Module Relationships**: For each root directory:
   - Add an entry in `moduleRelationships`.
   - Set initial `depends_on` and `depended_by` as empty arrays.

3. **Identify Documentation**: Look for documentation directories (docs, documentation):
   - Add documentation files to `documentationRelationships`.

4. **Analyze Dependencies**:
   For each file in `fileRelationships`:
   - Read the file content.
   - Look for imports, includes, or other dependency indicators.
   - For each identified dependency:
     - Check if it exists in the project.
     - If yes, add it to the file's `depends_on` array.
     - Add the current file to the dependency's `depended_by` array.

5. **Module-Level Dependencies**:
   Based on file-level dependencies, calculate module-level dependencies.
   - If files in module A depend on files in module B, add module B to module A's `depends_on`.

6. **Documentation Dependencies**:
   For documentation files:
   - Look for links, references, or "see also" sections.
   - Add appropriate dependencies based on references.

7. **MUP**: Apply Core MUP after each significant update.

---

## IV. Identifying Code Root Directories

**Action**: Identify the primary code directories of the project.

**Procedure:**
1. **Scan Root Directory**: List all directories in the project root.
2. **Filter Candidates**: Apply these filters:
   - **Include**: Directories containing code files (.py, .js, .ts, .java, etc.)
   - **Include**: Directories with common code folder names (src, lib, app, core)
   - **Exclude**: Known non-code directories (.git, node_modules, venv, __pycache__, etc.)

3. **Chain-of-Thought Reasoning**: For each candidate, document why it should or shouldn't be included.

4. **Update `.memory-bankrules.json`**:
   ```javascript
   // Read the current file
   const memory-bankrules = readJsonFile('.memory-bankrules.json');
   
   // Update code roots
   memory-bankrules.codeRootDirectories = ['src', 'lib', 'tests']; // Example
   
   // Write back
   writeJsonFile('.memory-bankrules.json', memory-bankrules);
   ```

5. **MUP**: Apply Core MUP.

---

## V. Adding a File or Module to Track

**Action**: Add new files or modules to the dependency tracking system.

**Procedure:**
1. **File Addition**:
   ```javascript
   // Read dependencies.json
   const dependencies = readJsonFile('memory-bank-docs/dependencies.json');
   
   // Add new file if it doesn't exist
   if (!dependencies.fileRelationships['src/newfile.py']) {
     dependencies.fileRelationships['src/newfile.py'] = {
       "depends_on": [],
       "depended_by": [],
       "description": "Description of the file"
     };
   }
   
   // Write back
   writeJsonFile('memory-bank-docs/dependencies.json', dependencies);
   ```

2. **Module Addition**:
   ```javascript
   // Read dependencies.json
   const dependencies = readJsonFile('memory-bank-docs/dependencies.json');
   
   // Add new module if it doesn't exist
   if (!dependencies.moduleRelationships['new_module']) {
     dependencies.moduleRelationships['new_module'] = {
       "depends_on": [],
       "depended_by": [],
       "description": "Description of the module"
     };
   }
   
   // Write back
   writeJsonFile('memory-bank-docs/dependencies.json', dependencies);
   ```

3. **MUP**: Apply Core MUP.

---

## VI. Set-up/Maintenance Plugin - MUP Additions

After Core MUP steps:
1. **Update `dependencies.json`**: Save any changes to the dependency tracker.
2. **Update `.memory-bankrules.json` `lastActionState`**:

```json
{
  "lastActionState": {
    "lastAction": "Added new module 'auth'",
    "currentPhase": "Set-up/Maintenance",
    "nextAction": "Identify dependencies for 'auth' module",
    "nextPhase": "Set-up/Maintenance"
  }
}
```

---

## VII. Adding Dependencies Between Files

**Action**: Update dependency relationships in the tracker.

**Procedure:**
1. **Add Dependency**:
   ```javascript
   function addDependency(sourceFile, targetFile, description = "") {
     // Read dependencies.json
     const dependencies = readJsonFile('memory-bank-docs/dependencies.json');
     
     // Ensure both files exist in tracker
     if (!dependencies.fileRelationships[sourceFile]) {
       dependencies.fileRelationships[sourceFile] = {
         "depends_on": [],
         "depended_by": [],
         "description": description
       };
     }
     
     if (!dependencies.fileRelationships[targetFile]) {
       dependencies.fileRelationships[targetFile] = {
         "depends_on": [],
         "depended_by": [],
         "description": ""
       };
     }
     
     // Add dependency relationships
     if (!dependencies.fileRelationships[sourceFile].depends_on.includes(targetFile)) {
       dependencies.fileRelationships[sourceFile].depends_on.push(targetFile);
     }
     
     if (!dependencies.fileRelationships[targetFile].depended_by.includes(sourceFile)) {
       dependencies.fileRelationships[targetFile].depended_by.push(sourceFile);
     }
     
     // Write back
     writeJsonFile('memory-bank-docs/dependencies.json', dependencies);
   }
   ```

2. **Update Module Dependencies**:
   ```javascript
   function updateModuleDependencies() {
     // Read dependencies.json
     const dependencies = readJsonFile('memory-bank-docs/dependencies.json');
     
     // Clear existing module dependencies
     Object.keys(dependencies.moduleRelationships).forEach(module => {
       dependencies.moduleRelationships[module].depends_on = [];
       dependencies.moduleRelationships[module].depended_by = [];
     });
     
     // Calculate module dependencies based on file dependencies
     Object.keys(dependencies.fileRelationships).forEach(sourceFile => {
       const sourceModule = sourceFile.split('/')[0];
       
       dependencies.fileRelationships[sourceFile].depends_on.forEach(targetFile => {
         const targetModule = targetFile.split('/')[0];
         
         if (sourceModule !== targetModule) {
           if (!dependencies.moduleRelationships[sourceModule].depends_on.includes(targetModule)) {
             dependencies.moduleRelationships[sourceModule].depends_on.push(targetModule);
           }
           
           if (!dependencies.moduleRelationships[targetModule].depended_by.includes(sourceModule)) {
             dependencies.moduleRelationships[targetModule].depended_by.push(sourceModule);
           }
         }
       });
     });
     
     // Write back
     writeJsonFile('memory-bank-docs/dependencies.json', dependencies);
   }
   ```

3. **MUP**: Apply Core MUP.