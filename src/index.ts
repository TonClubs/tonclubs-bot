import dedent from 'dedent';
import {Bot, Debug} from './Services';
import Start from './Commands/Start';
import Create from './Commands/Create';

Bot.setMyCommands([
  {
    command: 'start',
    description: 'Starts the bot',
  },
  {
    command: 'create',
    description: 'Shows instructions to setup a telegram group with the bot',
  },
  {
    command: 'join',
    description: 'Shows instructions to join a telegram group with the bot',
  },
]).then((ok) => {
  Debug.bot('Commands set successfully: %o', ok);
  console.info('Bot started');
});

Bot.on('message', async (msg) => {
  if (msg.text === '/start') {
    Start(msg);
  }

  if (msg.text === '/create') {
    Create(msg);
  }
});

Bot.on('callback_query', async (query) => {
  if (query.data === 'create' && query.message) {
    Create(query.message);
  }
});

Bot.on('my_chat_member', async (member) => {
  console.log('my_chat_member', member);

  const isSuperGroup = member.chat.type === 'supergroup';
  const isMember = member.new_chat_member.is_member || member.new_chat_member.status === 'member';
  const isAdmin = member.new_chat_member.status === 'administrator';
  const canInviteUser = member.new_chat_member.can_invite_users;

  console.log('isMember', isMember);

  if (isMember) {
    if (member.old_chat_member.status === 'left') {
      const steps = [];

      if (!isSuperGroup) steps.push('Make the group a Super Group');
      if (!isAdmin) steps.push('Make me an admin');
      if (!canInviteUser) steps.push('Give me the permission to invite and add users');

      if (steps.length > 0) {
        Bot.sendMessage(
          member.chat.id,
          dedent`Hi! Let's setup the group. Please follow the instructions:
          ${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`,
        );
        return;
      }

      // TODO: What if the bot is already setup?
    }

    if (!isSuperGroup) {
      Bot.sendMessage(
        member.chat.id,
        'This bot only works in Super Groups. Please follow the setup instructions to create a Super Group with the bot.',
      );
      return;
    }

    if (!isAdmin) {
      Bot.sendMessage(member.chat.id, 'Please make me an admin to start using the bot.');
      return;
    }

    if (!canInviteUser) {
      Bot.sendMessage(
        member.chat.id,
        'Please give me the permission to invite users to the group.',
      );
      return;
    }
  }
});
