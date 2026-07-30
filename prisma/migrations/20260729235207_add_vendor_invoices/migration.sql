-- CreateTable
CREATE TABLE "VendorInvoice" (
    "id" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3),
    "orderNumber" TEXT,
    "subtotal" DECIMAL(10,2),
    "total" DECIMAL(10,2),
    "sourceText" TEXT NOT NULL,
    "uploadedByStaffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorInvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT NOT NULL,
    "gtin" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorInvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItemAllocation" (
    "id" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "pullListItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "resultingStatus" "PullListStatus" NOT NULL,
    "confirmedByStaffId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLineItemAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvoice_vendorName_invoiceNumber_key" ON "VendorInvoice"("vendorName", "invoiceNumber");

-- CreateIndex
CREATE INDEX "VendorInvoiceLineItem_invoiceId_idx" ON "VendorInvoiceLineItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLineItemAllocation_lineItemId_idx" ON "InvoiceLineItemAllocation"("lineItemId");

-- CreateIndex
CREATE INDEX "InvoiceLineItemAllocation_pullListItemId_idx" ON "InvoiceLineItemAllocation"("pullListItemId");

-- AddForeignKey
ALTER TABLE "VendorInvoice" ADD CONSTRAINT "VendorInvoice_uploadedByStaffId_fkey" FOREIGN KEY ("uploadedByStaffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvoiceLineItem" ADD CONSTRAINT "VendorInvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "VendorInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItemAllocation" ADD CONSTRAINT "InvoiceLineItemAllocation_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "VendorInvoiceLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItemAllocation" ADD CONSTRAINT "InvoiceLineItemAllocation_pullListItemId_fkey" FOREIGN KEY ("pullListItemId") REFERENCES "PullListItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItemAllocation" ADD CONSTRAINT "InvoiceLineItemAllocation_confirmedByStaffId_fkey" FOREIGN KEY ("confirmedByStaffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

