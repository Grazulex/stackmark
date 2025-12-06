<div align="center">

<img src="https://raw.githubusercontent.com/Grazulex/stackmark/main/logo.png" alt="StackMark Logo" width="120" />

# StackMark

### Docker Stack Management Made Simple
**Beautiful CLI • Zero Port Conflicts • Full Control**

[![npm version](https://img.shields.io/npm/v/@grazulex/stackmark.svg?style=flat-square&logo=npm&color=cb3837)](https://www.npmjs.com/package/@grazulex/stackmark)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Website](https://img.shields.io/badge/Website-stackmark.tech-8B5CF6?style=flat-square)](https://stackmark.tech)

**Manage multiple Docker Compose projects effortlessly. Automatic port allocation, interactive dashboard, and smart project templates—all from your terminal.**

[Website](https://stackmark.tech) • [Quick Start](#-quick-start) • [Features](#-features) • [Commands](#-commands) • [Templates](#-templates)

</div>

---

## ⚡ Quick Start

```bash
# Install globally
npm install -g @grazulex/stackmark

# Register your existing project
cd ~/Dev/my-project
stackmark add

# Start the stack
stackmark start

# Open interactive dashboard
stackmark dash
```

**That's it!** StackMark handles port conflicts automatically and provides a unified interface for all your Docker stacks.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔌 Automatic Port Allocation
No more port conflicts! StackMark automatically assigns unique ports to each stack starting from 9000.

</td>
<td width="50%">

### 📊 Interactive Dashboard
Real-time TUI with auto-refresh showing all your stacks, their status, and running containers.

</td>
</tr>
<tr>
<td>

### 🎯 Smart Auto-Detection
Run commands from any project directory—StackMark automatically detects which stack you're working with.

</td>
<td>

### 🏗️ Project Scaffolding
Generate docker-compose.yml with interactive templates for Laravel, Symfony, Node.js, WordPress, and more.

</td>
</tr>
<tr>
<td>

### 🌐 Hosts Management
Sync local domains (myapp.local) to /etc/hosts with a single command.

</td>
<td>

### 🎨 Beautiful Terminal UI
Colorful output, status indicators, and a modern CLI experience.

</td>
</tr>
</table>

---

## 🖥️ Commands

### `stackmark init`

Generate a new docker-compose.yml with interactive prompts.

```bash
cd ~/Dev/new-project
stackmark init
```

Select from templates (Laravel, Symfony, Node.js, etc.) or build a custom stack.

### `stackmark add [name]`

Register a stack in StackMark.

```bash
stackmark add                           # Use current directory
stackmark add myapp                     # With custom name
stackmark add myapp --path ~/Dev/myapp  # With specific path
stackmark add myapp --domain myapp.local # With local domain
```

### `stackmark start [name]`

Start a stack with automatic port management.

```bash
stackmark start                         # Auto-detect from current dir
stackmark start myapp                   # Start specific stack
stackmark start --no-override           # Use original ports
```

### `stackmark stop [name]`

Stop a running stack.

```bash
stackmark stop                          # Auto-detect
stackmark stop myapp                    # Stop specific stack
```

### `stackmark status [name]`

Show detailed stack status with container info.

```bash
stackmark status                        # Current directory stack
stackmark status myapp                  # Specific stack
stackmark status --all                  # All stacks
```

**Example output:**
```
🐳 Stack Status

  ● myapp running
    → http://localhost:9003
    Path: /home/user/Dev/myapp
    Other: db:9004, redis:9005
    └─ myapp_app: Up 5 minutes
    └─ myapp_db: Up 5 minutes
    └─ myapp_nginx: Up 5 minutes
```

### `stackmark list`

List all registered stacks with their status.

```bash
stackmark list
stackmark ls
```

**Example output:**
```
📦 Stacks

  ● myapp
    → http://localhost:9003
    /home/user/Dev/myapp

  ○ other-project
    → http://localhost:9007
    /home/user/Dev/other-project
```

### `stackmark dashboard`

Interactive dashboard with real-time updates.

```bash
stackmark dashboard
stackmark dash
```

**Features:**
- Auto-refresh every 2 seconds
- Running/stopped/partial status indicators
- Press **q** to quit

### `stackmark open [name]`

Open the stack's main URL in your browser.

```bash
stackmark open                          # Auto-detect
stackmark open myapp                    # Specific stack
```

### `stackmark restart [name]`

Restart a stack.

```bash
stackmark restart                       # Auto-detect
stackmark restart myapp                 # Specific stack
stackmark restart --no-override         # With original ports
```

### `stackmark logs [name]`

View stack logs.

```bash
stackmark logs                          # Auto-detect
stackmark logs myapp                    # Specific stack
stackmark logs -f                       # Follow mode
```

### `stackmark remove <name>`

Remove a registered stack.

```bash
stackmark remove myapp
stackmark rm myapp
```

### `stackmark hosts sync`

Sync local domains to /etc/hosts.

```bash
sudo stackmark hosts sync
```

---

## 🏗️ Templates

Generate complete Docker Compose configurations with `stackmark init`:

| Template | Stack |
|----------|-------|
| **Laravel** | PHP + Nginx + MySQL + Redis + Mailpit |
| **Symfony** | PHP + Nginx + PostgreSQL + Redis + Mailpit |
| **Node.js** | Node + PostgreSQL + Redis |
| **WordPress** | PHP + Nginx + MariaDB + Redis + Mailpit |
| **API** | PHP + Nginx + PostgreSQL + Redis |
| **Custom** | Choose your own services |

### Available Services

| Category | Services |
|----------|----------|
| **Runtime** | PHP (8.3, 8.2, 8.1), Node.js (22, 20, 18) |
| **Webserver** | Nginx |
| **Database** | MySQL, MariaDB, PostgreSQL |
| **Cache** | Redis, Memcached |
| **Tools** | Mailpit, MinIO (S3), phpMyAdmin |

---

## 🔌 Port Management

### How It Works

1. When you `stackmark add` a project, StackMark scans docker-compose.yml for port mappings
2. It allocates unique external ports starting from **9000**
3. When you `stackmark start`, it creates a temporary override file
4. Your original docker-compose.yml is **never modified**

### Example

**Original docker-compose.yml:**
```yaml
services:
  nginx:
    ports:
      - "80:80"
  db:
    ports:
      - "3306:3306"
```

**StackMark allocates:**
```
nginx: localhost:9003 → container:80
db:    localhost:9004 → container:3306
```

### Using Original Ports

Need to test with original ports? No problem:

```bash
stackmark start --no-override
```

---

## ⚙️ Configuration

Configuration is stored in `~/.stackmark/config.yml`:

```yaml
stacks:
  myapp:
    path: /home/user/Dev/myapp
    domains:
      - myapp.local
    portMappings:
      - service: nginx
        internal: 80
        external: 9003
      - service: db
        internal: 3306
        external: 9004
nextPort: 9010
```

---

## 🎯 Auto-Detection

Most commands auto-detect the stack when run from a project directory:

```bash
cd ~/Dev/myapp
stackmark start      # Starts myapp
stackmark logs -f    # Shows myapp logs
stackmark status     # Shows myapp status
```

Override auto-detection when needed:
```bash
stackmark status --all    # Show all stacks
stackmark start other     # Start a different stack
```

---

## 🚀 Installation

### npm (Recommended)

```bash
npm install -g @grazulex/stackmark
```

### npx (No install)

```bash
npx @grazulex/stackmark dash
```

### Verify Installation

```bash
stackmark --version
```

---

## 📊 Comparison

| Feature | StackMark | Docker Compose | Dockstation | Portainer |
|---------|-----------|----------------|-------------|-----------|
| **CLI-first** | ✅ | ✅ | ❌ | ❌ |
| **Auto Port Allocation** | ✅ | ❌ | ❌ | ❌ |
| **Project Templates** | ✅ | ❌ | ❌ | ⚠️ |
| **Multi-stack Dashboard** | ✅ | ❌ | ✅ | ✅ |
| **Zero Config** | ✅ | ⚠️ | ❌ | ❌ |
| **Auto-detection** | ✅ | ❌ | ❌ | ❌ |
| **Hosts Sync** | ✅ | ❌ | ❌ | ❌ |

---

## 🛠️ Troubleshooting

### Port Already in Use

Check which stacks are using ports:
```bash
stackmark status --all
```

Or use original ports:
```bash
stackmark start --no-override
```

### /etc/hosts Permission Denied

The hosts sync command requires sudo:
```bash
sudo stackmark hosts sync
```

### Stack Not Detected

Make sure you're in the project root (where docker-compose.yml is located) or specify the stack name.

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- 🐛 Bug reports
- ✨ Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions

---

## 📄 License

MIT © [Grazulex](https://github.com/Grazulex)

---

<div align="center">

**[🌐 Website](https://stackmark.tech)** •
**[📦 npm](https://www.npmjs.com/package/@grazulex/stackmark)** •
**[🐛 Issues](https://github.com/Grazulex/stackmark/issues)** •
**[💬 Discussions](https://github.com/Grazulex/stackmark/discussions)**

---

**Built with ❤️ for developers who juggle multiple Docker projects**

*Star this repo if StackMark simplifies your workflow!* ⭐

</div>
