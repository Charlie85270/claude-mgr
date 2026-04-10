# factor-echelon — OpenClaw Adapter

This adapter packages factor-echelon as an OpenClaw bundle.

## Install

```bash
# From the dist/openclaw directory:
bash install.sh

# Or specify a custom install directory:
OPENCLAW_INSTALL_DIR=~/my-workspace bash install.sh
```

## Use

```bash
openclaw start --config ~/.openclaw/workspace/factor-echelon/openclaw.json
```

## Bundle Structure

```
dist/openclaw/
├── openclaw.json          # OpenClaw config
├── install.sh             # Installer script
└── skill/                 # Full skill tree
    ├── archetypes/
    ├── themes/
    ├── advisory-board/
    ├── roster-composer/
    ├── theme-engine/
    ├── capabilities/
    └── protocols/
```

See the main project README for full documentation.
