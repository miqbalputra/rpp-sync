-- Private 1:1 chat between Guru and PJ Diniyyah.
CREATE TABLE `chat_conversations` (
    `id` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `pjId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `chat_conversations_guruId_pjId_key`(`guruId`, `pjId`),
    INDEX `chat_conversations_guruId_updatedAt_idx`(`guruId`, `updatedAt`),
    INDEX `chat_conversations_pjId_updatedAt_idx`(`pjId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `isi` TEXT NOT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    INDEX `chat_messages_senderId_createdAt_idx`(`senderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `chat_conversations`
    ADD CONSTRAINT `chat_conversations_guruId_fkey`
    FOREIGN KEY (`guruId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `chat_conversations`
    ADD CONSTRAINT `chat_conversations_pjId_fkey`
    FOREIGN KEY (`pjId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `chat_messages`
    ADD CONSTRAINT `chat_messages_conversationId_fkey`
    FOREIGN KEY (`conversationId`) REFERENCES `chat_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `chat_messages`
    ADD CONSTRAINT `chat_messages_senderId_fkey`
    FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
