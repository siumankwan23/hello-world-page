import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";

type Listing = {
  id?: string;
  search_id?: string;
  mls_number?: string | null;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number | null;
  property_type?: string;
  year_built?: number | null;
  listing_status?: string;
  client_status?: string;
  notes?: string | null;
  photos?: string[];
};

type ListingFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchId: string;
  editing?: Listing | null;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
};

export function ListingFormDialog({
  open,
  onOpenChange,
  searchId,
  editing,
  onSubmit,
  isSubmitting,
  error,
}: ListingFormDialogProps) {
  const [formData, setFormData] = useState<Listing>({
    address: "",
    city: "",
    state: "CA",
    zip_code: "",
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    square_feet: 0,
    property_type: "Single Family",
    listing_status: "Active",
    client_status: "Interested",
    photos: [],
  });
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (open) {
      if (editing) {
        setFormData(editing);
      } else {
        setFormData({
          address: "",
          city: "",
          state: "CA",
          zip_code: "",
          price: 0,
          bedrooms: 0,
          bathrooms: 0,
          square_feet: 0,
          property_type: "Single Family",
          listing_status: "Active",
          client_status: "Interested",
          photos: [],
        });
      }
      setLocalError("");
    }
  }, [open, editing]);

  const handleSubmit = async () => {
    setLocalError("");

    // Validation
    if (!formData.address?.trim())
      return setLocalError("Address is required");
    if (!formData.city?.trim()) return setLocalError("City is required");
    if (!formData.state?.trim()) return setLocalError("State is required");
    if (!formData.zip_code?.trim())
      return setLocalError("ZIP code is required");
    if (!formData.price) return setLocalError("Price is required");
    if (formData.bedrooms == null) return setLocalError("Bedrooms is required");
    if (formData.bathrooms == null)
      return setLocalError("Bathrooms is required");
    if (!formData.square_feet)
      return setLocalError("Square feet is required");
    if (!formData.property_type)
      return setLocalError("Property type is required");
    if (!formData.listing_status)
      return setLocalError("Listing status is required");
    if (!formData.client_status)
      return setLocalError("Client status is required");

    try {
      await onSubmit({
        ...(editing?.id && { id: editing.id }),
        search_id: searchId,
        ...formData,
      });
      onOpenChange(false);
    } catch (err) {
      setLocalError((err as Error).message || "Failed to save listing");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-screen overflow-y-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Listing" : "Add a New Listing"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <div>
            <h4 className="mb-3 font-semibold">Property Information</h4>
            <div className="space-y-3">
              <div>
                <Label>Address *</Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.city || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input
                    value={formData.state || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label>ZIP Code *</Label>
                  <Input
                    value={formData.zip_code || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, zip_code: e.target.value })
                    }
                    placeholder="94103"
                  />
                </div>
              </div>

              <div>
                <Label>MLS Number</Label>
                <Input
                  value={formData.mls_number || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, mls_number: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Financial & Physical Details */}
          <div>
            <h4 className="mb-3 font-semibold">Details</h4>
            <div className="space-y-3">
              <div>
                <Label>Price *</Label>
                <Input
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="1000000"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <Label>Bedrooms *</Label>
                  <Input
                    type="number"
                    value={formData.bedrooms || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bedrooms: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <Label>Bathrooms *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.bathrooms || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bathrooms: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <Label>Sq Feet *</Label>
                  <Input
                    type="number"
                    value={formData.square_feet || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        square_feet: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <Label>Lot Size</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.lot_size || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lot_size: parseFloat(e.target.value) || null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Property Type *</Label>
                  <Select
                    value={formData.property_type || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, property_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Family">Single Family</SelectItem>
                      <SelectItem value="Multi Family">Multi Family</SelectItem>
                      <SelectItem value="Condo">Condo</SelectItem>
                      <SelectItem value="Townhouse">Townhouse</SelectItem>
                      <SelectItem value="Land">Land</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year Built</Label>
                  <Input
                    type="number"
                    value={formData.year_built || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year_built: parseInt(e.target.value) || null,
                      })
                    }
                    min="1800"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Fields */}
          <div>
            <h4 className="mb-3 font-semibold">Status</h4>
            <div className="space-y-3">
              <div>
                <Label>Listing Status *</Label>
                <Select
                  value={formData.listing_status || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, listing_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Under Contract">Under Contract</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="Off Market">Off Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Client Status *</Label>
                <Select
                  value={formData.client_status || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interested">Interested</SelectItem>
                    <SelectItem value="Favorite">Favorite</SelectItem>
                    <SelectItem value="Schedule Showing">
                      Schedule Showing
                    </SelectItem>
                    <SelectItem value="Offer Submitted">
                      Offer Submitted
                    </SelectItem>
                    <SelectItem value="Offer Accepted">
                      Offer Accepted
                    </SelectItem>
                    <SelectItem value="Not Interested">
                      Not Interested
                    </SelectItem>
                    <SelectItem value="Watching">Watching</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any notes about this listing..."
              rows={3}
              className="resize-none"
            />
          </div>

          {(localError || error) && (
            <p className="text-sm text-red-600">{localError || error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editing ? "Update Listing" : "Add Listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
