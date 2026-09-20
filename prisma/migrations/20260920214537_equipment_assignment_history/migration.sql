-- CreateTable
CREATE TABLE "EquipmentAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "numeroSerie" TEXT NOT NULL,
    "inicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fim" DATETIME,
    CONSTRAINT "EquipmentAssignment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquipmentAssignment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EquipmentAssignment_patientId_idx" ON "EquipmentAssignment"("patientId");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_equipmentId_idx" ON "EquipmentAssignment"("equipmentId");
