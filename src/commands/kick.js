const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModDM } = require('../utils/dmNotifier');
const { sendModLog } = require('../utils/modLogger');
const { validateModerationTarget } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server with a reason and notify them via DM')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member to kick')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for kicking this member')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim();

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply({
        content: `❌ **${targetUser.tag}** is not a member of this server.`,
        ephemeral: true,
      });
    }

    const validationError = validateModerationTarget(interaction, targetUser, targetMember, 'kick');
    if (validationError) {
      return interaction.reply({ content: validationError, ephemeral: true });
    }

    if (!targetMember.kickable) {
      return interaction.reply({
        content: `❌ I do not have permission to kick **${targetUser.tag}**.`,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const dmResult = await sendModDM(targetUser, {
      actionTitle: '👢 You Have Been Kicked',
      color: 0xe67e22,
      guild: interaction.guild,
      moderator: interaction.user,
      reason,
    });

    try {
      await targetMember.kick(`${reason} | Kicked by ${interaction.user.tag}`);
    } catch (err) {
      console.error('[Kick Command Error]:', err);
      return interaction.editReply({
        content: `❌ Failed to kick **${targetUser.tag}**: ${err.message}`,
      });
    }

    const dmStatusText = dmResult.delivered
      ? '✅ Sent to User\'s DM'
      : '⚠️ Failed to send DM (User has DMs closed or blocked the bot)';

    const descriptionText = dmResult.delivered
      ? `👢 **${targetUser.tag}** has been kicked from the server, and a notification has been sent to their DMs.`
      : `👢 **${targetUser.tag}** has been kicked from the server, **but the notification could not be sent to their DMs because their DMs are closed.**`;

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle('👢 Member Kicked')
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setDescription(descriptionText)
      .addFields(
        { name: 'Kicked User', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
        { name: 'DM Confirmation', value: dmStatusText, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setFooter({ text: `User ID: ${targetUser.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    await sendModLog(interaction.guild, {
      title: '👢 Member Kicked',
      color: 0xe67e22,
      targetUser,
      moderator: interaction.user,
      fields: [
        { name: 'DM Status', value: dmStatusText, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    });
  },
};
