const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { sendModLog } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a text channel so regular members (@everyone) can send messages again')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to unlock (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason for unlocking the channel')
        .setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason')?.trim() || 'Channel unlocked by moderator.';

    try {
      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: null },
        { reason: `${reason} | Unlocked by ${interaction.user.tag}` }
      );

      const embed = new EmbedBuilder()
        .setColor(0x3ba55c)
        .setTitle('🔓 Channel Unlocked')
        .setDescription(`<#${channel.id}> has been unlocked for \`@everyone\`.`)
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      await sendModLog(interaction.guild, {
        title: '🔓 Channel Unlocked',
        color: 0x3ba55c,
        moderator: interaction.user,
        fields: [
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false },
        ],
      });
    } catch (err) {
      console.error('[Unlock Command Error]:', err);
      await interaction.reply({
        content: `❌ Failed to unlock <#${channel.id}>: ${err.message}`,
        ephemeral: true,
      });
    }
  },
};
