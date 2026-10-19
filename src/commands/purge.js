const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModLog } = require('../utils/modLogger');

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a specific number of messages sent by a specific user in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user whose messages you want to delete')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete from this user (1 - 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);

    await interaction.deferReply({ ephemeral: true });

    try {
      const fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 });
      const now = Date.now();

      const userMessages = fetchedMessages.filter(
        (msg) => msg.author.id === targetUser.id && now - msg.createdTimestamp < FOURTEEN_DAYS_MS
      );

      const messagesToDelete = Array.from(userMessages.values()).slice(0, amount);

      if (messagesToDelete.length === 0) {
        return interaction.editReply({
          content: `⚠️ No recent messages (under 14 days old) from **${targetUser.tag}** were found in the last 100 messages of this channel.`,
        });
      }

      const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);

      const embed = new EmbedBuilder()
        .setColor(0x3ba55c)
        .setTitle('🧹 Messages Purged')
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setDescription(
          `Successfully deleted **${deleted.size}** message(s) from <@${targetUser.id}> in <#${interaction.channel.id}>.`
        )
        .addFields(
          { name: 'Target User', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
          { name: 'Requested / Deleted', value: `${amount} / ${deleted.size}`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      await sendModLog(interaction.guild, {
        title: '🧹 Member Messages Purged',
        color: 0x3ba55c,
        targetUser,
        moderator: interaction.user,
        fields: [
          { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true },
          { name: 'Messages Deleted', value: `\`${deleted.size}\` (Requested: \`${amount}\`)`, inline: true },
        ],
      });
    } catch (err) {
      console.error('[Purge Command Error]:', err);
      await interaction.editReply({
        content: `❌ Failed to purge messages: ${err.message}`,
      });
    }
  },
};
