const { EmbedBuilder } = require('discord.js');
const { getModLogChannel } = require('./database');

async function sendModLog(guild, { title, color, targetUser, moderator, fields = [] }) {
  try {
    const channelId = getModLogChannel(guild.id);
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId) || (await guild.channels.fetch(channelId).catch(() => null));
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .addFields(
        ...(targetUser
          ? [{ name: 'Target User', value: `${targetUser.tag} (<@${targetUser.id}> \`${targetUser.id}\`)`, inline: true }]
          : []),
        { name: 'Moderator', value: `${moderator.tag} (<@${moderator.id}>)`, inline: true },
        ...fields
      )
      .setTimestamp();

    if (targetUser) {
      embed.setThumbnail(targetUser.displayAvatarURL({ size: 256 }));
    }

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[ModLogger] Failed to send moderation log:', err.message);
  }
}

module.exports = { sendModLog };
