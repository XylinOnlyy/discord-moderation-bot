const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWarnings } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View the warning history of a user in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user whose warnings you want to check')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const warnings = getWarnings(interaction.guild.id, targetUser.id);

    const embed = new EmbedBuilder()
      .setColor(warnings.length > 0 ? 0xfee75c : 0x3ba55c)
      .setAuthor({
        name: `${targetUser.tag} — Warning History`,
        iconURL: targetUser.displayAvatarURL({ size: 128 }),
      })
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setFooter({ text: `Total Warnings: ${warnings.length} | User ID: ${targetUser.id}` })
      .setTimestamp();

    if (warnings.length === 0) {
      embed.setDescription(`✅ <@${targetUser.id}> has a clean record with **0** warnings in this server.`);
    } else {
      const formattedList = warnings
        .slice(-15)
        .map((w, idx) => {
          const unixTime = Math.floor(w.timestamp / 1000);
          return `**${idx + 1}. Warn ID:** \`#${w.id}\` — <t:${unixTime}:R>\n**Moderator:** <@${w.moderatorId}> (${w.moderatorTag})\n**Reason:** ${w.reason}`;
        })
        .join('\n\n');

      embed.setDescription(formattedList);
    }

    await interaction.reply({ embeds: [embed] });
  },
};
