const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { sendModLog } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set or disable slowmode in a text channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((option) =>
      option
        .setName('seconds')
        .setDescription('Slowmode interval in seconds (0 to disable, max 21600 / 6 hours)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to configure (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds', true);
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.setRateLimitPerUser(seconds, `Slowmode updated by ${interaction.user.tag}`);

      const statusText =
        seconds === 0
          ? `✅ Slowmode has been **disabled** in <#${channel.id}>.`
          : `⏱️ Slowmode in <#${channel.id}> has been set to **${seconds} second(s)**.`;

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('⏱️ Channel Slowmode Updated')
        .setDescription(statusText)
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Interval', value: seconds === 0 ? 'Disabled (`0s`)' : `\`${seconds}s\``, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      await sendModLog(interaction.guild, {
        title: '⏱️ Slowmode Updated',
        color: 0x5865f2,
        moderator: interaction.user,
        fields: [
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Slowmode', value: seconds === 0 ? 'Disabled' : `\`${seconds}s\``, inline: true },
        ],
      });
    } catch (err) {
      console.error('[Slowmode Command Error]:', err);
      await interaction.reply({
        content: `❌ Failed to update slowmode in <#${channel.id}>: ${err.message}`,
        ephemeral: true,
      });
    }
  },
};
