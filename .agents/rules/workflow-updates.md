# STRICT WORKFLOW DIRECTIVE: THE 4-STEP LOOP

As an AI agent working on ProxyData, you MUST adhere to the following mandatory workflow protocol for **every single prompt** the user gives:

### Step 1: Pre-Work Verification
Before writing any code, you MUST check the master documentation (`docs/05-MASTER-WORKPLAN.md`, `.agents/rules/tech-stack.md`, etc.) to ensure your planned implementation does not violate the architecture, break Next.js 16/HeroUI v3 rules, or jump out of the correct Phase sequence.

### Step 2: Execution
Write the code following the strict tech-stack guidelines. 

### Step 3: Error Checking (MANDATORY)
After writing or modifying code, you MUST run a build/type check (e.g., `npx tsc --noEmit`) to verify there are no compilation errors, unused variables, or missing imports (like placing "use client" in the wrong order). Never hand over broken code.

### Step 4: Memory & Task Update
After successfully verifying the code has no errors, you MUST automatically update the `task.md` memory tracking file. 
- Explicitly mark completed items with `[x]` and move ongoing items to `[/]`.
- Document what was done and what the immediate next step is.
- **You do not need to wait for the user to explicitly ask you to "update the workplan". Do it autonomously before finishing your response.**
