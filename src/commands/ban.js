const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModDM } = require('../utils/dmNotifier');
const { sendModLog } = require('../utils/modLogger');
const { validateModerationTarget } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server with a reason and notify them via DM')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to ban')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for banning this user')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('delete_days')
        .setDescription('Number of days of messages to delete (0 - 7 days, default: 0)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim();
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    const validationError = validateModerationTarget(interaction, targetUser, targetMember, 'ban');
    if (validationError) {
      return interaction.reply({ content: validationError, ephemeral: true });
    }

    if (targetMember && !targetMember.bannable) {
      return interaction.reply({
        content: `❌ I do not have sufficient permissions to ban **${targetUser.tag}**. Please check my role position and permissions.`,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const dmResult = await sendModDM(targetUser, {
      actionTitle: '🔨 You Have Been Banned',
      color: 0xed4245,
      guild: interaction.guild,
      moderator: interaction.user,
      reason,
    });

    try {
      await interaction.guild.members.ban(targetUser.id, {
        reason: `${reason} | Banned by ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 86400,
      });
    } catch (err) {
      console.error('[Ban Command Error]:', err);
      return interaction.editReply({
        content: `❌ Failed to ban **${targetUser.tag}**: ${err.message}`,
      });
    }

    const dmStatusText = dmResult.delivered
      ? '✅ Sent to User\'s DM'
      : '⚠️ Failed to send DM (User has DMs closed or blocked the bot)';

    const descriptionText = dmResult.delivered
      ? `🔨 **${targetUser.tag}** has been permanently banned from the server, and the ban notification has been sent to their DMs.`
      : `🔨 **${targetUser.tag}** has been permanently banned from the server, **but the ban notification could not be sent to their DMs because their DMs are closed.**`;

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🔨 Member Banned')
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setDescription(descriptionText)
      .addFields(
        { name: 'Banned User', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
        { name: 'DM Confirmation', value: dmStatusText, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setFooter({ text: `User ID: ${targetUser.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    await sendModLog(interaction.guild, {
      title: '🔨 Member Banned',
      color: 0xed4245,
      targetUser,
      moderator: interaction.user,
      fields: [
        { name: 'DM Status', value: dmStatusText, inline: true },
        { name: 'Messages Deleted', value: `${deleteDays} day(s)`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    });
  },
};
