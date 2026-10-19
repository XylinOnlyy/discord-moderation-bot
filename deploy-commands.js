require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('❌ Please set both DISCORD_TOKEN and CLIENT_ID in your .env file before running deploy.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`🔄 Deploying ${commands.length} application (/) commands...`);

    if (guildId && guildId.trim() !== '') {
      const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId.trim()), {
        body: commands,
      });
      console.log(`✅ Successfully deployed ${data.length} guild commands to server ${guildId.trim()}.`);
    } else {
      const data = await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
      console.log(`✅ Successfully deployed ${data.length} global commands.`);
    }
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
