# **Simplified CRCT System - Strategy Plugin**

**This Plugin provides detailed instructions for the Strategy phase using JSON-based dependency tracking.**

---

## I. Entering and Exiting Strategy Phase

**Entering Strategy Phase:**
1. **`.memory-bankrules.json` Check**: Always read `.memory-bankrules.json` first. If `lastActionState.currentPhase` shows "Strategy", proceed with these instructions.
2. **Transition from Set-up/Maintenance**: Enter after Set-up/Maintenance; `.memory-bankrules.json` `nextPhase` will be "Strategy".
3. **User Trigger**: Start a new session after Set-up/Maintenance or to resume strategy.

**Exiting Strategy Phase:**
1. **Completion Criteria:**
   - Instruction files for prioritized tasks are created with complete sections.
   - Tasks are prioritized and ready for execution.
   - Strategy objectives for the cycle are met.
2. **`.memory-bankrules.json` Update (MUP):**
   ```json
   {
     "lastActionState": {
       "lastAction": "Completed Strategy Phase - Tasks Planned",
       "currentPhase": "Strategy",
       "nextAction": "Phase Complete - User Action Required",
       "nextPhase": "Execution"
     }
   }
   ```
3. **User Action**: After updating `.memory-bankrules.json`, pause for user to trigger Execution phase via a new session.

---

## II. Loading Context for Strategy

**Action**: Load context to guide strategy.
**Procedure:**
- Load core files: `.memory-bankrules.json`, `projectbrief.md`, `productContext.md`, `activeContext.md`, `dependencies.json`, `changelog.md`
- Review `activeContext.md` for current state, decisions, and priorities.
- Check `dependencies.json` for module and file dependencies.
- Revisit `projectbrief.md` and `productContext.md` to align with project scope and purpose.
- Examine `.memory-bankrules.json` `learningJournal` for past insights influencing strategy.

---

## III. Creating New Task Instruction Files

**Action**: Create `*_instructions.txt` files for tasks/subtasks.
**Procedure:**
1. **Identify Task/Subtask**: Use `projectbrief.md`, `productContext.md`, `activeContext.md`, and project state to select tasks.

2. **Choose Task Name and Location:**
   - **Tasks folder** Use or Create `strategy_tasks/` folder
   - **Task**: Create `{task_name}_instructions.txt` in a new directory if needed (e.g., `strategy_tasks/`).
   - **Subtask**: Place `{subtask_name}_instructions.txt` in a parent task subdirectory.
   - **Module-Level**: Use or create `{module_dir}/{module_dir}_main_instructions.txt`.

3. **Populate Instruction File Sections:**
   - Set title: `# {Task Name} Instructions`.
   - Define objective: Clearly state purpose and goals.
   - Provide context: Include background and constraints, referencing files.
   - List dependencies: List files and modules from `dependencies.json` that this task depends on.
   - Outline steps: Break into actionable increments.
   - Specify output: Describe deliverables.
   - Add notes: Note challenges or considerations.

   - Example Instruction File:
     ```
     # Authentication System Instructions

     ## Objective
     Implement a secure user authentication system with login, logout, and password reset.

     ## Context
     The application needs a secure way to authenticate users. We'll use JWT tokens for session management.

     ## Dependencies
     - src/database.py (Database connection handling)
     - src/config.py (Application configuration)
     - src/models/user.py (User data model)

     ## Steps
     1. Create src/auth/jwt_handler.py for JWT token creation and validation
     2. Create src/auth/password_utils.py for password hashing and verification
     3. Implement login endpoint in src/routes/auth.py
     4. Implement logout endpoint
     5. Implement password reset functionality

     ## Expected Output
     - src/auth/jwt_handler.py
     - src/auth/password_utils.py
     - src/routes/auth.py (new endpoints)
     - Updated dependencies in dependencies.json

     ## Notes
     - Ensure password hashing uses bcrypt or equivalent
     - JWT tokens should expire after 24 hours
     ```

4. **MUP**: Follow Core MUP and Section V additions after creating files.

---

## IV. Prioritizing Tasks and Subtasks

**Action**: Determine task/subtask priority and order.
**Procedure:**
1. **Review Existing Tasks**: Check incomplete instruction files in module or task directories.

2. **Assess Dependencies**: Use `dependencies.json` to identify prerequisite relationships:
   ```javascript
   function findTaskDependencies(taskName) {
     // Read dependencies.json
     const dependencies = readJsonFile('memory-bank_docs/dependencies.json');
     
     // Find all files mentioned in the task instructions
     const taskInstructions = readFile(`strategy_tasks/${taskName}_instructions.txt`);
     
     // Extract file paths from the Dependencies section
     const dependencySection = taskInstructions.split('## Dependencies')[1].split('##')[0];
     const filePaths = extractFilePaths(dependencySection);
     
     // Check dependencies for each file
     const prerequisiteTasks = [];
     filePaths.forEach(filePath => {
       if (dependencies.fileRelationships[filePath]) {
         dependencies.fileRelationships[filePath].depends_on.forEach(dep => {
           // Check if this dependency is part of another task
           // This would require mapping files to tasks
           const relatedTask = findTaskForFile(dep); 
           if (relatedTask && relatedTask !== taskName) {
             prerequisiteTasks.push(relatedTask);
           }
         });
       }
     });
     
     return prerequisiteTasks;
   }
   ```

3. **Consider Project Goals**: Align with `projectbrief.md` objectives, prioritizing key contributions.

4. **Review `activeContext.md`**: Factor in recent priorities, issues, or feedback.

5. **Create Priority List**:
   ```javascript
   function createPriorityList() {
     // Get all task files
     const taskFiles = listFiles('strategy_tasks', '*_instructions.txt');
     
     // Build dependency graph
     const graph = {};
     taskFiles.forEach(taskFile => {
       const taskName = taskFile.replace('_instructions.txt', '');
       graph[taskName] = findTaskDependencies(taskName);
     });
     
     // Topological sort to respect dependencies
     const priorityList = topologicalSort(graph);
     
     // Write to activeContext.md
     const activeContext = readFile('memory-bank_docs/activeContext.md');
     const updatedContext = activeContext + '\n\n## Task Priorities\n' + 
       priorityList.map((task, index) => `${index + 1}. ${task}`).join('\n');
     
     writeToFile('memory-bank_docs/activeContext.md', updatedContext);
   }
   ```

---

## V. Strategy Plugin - Mandatory Update Protocol (MUP) Additions

After Core MUP steps:
1. **Update Instruction Files**: Save new or modified instruction files.

2. **Update `activeContext.md` with Strategy Outcomes:**
   - Summarize planned tasks.
   - List new instruction file locations and names.
   - Document priorities and reasoning (from Section IV).

3. **Update Task Dependencies in `dependencies.json`**:
   ```javascript
   function addTaskToDependencies(taskName, filePaths) {
     // Read dependencies.json
     const dependencies = readJsonFile('memory-bank_docs/dependencies.json');
     
     // Create a "tasks" section if it doesn't exist
     if (!dependencies.taskRelationships) {
       dependencies.taskRelationships = {};
     }
     
     // Add task
     dependencies.taskRelationships[taskName] = {
       "files": filePaths,
       "depends_on": [],
       "depended_by": [],
       "description": `Task: ${taskName}`
     };
     
     // Infer task dependencies from file dependencies
     filePaths.forEach(filePath => {
       if (dependencies.fileRelationships[filePath]) {
         dependencies.fileRelationships[filePath].depends_on.forEach(dep => {
           // Find tasks that include this dependency
           Object.keys(dependencies.taskRelationships).forEach(otherTask => {
             if (otherTask !== taskName && 
                 dependencies.taskRelationships[otherTask].files.includes(dep)) {
               // Add task dependency
               if (!dependencies.taskRelationships[taskName].depends_on.includes(otherTask)) {
                 dependencies.taskRelationships[taskName].depends_on.push(otherTask);
               }
               if (!dependencies.taskRelationships[otherTask].depended_by.includes(taskName)) {
                 dependencies.taskRelationships[otherTask].depended_by.push(taskName);
               }
             }
           });
         });
       }
     });
     
     // Write back
     writeJsonFile('memory-bank_docs/dependencies.json', dependencies);
   }
   ```

4. **Update `.memory-bankrules.json` `lastActionState`**:
   ```json
   {
     "lastActionState": {
       "lastAction": "Created Authentication System task",
       "currentPhase": "Strategy",
       "nextAction": "Create Data Processing task",
       "nextPhase": "Strategy"
     }
   }
   ```

---

## VI. Handling Subtasks and Recursive Decomposition

**Action**: Break complex tasks into subtasks recursively.

**Procedure:**
1. **Identify Complex Tasks**: Review instruction files to find tasks that seem too large or complex.

2. **Create Subtask Instructions**: For each subtask:
   - Create `{subtask_name}_instructions.txt` in a subtask directory.
   - Follow the same format as regular task instructions.
   - Reference parent task in the Context section.
   - Add detailed steps specific to the subtask.
   - Mark explicitly as a subtask to trigger recursive processing.

3. **Update Parent Task**:
   - Modify parent task instructions to reference subtasks.
   - Change steps to delegate to subtasks where appropriate.
   - Add a note in the Steps section: "Execute subtask {subtask_name} (recursive)".

4. **Prepare for Recursion**:
   - Document in `activeContext.md` that a recursive subtask has been created.
   - Ensure all dependencies are clearly documented.
   - Note that when execution reaches this step, it should:
     - Temporarily pause the parent task
     - Process the subtask completely (applying the full chain-of-thought loop)
     - Resume the parent task once the subtask is complete

5. **Update Dependencies**:
   - Add relationships between parent tasks and subtasks in `dependencies.json`:
   ```javascript
   function addSubtaskDependency(parentTask, subtask) {
     // Read dependencies.json
     const dependencies = readJsonFile('memory-bank_docs/dependencies.json');
     
     // Ensure taskRelationships exists
     if (!dependencies.taskRelationships) {
       dependencies.taskRelationships = {};
     }
     
     // Add subtask relationship
     if (dependencies.taskRelationships[parentTask]) {
       if (!dependencies.taskRelationships[parentTask].subtasks) {
         dependencies.taskRelationships[parentTask].subtasks = [];
       }
       dependencies.taskRelationships[parentTask].subtasks.push(subtask);
     }
     
     // Add reverse relationship
     if (!dependencies.taskRelationships[subtask]) {
       dependencies.taskRelationships[subtask] = {
         parent_task: parentTask,
         files: [],
         depends_on: [],
         depended_by: [],
         description: `Subtask of ${parentTask}`
       };
     } else {
       dependencies.taskRelationships[subtask].parent_task = parentTask;
     }
     
     // Write back
     writeJsonFile('memory-bank_docs/dependencies.json', dependencies);
   }
   ```

6. **MUP**: Apply Core MUP after each subtask creation.

---

## VII. Creating Strategy Task Files

**Action**: Create detailed strategy documents for complex features.

**Procedure:**
1. **Identify Features Needing Detailed Planning**:
   - Complex architectural decisions
   - Features involving multiple modules
   - Areas with significant technical challenges

2. **Create Feature Strategy Document**:
   ```
   # Authentication System - Strategy Document
   
   ## Overview
   This document outlines the strategic approach for implementing the authentication system.
   
   ## Architecture
   We'll use a token-based authentication approach with JWT:
   
   ```mermaid
   sequenceDiagram
       Client->>+Server: Login Request
       Server->>+Database: Validate Credentials
       Database-->>-Server: User Found
       Server->>Server: Generate JWT
       Server-->>-Client: Return JWT
   ```
   
   ## Technical Decisions
   1. **Token Storage**: HttpOnly cookies for security
   2. **Password Encryption**: bcrypt with 12 rounds of salting
   3. **Token Lifetime**: 24 hours for regular tokens, 7 days for "remember me"
   
   ## Implementation Plan
   [Reference to instruction file]
   
   ## Considerations and Risks
   - XSS and CSRF protection needed
   - Rate limiting for login attempts
   ```

3. **Update Task Instructions**: Reference strategy documents in related task instructions.

4. **MUP**: Apply Core MUP after creating strategy documents.