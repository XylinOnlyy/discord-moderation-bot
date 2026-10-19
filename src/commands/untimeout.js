const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModDM } = require('../utils/dmNotifier');
const { sendModLog } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove an active timeout from a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member whose timeout you want to remove')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for removing the timeout')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason')?.trim() || 'Timeout removed by moderator.';

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply({
        content: `❌ **${targetUser.tag}** is not in this server.`,
        ephemeral: true,
      });
    }

    if (!targetMember.isCommunicationDisabled()) {
      return interaction.reply({
        content: `ℹ️ **${targetUser.tag}** is not currently timed out.`,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      await targetMember.timeout(null, `${reason} | Untimed out by ${interaction.user.tag}`);
    } catch (err) {
      console.error('[Untimeout Command Error]:', err);
      return interaction.editReply({
        content: `❌ Failed to remove timeout for **${targetUser.tag}**: ${err.message}`,
      });
    }

    const dmResult = await sendModDM(targetUser, {
      actionTitle: '🔊 Your Timeout Has Been Removed',
      color: 0x3ba55c,
      guild: interaction.guild,
      moderator: interaction.user,
      reason,
    });

    const dmStatusText = dmResult.delivered
      ? '✅ Sent to User\'s DM'
      : '⚠️ Failed to send DM (User has DMs closed)';

    const embed = new EmbedBuilder()
      .setColor(0x3ba55c)
      .setTitle('🔊 Timeout Removed')
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setDescription(`✅ Timeout has been removed for **${targetUser.tag}** (<@${targetUser.id}>).`)
      .addFields(
        { name: 'Member', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
        { name: 'DM Status', value: dmStatusText, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    await sendModLog(interaction.guild, {
      title: '🔊 Timeout Removed',
      color: 0x3ba55c,
      targetUser,
      moderator: interaction.user,
      fields: [{ name: 'Reason', value: reason, inline: false }],
    });
  },
};
