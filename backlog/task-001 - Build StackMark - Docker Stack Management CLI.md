---
id: 1
title: Build StackMark - Docker Stack Management CLI
created_date: '2025-12-05T20:38:37.198Z'
updated_date: '2025-12-05T20:38:37.198Z'
status: In Progress
priority: high
milestone: v1.0
assignees:
  - Claude
labels:
  - feature
  - cli
  - docker
  - typescript
subtasks: []
dependencies: []
blocked_by: []
changelog:
  - timestamp: '2025-12-05T20:38:37.198Z'
    action: created
    details: Task created
    user: system
acceptance_criteria: []
---
A TypeScript CLI to manage Docker stacks in local development. Features include:
- Manual stack registration (add/remove) with name, path, and domains
- Stack operations: start, stop, restart, status, logs
- /etc/hosts management (auto-sync domains)
- Central config file at ~/.stackmark/config.yml (YAML format)
- Stack info: name, path, domains (basic for now)

Tech stack: TypeScript, Commander.js, Dockerode, YAML, Chalk
