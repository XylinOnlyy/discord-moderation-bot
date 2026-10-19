const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { setModLogChannel, getModLogChannel } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlog')
    .setDescription('Configure or disable the server moderation log channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Select a text channel for moderation logs (leave empty to disable)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    if (!channel) {
      const current = getModLogChannel(interaction.guild.id);
      setModLogChannel(interaction.guild.id, null);

      return interaction.reply({
        content: current
          ? `✅ Moderation logging (previously <#${current}>) has been **disabled**.`
          : 'ℹ️ Moderation logging is currently disabled. Provide a `channel` option to enable it.',
        ephemeral: true,
      });
    }

    setModLogChannel(interaction.guild.id, channel.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📋 Moderation Log Channel Configured')
      .setDescription(`All future moderation actions will be automatically logged in <#${channel.id}>.`)
      .addFields(
        { name: 'Log Channel', value: `<#${channel.id}> (\`${channel.id}\`)`, inline: true },
        { name: 'Configured By', value: `${interaction.user.tag}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
