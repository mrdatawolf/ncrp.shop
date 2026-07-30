-- CreateTable
CREATE TABLE "InvoiceReceivingScan" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "lineItemId" TEXT,
    "scannedCode" TEXT NOT NULL,
    "scannedByStaffId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceReceivingScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceReceivingScan_invoiceId_idx" ON "InvoiceReceivingScan"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceReceivingScan_lineItemId_idx" ON "InvoiceReceivingScan"("lineItemId");

-- AddForeignKey
ALTER TABLE "InvoiceReceivingScan" ADD CONSTRAINT "InvoiceReceivingScan_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "VendorInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceReceivingScan" ADD CONSTRAINT "InvoiceReceivingScan_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "VendorInvoiceLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceReceivingScan" ADD CONSTRAINT "InvoiceReceivingScan_scannedByStaffId_fkey" FOREIGN KEY ("scannedByStaffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

