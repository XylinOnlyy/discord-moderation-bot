const { PermissionsBitField } = require('discord.js');

const KEY_PERMISSIONS = [
  [PermissionsBitField.Flags.Administrator, 'Administrator'],
  [PermissionsBitField.Flags.ManageGuild, 'Manage Server'],
  [PermissionsBitField.Flags.ManageRoles, 'Manage Roles'],
  [PermissionsBitField.Flags.ManageChannels, 'Manage Channels'],
  [PermissionsBitField.Flags.ManageWebhooks, 'Manage Webhooks'],
  [PermissionsBitField.Flags.ManageGuildExpressions, 'Manage Expressions'],
  [PermissionsBitField.Flags.ViewAuditLog, 'View Audit Log'],
  [PermissionsBitField.Flags.BanMembers, 'Ban Members'],
  [PermissionsBitField.Flags.KickMembers, 'Kick Members'],
  [PermissionsBitField.Flags.ModerateMembers, 'Timeout Members'],
  [PermissionsBitField.Flags.ManageMessages, 'Manage Messages'],
  [PermissionsBitField.Flags.ManageThreads, 'Manage Threads'],
  [PermissionsBitField.Flags.ManageNicknames, 'Manage Nicknames'],
  [PermissionsBitField.Flags.MentionEveryone, 'Mention @everyone'],
  [PermissionsBitField.Flags.MuteMembers, 'Mute Voice Members'],
  [PermissionsBitField.Flags.DeafenMembers, 'Deafen Voice Members'],
  [PermissionsBitField.Flags.MoveMembers, 'Move Voice Members'],
  [PermissionsBitField.Flags.ManageEvents, 'Manage Events'],
  [PermissionsBitField.Flags.SendMessages, 'Send Messages'],
  [PermissionsBitField.Flags.AttachFiles, 'Attach Files'],
  [PermissionsBitField.Flags.EmbedLinks, 'Embed Links'],
  [PermissionsBitField.Flags.Connect, 'Connect to Voice'],
  [PermissionsBitField.Flags.Speak, 'Speak in Voice'],
];

function formatMemberPermissions(member) {
  if (!member || !member.permissions) {
    return 'None (User is not in this server)';
  }

  if (member.id === member.guild.ownerId) {
    return '👑 **Server Owner** (All Permissions)';
  }

  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    const granted = KEY_PERMISSIONS.filter(([flag]) => member.permissions.has(flag)).map(
      ([, label]) => `\`${label}\``
    );
    return `🛡️ **Administrator** (All Permissions)\n${granted.slice(0, 12).join(', ')}${
      granted.length > 12 ? ` +${granted.length - 12} more` : ''
    }`;
  }

  const granted = KEY_PERMISSIONS.filter(([flag]) => member.permissions.has(flag)).map(
    ([, label]) => `\`${label}\``
  );

  if (granted.length === 0) {
    return 'Basic Member Permissions';
  }

  return granted.join(', ');
}

function validateModerationTarget(interaction, targetUser, targetMember, actionVerb) {
  if (targetUser.id === interaction.user.id) {
    return `❌ You cannot ${actionVerb} yourself.`;
  }

  if (targetUser.id === interaction.client.user.id) {
    return `❌ You cannot ${actionVerb} me.`;
  }

  if (targetUser.id === interaction.guild.ownerId) {
    return `❌ You cannot ${actionVerb} the server owner.`;
  }

  if (targetMember) {
    if (
      interaction.user.id !== interaction.guild.ownerId &&
      targetMember.roles.highest.position >= interaction.member.roles.highest.position
    ) {
      return `❌ You cannot ${actionVerb} **${targetUser.tag}** because they have an equal or higher role than you.`;
    }

    const botMember = interaction.guild.members.me;
    if (
      botMember &&
      actionVerb !== 'warn' &&
      targetMember.roles.highest.position >= botMember.roles.highest.position
    ) {
      return `❌ I cannot ${actionVerb} **${targetUser.tag}** because their highest role is equal to or higher than my highest role.`;
    }
  }

  return null;
}

module.exports = {
  formatMemberPermissions,
  validateModerationTarget,
};
