BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[usuarios] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nome] NVARCHAR(150) NOT NULL,
    [email] NVARCHAR(191) NOT NULL,
    [senha_hash] NVARCHAR(255) NOT NULL,
    [perfil] NVARCHAR(20) NOT NULL CONSTRAINT [usuarios_perfil_df] DEFAULT 'COLABORADOR',
    [ativo] BIT NOT NULL CONSTRAINT [usuarios_ativo_df] DEFAULT 1,
    [criado_em] DATETIME2 NOT NULL CONSTRAINT [usuarios_criado_em_df] DEFAULT CURRENT_TIMESTAMP,
    [atualizado_em] DATETIME2 NOT NULL,
    CONSTRAINT [usuarios_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [usuarios_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[categorias] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nome] NVARCHAR(100) NOT NULL,
    [descricao] NVARCHAR(500),
    [ativo] BIT NOT NULL CONSTRAINT [categorias_ativo_df] DEFAULT 1,
    [criado_em] DATETIME2 NOT NULL CONSTRAINT [categorias_criado_em_df] DEFAULT CURRENT_TIMESTAMP,
    [atualizado_em] DATETIME2 NOT NULL,
    CONSTRAINT [categorias_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [categorias_nome_key] UNIQUE NONCLUSTERED ([nome])
);

-- CreateTable
CREATE TABLE [dbo].[boas_praticas] (
    [id] INT NOT NULL IDENTITY(1,1),
    [titulo] NVARCHAR(200) NOT NULL,
    [resumo] NVARCHAR(500) NOT NULL,
    [conteudo] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [boas_praticas_status_df] DEFAULT 'RASCUNHO',
    [categoria_id] INT NOT NULL,
    [autor_id] INT NOT NULL,
    [aprovador_id] INT,
    [publicada_em] DATETIME2,
    [criado_em] DATETIME2 NOT NULL CONSTRAINT [boas_praticas_criado_em_df] DEFAULT CURRENT_TIMESTAMP,
    [atualizado_em] DATETIME2 NOT NULL,
    CONSTRAINT [boas_praticas_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[historico_boas_praticas] (
    [id] INT NOT NULL IDENTITY(1,1),
    [boa_pratica_id] INT NOT NULL,
    [usuario_id] INT NOT NULL,
    [acao] NVARCHAR(30) NOT NULL,
    [status_de] NVARCHAR(20),
    [status_para] NVARCHAR(20) NOT NULL,
    [comentario] NVARCHAR(1000),
    [criado_em] DATETIME2 NOT NULL CONSTRAINT [historico_boas_praticas_criado_em_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [historico_boas_praticas_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [boas_praticas_status_idx] ON [dbo].[boas_praticas]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [boas_praticas_categoria_id_idx] ON [dbo].[boas_praticas]([categoria_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [boas_praticas_autor_id_idx] ON [dbo].[boas_praticas]([autor_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [historico_boas_praticas_boa_pratica_id_idx] ON [dbo].[historico_boas_praticas]([boa_pratica_id]);

-- AddForeignKey
ALTER TABLE [dbo].[boas_praticas] ADD CONSTRAINT [boas_praticas_categoria_id_fkey] FOREIGN KEY ([categoria_id]) REFERENCES [dbo].[categorias]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[boas_praticas] ADD CONSTRAINT [boas_praticas_autor_id_fkey] FOREIGN KEY ([autor_id]) REFERENCES [dbo].[usuarios]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[boas_praticas] ADD CONSTRAINT [boas_praticas_aprovador_id_fkey] FOREIGN KEY ([aprovador_id]) REFERENCES [dbo].[usuarios]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[historico_boas_praticas] ADD CONSTRAINT [historico_boas_praticas_boa_pratica_id_fkey] FOREIGN KEY ([boa_pratica_id]) REFERENCES [dbo].[boas_praticas]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[historico_boas_praticas] ADD CONSTRAINT [historico_boas_praticas_usuario_id_fkey] FOREIGN KEY ([usuario_id]) REFERENCES [dbo].[usuarios]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
