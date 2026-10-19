const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { removeWarning, getWarnings } = require('../utils/database');
const { sendModLog } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Remove a specific warning from a user by its Warn ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user whose warning you want to remove')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('warn_id')
        .setDescription('The Warn ID to remove (without #, e.g. A1B2C3)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const rawWarnId = interaction.options.getString('warn_id', true).replace(/^#/, '');

    const removed = removeWarning(interaction.guild.id, targetUser.id, rawWarnId);
    if (!removed) {
      return interaction.reply({
        content: `❌ Could not find warning \`#${rawWarnId.toUpperCase()}\` for **${targetUser.tag}**. Use \`/warnings\` to view valid Warn IDs.`,
        ephemeral: true,
      });
    }

    const remaining = getWarnings(interaction.guild.id, targetUser.id).length;

    const embed = new EmbedBuilder()
      .setColor(0x3ba55c)
      .setTitle('✅ Warning Removed')
      .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
      .setDescription(`Removed warning \`#${removed.id}\` from **${targetUser.tag}** (<@${targetUser.id}>).`)
      .addFields(
        { name: 'Original Reason', value: removed.reason, inline: false },
        { name: 'Removed By', value: `${interaction.user.tag}`, inline: true },
        { name: 'Remaining Warnings', value: `\`${remaining}\``, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    await sendModLog(interaction.guild, {
      title: '✅ Warning Removed',
      color: 0x3ba55c,
      targetUser,
      moderator: interaction.user,
      fields: [
        { name: 'Removed Warn ID', value: `\`#${removed.id}\``, inline: true },
        { name: 'Remaining Warnings', value: `\`${remaining}\``, inline: true },
        { name: 'Original Reason', value: removed.reason, inline: false },
      ],
    });
  },
};
