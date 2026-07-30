"use client";

import { useActionState, useState } from "react";
import {
  confirmInvoiceAllocation,
  removeInvoiceAllocation,
  createPullListItemAndAllocate,
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

const STATUS_OPTIONS = ["REQUESTED", "ORDERED", "ARRIVED", "PICKED_UP", "CANCELED"] as const;

export type CustomerOption = { id: string; displayName: string };

export type Candidate = {
  id: string;
  title: string;
  issueInfo: string | null;
  customerId: string;
  customerName: string;
  score: number;
};

export type AllocationView = {
  id: string;
  quantity: number;
  resultingStatus: string;
  customerId: string;
  customerName: string;
  pullListTitle: string;
  pullListIssueInfo: string | null;
  confirmedByName: string;
};

export type LineItemView = {
  id: string;
  sku: string | null;
  description: string;
  gtin: string | null;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  allocations: AllocationView[];
  candidates: Candidate[];
};

export function InvoiceMatchingPanel({
  invoiceId,
  lineItems,
  customers,
}: {
  invoiceId: string;
  lineItems: LineItemView[];
  customers: CustomerOption[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {lineItems.map((item) => (
        <LineItemMatchRow
          key={`${item.id}-${item.allocations.length}`}
          invoiceId={invoiceId}
          item={item}
          customers={customers}
        />
      ))}
    </div>
  );
}

function LineItemMatchRow({
  invoiceId,
  item,
  customers,
}: {
  invoiceId: string;
  item: LineItemView;
  customers: CustomerOption[];
}) {
  const [state, action, pending] = useActionState(confirmInvoiceAllocation, undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const allocated = item.allocations.reduce((sum, a) => sum + a.quantity, 0);
  const remaining = item.quantity - allocated;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">{item.description}</p>
            <p className="text-muted-foreground text-sm">
              {item.sku && `SKU ${item.sku} · `}
              Qty {item.quantity} @ ${item.unitPrice.toFixed(2)}
            </p>
          </div>
          <Badge variant={remaining > 0 ? "outline" : "secondary"}>
            {remaining > 0 ? `${remaining} unmatched` : "Fully matched"}
          </Badge>
        </div>

        {item.allocations.length > 0 && (
          <div className="flex flex-col gap-2">
            {item.allocations.map((a) => (
              <AllocationRow key={a.id} invoiceId={invoiceId} allocation={a} />
            ))}
          </div>
        )}

        {remaining > 0 && (
          <form
            action={action}
            className="flex flex-wrap items-end gap-3 border-t pt-4"
          >
            <input type="hidden" name="lineItemId" value={item.id} />
            <input type="hidden" name="invoiceId" value={invoiceId} />

            <div className="flex flex-col gap-2">
              <Label htmlFor={`candidate-${item.id}`}>Match to</Label>
              <Select
                name="pullListItemAndCustomer"
                required
                items={Object.fromEntries(
                  item.candidates.map((c) => [
                    `${c.id}|${c.customerId}`,
                    `${c.customerName} — ${c.title}${c.issueInfo ? ` (${c.issueInfo})` : ""} · ${Math.round(c.score * 100)}%`,
                  ])
                )}
              >
                <SelectTrigger id={`candidate-${item.id}`} className="w-72">
                  <SelectValue placeholder="Choose a pull-list item" />
                </SelectTrigger>
                <SelectContent>
                  {item.candidates.map((c) => (
                    <SelectItem key={c.id} value={`${c.id}|${c.customerId}`}>
                      {c.customerName} — {c.title}
                      {c.issueInfo ? ` (${c.issueInfo})` : ""} · {Math.round(c.score * 100)}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`qty-${item.id}`}>Quantity</Label>
              <Input
                id={`qty-${item.id}`}
                name="quantity"
                type="number"
                min={1}
                max={remaining}
                defaultValue={remaining}
                className="w-20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`status-${item.id}`}>Sets status to</Label>
              <Select
                name="resultingStatus"
                defaultValue="ARRIVED"
                items={Object.fromEntries(STATUS_OPTIONS.map((s) => [s, s.replace("_", " ")]))}
              >
                <SelectTrigger id={`status-${item.id}`} className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {state?.error && <p className="text-destructive w-full text-sm">{state.error}</p>}
            <Button type="submit" disabled={pending} size="sm">
              {pending ? "Matching..." : "Confirm Match"}
            </Button>
          </form>
        )}

        {remaining > 0 && !showCreateForm && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="text-primary w-fit text-sm hover:underline"
          >
            + Add a new pull-list item for this
          </button>
        )}

        {remaining > 0 && showCreateForm && (
          <CreatePullListItemForm
            invoiceId={invoiceId}
            lineItemId={item.id}
            defaultTitle={item.description}
            remaining={remaining}
            customers={customers}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function CreatePullListItemForm({
  invoiceId,
  lineItemId,
  defaultTitle,
  remaining,
  customers,
  onCancel,
}: {
  invoiceId: string;
  lineItemId: string;
  defaultTitle: string;
  remaining: number;
  customers: CustomerOption[];
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(createPullListItemAndAllocate, undefined);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 border-t pt-4"
    >
      <input type="hidden" name="lineItemId" value={lineItemId} />
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={`new-customer-${lineItemId}`}>Customer</Label>
        <Select
          name="customerId"
          required
          items={Object.fromEntries(customers.map((c) => [c.id, c.displayName]))}
        >
          <SelectTrigger id={`new-customer-${lineItemId}`} className="w-48">
            <SelectValue placeholder="Choose a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`new-title-${lineItemId}`}>Title</Label>
        <Input id={`new-title-${lineItemId}`} name="title" defaultValue={defaultTitle} required className="w-56" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`new-issueInfo-${lineItemId}`}>Issue / details</Label>
        <Input id={`new-issueInfo-${lineItemId}`} name="issueInfo" className="w-40" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`new-qty-${lineItemId}`}>Quantity</Label>
        <Input
          id={`new-qty-${lineItemId}`}
          name="quantity"
          type="number"
          min={1}
          max={remaining}
          defaultValue={remaining}
          className="w-20"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`new-status-${lineItemId}`}>Sets status to</Label>
        <Select
          name="resultingStatus"
          defaultValue="ARRIVED"
          items={Object.fromEntries(STATUS_OPTIONS.map((s) => [s, s.replace("_", " ")]))}
        >
          <SelectTrigger id={`new-status-${lineItemId}`} className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state?.error && <p className="text-destructive w-full text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Adding..." : "Add & Match"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}

function AllocationRow({
  invoiceId,
  allocation,
}: {
  invoiceId: string;
  allocation: AllocationView;
}) {
  const [state, action, pending] = useActionState(removeInvoiceAllocation, undefined);

  return (
    <div className="bg-muted flex items-center justify-between gap-4 rounded-md p-3 text-sm">
      <div>
        <span className="font-medium">{allocation.quantity}×</span>{" "}
        {allocation.customerName} — {allocation.pullListTitle}
        {allocation.pullListIssueInfo ? ` (${allocation.pullListIssueInfo})` : ""}{" "}
        <Badge variant="outline" className="ml-1">
          {allocation.resultingStatus.replace("_", " ")}
        </Badge>
        <span className="text-muted-foreground ml-2">
          confirmed by {allocation.confirmedByName}
        </span>
      </div>
      <form action={action}>
        <input type="hidden" name="allocationId" value={allocation.id} />
        <input type="hidden" name="invoiceId" value={invoiceId} />
        {state?.error && <p className="text-destructive text-xs">{state.error}</p>}
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Removing..." : "Unmatch"}
        </Button>
      </form>
    </div>
  );
}
