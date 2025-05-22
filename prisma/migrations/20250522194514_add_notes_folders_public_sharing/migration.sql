-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content_markdown" TEXT,
    "folder_id" TEXT,
    "owner_id" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "public_share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "current_version_id" TEXT,
    "yjs_doc_state" BYTEA,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_folder_id" TEXT,
    "owner_id" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "public_share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Note_public_share_token_key" ON "Note"("public_share_token");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_public_share_token_key" ON "Folder"("public_share_token");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;