const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addWarning } = require('../utils/database');
const { sendModDM } = require('../utils/dmNotifier');
const { sendModLog } = require('../utils/modLogger');
const { validateModerationTarget } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue an official warning to a user and notify them via DM')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for issuing this warning')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim();

    if (targetUser.bot) {
      return interaction.reply({
        content: '❌ You cannot warn a bot.',
        ephemeral: true,
      });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    const validationError = validateModerationTarget(interaction, targetUser, targetMember, 'warn');
    if (validationError) {
      return interaction.reply({ content: validationError, ephemeral: true });
    }

    await interaction.deferReply();

    const warnRecord = addWarning(
      interaction.guild.id,
      targetUser.id,
      interaction.user.id,
      interaction.user.tag,
      reason
    );

    const dmResult = await sendModDM(targetUser, {
      actionTitle: '⚠️ You Have Been Warned',
      color: 0xfee75c,
      guild: interaction.guild,
      moderator: interaction.user,
      reason,
      extraFields: [
        { name: 'Warn ID', value: `\`#${warnRecord.id}\``, inline: true },
        { name: 'Total Server Warnings', value: `\`${warnRecord.totalWarnings}\``, inline: true },
      ],
    });

    const dmStatusText = dmResult.delivered
      ? '✅ Sent to User\'s DM'
      : '⚠️ Failed to send DM (User has DMs closed or blocked the bot)';

    const descriptionText = dmResult.delivered
      ? `✅ **${targetUser.tag}** has been warned, and a warning notification has been delivered to their DMs.`
      : `⚠️ **${targetUser.tag}** has been officially warned, **but the notification could not be sent to their DMs because their DMs are closed.**`;

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('⚠️ Member Warned')
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setDescription(descriptionText)
      .addFields(
        { name: 'Warned User', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
        { name: 'Warn ID', value: `\`#${warnRecord.id}\``, inline: true },
        { name: 'Total Warnings', value: `\`${warnRecord.totalWarnings}\``, inline: true },
        { name: 'DM Confirmation', value: dmStatusText, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setFooter({ text: `User ID: ${targetUser.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    await sendModLog(interaction.guild, {
      title: '⚠️ Member Warned',
      color: 0xfee75c,
      targetUser,
      moderator: interaction.user,
      fields: [
        { name: 'Warn ID', value: `\`#${warnRecord.id}\``, inline: true },
        { name: 'Total Warnings', value: `\`${warnRecord.totalWarnings}\``, inline: true },
        { name: 'DM Status', value: dmStatusText, inline: false },
        { name: 'Reason', value: reason, inline: false },
      ],
    });
  },
};
