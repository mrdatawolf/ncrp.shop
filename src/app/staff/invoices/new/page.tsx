import { notFound } from "next/navigation";
import { isLlmEnabled } from "@/lib/feature-flags";
import { InvoiceUploadWizard } from "@/components/staff/invoice-upload-wizard";

export default function NewInvoicePage() {
  if (!isLlmEnabled()) notFound();

  return (
    <div className="flex flex-1 justify-center">
      <InvoiceUploadWizard />
    </div>
  );
}
