-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cidade" TEXT,
    "inicioLocacao" DATETIME,
    "fimLocacao" DATETIME,
    "aparelhoLocado" TEXT,
    "identificacaoAparelho" TEXT,
    "adesaoTerapia" TEXT,
    "compraCpap" TEXT,
    "dataEntregaEquipamento" DATETIME,
    "dispositivo" TEXT,
    "nsAparelhoEntregue" TEXT,
    "observacoes" TEXT,
    "equipmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Patient_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroSerie" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "obs" TEXT,
    "manutencaoHoras" INTEGER,
    "tipoManutencao" TEXT,
    "dataManutencao" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RentalPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_LOCACAO',
    CONSTRAINT "RentalPeriod_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonthlyPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rentalPeriodId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "status" TEXT,
    CONSTRAINT "MonthlyPayment_rentalPeriodId_fkey" FOREIGN KEY ("rentalPeriodId") REFERENCES "RentalPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PriceTable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ano" INTEGER NOT NULL,
    "valor" REAL NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Patient_nome_idx" ON "Patient"("nome");

-- CreateIndex
CREATE INDEX "Patient_cidade_idx" ON "Patient"("cidade");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_numeroSerie_key" ON "Equipment"("numeroSerie");

-- CreateIndex
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

-- CreateIndex
CREATE INDEX "Equipment_tipo_idx" ON "Equipment"("tipo");

-- CreateIndex
CREATE INDEX "RentalPeriod_ano_idx" ON "RentalPeriod"("ano");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPeriod_patientId_ano_key" ON "RentalPeriod"("patientId", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPayment_rentalPeriodId_mes_key" ON "MonthlyPayment"("rentalPeriodId", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "PriceTable_ano_key" ON "PriceTable"("ano");
