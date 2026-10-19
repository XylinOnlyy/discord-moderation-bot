const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { clearWarnings } = require('../utils/database');
const { sendModLog } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Clear all warnings for a specific user in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user whose warnings you want to clear')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const clearedCount = clearWarnings(interaction.guild.id, targetUser.id);

    if (clearedCount === 0) {
      return interaction.reply({
        content: `ℹ️ **${targetUser.tag}** already has **0** warnings in this server.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x3ba55c)
      .setTitle('🧹 All Warnings Cleared')
      .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
      .setDescription(
        `Successfully cleared **${clearedCount}** warning(s) for **${targetUser.tag}** (<@${targetUser.id}>).`
      )
      .addFields({ name: 'Moderator', value: `${interaction.user.tag}`, inline: true })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    await sendModLog(interaction.guild, {
      title: '🧹 All Warnings Cleared',
      color: 0x3ba55c,
      targetUser,
      moderator: interaction.user,
      fields: [{ name: 'Cleared Count', value: `\`${clearedCount}\``, inline: true }],
    });
  },
};
