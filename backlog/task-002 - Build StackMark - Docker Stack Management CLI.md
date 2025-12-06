---
id: 2
title: Build StackMark - Docker Stack Management CLI
created_date: '2025-12-05T20:39:37.378Z'
updated_date: '2025-12-05T20:39:37.378Z'
status: In Progress
priority: high
assignees: []
labels:
  - cli
  - docker
  - typescript
subtasks: []
dependencies: []
blocked_by: []
changelog:
  - timestamp: '2025-12-05T20:39:37.378Z'
    action: created
    details: Task created
    user: system
acceptance_criteria: []
---
A TypeScript CLI to manage Docker stacks in local development.

## Features
- Manual stack registration (add/remove) with name, path, and domains
- Stack operations: start, stop, restart, status, logs
- /etc/hosts management (auto-sync domains)
- Central config file at ~/.stackmark/config.yml (YAML format)
- Stack info: name, path, domains

## Tech Stack
TypeScript, Commander.js, Dockerode, YAML, Chalk

## Commands
- stackmark add <name> --path <path> [--domain <domain>]
- stackmark remove <name>
- stackmark list
- stackmark start/stop/restart <name>
- stackmark logs <name> [-f]
- stackmark status [name]
- stackmark hosts sync
