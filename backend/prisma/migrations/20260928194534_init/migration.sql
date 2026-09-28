-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha_hash` VARCHAR(255) NOT NULL,
    `perfil` VARCHAR(20) NOT NULL DEFAULT 'COLABORADOR',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(500) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categorias_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boas_praticas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(200) NOT NULL,
    `resumo` VARCHAR(500) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO',
    `categoria_id` INTEGER NOT NULL,
    `autor_id` INTEGER NOT NULL,
    `aprovador_id` INTEGER NULL,
    `publicada_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `boas_praticas_status_idx`(`status`),
    INDEX `boas_praticas_categoria_id_idx`(`categoria_id`),
    INDEX `boas_praticas_autor_id_idx`(`autor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historico_boas_praticas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `boa_pratica_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `acao` VARCHAR(30) NOT NULL,
    `status_de` VARCHAR(20) NULL,
    `status_para` VARCHAR(20) NOT NULL,
    `comentario` VARCHAR(1000) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historico_boas_praticas_boa_pratica_id_idx`(`boa_pratica_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `boas_praticas` ADD CONSTRAINT `boas_praticas_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `boas_praticas` ADD CONSTRAINT `boas_praticas_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `boas_praticas` ADD CONSTRAINT `boas_praticas_aprovador_id_fkey` FOREIGN KEY (`aprovador_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `historico_boas_praticas` ADD CONSTRAINT `historico_boas_praticas_boa_pratica_id_fkey` FOREIGN KEY (`boa_pratica_id`) REFERENCES `boas_praticas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `historico_boas_praticas` ADD CONSTRAINT `historico_boas_praticas_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
