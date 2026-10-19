# Discord Moderation Bot (discord.js v14)

A complete, English-language Discord Moderation Bot built with **Node.js** and **discord.js v14** using Slash Commands (`/`) and automatic local JSON storage (`data/moderation.json`).

---

## ✨ Features & Slash Commands

### Core Requested Commands
- **`/info [user]`** — Check detailed information about a user, including:
  - Server roles (sorted by hierarchy) & highest role
  - Server join date & Discord account creation date
  - Key server permissions (human-readable list)
  - Active warning count in the server
  - Mini avatar thumbnail on the embed
- **`/purge [user] [amount]`** — Delete a specific number (`1–100`) of recent messages sent by a specific user in the current channel.
- **`/warn [user] [reason]`** — Issue an official warning to a user, save it to the local database with a unique Warn ID, and send a DM embed to the user. **If the user's DMs are closed, the bot explicitly confirms in the response that the user was warned but could not be reached via DM.**
- **`/ban [user] [reason] [delete_days]`** — Ban a user from the server with a reason and send a DM notification beforehand. **If the user's DMs are closed, the bot explicitly confirms in the response that the user was banned but the DM could not be delivered.**

### Additional Moderation Commands Included
- **`/warnings [user]`** — View all active warnings for a user (including Warn IDs, Moderator, Timestamp, and Reason).
- **`/unwarn [user] [warn_id]`** — Remove a single warning from a user by its Warn ID.
- **`/clearwarns [user]`** — Clear all warnings for a user.
- **`/kick [user] [reason]`** — Kick a member from the server with DM notification and closed-DM fallback confirmation.
- **`/unban [user_id] [reason]`** — Unban a user by their Discord User ID.
- **`/timeout [user] [duration] [reason]`** — Timeout/mute a member (e.g., `10m`, `2h`, `1d`, `7d`) with DM notification and closed-DM fallback confirmation.
- **`/untimeout [user] [reason]`** — Remove an active timeout from a member.
- **`/lock [channel] [reason]`** — Lock a text channel so `@everyone` cannot send messages.
- **`/unlock [channel] [reason]`** — Unlock a locked text channel for `@everyone`.
- **`/slowmode [seconds] [channel]`** — Configure or disable (`0`) channel slowmode.
- **`/modlog [channel]`** — Configure or disable an automated moderation log channel where all moderation actions are logged.
- **`/help`** — View a complete list of all moderation commands.

---

## 🚀 Setup Instructions

### 1. Prerequisites
- **Node.js v18+** installed on your computer.
- A Discord Bot Application created at the [Discord Developer Portal](https://discord.com/developers/applications).
  - Under **Bot** settings, enable **Server Members Intent** (recommended for member lookups).
  - Invite the bot to your server with `bot` and `applications.commands` scopes, and permissions: `Kick Members`, `Ban Members`, `Manage Channels`, `Manage Messages`, `Moderate Members`, `Send Messages`, `Embed Links`, `Read Message History`.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=optional_server_id_for_instant_command_sync
```

### 3. Install Dependencies & Start the Bot
```bash
npm install
npm start
```
*(Slash commands are automatically registered when the bot starts, or you can run `npm run deploy` manually.)*
