const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { sendModLog } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a text channel so regular members (@everyone) cannot send messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to lock (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason for locking the channel')
        .setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason')?.trim() || 'Channel locked by moderator.';

    try {
      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: false },
        { reason: `${reason} | Locked by ${interaction.user.tag}` }
      );

      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('🔒 Channel Locked')
        .setDescription(`<#${channel.id}> has been locked for \`@everyone\`.`)
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      await sendModLog(interaction.guild, {
        title: '🔒 Channel Locked',
        color: 0xed4245,
        moderator: interaction.user,
        fields: [
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false },
        ],
      });
    } catch (err) {
      console.error('[Lock Command Error]:', err);
      await interaction.reply({
        content: `❌ Failed to lock <#${channel.id}>: ${err.message}`,
        ephemeral: true,
      });
    }
  },
};
