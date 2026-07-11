import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PropertyFormValues = {
  photo_url: string;
  url: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  lot_size: number | null;
  property_type: string;
  year_built: number | null;
  listing_status: string;
  client_status: string;
  notes: string;
};

const empty: PropertyFormValues = {
  photo_url: "",
  url: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  price: 0,
  bedrooms: 0,
  bathrooms: 0,
  square_feet: 0,
  lot_size: null,
  property_type: "Single Family",
  year_built: null,
  listing_status: "Active",
  client_status: "Interested",
  notes: "",
};

const propertyTypes = [
  "Single Family",
  "Multi Family",
  "Condo",
  "Townhouse",
  "Land",
  "Commercial",
  "Other",
];
const listingStatuses = [
  "New",
  "Active",
  "Pending",
  "Under Contract",
  "Sold",
  "Withdrawn",
  "Off Market",
];
const clientStatuses = [
  "Interested",
  "Favorite",
  "Schedule Showing",
  "Offer Submitted",
  "Offer Accepted",
  "Not Interested",
  "Watching",
  "Closed",
];

export function PropertyFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: (Partial<PropertyFormValues> & { id?: string }) | null;
  onSubmit: (values: PropertyFormValues) => void | Promise<void>;
  submitting?: boolean;
  error?: string | null;
}) {
  const [form, setForm] = useState<PropertyFormValues>(empty);
  const [local, setLocal] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        ...empty,
        ...(editing || {}),
        photo_url: editing?.photo_url ?? "",
        url: editing?.url ?? "",
        notes: editing?.notes ?? "",
      } as PropertyFormValues);
      setLocal(null);
    }
  }, [open, editing]);

  const set = <K extends keyof PropertyFormValues>(k: K, v: PropertyFormValues[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLocal(null);
    if (!form.address.trim()) return setLocal("Property address is required.");
    if (!form.city.trim()) return setLocal("City is required.");
    if (!form.state.trim()) return setLocal("State is required.");
    if (!form.zip_code.trim()) return setLocal("ZIP code is required.");
    try {
      await onSubmit(form);
    } catch (e) {
      setLocal((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing?.id ? "Edit property" : "Add a property"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Photo URL</Label>
            <Input
              value={form.photo_url}
              onChange={(e) => set("photo_url", e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div>
            <Label>URL</Label>
            <Input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="Listing link"
            />
          </div>

          <div>
            <Label>Property Address *</Label>
            <Input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>City *</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <Label>State *</Label>
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div>
              <Label>ZIP Code *</Label>
              <Input value={form.zip_code} onChange={(e) => set("zip_code", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Price</Label>
              <Input
                type="number"
                value={form.price || ""}
                onChange={(e) => set("price", parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Square Feet</Label>
              <Input
                type="number"
                value={form.square_feet || ""}
                onChange={(e) => set("square_feet", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Bedrooms</Label>
              <Input
                type="number"
                min={0}
                value={form.bedrooms || ""}
                onChange={(e) => set("bedrooms", parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Bathrooms</Label>
              <Input
                type="number"
                step="0.5"
                min={0}
                value={form.bathrooms || ""}
                onChange={(e) => set("bathrooms", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Lot Size</Label>
              <Input
                type="number"
                step="0.01"
                value={form.lot_size ?? ""}
                onChange={(e) =>
                  set("lot_size", e.target.value === "" ? null : parseFloat(e.target.value))
                }
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Property Type</Label>
              <Select
                value={form.property_type}
                onValueChange={(v) => set("property_type", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year Built</Label>
              <Input
                type="number"
                value={form.year_built ?? ""}
                onChange={(e) =>
                  set("year_built", e.target.value === "" ? null : parseInt(e.target.value))
                }
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Listing Status</Label>
              <Select
                value={form.listing_status}
                onValueChange={(v) => set("listing_status", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {listingStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Client Status</Label>
              <Select
                value={form.client_status}
                onValueChange={(v) => set("client_status", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clientStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {(local || error) && (
            <p className="text-sm text-red-600">{local || error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : editing?.id ? "Save changes" : "Add property"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
