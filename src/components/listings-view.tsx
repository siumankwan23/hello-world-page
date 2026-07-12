import { useState, useMemo } from "react";
import {
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Ruler,
  Tag,
  Calendar,
  Edit,
  Trash2,
  ImageIcon,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type Listing = {
  id: string;
  mls_number: string | null;
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
  notes: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
};

type ListingsViewProps = {
  listings: Listing[];
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onSelectListing: (listing: Listing) => void;
  isLoading?: boolean;
};

export function ListingsTableView({
  listings,
  onEdit,
  onDelete,
  onSelectListing,
  isLoading,
}: ListingsViewProps) {
  const [sortBy, setSortBy] = useState<"price" | "date" | "status">("date");

  const sorted = useMemo(() => {
    const copy = [...listings];
    if (sortBy === "price") {
      copy.sort((a, b) => b.price - a.price);
    } else if (sortBy === "date") {
      copy.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
    } else if (sortBy === "status") {
      copy.sort((a, b) => a.listing_status.localeCompare(b.listing_status));
    }
    return copy;
  }, [listings, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-500">Loading listings...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <p className="text-slate-600">No listings yet. Add your first listing to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Sort by: {sortBy}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy("date")}>
              Date Updated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("price")}>
              Price
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("status")}>
              Status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="p-3 text-left font-semibold">Address</th>
              <th className="p-3 text-left font-semibold">Price</th>
              <th className="p-3 text-left font-semibold">Beds/Baths</th>
              <th className="p-3 text-left font-semibold">Status</th>
              <th className="p-3 text-left font-semibold">Client Status</th>
              <th className="p-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((listing) => (
              <tr
                key={listing.id}
                className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
                onClick={() => onSelectListing(listing)}
              >
                <td className="p-3">
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-xs"
                  >
                    <p className="font-medium text-slate-900">{listing.address}</p>
                    <p className="text-xs text-slate-500">
                      {listing.city}, {listing.state} {listing.zip_code}
                    </p>
                  </div>
                </td>
                <td className="p-3 font-semibold text-slate-900">
                  ${listing.price.toLocaleString()}
                </td>
                <td className="p-3">
                  <span className="text-slate-600">
                    {listing.bedrooms}bd / {listing.bathrooms.toFixed(1)}ba
                  </span>
                </td>
                <td className="p-3">
                  <Badge
                    variant={
                      listing.listing_status === "Active"
                        ? "default"
                        : listing.listing_status === "Sold"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {listing.listing_status}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant="outline">{listing.client_status}</Badge>
                </td>
                <td className="p-3">
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(listing)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => onDelete(listing.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ListingsCardView({
  listings,
  onEdit,
  onDelete,
  onSelectListing,
  isLoading,
}: ListingsViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-500">Loading listings...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <p className="text-slate-600">No listings yet. Add your first listing to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => (
        <Card
          key={listing.id}
          className="cursor-pointer overflow-hidden transition hover:border-cyan-500 hover:shadow-md"
          onClick={() => onSelectListing(listing)}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="relative h-40 w-full sm:h-auto sm:w-40 sm:shrink-0">
              {listing.photos && listing.photos.length > 0 ? (
                <>
                  <img
                    src={listing.photos[0]}
                    alt={listing.address}
                    className="h-full w-full object-cover"
                  />
                  {listing.photos.length > 1 && (
                    <Badge className="absolute right-2 top-2 gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {listing.photos.length}
                    </Badge>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-100">
                  <ImageIcon className="h-10 w-10 text-slate-300" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{listing.address}</p>
                  <p className="text-sm text-slate-500">
                    {listing.city}, {listing.state} {listing.zip_code}
                  </p>
                </div>
                <p className="text-lg font-bold text-slate-900">
                  ${listing.price.toLocaleString()}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <Bed className="h-4 w-4 text-slate-400" />
                  {listing.bedrooms} bd
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="h-4 w-4 text-slate-400" />
                  {listing.bathrooms.toFixed(1)} ba
                </span>
                <span className="flex items-center gap-1">
                  <Ruler className="h-4 w-4 text-slate-400" />
                  {listing.square_feet.toLocaleString()} sqft
                </span>
                {listing.year_built && <span>Built {listing.year_built}</span>}
                {listing.lot_size && <span>{listing.lot_size} ac lot</span>}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      listing.listing_status === "Active"
                        ? "default"
                        : listing.listing_status === "Sold"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {listing.listing_status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {listing.client_status}
                  </Badge>
                </div>

                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(listing)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => onDelete(listing.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ListingDetailPanel({
  listing,
  onClose,
  onEdit,
  onDelete,
  children,
}: {
  listing: Listing;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      {listing.photos && listing.photos.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Photos</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {listing.photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt={`${listing.address} - ${idx + 1}`}
                className="h-48 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Property Information */}
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Address</p>
              <p className="font-semibold">{listing.address}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Location</p>
              <p className="font-semibold">
                {listing.city}, {listing.state} {listing.zip_code}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Price</p>
              <p className="font-semibold">
                ${listing.price.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">MLS Number</p>
              <p className="font-semibold">{listing.mls_number || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Property Type</p>
              <p className="font-semibold">{listing.property_type}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Year Built</p>
              <p className="font-semibold">{listing.year_built || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Bedrooms</p>
              <p className="font-semibold">{listing.bedrooms}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Bathrooms</p>
              <p className="font-semibold">{listing.bathrooms}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Square Feet</p>
              <p className="font-semibold">
                {listing.square_feet.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Lot Size</p>
              <p className="font-semibold">{listing.lot_size || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Listing Status</p>
              <Badge>{listing.listing_status}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">Client Status</p>
              <Badge variant="outline">{listing.client_status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {listing.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-slate-700">
              {listing.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Activity/Timeline - Placeholder for children */}
      {children}

      {/* Actions */}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onEdit}>
          Edit Listing
        </Button>
        <Button variant="outline" className="flex-1 text-red-600" onClick={onDelete}>
          Delete
        </Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
