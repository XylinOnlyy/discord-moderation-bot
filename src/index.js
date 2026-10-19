require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  ActivityType,
} = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token) {
  console.error('❌ Missing DISCORD_TOKEN in your .env file! Please copy .env.example to .env and fill in your bot token.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
  ],
});

client.commands = new Collection();
const commandsPayload = [];

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commandsPayload.push(command.data.toJSON());
  } else {
    console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag} (${readyClient.user.id})`);
  readyClient.user.setActivity('/help | Moderation System', { type: ActivityType.Watching });

  try {
    const rest = new REST().setToken(token);
    const appId = clientId || readyClient.user.id;

    if (guildId && guildId.trim() !== '') {
      await rest.put(Routes.applicationGuildCommands(appId, guildId.trim()), {
        body: commandsPayload,
      });
      console.log(`⚡ Successfully synced ${commandsPayload.length} slash commands to guild ${guildId.trim()}.`);
    } else {
      await rest.put(Routes.applicationCommands(appId), {
        body: commandsPayload,
      });
      console.log(`🌍 Successfully synced ${commandsPayload.length} global slash commands.`);
    }
  } catch (err) {
    console.error('⚠️ Failed to auto-sync slash commands on startup:', err.message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.inGuild()) {
    return interaction.reply({
      content: '❌ Moderation commands can only be used inside a server.',
      ephemeral: true,
    });
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[Error executing /${interaction.commandName}]:`, error);
    const errorMessage = {
      content: '❌ An unexpected error occurred while executing this command.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage).catch(() => {});
    } else {
      await interaction.reply(errorMessage).catch(() => {});
    }
  }
});

client.login(token);
