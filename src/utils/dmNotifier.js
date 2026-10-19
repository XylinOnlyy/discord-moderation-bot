const { EmbedBuilder } = require('discord.js');

async function sendModDM(user, { actionTitle, color, guild, moderator, reason, extraFields = [] }) {
  if (!user || user.bot) {
    return { delivered: false };
  }

  const dmEmbed = new EmbedBuilder()
    .setColor(color)
    .setTitle(actionTitle)
    .setAuthor({
      name: guild.name,
      iconURL: guild.iconURL({ size: 128 }) || undefined,
    })
    .setThumbnail(guild.iconURL({ size: 256 }) || null)
    .addFields(
      { name: 'Server', value: `${guild.name} (\`${guild.id}\`)`, inline: true },
      { name: 'Moderator', value: `${moderator.tag} (<@${moderator.id}>)`, inline: true },
      ...extraFields,
      { name: 'Reason', value: reason || 'No reason provided.', inline: false }
    )
    .setTimestamp();

  try {
    await user.send({ embeds: [dmEmbed] });
    return { delivered: true };
  } catch {
    return { delivered: false };
  }
}

module.exports = { sendModDM };
