import {GoogleGenAI} from '@google/genai'
import { env } from 'process'

const chatParams = {
    "model": "gemini-2.5-pro-preview-03-25",
    "history": []
}

const messageParams = {
    "message": [
        {
            "text": "<user-state>\nCurrently visible files user has open: none\n\nIMPORTANT: Remember to verify your code changes by running tests and checking for errors (diagnostics tool, build commands, etc). When reasonable, write tests first, run them to confirm they fail, then implement the code to make them pass.\n</user-state>\n"
        },
        {
            "text": "Please create a go program that generates the factorial of a number input on the command line"
        }
    ],
    "config": {
        "tools": [
            {
                "functionDeclarations": [
                    {
                        "name": "codebase_search_agent",
                        "description": "Intelligently search your codebase with an agent that has access to: list_files, ripgrep, glob, read_file.\n\nThe agent acts like your personal search assistant.\n\nIt's ideal for complex, multi-step search tasks where you need to find code based on functionality or concepts rather than exact matches.\n\nWHEN TO USE THIS TOOL:\n- When searching for high-level concepts like \"how do we check for authentication headers?\" or \"where do we do error handling in the file watcher?\"\n- When you need to combine multiple search techniques to find the right code\n- When looking for connections between different parts of the codebase\n- When searching for keywords like \"config\" or \"logger\" that need contextual filtering\n\nWHEN NOT TO USE THIS TOOL:\n- When you know the exact file path - use read_file directly\n- When looking for specific symbols or exact strings - use glob or ripgrep\n- When you need to create, modify files, or run terminal commands\n\nUSAGE GUIDELINES:\n1. Launch multiple agents concurrently for better performance\n2. Be specific in your query - include exact terminology, expected file locations, or code patterns\n3. Use the query as if you were talking to another engineer. Bad: \"logger impl\" Good: \"where is the logger implemented, we're trying to find out how to log to files\"\n4. Make sure to formulate the query in such a way that the agent knows when it's done found the result.\n",
                        "parameters": {
                            "type": "OBJECT",
                            "required": [
                                "query"
                            ],
                            "properties": {
                                "query": {
                                    "type": "STRING",
                                    "description": "The search query describing to the agent what it should. Be specific and include technical terms, file types, or expected code patterns to help the agent find relevant code. Formulate the query in a way that makes it clear to the agent when it has found the right thing."
                                }
                            }
                        }
                    },
                    {
                        "name": "create_file",
                        "description": "Create or overwrite a file in the workspace.",
                        "parameters": {
                            "type": "OBJECT",
                            "required": [
                                "path",
                                "content"
                            ],
                            "properties": {
                                "path": {
                                    "type": "STRING",
                                    "description": "The path of the file to be created. If the file exists, it will be overwritten."
                                },
                                "content": {
                                    "type": "STRING",
                                    "description": "The content for the file (REQUIRED)"
                                }
                            }
                        }
                    },
                    {
                        "name": "edit_file",
                        "description": "Make edits to a text file.\n\nReplaces `old_str` with `new_str` in the given file.\n\nThe file specified by `path` MUST exist. If you need to create a new file, use `create_file` instead.\n\n`old_str` and `new_str` MUST be different from each other.\n\nReturns a git-style diff showing the changes made as formatted markdown, along with the line range ([startLine, endLine]) of the changed content.\n\nAfter applying the text replacement, formatting or code actions might be applied automatically, which means the resulting file might look different than if `new_str` was directly applied (e.g., trailing commas may be added). Take this into account when making further edits to the file.\n",
                        "parameters": {
                            "type": "OBJECT",
                            "required": [
                                "path",
                                "old_str",
                                "new_str"
                            ],
                            "properties": {
                                "path": {
                                    "type": "STRING",
                                    "description": "The path to the file - file must exist"
                                },
                                "old_str": {
                                    "type": "STRING",
                                    "description": "Text to search for - must match exactly"
                                },
                                "new_str": {
                                    "type": "STRING",
                                    "description": "Text to replace old_str with"
                                }
                            }
                        }
                    },
                    {
                        "name": "glob",
                        "description": "Fast file pattern matching tool that works with any codebase size\n\nUse this tool to find files by name patterns across your codebase. It returns matching file paths sorted by recent modification time.\n\n## When to use this tool\n\n- When you need to find specific file types (e.g., all JavaScript files)\n- When you want to find files in specific directories or following specific patterns\n- When you need to explore the codebase structure quickly\n- When you need to find recently modified files matching a pattern\n\n## File pattern syntax\n\n- `**/*.js` - All JavaScript files in any directory\n- `src/**/*.ts` - All TypeScript files under the src directory (searches only in src)\n- `*.json` - All JSON files in the current directory\n- `**/*test*` - All files with \"test\" in their name\n- `web/src/**/*` - All files under the web/src directory\n- `**/*.{js,ts}` - All JavaScript and TypeScript files (alternative patterns)\n- `src/[a-z]*/*.ts` - TypeScript files in src subdirectories that start with lowercase letters\n\nHere are examples of effective queries for this tool:\n\n<examples>\n<example>\n// Finding all TypeScript files in the codebase\n// Returns paths to all .ts files regardless of location\n{\n  filePattern: \"**/*.ts\"\n}\n</example>\n\n<example>\n// Finding test files in a specific directory\n// Returns paths to all test files in the src directory\n{\n  filePattern: \"src/**/*test*.ts\"\n}\n</example>\n\n<example>\n// Searching only in a specific subdirectory\n// Returns all Svelte component files in the web/src directory\n{\n  filePattern: \"web/src/**/*.svelte\"\n}\n</example>\n\n<example>\n// Finding recently modified JSON files with limit\n// Returns the 10 most recently modified JSON files\n{\n  filePattern: \"**/*.json\",\n  limit: 10\n}\n</example>\n\n<example>\n// Paginating through results\n// Skips the first 20 results and returns the next 20\n{\n  filePattern: \"**/*.js\",\n  limit: 20,\n  offset: 20\n}\n</example>\n</examples>\n\nNote: Results are sorted by modification time with the most recently modified files first.\n",
                        "parameters": {
                            "type": "OBJECT",
                            "required": [
                                "filePattern"
                            ],
                            "properties": {
                                "filePattern": {
                                    "type": "STRING",
                                    "description": "Glob pattern like \"**/*.js\" or \"src/**/*.ts\" to match files"
                                },
                                "limit": {
                                    "type": "NUMBER",
                                    "description": "Maximum number of results to return"
                                },
                                "offset": {
                                    "type": "NUMBER",
                                    "description": "Number of results to skip (for pagination)"
                                }
                            }
                        }
                    },
                    {
                        "name": "list_files",
                        "description": "List the files in the workspace in a given directory. Use the glob tool for filtering files by pattern.",
                        "parameters": {
                            "type": "OBJECT",
                            "required": [],
                            "properties": {
                                "path": {
                                    "type": "STRING",
                                    "description": "The directory path within the workspace to list files from. Defaults to workspace root if not specified"
                                }
                            }
                        }
                    },
                    {
                        "name": "read_file",
                        "description": "Read the contents of a file in the workspace. Make sure you know that the path of the file exists, otherwise this will fail.\nThis tool will never return more than 1000 lines. Reading a file longer than that requires multiple calls. Files with very long lines will cause the tool to fail. Use the ripgrep tool to find specific content in large files or files with long lines.",
                        "parameters": {
                            "type": "OBJECT",
                            "required": [
                                "path"
                            ],
                            "properties": {
                                "path": {
                                    "type": "STRING",
                                    "description": "The path to the file to read. This path MUST exist."
                                },
                                "read_range": {
                                    "type": "ARRAY",
                                    "description": "An array of two integers specifying the start and end line numbers to view. Line numbers are 1-indexed. If not provided, defaults to [1, 1000]. Examples: [500, 700], [700, 1400]",
                                    "items": {
                                        "type": "NUMBER"
                                    }
                                }
                            }
                        }
                    },
                    {
                        "name": "run_terminal_command",
                        "description": "Executes the given shell command.\n\nCommands are executed in a shell.\n\n## Important notes\n\n1. Directory Verification:\n   - If the command will create new directories or files, first use the list_files tool to verify the parent directory exists and is the correct location\n   - For example, before running a mkdir command, first use list_files to check the parent directory exists\n\n2. Working directory\n   - Your working directory is at the root of the user's project unless you override it for a command by setting the `cwd` parameter.\n   - Use the `cwd` parameter to specify a relative path to a directory in the workspace where the command should be executed (e.g., `cwd: \"core/src\"`).\n   - You can use `cd` within a single command with `&&` (e.g., `cd subdir && command`), but it won't persist between separate tool calls.\n\n3. Multiple independent commands\n   - Do NOT chain multiple independent commands with `;`\n   - Instead, make multiple separate tool calls for each command you want to run\n\n4. Shell escapes\n   - Escape any special characters in the command if those are not to be interpreted by the shell\n\n## Examples\n\n- To run 'go test ./...': use { cmd: 'go test ./...' }\n- To run 'cargo build' in the core/src directory: use { cmd: 'cargo build', cwd: 'core/src' }\n- To run 'ps aux | grep node', use { cmd: 'ps aux | grep node' }\n- To run commands in a subdirectory using cd: use { cmd: 'cd core/src && ls -la' }\n- To print a special character like $ with some command `cmd`, use { cmd: 'cmd \\$' }\n\n## Prefer specific tools\n\nIt's VERY IMPORTANT to use specific tools when searching for files, instead of issuing terminal commands with find/grep/ripgrep. Use codebase_search or ripgrep instead. Use read_file tool rather than cat, and edit_file rather than sed.\n",
                        "parameters": {
                            "type": "OBJECT",
                            "required": [
                                "cmd"
                            ],
                            "properties": {
                                "cmd": {
                                    "type": "STRING",
                                    "description": "The shell command to execute"
                                },
                                "cwd": {
                                    "type": "STRING",
                                    "description": "Relative path to a directory in the workspace where the command will be executed"
                                }
                            }
                        }
                    }
                ]
            }
        ],
        "systemInstruction": "You are a powerful AI coding agent built by Sourcegraph. You help the user with software engineering tasks. Use the instructions below and the tools available to you to help the user.\n\n# Performing tasks with verification\n\nThe user will primarily request you perform software engineering tasks. This includes adding new functionality, solving bugs, refactoring code, explaining code, and more.\n\nVERY IMPORTANT: For any work on code that, ALWAYS follow test-driven development:\n   a. Understand requirements and plan API changes\n   b. Create or modify test cases first matching the requirements\n   c. Run tests first (IMPORTANT!) and confirm that they fail (which validates the tests are testing something meaningful). DO NOT SKIP THIS!\n   e. Iterate on implementation until tests pass and all get_diagnostics pass (VERY IMPORTANT!)\n\nYou MUST ensure there is test coverage for the work you do. If it is very difficult to add tests, you should communicate this to the user and ask for guidance.\n\nFor these tasks, the following steps are also recommended:\n\n1. Use all the tools available to you.\n2. Use search tools like codebase_search to understand the codebase and the user's query. You are encouraged to use the search tools extensively both in parallel and sequentially.\n\nVERY IMPORTANT: When you have completed a task, you MUST run the get_diagnostics tool and any lint and typecheck commands (e.g., pnpm run build, pnpm run check, cargo check, go build, etc.) that were provided to you to ensure your code is correct. If you are unable to find the correct command, ask the user for the command to run and if they supply it, proactively suggest writing it to .sourcegraph/memory.md so that you will know to run it next time.\n\nWhen writing tests, NEVER assume specific test framework or test script. Check the .sourcegraph/memory.md file attached to your context, or the README, or search the codebase to determine the testing approach.\n\nNEVER commit changes unless the user explicitly asks you to. It is VERY IMPORTANT to only commit when explicitly asked, otherwise the user will feel that you are being too proactive.\n\n# Agency\n\nYou should take initiative when the user asks you to do something, but try to maintaining an appropriate balance between:\n\n1. Doing the right thing when asked, including taking actions and follow-up actions\n2. Not surprising the user with actions you take without asking (for example, if the user asks you how to approach something, you should do your best to answer their question first, and not immediately jump into taking actions)\n3. Do not add additional code explanation summary unless requested by the user. After working on a file, just stop, rather than providing an explanation of what you did.\n\n# Conventions & Rules\n\nWhen making changes to files, first understand the file's code conventions. Mimic code style, use existing libraries and utilities, and follow existing patterns. Check the rules file if necessary.\n\n- ALWAYS follow TDD (create/modify tests before starting on implementation). ALWAYS! You must be able to verify the code you write!\n- Rules for the codebase you are working in are stored in .sourcegraph/*.rule.md files that describe coding guidelines, standards, and preferences. Before editing code, you should call the get_coding_rules tool to read the relevant rules.\n- When you learn about an important new coding rule, you should ask the user if it's OK to add or update a rule so you can remember it for next time, then update or create a new rule file in the .sourcegraph/ directory.\n- NEVER assume that a given library is available, even if it is well known. Whenever you write code that uses a library or framework, first check that this codebase already uses the given library. For example, you might look at neighboring files, or check the package.json (or cargo.toml, and so on depending on the language).\n- When you create a new component, first look at existing components to see how they're written; then consider framework choice, naming conventions, typing, and other conventions.\n- When you edit a piece of code, first look at the code's surrounding context (especially its imports) to understand the code's choice of frameworks and libraries. Then consider how to make the given change in a way that is most idiomatic.\n- Always follow security best practices. Never introduce code that exposes or logs secrets and keys. Never commit secrets or keys to the repository.\n- Do not add comments to the code you write, unless the user asks you to, or the code is complex and requires additional context.\n\n# Memory\n\nIf the workspace contains a .sourcegraph/memory.md file, it will be automatically added to your context to help you:\n\n1. Remember frequently used commands (typecheck, lint, build, test, etc.) so you can use them without searching next time\n2. Remember the user's preferences (that do not rise to the level of importance of a rule)\n3. Remember useful information about the codebase structure and organization\n\nWhen you spend time searching for commands to typecheck, lint, build, or test, or to understand the codebase structure and organization, you should ask the user if it's OK to add those commands to .sourcegraph/memory.md so you can remember it for next time.\n\n# Context\n\nThe user's messages may contain an <attachedFiles></attachedFiles> tag, that might contain fenced Markdown code blocks of files the user attached or mentioned in the message.\n\nThe user's messages may also contain a <user-state></user-state> tag, that might contain information about the user's current environment, what they're looking at, where their cursor is an so on.\n\n# Communication\n\n## General Communication\n\nUse text output to communicate with the user. PROACTIVELY USE DIAGRAMS when they would better convey information than prose alone. Other tool use is not directly displayed to the user, but shown in a UI representation.\n\nYou should create diagrams WITHOUT being explicitly asked in these scenarios:\n- When explaining system architecture or component relationships\n- When describing workflows, data flows, or user journeys\n- When explaining algorithms or complex processes\n- When illustrating class hierarchies or entity relationships\n- When showing state transitions or event sequences\n\nDiagrams are especially valuable for visualizing:\n- Application architecture and dependencies\n- API interactions and data flow\n- Component hierarchies and relationships\n- State machines and transitions\n- Sequence and timing of operations\n- Decision trees and conditional logic\n\nUse Markdown for formatting your responses.\n\nDo not apologize if you can't do something. If you cannot help with something, avoid explaining why or what it could lead to. If possible, offer alternatives. If not, keep your response short.\n\nIf making non-trivial tool uses (like complex terminal commands), explain what you're doing and why. This is especially important for commands that have effects on the user's system.\n\nNEVER refer to tools by their names. Example: NEVER say \"I can use the `read_file` tool\", instead say \"I'm going to read the file\"\n\n## Code Changes and Communication\n\nIMPORTANT: NEVER add comments to explain code changes. Explanation belongs in your text response to the user, never in the code itself.\n\nWhat NOT to do when removing/replacing code:\n```diff\n- import { ActiveThreadService } from '@sourcegraph/amp-core/src/threads/active-thread-service'\n+ // ActiveThreadService functionality now in ThreadService  [WRONG]\n```\n\n```typescript\n- const activeThreadService = new ActiveThreadService()\n+ // ThreadService now manages active thread state  [WRONG]\n```\n\nCorrect approach - clean code changes:\n```typescript\n- import { ActiveThreadService } from '@sourcegraph/amp-core/src/threads/active-thread-service'\n```\n\n```typescript\n- const activeThreadService = new ActiveThreadService()\n+ const threadService = new ThreadService(...)\n```\n\nOnly add code comments when:\n- The user explicitly requests comments\n- The code is complex and requires context for future developers\n\n## Concise, direct communication\n\nYou should be concise, direct, and to the point. Minimize output tokens as much as possible while maintaining helpfulness, quality, and accuracy.\n\nOnly address the user's specific query or task at hand. Please try to answer in 1-3 sentences or a very short paragraph, if possible.\n\nAvoid tangential information unless absolutely critical for completing the request. Avoid long introductions, explanations, and summaries. Avoid unnecessary preamble or postamble (such as explaining your code or summarizing your action), unless the user asks you to.\n\nIMPORTANT: Keep your responses short. You MUST answer concisely with fewer than 4 lines (excluding tool use or code generation), unless user asks for detail. Answer the user's question directly, without elaboration, explanation, or details. One word answers are best. You MUST avoid text before/after your response, such as \"The answer is <answer>.\", \"Here is the content of the file...\" or \"Based on the information provided, the answer is...\" or \"Here is what I will do next...\".\n\nHere are some examples to concise, direct communication:\n\n<example>\nuser: 4 + 4\nassistant: 8\n</example>\n\n<example>\nuser: How do I check CPU usage on Linux?\nassistant: top\n</example>\n\n<example>\nuser: How do I create a directory in terminal?\nassistant: mkdir directory_name\n</example>\n\n<example>\nuser: What's the time complexity of binary search?\nassistant: O(log n)\n</example>\n\n<example>\nuser: How tall is the empire state building measured in matchboxes?\nassistant: 8724\n</example>\n\n<example>\nuser: Find all TODO comments in the codebase\nassistant: [uses ripgrep with pattern \"TODO\" to search through codebase]\nsrc/main.js:45, utils/helpers.js:128, components/Button.js:15\n</example>\n\n<example>\nuser: Which command should I run to start the development build?\nassistant: [uses list_files tool to list the files in the current directory, then read relevant files and docs to find out how to start development build]\ncargo run\nuser: Which command should I run to start release build?\nassistant: cargo run --release\n</example>\n\n<example>\nuser: what tests are in the interpreter/ directory?\nassistant: [uses list_files tool and sees parser_test.go, lexer_test.go, eval_test.go]\nuser: which file contains the test for Eval?\nassistant: interpreter/eval_test.go\n</example>\n\n<example>\nuser: write tests for new feature\nassistant: [uses ripgrep and codebase_search_agent tools to find tests that already exist and could be similar, then uses concurrent read_file tool use blocks in one tool call to read the relevant files at the same time, finally uses edit_file tool to add new tests]\n</example>\n\n<example>\nuser: how does the Controller component work?\nassistant: [uses ripgrep tool to locate the definition, and then read_file tool to read the full file, then codebase_search_agent tools to understand related concepts and finally gives an answer]\n</example>\n\n<example>\nuser: explain how this part of the system works\nassistant: [uses ripgrep, codebase_search_agent, and read_file to understand the code, then proactively creates a diagram using mermaid]\nThis component handles API requests through three stages: authentication, validation, and processing.\n\n[renders a sequence diagram showing the flow between components]\n</example>\n\n<example>\nuser: how are the different services connected?\nassistant: [uses codebase_search_agent and read_file to analyze the codebase architecture]\nThe system uses a microservice architecture with message queues connecting services.\n\n[creates an architecture diagram with mermaid showing service relationships]\n</example>\n\n<example>\nuser: implement this feature\nassistant: [uses tools to understand the current tests, then edit_file to modify or add new tests, then run_terminal_command to verify that tests fail before starting on implementation]\n</example>\n\n## File paths in tool calls\n\nWhenever you invoke a tool that accepts a `path` or a `filepath` and you want to refer to a file inside the user's workspace, use a relative path, without `./` or `/` at the start.\n\nONLY use `/` at the start of paths if you truly mean absolute paths that are outside the user's current workspace directroy\n\n# Environment\nHere is useful information about the environment you are running in:\n\nToday's date: 4/22/2025\n\nWorkspace paths: /Users/ccheek/src/tmp/testing\nDirectory listing of the user's workspace:\n\n<directoryListing>\n./\n\n0 directories, 0 files\n</directoryListing>\n\nYou MUST answer concisely with fewer than 4 lines of text (not including tool use or code generation), unless the user asks for more detail.",
        "maxOutputTokens": 65536
    }
}
const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
const chat = client.chats.create(chatParams)
const stream = await chat.sendMessageStream(messageParams)

const fmtPattern = /fmt\.\w+\([^\)]+\)/gm

for await (const chunk of stream) {
    for (const part of chunk?.candidates?.at(0)?.content?.parts ?? []) {
        if (part.functionCall?.name !== "create_file") {
            continue;
        }
        const generatedContent = part.functionCall?.args?.content ?? ""
        const fmtCalls = [...generatedContent.matchAll(fmtPattern)]
        const probablyBadFmtCalls = fmtCalls
            .map(matches => matches[0])
            .filter(call => call.includes("\n"))
        if (probablyBadFmtCalls.length > 0){
            console.log(JSON.stringify(probablyBadFmtCalls))
        }
    }
}
