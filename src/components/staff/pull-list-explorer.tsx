"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PullListQuickStatus } from "@/components/staff/pull-list-quick-status";

const STATUS_OPTIONS = ["REQUESTED", "ORDERED", "ARRIVED", "PICKED_UP", "CANCELED"] as const;
type PullListStatus = (typeof STATUS_OPTIONS)[number];

const GROUP_BY_OPTIONS = ["customer", "title", "status"] as const;
type GroupBy = (typeof GROUP_BY_OPTIONS)[number];

export type PullListItemView = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  issueInfo: string | null;
  status: PullListStatus;
};

function statusLabel(status: PullListStatus): string {
  return status.replace("_", " ");
}

function productLabel(item: PullListItemView): string {
  return item.issueInfo ? `${item.title} (${item.issueInfo})` : item.title;
}

function statusSortIndex(label: string): number {
  const idx = STATUS_OPTIONS.findIndex((s) => statusLabel(s) === label);
  return idx === -1 ? STATUS_OPTIONS.length : idx;
}

type GroupLevel = {
  key: string;
  label: string;
  count: number;
  children: GroupLevel[];
  items: PullListItemView[];
};

function buildGroups(
  items: PullListItemView[],
  keyFns: [(item: PullListItemView) => string, (item: PullListItemView) => string, (item: PullListItemView) => string],
  isStatusLevel: [boolean, boolean, boolean]
): GroupLevel[] {
  function group(
    items: PullListItemView[],
    depth: number,
    parentKey: string
  ): GroupLevel[] {
    if (depth === 3) return [];
    const buckets = new Map<string, PullListItemView[]>();
    for (const item of items) {
      const k = keyFns[depth](item);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(item);
    }
    const labels = [...buckets.keys()].sort((a, b) =>
      isStatusLevel[depth] ? statusSortIndex(a) - statusSortIndex(b) : a.localeCompare(b)
    );
    return labels.map((label) => {
      const bucketItems = buckets.get(label)!;
      const key = `${parentKey}>${label}`;
      return {
        key,
        label,
        count: bucketItems.length,
        children: depth < 2 ? group(bucketItems, depth + 1, key) : [],
        items: depth === 2 ? bucketItems : [],
      };
    });
  }

  return group(items, 0, "root");
}

export function PullListExplorer({ items }: { items: PullListItemView[] }) {
  const [selectedStatuses, setSelectedStatuses] = useState<Set<PullListStatus>>(
    new Set(["REQUESTED", "ORDERED", "ARRIVED"])
  );
  const [groupBy, setGroupBy] = useState<GroupBy>("customer");
  const [search, setSearch] = useState("");
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  function toggleStatus(status: PullListStatus) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function toggleCollapsed(key: string) {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!selectedStatuses.has(item.status)) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.issueInfo?.toLowerCase().includes(q) ?? false) ||
        item.customerName.toLowerCase().includes(q)
      );
    });
  }, [items, selectedStatuses, search]);

  const groups = useMemo(() => {
    if (groupBy === "customer") {
      return buildGroups(
        filteredItems,
        [(i) => i.customerName, (i) => productLabel(i), (i) => statusLabel(i.status)],
        [false, false, true]
      );
    }
    if (groupBy === "title") {
      return buildGroups(
        filteredItems,
        [(i) => i.title, (i) => i.issueInfo ?? "No edition specified", (i) => i.customerName],
        [false, false, false]
      );
    }
    return buildGroups(
      filteredItems,
      [(i) => statusLabel(i.status), (i) => productLabel(i), (i) => i.customerName],
      [true, false, false]
    );
  }, [filteredItems, groupBy]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-md border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium">Status:</span>
          {STATUS_OPTIONS.map((status) => (
            <label key={status} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={selectedStatuses.has(status)}
                onChange={() => toggleStatus(status)}
              />
              {statusLabel(status)}
            </label>
          ))}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedStatuses(new Set(["REQUESTED", "ORDERED", "ARRIVED"]))}
            >
              Active
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedStatuses(new Set(["ARRIVED"]))}
            >
              Ready for Pickup
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedStatuses(new Set(STATUS_OPTIONS))}
            >
              All
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Group by:</span>
            {GROUP_BY_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={groupBy === option ? "default" : "outline"}
                onClick={() => setGroupBy(option)}
                className="capitalize"
              >
                {option}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="pull-list-search" className="sr-only">
              Search
            </Label>
            <Input
              id="pull-list-search"
              type="search"
              placeholder="Search by title, issue, or customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {groups.map((level1) => (
          <GroupSection
            key={level1.key}
            group={level1}
            depth={0}
            collapsedKeys={collapsedKeys}
            toggleCollapsed={toggleCollapsed}
          />
        ))}
        {groups.length === 0 && (
          <p className="text-muted-foreground text-center">No pull list items found.</p>
        )}
      </div>
    </div>
  );
}

function GroupSection({
  group,
  depth,
  collapsedKeys,
  toggleCollapsed,
}: {
  group: GroupLevel;
  depth: number;
  collapsedKeys: Set<string>;
  toggleCollapsed: (key: string) => void;
}) {
  const collapsed = collapsedKeys.has(group.key);

  return (
    <div style={{ marginLeft: depth * 20 }} className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => toggleCollapsed(group.key)}
        className="flex items-center gap-2 rounded-md py-1 text-left font-medium hover:underline"
      >
        <span>{collapsed ? "▶" : "▼"}</span>
        <span>{group.label}</span>
        <span className="text-muted-foreground text-sm font-normal">({group.count})</span>
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-2 pl-2">
          {group.children.map((child) => (
            <GroupSection
              key={child.key}
              group={child}
              depth={depth + 1}
              collapsedKeys={collapsedKeys}
              toggleCollapsed={toggleCollapsed}
            />
          ))}
          {group.items.map((item) => (
            <div key={item.id} style={{ marginLeft: (depth + 1) * 20 }}>
              <PullListQuickStatus
                key={`${item.id}-${item.status}`}
                itemId={item.id}
                customerId={item.customerId}
                status={item.status}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
