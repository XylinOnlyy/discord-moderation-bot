const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatMemberPermissions } = require('../utils/permissions');
const { getWarnings } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Check detailed server information, roles, join date, permissions, and avatar of a user')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user you want to inspect (defaults to yourself)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    const avatarUrl = targetUser.displayAvatarURL({ size: 256 });
    const createdTimestamp = Math.floor(targetUser.createdTimestamp / 1000);
    const warnings = getWarnings(interaction.guild.id, targetUser.id);

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor && member.displayHexColor !== '#000000' ? member.displayHexColor : 0x5865f2)
      .setAuthor({
        name: `${targetUser.tag} — User Information`,
        iconURL: avatarUrl,
      })
      .setThumbnail(avatarUrl)
      .addFields(
        {
          name: '👤 User Identity',
          value: [
            `**Username:** ${targetUser.tag}`,
            `**Mention:** <@${targetUser.id}>`,
            `**User ID:** \`${targetUser.id}\``,
            `**Account Type:** ${targetUser.bot ? '🤖 Bot' : '🧑 Human'}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '🏠 Server Profile',
          value: member
            ? [
                `**Nickname:** ${member.nickname ? member.nickname : 'None'}`,
                `**Highest Role:** ${member.roles.highest}`,
                `**Boosting Since:** ${
                  member.premiumSinceTimestamp
                    ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`
                    : 'Not Boosting'
                }`,
                `**Active Warnings:** \`${warnings.length}\``,
              ].join('\n')
            : '*This user is not currently a member of this server.*',
          inline: true,
        },
        {
          name: '📅 Timestamps',
          value: [
            `**Account Created:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`,
            member?.joinedTimestamp
              ? `**Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(
                  member.joinedTimestamp / 1000
                )}:R>)`
              : '**Joined Server:** N/A',
          ].join('\n'),
          inline: false,
        }
      );

    if (member) {
      const roles = member.roles.cache
        .filter((role) => role.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map((role) => role.toString());

      const rolesDisplay =
        roles.length > 0
          ? roles.slice(0, 25).join(' ') + (roles.length > 25 ? ` ...and ${roles.length - 25} more` : '')
          : 'No roles assigned';

      embed.addFields(
        {
          name: `🎭 Roles [${roles.length}]`,
          value: rolesDisplay,
          inline: false,
        },
        {
          name: '🔑 Server Permissions',
          value: formatMemberPermissions(member),
          inline: false,
        }
      );
    }

    embed.setFooter({
      text: `Requested by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL({ size: 64 }),
    });
    embed.setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
