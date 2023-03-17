import Listeners from './Listeners';
import {Bot, BotInfo, Debug} from './Services';

(async (): Promise<void> => {
  const ok = await Bot.setMyCommands([
    {
      command: 'start',
      description: 'Starts the bot',
    },
    {
      command: 'connect',
      description: 'Shows instructions to connect your group to a collection',
    },
    {
      command: 'create',
      description: 'Shows instructions to create a new collection',
    },
    {
      command: 'mint',
      description: 'Shows instructions to mint a new NFT for a collection',
    },
    {
      command: 'join',
      description: 'Shows instructions to join a telegram group with the bot',
    },
  ]);

  Debug.bot('Commands set successfully: %o', ok);

  if (!ok) throw new Error('Could not set commands');

  await Bot.setMyDefaultAdministratorRights({
    rights: {
      is_anonymous: false,
      can_manage_chat: true,
      can_delete_messages: true,
      can_manage_video_chats: false,
      can_restrict_members: true,
      can_promote_members: true,
      can_change_info: false,
      can_invite_users: true,
      can_post_messages: true,
      can_edit_messages: true,
      can_pin_messages: false,
      can_manage_topics: false,
    },
  });

  const me = await Bot.getMe();

  BotInfo.setBotInfo(me);

  Debug.bot('Bot info received successfully');
  console.info('Bot started');

  Listeners();
})();
