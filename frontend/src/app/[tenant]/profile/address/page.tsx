"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getUserAddresses,
  addUserAddress,
  deleteUserAddress,
} from "@/lib/api/auth";
import type { UserAddress } from "@/types/users";

export default function ProfileAddressPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // New Address Form State
  const [addressForm, setAddressForm] = useState({
    country: "Nigeria",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    async function loadAddresses() {
      setIsLoadingAddresses(true);
      try {
        const addressList = await getUserAddresses();
        if (Array.isArray(addressList)) {
          setAddresses(addressList);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoadingAddresses(false);
      }
    }
    loadAddresses();
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !addressForm.street ||
      !addressForm.city ||
      !addressForm.state ||
      !addressForm.zipCode
    ) {
      toast.error("Please fill in all required address fields");
      return;
    }

    try {
      const newAddress = await addUserAddress({
        street: addressForm.street,
        city: addressForm.city,
        state: addressForm.state,
        zip_code: addressForm.zipCode,
        country: addressForm.country,
        phone: addressForm.phone,
        email: addressForm.email,
        first_name: "",
        last_name: "",
        is_default: addresses.length === 0,
      });

      if (newAddress && newAddress.id) {
        setAddresses((prev) => [...prev, newAddress]);
        toast.success("New address added successfully!");
        setAddressForm({
          country: "Nigeria",
          street: "",
          city: "",
          state: "",
          zipCode: "",
          phone: "",
          email: "",
        });
      }
    } catch {
      toast.error("Failed to add address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteUserAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  return (
    <div className="space-y-8">
      {/* Saved Addresses Cards */}
      {isLoadingAddresses ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading saved addresses...</span>
        </div>
      ) : addresses.length > 0 ? (
        <div className="space-y-4">
          <h4 className="font-bold text-foreground">Saved Addresses</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="border border-border rounded-xl p-4 bg-muted/20 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">
                      {addr.street}
                    </span>
                    {addr.is_default && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {addr.city}, {addr.state} {addr.zip_code}
                  </p>
                  <p className="text-muted-foreground mt-0.5">{addr.country}</p>
                  {addr.phone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {addr.phone}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-destructive hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Add New Address Form */}
      <div>
        <h4 className="font-bold text-foreground mb-4">Add New Address</h4>
        <form onSubmit={handleAddAddress} className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Country / Region *
            </Label>
            <Select
              value={addressForm.country}
              onValueChange={(val) =>
                setAddressForm({ ...addressForm, country: val })
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nigeria">Nigeria</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Street Address *
            </Label>
            <Input
              value={addressForm.street}
              onChange={(e) =>
                setAddressForm({
                  ...addressForm,
                  street: e.target.value,
                })
              }
              placeholder="Enter Street Address"
              className="h-10"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                City *
              </Label>
              <Input
                value={addressForm.city}
                onChange={(e) =>
                  setAddressForm({
                    ...addressForm,
                    city: e.target.value,
                  })
                }
                placeholder="Select City"
                className="h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                State *
              </Label>
              <Input
                value={addressForm.state}
                onChange={(e) =>
                  setAddressForm({
                    ...addressForm,
                    state: e.target.value,
                  })
                }
                placeholder="Select State"
                className="h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Zip Code *
              </Label>
              <Input
                value={addressForm.zipCode}
                onChange={(e) =>
                  setAddressForm({
                    ...addressForm,
                    zipCode: e.target.value,
                  })
                }
                placeholder="Enter Zip Code"
                className="h-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Phone *
              </Label>
              <Input
                value={addressForm.phone}
                onChange={(e) =>
                  setAddressForm({
                    ...addressForm,
                    phone: e.target.value,
                  })
                }
                placeholder="Enter Phone Number"
                className="h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Email *
              </Label>
              <Input
                type="email"
                value={addressForm.email}
                onChange={(e) =>
                  setAddressForm({
                    ...addressForm,
                    email: e.target.value,
                  })
                }
                placeholder="Enter Email Address"
                className="h-10"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit">Add Address</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
