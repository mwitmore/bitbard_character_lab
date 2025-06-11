# 🎭 Eliza Character Laboratory

**An advanced AI character development workspace built on the Eliza framework**

This repository serves as a comprehensive laboratory for creating, testing, and refining sophisticated AI agents with distinct personalities, behavioral patterns, and communication styles.

## 🌟 Current Characters

### Lady Macbeth (`@bbo_ladymacbeth`)
**Status: Active on Twitter** | **Behavioral Intelligence: Advanced**

A psychologically sophisticated agent embodying Shakespeare's Lady Macbeth with:
- **Authentic Early Modern English** speech patterns  
- **Strategic ambition** and persuasive rhetoric
- **Anti-repetition intelligence** preventing formulaic responses
- **Temporal awareness** with night-active scheduling (18:00-06:00 UTC)
- **Memory-based interaction** tracking to prevent spam
- **Advanced posting constraints** with daily limits and cooldown periods

**Live Performance**: Successfully posting contextual responses and engaging with Twitter users while maintaining character authenticity.

## 🔬 Laboratory Features

### Character Development Tools
- **Speech Analysis Pipeline** - Extract linguistic patterns from source texts
- **Behavioral Protocol Engine** - Define complex personality rules and constraints  
- **Response Variation System** - Prevent repetitive AI patterns
- **Memory Architecture** - SQLite-based conversation tracking
- **RAG Knowledge Integration** - Character-specific knowledge bases
- **Template Testing Framework** - Validate character responses across scenarios

### Technical Infrastructure
- **Multi-platform Support** - Twitter, Discord, Direct chat interfaces
- **Database Integration** - SQLite with custom adapters
- **Plugin Architecture** - Modular character capabilities
- **Advanced Scheduling** - Time-aware posting and interaction patterns
- **Environment Management** - Secure credential and configuration handling

### Testing & Validation
- **Cue Response Testing** - Automated character validation across scenarios
- **Speech Pattern Analysis** - Linguistic authenticity verification  
- **Behavioral Consistency Checks** - Ensure character integrity over time
- **Performance Metrics** - Track engagement and character effectiveness

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ LTS
- pnpm package manager
- Twitter API credentials (for social media agents)

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd eliza-character-lab

# Install dependencies
pnpm install

# Build the project
cd agent && pnpm build
```

### Running a Character
```bash
# Start Lady Macbeth (example)
./start-ladymacbeth.sh

# Or use the generic launcher
./scripts/start-character.sh characters/your-character.json
```

## 📁 Project Structure

```
eliza-character-lab/
├── characters/           # Character definitions and configurations
│   ├── ladymacbethcopy.character.json
│   └── templates/       # Character templates for new agents
├── archives/            # Version control for character iterations
│   └── character-versions/
├── docs/               # Documentation and analysis
│   ├── speech-analysis/
│   └── behavioral-guides/
├── tests/              # Character testing and validation
│   ├── cue-validation/
│   └── performance-metrics/
├── scripts/            # Utility scripts for character management
└── packages/           # Extended Eliza framework components
```

## 🧪 Character Development Workflow

### 1. Character Analysis
- Extract speech patterns from source material
- Identify key personality traits and behavioral rules
- Define interaction constraints and preferences

### 2. Configuration Design  
- Create character JSON with personality, knowledge, and rules
- Set up behavioral protocols and response patterns
- Configure posting schedules and interaction limits

### 3. Testing & Refinement
- Run cue validation tests across diverse scenarios
- Analyze response patterns for authenticity
- Iterate on configuration based on performance

### 4. Deployment & Monitoring
- Deploy to chosen platforms (Twitter, Discord, etc.)
- Monitor real-world interactions and performance
- Continuous refinement based on live performance data

## 🎯 Character Templates

### Available Templates
- **Historical Figure** - For personalities from history/literature
- **Fictional Character** - For characters from media/books
- **Professional Persona** - For specialized knowledge agents
- **Creative Personality** - For artistic/creative agents

### Creating New Characters
1. Copy a template from `characters/templates/`
2. Customize personality, knowledge, and behavioral rules
3. Test with validation suite
4. Deploy and monitor

## 📊 Advanced Features

### Behavioral Intelligence
- **Anti-Question Protocol** - Prevents AI from echoing user words as questions
- **Response Rotation** - Ensures variety in similar situations  
- **Contextual Adaptation** - Adjusts responses based on conversation context
- **Memory Integration** - Uses past interactions to inform responses

### Social Media Integration
- **Platform-Specific Optimization** - Tailored for Twitter, Discord, etc.
- **Engagement Metrics** - Track likes, replies, mentions
- **Spam Prevention** - Intelligent rate limiting and interaction windows
- **Trend Awareness** - Respond to relevant social media trends

## 🔧 Technical Architecture

Built on the Eliza framework with custom enhancements:
- **Database Adapters** - SQLite for memory persistence
- **Client Plugins** - Twitter, Discord, Direct chat
- **Generation Engine** - Advanced text generation with character constraints
- **Plugin System** - Modular capabilities and integrations

## 📈 Performance Tracking

### Metrics
- Response authenticity scores
- Engagement rates (likes, replies, shares)  
- Character consistency over time
- User satisfaction and interaction quality

### Analytics
- Daily posting patterns and effectiveness
- Character development progression
- A/B testing for behavioral modifications

## 🤝 Contributing

This laboratory welcomes contributions:
- New character templates and configurations
- Behavioral analysis tools and techniques
- Platform integrations and plugins
- Testing frameworks and validation tools

## 📄 License

This project builds upon the Eliza framework. Please see individual component licenses for details.

## 🔗 Links

- **Live Agents**: [Lady Macbeth on Twitter](https://twitter.com/bbo_ladymacbeth)
- **Documentation**: See `docs/` directory for detailed guides
- **Original Eliza Framework**: [ElizaOS Project](https://github.com/elizaOS/eliza)

---

**Created with ❤️ for advancing AI character development and personality simulation**

# Eliza 🤖

<div align="center">
  <img src="./docs/static/img/eliza_banner.jpg" alt="Eliza Banner" width="100%" />
</div>

<div align="center">

📑 [Technical Report](https://arxiv.org/pdf/2501.06781) |  📖 [Documentation](https://elizaos.github.io/eliza/) | 🎯 [Examples](https://github.com/thejoven/awesome-eliza)

</div>

## 🌍 README Translations

[中文说明](i18n/readme/README_CN.md) | [日本語の説明](i18n/readme/README_JA.md) | [한국어 설명](i18n/readme/README_KOR.md) | [Persian](i18n/readme/README_FA.md) | [Français](i18n/readme/README_FR.md) | [Português](i18n/readme/README_PTBR.md) | [Türkçe](i18n/readme/README_TR.md) | [Русский](i18n/readme/README_RU.md) | [Español](i18n/readme/README_ES.md) | [Italiano](i18n/readme/README_IT.md) | [ไทย](i18n/readme/README_TH.md) | [Deutsch](i18n/readme/README_DE.md) | [Tiếng Việt](i18n/readme/README_VI.md) | [עִברִית](i18n/readme/README_HE.md) | [Tagalog](i18n/readme/README_TG.md) | [Polski](i18n/readme/README_PL.md) | [Arabic](i18n/readme/README_AR.md) | [Hungarian](i18n/readme/README_HU.md) | [Srpski](i18n/readme/README_RS.md) | [Română](i18n/readme/README_RO.md) | [Nederlands](i18n/readme/README_NL.md) | [Ελληνικά](i18n/readme/README_GR.md)

## 🚩 Overview

<div align="center">
  <img src="./docs/static/img/eliza_diagram.png" alt="Eliza Diagram" width="100%" />
</div>

## ✨ Features

- 🛠️ Full-featured Discord, X (Twitter) and Telegram connectors
- 🔗 Support for every model (Llama, Grok, OpenAI, Anthropic, Gemini, etc.)
- 👥 Multi-agent and room support
- 📚 Easily ingest and interact with your documents
- 💾 Retrievable memory and document store
- 🚀 Highly extensible - create your own actions and clients
- 📦 Just works!

## Video Tutorials

[AI Agent Dev School](https://www.youtube.com/watch?v=ArptLpQiKfI&list=PLx5pnFXdPTRzWla0RaOxALTSTnVq53fKL)

## 🎯 Use Cases

- 🤖 Chatbots
- 🕵️ Autonomous Agents
- 📈 Business Process Handling
- 🎮 Video Game NPCs
- 🧠 Trading

## 🚀 Quick Start

### Prerequisites

- [Python 2.7+](https://www.python.org/downloads/)
- [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [pnpm](https://pnpm.io/installation)

> **Note for Windows Users:** [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install-manual) is required.

### Use the Starter (Recommended for Agent Creation)

Full steps and documentation can be found in the [Eliza Starter Repository](https://github.com/elizaOS/eliza-starter).
```bash
git clone https://github.com/elizaos/eliza-starter.git
cd eliza-starter
cp .env.example .env
pnpm i && pnpm build && pnpm start
```

### Manually Start Eliza (Only recommended for plugin or platform development)

#### Checkout the latest release

```bash
# Clone the repository
git clone https://github.com/elizaos/eliza.git

# This project iterates fast, so we recommend checking out the latest release
git checkout $(git describe --tags --abbrev=0)
# If the above doesn't checkout the latest release, this should work:
# git checkout $(git describe --tags `git rev-list --tags --max-count=1`)
```

If you would like the sample character files too, then run this:
```bash
# Download characters submodule from the character repos
git submodule update --init
```

#### Edit the .env file

Copy .env.example to .env and fill in the appropriate values.

```
cp .env.example .env
```

Note: .env is optional. If you're planning to run multiple distinct agents, you can pass secrets through the character JSON

#### Start Eliza

```bash
pnpm i
pnpm build
pnpm start

# The project iterates fast, sometimes you need to clean the project if you are coming back to the project
pnpm clean
```

### Interact via Browser

Once the agent is running, you should see the message to run "pnpm start:client" at the end.

Open another terminal, move to the same directory, run the command below, then follow the URL to chat with your agent.

```bash
pnpm start:client
```

Then read the [Documentation](https://elizaos.github.io/eliza/) to learn how to customize your Eliza.

---

### Automatically Start Eliza

The start script provides an automated way to set up and run Eliza:

```bash
sh scripts/start.sh
```

For detailed instructions on using the start script, including character management and troubleshooting, see our [Start Script Guide](./docs/docs/guides/start-script.md).

> **Note**: The start script handles all dependencies, environment setup, and character management automatically.

---

### Modify Character

1. Open `packages/core/src/defaultCharacter.ts` to modify the default character. Uncomment and edit.

2. To load custom characters:
    - Use `pnpm start --characters="path/to/your/character.json"`
    - Multiple character files can be loaded simultaneously
3. Connect with X (Twitter)
    - change `"clients": []` to `"clients": ["twitter"]` in the character file to connect with X

---

### Add more plugins

1. run `npx elizaos plugins list` to get a list of available plugins or visit https://elizaos.github.io/registry/

2. run `npx elizaos plugins add @elizaos-plugins/plugin-NAME` to install the plugin into your instance

#### Additional Requirements

You may need to install Sharp. If you see an error when starting up, try installing it with the following command:

```
pnpm install --include=optional sharp
```

---

## Using Your Custom Plugins
Plugins that are not in the official registry for ElizaOS can be used as well. Here's how:

### Installation

1. Upload the custom plugin to the packages folder:

```
packages/
├─plugin-example/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts        # Main plugin entry
│   ├── actions/        # Custom actions
│   ├── providers/      # Data providers
│   ├── types.ts        # Type definitions
│   └── environment.ts  # Configuration
├── README.md
└── LICENSE
```

2. Add the custom plugin to your project's dependencies in the agent's package.json:

```json
{
  "dependencies": {
    "@elizaos/plugin-example": "workspace:*"
  }
}
```

3. Import the custom plugin to your agent's character.json

```json
  "plugins": [
    "@elizaos/plugin-example",
  ],
```

---

### Start Eliza with Gitpod

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/elizaos/eliza/tree/main)

---

### Deploy Eliza in one click

Use [Fleek](https://fleek.xyz/eliza/) to deploy Eliza in one click. This opens Eliza to non-developers and provides the following options to build your agent:
1. Start with a template
2. Build characterfile from scratch
3. Upload pre-made characterfile

Click [here](https://fleek.xyz/eliza/) to get started!

---

### Community & contact

- [GitHub Issues](https://github.com/elizaos/eliza/issues). Best for: bugs you encounter using Eliza, and feature proposals.
- [elizaOS Discord](https://discord.gg/elizaos). Best for: hanging out with the elizaOS technical community
- [DAO Discord](https://discord.gg/ai16z). Best for: hanging out with the larger non-technical community

## Citation

We now have a [paper](https://arxiv.org/pdf/2501.06781) you can cite for the Eliza OS:
```bibtex
@article{walters2025eliza,
  title={Eliza: A Web3 friendly AI Agent Operating System},
  author={Walters, Shaw and Gao, Sam and Nerd, Shakker and Da, Feng and Williams, Warren and Meng, Ting-Chien and Han, Hunter and He, Frank and Zhang, Allen and Wu, Ming and others},
  journal={arXiv preprint arXiv:2501.06781},
  year={2025}
}
```

## Contributors

<a href="https://github.com/elizaos/eliza/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=elizaos/eliza" alt="Eliza project contributors" />
</a>


## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=elizaos/eliza&type=Date)](https://star-history.com/#elizaos/eliza&Date)

## 🛠️ System Requirements

### Minimum Requirements
- CPU: Dual-core processor
- RAM: 4GB
- Storage: 1GB free space
- Internet connection: Broadband (1 Mbps+)

### Software Requirements
- Python 2.7+ (3.8+ recommended)
- Node.js 23+
- pnpm
- Git

### Optional Requirements
- GPU: For running local LLM models
- Additional storage: For document storage and memory
- Higher RAM: For running multiple agents

## 📁 Project Structure
```
eliza/
├── packages/
│   ├── core/           # Core Eliza functionality
│   ├── clients/        # Client implementations
│   └── actions/        # Custom actions
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── examples/          # Example implementations
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

### Types of Contributions
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🌍 Translations
- 🧪 Test improvements

### Code Style
- Follow the existing code style
- Add comments for complex logic
- Update documentation for changes
- Add tests for new features
