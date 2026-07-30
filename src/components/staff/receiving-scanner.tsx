"use client";

import { useActionState, useState } from "react";
import {
  recordReceivingScan,
  undoReceivingScan,
  assignReceivingScan,
} from "@/lib/actions/invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type LineItemProgress = {
  id: string;
  sku: string | null;
  description: string;
  gtin: string | null;
  quantity: number;
  receivedQuantity: number;
};

export type ScanFeedEntry = {
  id: string;
  code: string;
  matched: boolean;
  description: string | null;
  scannedByName: string;
};

export function ReceivingScanner({
  invoiceId,
  lineItems,
  scans,
}: {
  invoiceId: string;
  lineItems: LineItemProgress[];
  scans: ScanFeedEntry[];
}) {
  const [state, action, pending] = useActionState(recordReceivingScan, undefined);
  const formKey = state && "success" in state ? state.scanId : "initial";

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="flex flex-col gap-2 pt-6">
          <form action={action} key={formKey} className="flex flex-col gap-2">
            <input type="hidden" name="invoiceId" value={invoiceId} />
            <Label htmlFor="scan-code">Scan a barcode</Label>
            <div className="flex gap-2">
              <Input
                id="scan-code"
                name="code"
                autoFocus
                autoComplete="off"
                placeholder="Scan or type a barcode, then press Enter"
                className="max-w-sm"
              />
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Recording..." : "Record"}
              </Button>
            </div>
          </form>
          {state && "error" in state && <p className="text-destructive text-sm">{state.error}</p>}
          {state && "success" in state && (
            <p className={`text-sm ${state.matched ? "" : "text-destructive"}`}>
              {state.matched
                ? `Matched: ${state.description} (${state.receivedQuantity} of ${state.orderedQuantity} received)`
                : `"${state.code}" doesn't match any item on this invoice.`}
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="font-heading mb-4 text-xl tracking-wide">Line Items</h2>
        <div className="flex flex-col gap-3">
          {lineItems.map((item) => (
            <LineItemProgressRow key={item.id} item={item} />
          ))}
          {lineItems.length === 0 && (
            <p className="text-muted-foreground text-sm">This invoice has no line items.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-heading mb-4 text-xl tracking-wide">Recent Scans</h2>
        <div className="flex flex-col gap-2">
          {scans.map((scan) => (
            <ScanFeedRow key={scan.id} invoiceId={invoiceId} scan={scan} lineItems={lineItems} />
          ))}
          {scans.length === 0 && <p className="text-muted-foreground text-sm">No scans yet.</p>}
        </div>
      </div>
    </div>
  );
}

function LineItemProgressRow({ item }: { item: LineItemProgress }) {
  const badgeVariant =
    item.receivedQuantity > item.quantity
      ? "destructive"
      : item.receivedQuantity === item.quantity
        ? "secondary"
        : "outline";

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 pt-6">
        <div>
          <p className="font-medium">{item.description}</p>
          <p className="text-muted-foreground text-sm">
            {item.sku && `SKU ${item.sku} · `}
            {item.gtin ? `GTIN ${item.gtin}` : "No GTIN on file"}
          </p>
        </div>
        <Badge variant={badgeVariant}>
          {item.receivedQuantity} of {item.quantity} received
        </Badge>
      </CardContent>
    </Card>
  );
}

function ScanFeedRow({
  invoiceId,
  scan,
  lineItems,
}: {
  invoiceId: string;
  scan: ScanFeedEntry;
  lineItems: LineItemProgress[];
}) {
  const [undoState, undoAction, undoPending] = useActionState(undoReceivingScan, undefined);
  const [assignState, assignAction, assignPending] = useActionState(assignReceivingScan, undefined);
  const [showAssign, setShowAssign] = useState(false);

  return (
    <div className="bg-muted flex flex-wrap items-center justify-between gap-3 rounded-md p-3 text-sm">
      <div>
        {scan.matched ? (
          <span className="font-medium">{scan.description}</span>
        ) : (
          <Badge variant="destructive">Not on invoice</Badge>
        )}
        <span className="text-muted-foreground ml-2">
          {scan.code} · scanned by {scan.scannedByName}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!scan.matched && !showAssign && (
          <button
            type="button"
            onClick={() => setShowAssign(true)}
            className="text-primary text-xs hover:underline"
          >
            Assign to item
          </button>
        )}

        {!scan.matched && showAssign && (
          <form action={assignAction} className="flex items-center gap-2">
            <input type="hidden" name="invoiceId" value={invoiceId} />
            <input type="hidden" name="scanId" value={scan.id} />
            <Select
              name="lineItemId"
              required
              items={Object.fromEntries(lineItems.map((li) => [li.id, li.description]))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Choose item" />
              </SelectTrigger>
              <SelectContent>
                {lineItems.map((li) => (
                  <SelectItem key={li.id} value={li.id}>
                    {li.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" disabled={assignPending}>
              {assignPending ? "Assigning..." : "Assign"}
            </Button>
            {assignState?.error && <p className="text-destructive text-xs">{assignState.error}</p>}
          </form>
        )}

        <form action={undoAction}>
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <input type="hidden" name="scanId" value={scan.id} />
          <Button type="submit" variant="outline" size="sm" disabled={undoPending}>
            {undoPending ? "Undoing..." : "Undo"}
          </Button>
          {undoState?.error && <p className="text-destructive text-xs">{undoState.error}</p>}
        </form>
      </div>
    </div>
  );
}
