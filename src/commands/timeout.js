const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModDM } = require('../utils/dmNotifier');
const { sendModLog } = require('../utils/modLogger');
const { validateModerationTarget } = require('../utils/permissions');

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

function parseDuration(input) {
  const match = input
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)$/);

  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    sec: 1000,
    secs: 1000,
    second: 1000,
    seconds: 1000,
    m: 60 * 1000,
    min: 60 * 1000,
    mins: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    h: 60 * 60 * 1000,
    hr: 60 * 60 * 1000,
    hrs: 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member for a specified duration and notify them via DM')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member to timeout')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('Duration (e.g., 10m, 1h, 1d, 7d — max 28d)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for timing out this member')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const durationStr = interaction.options.getString('duration', true).trim();
    const reason = interaction.options.getString('reason', true).trim();

    const durationMs = parseDuration(durationStr);
    if (!durationMs || durationMs < 5000 || durationMs > MAX_TIMEOUT_MS) {
      return interaction.reply({
        content: '❌ Invalid duration! Please provide a valid duration between `5s` and `28d` (examples: `10m`, `2h`, `1d`, `7d`).',
        ephemeral: true,
      });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply({
        content: `❌ **${targetUser.tag}** is not in this server.`,
        ephemeral: true,
      });
    }

    const validationError = validateModerationTarget(interaction, targetUser, targetMember, 'timeout');
    if (validationError) {
      return interaction.reply({ content: validationError, ephemeral: true });
    }

    if (!targetMember.moderatable) {
      return interaction.reply({
        content: `❌ I do not have permission to timeout **${targetUser.tag}** (they may be an Administrator or have a higher role than me).`,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      await targetMember.timeout(durationMs, `${reason} | Timed out by ${interaction.user.tag}`);
    } catch (err) {
      console.error('[Timeout Command Error]:', err);
      return interaction.editReply({
        content: `❌ Failed to timeout **${targetUser.tag}**: ${err.message}`,
      });
    }

    const expiresUnix = Math.floor((Date.now() + durationMs) / 1000);

    const dmResult = await sendModDM(targetUser, {
      actionTitle: '🔇 You Have Been Timed Out',
      color: 0xe67e22,
      guild: interaction.guild,
      moderator: interaction.user,
      reason,
      extraFields: [
        { name: 'Duration', value: `\`${durationStr}\``, inline: true },
        { name: 'Expires', value: `<t:${expiresUnix}:F> (<t:${expiresUnix}:R>)`, inline: true },
      ],
    });

    const dmStatusText = dmResult.delivered
      ? '✅ Sent to User\'s DM'
      : '⚠️ Failed to send DM (User has DMs closed or blocked the bot)';

    const descriptionText = dmResult.delivered
      ? `🔇 **${targetUser.tag}** has been timed out for \`${durationStr}\`, and a notification has been sent to their DMs.`
      : `🔇 **${targetUser.tag}** has been timed out for \`${durationStr}\`, **but the notification could not be sent to their DMs because their DMs are closed.**`;

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle('🔇 Member Timed Out')
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setDescription(descriptionText)
      .addFields(
        { name: 'Member', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
        { name: 'Duration', value: `\`${durationStr}\` (Ends <t:${expiresUnix}:R>)`, inline: true },
        { name: 'DM Confirmation', value: dmStatusText, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setFooter({ text: `User ID: ${targetUser.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    await sendModLog(interaction.guild, {
      title: '🔇 Member Timed Out',
      color: 0xe67e22,
      targetUser,
      moderator: interaction.user,
      fields: [
        { name: 'Duration', value: `\`${durationStr}\` (Ends <t:${expiresUnix}:R>)`, inline: true },
        { name: 'DM Status', value: dmStatusText, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    });
  },
};
