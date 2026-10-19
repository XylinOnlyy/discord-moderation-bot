const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available moderation commands and their usage'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🛡️ Moderation Bot — Command Reference')
      .setDescription('Below is the complete list of slash commands available in this moderation system.')
      .addFields(
        {
          name: '🔍 User & Server Inspection',
          value: [
            '`/info [user]` — Check user roles, server join date, permissions, warnings, and mini avatar.',
            '`/warnings [user]` — View all active warnings and case IDs for a user.',
            '`/help` — Show this command reference menu.',
          ].join('\n'),
          inline: false,
        },
        {
          name: '⚠️ Warning System (with DM & Closed-DM Confirmation)',
          value: [
            '`/warn [user] [reason]` — Warn a user and notify them via DM (confirms if DMs are closed).',
            '`/unwarn [user] [warn_id]` — Remove a specific warning by its Warn ID.',
            '`/clearwarns [user]` — Clear all warnings for a user.',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🔨 Member Moderation (with DM & Closed-DM Confirmation)',
          value: [
            '`/ban [user] [reason] [delete_days]` — Ban a user and notify them via DM (confirms if DMs are closed).',
            '`/unban [user_id] [reason]` — Unban a user by their Discord User ID.',
            '`/kick [user] [reason]` — Kick a member and notify them via DM (confirms if DMs are closed).',
            '`/timeout [user] [duration] [reason]` — Timeout/mute a member (e.g. `10m`, `1h`, `1d`) and notify via DM.',
            '`/untimeout [user] [reason]` — Remove an active timeout from a member.',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🧹 Channel & Server Management',
          value: [
            '`/purge [user] [amount]` — Delete a specific number of messages sent by a target user.',
            '`/lock [channel] [reason]` — Lock a text channel for `@everyone`.',
            '`/unlock [channel] [reason]` — Unlock a text channel for `@everyone`.',
            '`/slowmode [seconds] [channel]` — Set or disable channel slowmode (`0` to disable).',
            '`/modlog [channel]` — Set or disable the automated moderation log channel.',
          ].join('\n'),
          inline: false,
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ size: 64 }),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
