# SmartSupport AI

Customer support dashboard integrating Next.js, Typesafe Jev AI, and Telegram.

## Overview

SmartSupport AI is a prototype dashboard built to automate incoming support tickets. It uses LLMs to classify requests and draft responses based on a provided Knowledge Base.

### Features

- **Triage**: Uses Typesafe Jev AI to categorize incoming tickets (Billing, Technical, Account, Spam).
- **Auto-Resolution**: Automatically closes tickets identified as Spam or Offtopic.
- **Copilot Drafts**: Generates response drafts using Deepseek/Groq referenced against a dynamic FAQ.
- **Telegram Integration**: Receives client messages directly from a Telegram bot and routes them to the dashboard.
- **Dashboard UI**: Next.js-based interface for managing tickets.

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI Integration**: Typesafe SDK (Jev AI), Deepseek/Groq
- **Bot**: Telegraf

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mukh4w/smartsupport-ai-mvp.git
   cd ai-support-mvp
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your `TELEGRAM_BOT_TOKEN`, `TYPESAFE_API_KEY`, and LLM keys.

4. Run the development server:
   ```bash
   bun run dev
   ```

5. Start the Telegram bot (in a separate terminal):
   ```bash
   bun run telegram-bot.ts
   ```

## Architecture Flow

1. Client sends a message to the Telegram bot.
2. `telegram-bot.ts` forwards the payload to `/api/tickets`.
3. The API categorizes the intent and urgency using Jev AI.
4. The ticket populates in the UI; spam is closed automatically.
5. For open tickets, the AI Copilot drafts a response utilizing the Knowledge Base.
