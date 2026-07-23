-- Email dibuat opsional (boleh NULL) supaya import guru via Excel tidak wajib
-- mengisi email. Guru dapat mengisi email sendiri lewat menu Akun (profil).
-- Unique index users_email_key tetap berlaku untuk nilai non-NULL; banyak baris
-- dengan email NULL diizinkan (perilaku standar MySQL/MariaDB).
ALTER TABLE `users` MODIFY COLUMN `email` VARCHAR(191) NULL;