# StackMark

> Docker stack management CLI for local development

StackMark simplifies managing multiple Docker Compose projects on your local machine. It handles port conflicts automatically, provides a unified interface for all your stacks, and includes an interactive dashboard.

## Features

- **Stack Registration** - Register and manage multiple Docker Compose projects
- **Automatic Port Allocation** - No more port conflicts between stacks
- **Auto-detection** - Commands detect the current directory's stack automatically
- **Interactive Dashboard** - Real-time TUI with auto-refresh
- **Scaffolding** - Generate docker-compose.yml with templates (Laravel, Symfony, Node.js, etc.)
- **Hosts Management** - Sync local domains to /etc/hosts

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/stackmark.git
cd stackmark

# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link
```

## Quick Start

```bash
# Register an existing project
cd ~/Dev/my-project
stackmark add

# Start the stack
stackmark start

# View status
stackmark status

# Open in browser
stackmark open

# Interactive dashboard
stackmark dash
```

## Commands

### `stackmark init`

Generate a new docker-compose.yml with interactive prompts.

```bash
cd ~/Dev/new-project
stackmark init
```

**Templates disponibles:**
- **Laravel** - PHP + Nginx + MySQL + Redis + Mailpit
- **Symfony** - PHP + Nginx + PostgreSQL + Redis + Mailpit
- **Node.js** - Node + PostgreSQL + Redis
- **WordPress** - PHP + Nginx + MariaDB + Redis + Mailpit
- **API** - PHP + Nginx + PostgreSQL + Redis
- **Custom** - Choose your own services

**Services disponibles:**
| Category | Services |
|----------|----------|
| Runtime | PHP (8.3, 8.2, 8.1), Node.js (22, 20, 18) |
| Webserver | Nginx |
| Database | MySQL, MariaDB, PostgreSQL |
| Cache | Redis, Memcached |
| Tools | Mailpit, MinIO (S3), phpMyAdmin |

---

### `stackmark add [name]`

Register a stack in StackMark.

```bash
# In the project directory (uses directory name)
stackmark add

# With custom name
stackmark add myapp

# With path
stackmark add myapp --path ~/Dev/my-project

# With local domain
stackmark add myapp --domain myapp.local
```

**Options:**
- `-p, --path <path>` - Path to docker-compose project
- `-d, --domain <domain...>` - Local domains (e.g., myapp.local)

---

### `stackmark remove <name>`

Remove a registered stack.

```bash
stackmark remove myapp
# or
stackmark rm myapp
```

---

### `stackmark list`

List all registered stacks with their status and URLs.

```bash
stackmark list
# or
stackmark ls
```

**Output:**
```
📦 Stacks

  ● myapp
    → http://localhost:9003
    /home/user/Dev/myapp
    Other: db:9004, redis:9005

  ○ other-project
    → http://localhost:9007
    /home/user/Dev/other-project
```

---

### `stackmark start [name]`

Start a stack.

```bash
# In project directory (auto-detect)
stackmark start

# By name
stackmark start myapp

# With original ports (no override)
stackmark start myapp --no-override
```

**Options:**
- `--no-override` - Use original ports from docker-compose.yml instead of allocated ports

---

### `stackmark stop [name]`

Stop a stack.

```bash
stackmark stop
stackmark stop myapp
```

---

### `stackmark restart [name]`

Restart a stack.

```bash
stackmark restart
stackmark restart myapp
stackmark restart myapp --no-override
```

**Options:**
- `--no-override` - Use original ports from docker-compose.yml

---

### `stackmark status [name]`

Show detailed stack status.

```bash
# Current directory stack
stackmark status

# Specific stack
stackmark status myapp

# All stacks
stackmark status --all
```

**Options:**
- `-a, --all` - Show all stacks (ignore auto-detection)

**Output:**
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

---

### `stackmark logs [name]`

View stack logs.

```bash
stackmark logs
stackmark logs myapp
stackmark logs -f        # Follow mode
```

**Options:**
- `-f, --follow` - Follow log output

---

### `stackmark open [name]`

Open the stack's main URL in the browser.

```bash
stackmark open
stackmark open myapp
```

---

### `stackmark dashboard`

Interactive dashboard with real-time status updates.

```bash
stackmark dashboard
# or
stackmark dash
```

**Features:**
- Auto-refresh every 2 seconds
- Shows running/stopped/partial status
- Displays actual ports (handles --no-override correctly)
- Press **q** to quit

---

### `stackmark hosts sync`

Synchronize /etc/hosts with stack domains.

```bash
sudo stackmark hosts sync
```

This adds entries like `127.0.0.1 myapp.local` for stacks with configured domains.

---

## Port Management

StackMark automatically allocates ports to avoid conflicts between stacks.

### How it works

1. When you `stackmark add` a project, StackMark scans the docker-compose.yml for port mappings
2. It allocates new external ports starting from **9000**
3. When you `stackmark start`, it creates a temporary override file with the new ports
4. The original docker-compose.yml is **never modified**

### Example

Original `docker-compose.yml`:
```yaml
services:
  nginx:
    ports:
      - "80:80"
  db:
    ports:
      - "3306:3306"
```

StackMark allocates:
```
nginx: localhost:9003 → :80
db: localhost:9004 → :3306
```

### Using Original Ports

If you need to test with original ports:

```bash
stackmark start --no-override
```

The `status` and `list` commands will show the **actual running ports**, whether override or original.

---

## Configuration

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

## Auto-detection

Most commands auto-detect the stack when run from a project directory:

```bash
cd ~/Dev/myapp
stackmark start      # Starts myapp
stackmark logs -f    # Shows myapp logs
stackmark status     # Shows myapp status
```

To override auto-detection:
```bash
stackmark status --all    # Show all stacks
stackmark start other     # Start a different stack
```

---

## Examples

### Setting up a new Laravel project

```bash
# Create directory
mkdir ~/Dev/my-laravel && cd ~/Dev/my-laravel

# Generate docker-compose.yml
stackmark init
# Select "Laravel" template

# Register the stack
stackmark add

# Start
stackmark start

# Check status
stackmark dash
```

### Managing multiple projects

```bash
# Start multiple stacks
stackmark start project-a
stackmark start project-b
stackmark start project-c

# View all in dashboard
stackmark dash

# Stop all
stackmark stop project-a
stackmark stop project-b
stackmark stop project-c
```

### Testing with original ports

```bash
# Stop the stack first
stackmark stop myapp

# Start with original ports
stackmark start myapp --no-override

# Verify ports
stackmark status myapp
```

---

## Troubleshooting

### Port already in use

If you see port conflicts, make sure no other stack is using the same allocated ports:

```bash
stackmark status --all
```

Or use `--no-override` to use original ports (ensure they're free).

### /etc/hosts permission denied

The `hosts sync` command requires sudo:

```bash
sudo stackmark hosts sync
```

### Stack not detected

Make sure you're in the project root directory (where docker-compose.yml is located) or specify the stack name explicitly.

---

## License

MIT
