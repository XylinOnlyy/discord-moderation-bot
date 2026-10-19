const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModLog } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server using their Discord User ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option
        .setName('user_id')
        .setDescription('The Discord User ID of the banned user')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for unbanning this user')
        .setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.options.getString('user_id', true).trim();
    const reason = interaction.options.getString('reason')?.trim() || 'No reason provided.';

    await interaction.deferReply();

    try {
      const banInfo = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!banInfo) {
        return interaction.editReply({
          content: `❌ User ID \`${userId}\` is not currently banned in this server.`,
        });
      }

      await interaction.guild.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);

      const unbannedUser = banInfo.user;

      const embed = new EmbedBuilder()
        .setColor(0x3ba55c)
        .setTitle('🔓 User Unbanned')
        .setThumbnail(unbannedUser.displayAvatarURL({ size: 256 }))
        .setDescription(`✅ **${unbannedUser.tag}** (\`${unbannedUser.id}\`) has been unbanned from the server.`)
        .addFields(
          { name: 'Unbanned User', value: `${unbannedUser.tag} (<@${unbannedUser.id}>)`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      await sendModLog(interaction.guild, {
        title: '🔓 User Unbanned',
        color: 0x3ba55c,
        targetUser: unbannedUser,
        moderator: interaction.user,
        fields: [{ name: 'Reason', value: reason, inline: false }],
      });
    } catch (err) {
      console.error('[Unban Command Error]:', err);
      await interaction.editReply({
        content: `❌ Failed to unban user \`${userId}\`: ${err.message}`,
      });
    }
  },
};
