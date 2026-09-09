-- Keep a tombstone for deleted chat messages so both participants see the placeholder.
ALTER TABLE `chat_messages` ADD COLUMN `deletedAt` DATETIME(3) NULL;
