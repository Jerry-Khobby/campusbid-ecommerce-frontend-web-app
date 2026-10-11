"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Bell,
  Check,
  CreditCard,
  Edit2,
  Heart,
  Loader2,
  LocateFixed,
  LogOut,
  MapPin,
  Plus,
  Settings,
  Trash2,
  Upload,
  User,
  type LucideIcon,
  X,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { OptimizedImage } from "@/components/optimized-image"
import { ApiError } from "@/lib/api/client"
import { formatCurrency } from "@/lib/format"
import { getDisplayName, getInitials, useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { fetchProduct, type Product } from "@/lib/api/products"
import type { Address, PaymentMethodRecord, SafeUser } from "@/lib/api/types"
import {
  addPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  updateProfile,
  uploadProfileImage,
  useAddAddress,
  useAddresses,
  useDeleteAddress,
  useUpdateAddress,
  type AddressInput,
  type PaymentMethodInput,
  type ProfileUpdateInput,
} from "@/lib/api/users"
import { NotificationsPanel } from "@/components/notifications-panel"
import { ConfirmDialog } from "@/components/confirm-dialog"

type TabId = "profile" | "addresses" | "payment" | "saved" | "notifications" | "settings"

const PAYMENT_METHODS_QUERY_KEY = ["payment-methods"] as const

const TAB_CONFIG: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "saved", label: "Saved Items", icon: Heart },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
]

function isTabId(value: string | null): value is TabId {
  return TAB_CONFIG.some((tab) => tab.id === value)
}

const EMPTY_ADDRESS_FORM: AddressFormValues = {
  label: "",
  building: "",
  room: "",
  instructions: "",
  latitude: "",
  longitude: "",
  isDefault: false,
}

const EMPTY_PAYMENT_METHOD_FORM: PaymentMethodInput = {
  type: "card",
  provider: "",
  last4: "",
  isDefault: false,
}

export default function ProfilePage() {
  const { user, logout, refetchUser, savedItemIds, toggleSavedItem } = useUser()
  const { addNotification } = useNotification()
  // ?tab=addresses lets other pages (e.g. checkout with no address) link
  // straight to the section the user needs.
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<TabId>(isTabId(requestedTab) ? requestedTab : "profile")
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<ProfileUpdateInput>({})

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await refetchUser()
      setIsEditing(false)
      addNotification("Profile updated successfully", "success")
    },
    onError: (error) => addNotification(getErrorMessage(error, "Failed to update profile"), "error"),
  })

  const uploadImageMutation = useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: async () => {
      await refetchUser()
      addNotification("Profile picture updated successfully", "success")
    },
    onError: (error) => addNotification(getErrorMessage(error, "Failed to upload profile picture"), "error"),
  })

  const startEditing = () => {
    if (!user) return
    setEditData({
      firstName: user.profile.firstName ?? "",
      lastName: user.profile.lastName ?? "",
      phoneNumber: user.profile.phoneNumber ?? "",
      studentId: user.profile.studentId ?? "",
      university: user.profile.university ?? "",
    })
    setIsEditing(true)
  }

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) uploadImageMutation.mutate(file)
  }

  const handleRemoveSavedItem = (itemId: string) => {
    toggleSavedItem(itemId)
    addNotification("Item removed from saved", "info")
  }

  const handleLogout = async () => {
    await logout()
    addNotification("Logged out successfully", "info")
  }

  if (!user) {
    return <ProfileLoadingState />
  }

  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-6 pb-24">
      <ProfilePageHeader />

      <ProfileHeaderCard
        user={user}
        isUploadingImage={uploadImageMutation.isPending}
        onUploadImage={handleProfileImageUpload}
        onStartEdit={startEditing}
      />

      {isEditing && (
        <EditProfileForm
          value={editData}
          onChange={setEditData}
          onSave={() => updateProfileMutation.mutate(editData)}
          onCancel={() => setIsEditing(false)}
          isSaving={updateProfileMutation.isPending}
        />
      )}

      <TabNavigation activeTab={activeTab} onSelectTab={setActiveTab} />

      <div className="space-y-4">
        {activeTab === "profile" && <AccountInfoCard user={user} />}
        {activeTab === "addresses" && <AddressesSection />}
        {activeTab === "payment" && <PaymentMethodsSection />}
        {activeTab === "saved" && <SavedItemsSection savedItemIds={savedItemIds} onRemove={handleRemoveSavedItem} />}
        {activeTab === "notifications" && <NotificationsPanel />}
        {activeTab === "settings" && <SettingsSection onLogout={handleLogout} />}
      </div>
    </main>
  )
}

function ProfilePageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Profile</h1>
      <p className="text-sm md:text-base text-muted-foreground">
        Logged in as <span className="font-semibold">Student</span>
      </p>
    </div>
  )
}

function ProfileHeaderCard({
  user,
  isUploadingImage,
  onUploadImage,
  onStartEdit,
}: {
  user: SafeUser
  isUploadingImage: boolean
  onUploadImage: (event: React.ChangeEvent<HTMLInputElement>) => void
  onStartEdit: () => void
}) {
  return (
    <Card className="p-4 md:p-6 mb-6 bg-card">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-accent flex items-center justify-center overflow-hidden">
            {user.profile.profileImage ? (
              <OptimizedImage
                src={user.profile.profileImage}
                alt={getDisplayName(user)}
                className="w-full h-full"
                showSkeleton={false}
              />
            ) : (
              <span className="text-2xl font-bold text-accent-foreground">{getInitials(user)}</span>
            )}
          </div>
          <label
            aria-label="Change profile photo"
            className="absolute bottom-0 right-0 bg-accent text-accent-foreground p-1.5 md:p-1 rounded-full cursor-pointer hover:bg-accent/90 transition-colors">
            {isUploadingImage ? (
              <Loader2 size={16} className="md:w-3.5 md:h-3.5 animate-spin" />
            ) : (
              <Upload size={16} className="md:w-3.5 md:h-3.5" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onUploadImage}
              className="hidden"
              disabled={isUploadingImage}
            />
          </label>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-foreground">{getDisplayName(user)}</h2>
          {getDisplayName(user) !== user.email && (
            <p className="text-sm md:text-base text-muted-foreground">{user.email}</p>
          )}
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={onStartEdit}
          aria-label="Edit profile"
          className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
        >
          <Edit2 size={20} className="text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
    </Card>
  )
}

function EditProfileForm({
  value,
  onChange,
  onSave,
  onCancel,
  isSaving,
}: {
  value: ProfileUpdateInput
  onChange: (value: ProfileUpdateInput) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}) {
  return (
    <Card className="p-4 md:p-6 mb-6 bg-muted border-2 border-accent">
      <h3 className="font-bold text-foreground mb-4">Edit Profile</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <ProfileField label="First Name" value={value.firstName ?? ""} onChange={(firstName) => onChange({ ...value, firstName })} />
        <ProfileField label="Last Name" value={value.lastName ?? ""} onChange={(lastName) => onChange({ ...value, lastName })} />
        <ProfileField label="Phone" value={value.phoneNumber ?? ""} onChange={(phoneNumber) => onChange({ ...value, phoneNumber })} />
        <ProfileField label="University" value={value.university ?? ""} onChange={(university) => onChange({ ...value, university })} />
        <ProfileField label="Student ID" value={value.studentId ?? ""} onChange={(studentId) => onChange({ ...value, studentId })} />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Save Changes
        </Button>
        <Button
          onClick={onCancel}
          className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold flex items-center justify-center gap-2"
        >
          <X size={16} />
          Cancel
        </Button>
      </div>
    </Card>
  )
}

function ProfileField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `profile-${label.toLowerCase().replace(/\s+/g, "-")}`
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground block mb-2">
        {label}
      </label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} />
    </div>
  )
}

function TabNavigation({ activeTab, onSelectTab }: { activeTab: TabId; onSelectTab: (tab: TabId) => void }) {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelectTab(id)}
          aria-label={label}
          aria-current={activeTab === id ? "page" : undefined}
          className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm md:text-base ${
            activeTab === id
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon size={16} className="flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

function AccountInfoCard({ user }: { user: SafeUser }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-foreground mb-3 text-sm md:text-base">Account Information</h3>
      <div className="space-y-3">
        <InfoRow label="Name" value={getDisplayName(user)} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Phone" value={user.profile.phoneNumber || "Not set"} />
        <InfoRow label="University" value={user.profile.university || "Not set"} />
        <InfoRow label="Student ID" value={user.profile.studentId || "Not set"} />
        <InfoRow label="Member Since" value={new Date(user.createdAt).toLocaleDateString()} />
        <InfoRow label="Account Type" value={capitalize(user.role)} valueClassName="text-accent" />
      </div>
    </Card>
  )
}

function InfoRow({
  label,
  value,
  valueClassName = "text-foreground",
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex justify-between text-sm md:text-base">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClassName}`}>{value}</span>
    </div>
  )
}

interface AddressFormValues {
  label: string
  building: string
  room: string
  instructions: string
  latitude: string
  longitude: string
  isDefault: boolean
}

function AddressesSection() {
  const { addNotification } = useNotification()
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)

  const addressesQuery = useAddresses()
  const addAddressMutation = useAddAddress()
  const updateAddressMutation = useUpdateAddress()
  const deleteAddressMutation = useDeleteAddress()

  const handleAddAddress = (values: AddressFormValues) => {
    if (!isValidAddressForm(values)) {
      addNotification(getAddressFormError(values) ?? "Please check the address details", "error")
      return
    }
    addAddressMutation.mutate(toAddressInput(values), {
      onSuccess: () => {
        setIsAddingAddress(false)
        addNotification("Address added", "success")
      },
      onError: (error) => addNotification(getErrorMessage(error, "Failed to add address"), "error"),
    })
  }

  const handleUpdateAddress = (id: string, values: AddressFormValues) => {
    if (!isValidAddressForm(values)) {
      addNotification(getAddressFormError(values) ?? "Please check the address details", "error")
      return
    }
    updateAddressMutation.mutate(
      { id, data: toAddressInput(values) },
      {
        onSuccess: () => {
          setEditingAddressId(null)
          addNotification("Address updated", "success")
        },
        onError: (error) => addNotification(getErrorMessage(error, "Failed to update address"), "error"),
      },
    )
  }

  const handleDeleteAddress = (id: string) => {
    deleteAddressMutation.mutate(id, {
      onSuccess: () => addNotification("Address deleted", "info"),
      onError: (error) => addNotification(getErrorMessage(error, "Failed to delete address"), "error"),
    })
  }

  if (addressesQuery.isLoading) return <LoadingCard label="Loading addresses..." />

  const addresses = addressesQuery.data ?? []

  return (
    <div className="space-y-4">
      {addresses.map((address) =>
        editingAddressId === address._id ? (
          <AddressFormCard
            key={address._id}
            initialValues={toAddressFormValues(address)}
            submitLabel="Save Address"
            isSubmitting={updateAddressMutation.isPending}
            onSubmit={(values) => handleUpdateAddress(address._id, values)}
            onCancel={() => setEditingAddressId(null)}
          />
        ) : (
          <AddressCard
            key={address._id}
            address={address}
            onEdit={() => setEditingAddressId(address._id)}
            onDelete={() => handleDeleteAddress(address._id)}
            isDeleting={deleteAddressMutation.isPending && deleteAddressMutation.variables === address._id}
          />
        ),
      )}

      {addresses.length === 0 && !isAddingAddress && (
        <Card className="p-8 text-center">
          <MapPin size={32} className="mx-auto text-muted-foreground mb-2 opacity-50" />
          <p className="text-muted-foreground">No saved addresses yet</p>
        </Card>
      )}

      {isAddingAddress ? (
        <AddressFormCard
          key="new"
          initialValues={EMPTY_ADDRESS_FORM}
          submitLabel="Add Address"
          isSubmitting={addAddressMutation.isPending}
          onSubmit={handleAddAddress}
          onCancel={() => setIsAddingAddress(false)}
        />
      ) : (
        <Button
          onClick={() => setIsAddingAddress(true)}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Address
        </Button>
      )}
    </div>
  )
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  isDeleting,
}: {
  address: Address
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const secondaryLine = [address.building, address.room].filter(Boolean).join(", ")

  return (
    <Card className="p-3 md:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground text-sm md:text-base truncate">{address.label}</p>
            {address.isDefault && (
              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded flex-shrink-0">
                Default
              </span>
            )}
          </div>
          {secondaryLine && <p className="text-xs md:text-sm text-muted-foreground truncate">{secondaryLine}</p>}
          {address.instructions && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{address.instructions}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            aria-label={`Edit address ${address.label}`}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Edit2 size={16} className="text-muted-foreground" aria-hidden="true" />
          </button>
          <ConfirmDialog
            title="Delete this address?"
            description={`"${address.label}" will be removed from your saved addresses.`}
            onConfirm={onDelete}
            trigger={
              <button
                disabled={isDeleting}
                aria-label={`Delete address ${address.label}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} className="text-destructive" aria-hidden="true" />
              </button>
            }
          />
        </div>
      </div>
    </Card>
  )
}

function AddressFormCard({
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  initialValues: AddressFormValues
  submitLabel: string
  isSubmitting: boolean
  onSubmit: (values: AddressFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState(initialValues)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const hasLocation = hasValidCoordinates(values)
  const [showCoordinates, setShowCoordinates] = useState(false)

  // Vendors deliver to the pinned location, and students don't know their
  // coordinates by heart — the device's location is the normal way to set it.
  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Your browser can't share its location. Enter the coordinates manually below.")
      setShowCoordinates(true)
      return
    }
    setIsLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValues((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }))
        setIsLocating(false)
      },
      (error) => {
        setIsLocating(false)
        setShowCoordinates(true)
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Location access was blocked. Allow it in your browser settings, or enter the coordinates manually below."
            : "Couldn't get your location. Try again, or enter the coordinates manually below.",
        )
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  return (
    <Card className="p-4 md:p-6 border-2 border-accent">
      <div className="space-y-3 mb-4">
        <div>
          <label htmlFor="address-label" className="text-sm font-medium text-foreground block mb-1">
            Label
          </label>
          <Input
            id="address-label"
            placeholder="e.g. Dorm Room, Library"
            value={values.label}
            onChange={(event) => setValues({ ...values, label: event.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="address-building" className="text-sm font-medium text-foreground block mb-1">
              Building <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              id="address-building"
              value={values.building}
              onChange={(event) => setValues({ ...values, building: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="address-room" className="text-sm font-medium text-foreground block mb-1">
              Room <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              id="address-room"
              value={values.room}
              onChange={(event) => setValues({ ...values, room: event.target.value })}
            />
          </div>
        </div>

        <div className="rounded-lg bg-muted p-3 space-y-2">
          <p className="text-sm font-medium text-foreground">Delivery location</p>
          <p className="text-xs text-muted-foreground" role="status">
            {hasLocation
              ? `Location set (${Number(values.latitude).toFixed(4)}, ${Number(values.longitude).toFixed(4)})`
              : "Stand at this address and use your current location so vendors can find you."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2"
          >
            {isLocating ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed size={16} aria-hidden="true" />
            )}
            {isLocating ? "Getting your location..." : hasLocation ? "Update to my current location" : "Use my current location"}
          </Button>
          {locationError && (
            <p className="text-xs text-destructive" role="alert">
              {locationError}
            </p>
          )}
          {showCoordinates ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="address-latitude" className="text-xs text-muted-foreground block mb-1">
                  Latitude
                </label>
                <Input
                  id="address-latitude"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="e.g. 5.6502"
                  value={values.latitude}
                  onChange={(event) => setValues({ ...values, latitude: event.target.value })}
                />
              </div>
              <div>
                <label htmlFor="address-longitude" className="text-xs text-muted-foreground block mb-1">
                  Longitude
                </label>
                <Input
                  id="address-longitude"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="e.g. -0.1869"
                  value={values.longitude}
                  onChange={(event) => setValues({ ...values, longitude: event.target.value })}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCoordinates(true)}
              className="py-1 text-xs text-accent hover:underline"
            >
              Enter coordinates manually instead
            </button>
          )}
        </div>

        <div>
          <label htmlFor="address-instructions" className="text-sm font-medium text-foreground block mb-1">
            Delivery instructions <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            id="address-instructions"
            placeholder="e.g. Call when you reach the porter's lodge"
            value={values.instructions}
            onChange={(event) => setValues({ ...values, instructions: event.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={values.isDefault}
            onCheckedChange={(checked) => setValues({ ...values, isDefault: checked === true })}
          />
          Set as default address
        </label>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => onSubmit(values)}
          disabled={isSubmitting}
          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {submitLabel}
        </Button>
        <Button
          onClick={onCancel}
          className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold flex items-center justify-center gap-2"
        >
          <X size={16} />
          Cancel
        </Button>
      </div>
    </Card>
  )
}

// Number("") is 0, so an empty field has to be ruled out explicitly — otherwise
// a blank location saves as 0,0 (the Gulf of Guinea).
function hasValidCoordinates(values: AddressFormValues): boolean {
  if (values.latitude.trim() === "" || values.longitude.trim() === "") return false
  const latitude = Number(values.latitude)
  const longitude = Number(values.longitude)
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  )
}

/** The first problem with the form as a user-facing message, or null if it's valid. */
function getAddressFormError(values: AddressFormValues): string | null {
  if (values.label.trim().length === 0) return "Give the address a label, e.g. Dorm Room"
  if (!hasValidCoordinates(values)) return "Set the delivery location with \"Use my current location\""
  return null
}

function isValidAddressForm(values: AddressFormValues): boolean {
  return getAddressFormError(values) === null
}

function toAddressInput(values: AddressFormValues): AddressInput {
  return {
    label: values.label.trim(),
    building: values.building.trim() || undefined,
    room: values.room.trim() || undefined,
    instructions: values.instructions.trim() || undefined,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    isDefault: values.isDefault,
  }
}

function toAddressFormValues(address: Address): AddressFormValues {
  return {
    label: address.label,
    building: address.building ?? "",
    room: address.room ?? "",
    instructions: address.instructions ?? "",
    latitude: String(address.location.coordinates[1]),
    longitude: String(address.location.coordinates[0]),
    isDefault: address.isDefault ?? false,
  }
}

function PaymentMethodsSection() {
  const { addNotification } = useNotification()
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)

  const paymentMethodsQuery = useQuery({ queryKey: PAYMENT_METHODS_QUERY_KEY, queryFn: fetchPaymentMethods })

  const addPaymentMethodMutation = useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: (paymentMethods) => {
      queryClient.setQueryData(PAYMENT_METHODS_QUERY_KEY, paymentMethods)
      setIsAdding(false)
      addNotification("Payment method added", "success")
    },
    onError: (error) => addNotification(getErrorMessage(error, "Failed to add payment method"), "error"),
  })

  const deletePaymentMethodMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: (paymentMethods) => {
      queryClient.setQueryData(PAYMENT_METHODS_QUERY_KEY, paymentMethods)
      addNotification("Payment method removed", "info")
    },
    onError: (error) => addNotification(getErrorMessage(error, "Failed to remove payment method"), "error"),
  })

  const handleAddPaymentMethod = (values: PaymentMethodInput) => {
    const isMobileMoney = values.type === "mobile_money"
    const digits = values.last4.trim()

    if (!values.provider.trim()) {
      addNotification(isMobileMoney ? "Network is required" : "Provider is required", "error")
      return
    }
    if (isMobileMoney ? digits.length < 9 : digits.length !== 4) {
      addNotification(
        isMobileMoney ? "Enter a valid phone number" : "Enter the last 4 digits of the card",
        "error",
      )
      return
    }

    // Stored masked the same way for both types — the phone number itself
    // isn't a card number, but only its last 4 digits are kept for display
    // ("MTN •••• 7081"), consistent with how a card is masked.
    addPaymentMethodMutation.mutate({ ...values, last4: digits.slice(-4) })
  }

  if (paymentMethodsQuery.isLoading) return <LoadingCard label="Loading payment methods..." />

  const paymentMethods = paymentMethodsQuery.data ?? []

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-foreground mb-3 text-sm md:text-base">Payment Methods</h3>
      <div className="space-y-3">
        {paymentMethods.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground">No saved payment methods yet</p>
        )}
        {paymentMethods.map((method) => (
          <PaymentMethodRow
            key={method._id}
            method={method}
            onDelete={() => deletePaymentMethodMutation.mutate(method._id)}
            isDeleting={deletePaymentMethodMutation.isPending && deletePaymentMethodMutation.variables === method._id}
          />
        ))}
      </div>

      {isAdding ? (
        <AddPaymentMethodForm
          isSubmitting={addPaymentMethodMutation.isPending}
          onSubmit={handleAddPaymentMethod}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <Button
          onClick={() => setIsAdding(true)}
          className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <Plus size={16} />
          Add Payment Method
        </Button>
      )}
    </Card>
  )
}

function PaymentMethodRow({
  method,
  onDelete,
  isDeleting,
}: {
  method: PaymentMethodRecord
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground text-sm md:text-base truncate">
          {method.provider} •••• {method.last4}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{method.type.replace("_", " ")}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {method.isDefault && (
          <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">Default</span>
        )}
        <ConfirmDialog
          title="Remove this payment method?"
          description={`${method.provider} •••• ${method.last4} will be removed from your saved payment methods.`}
          confirmLabel="Remove"
          onConfirm={onDelete}
          trigger={
            <button
              disabled={isDeleting}
              aria-label={`Remove payment method ${method.provider} ending ${method.last4}`}
              className="p-2 hover:bg-background rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} className="text-destructive" aria-hidden="true" />
            </button>
          }
        />
      </div>
    </div>
  )
}

function AddPaymentMethodForm({
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  isSubmitting: boolean
  onSubmit: (values: PaymentMethodInput) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<PaymentMethodInput>(EMPTY_PAYMENT_METHOD_FORM)

  return (
    <div className="mt-4 space-y-3 p-3 border border-border rounded-lg">
      <select
        aria-label="Payment method type"
        value={values.type}
        onChange={(event) => setValues({ ...values, type: event.target.value })}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
      >
        <option value="card">Card</option>
        <option value="mobile_money">Mobile Money</option>
      </select>
      <Input
        aria-label={values.type === "mobile_money" ? "Network" : "Card provider"}
        placeholder={values.type === "mobile_money" ? "Network (e.g. MTN, Vodafone, AirtelTigo)" : "Provider (e.g. Visa, Mastercard)"}
        value={values.provider}
        onChange={(event) => setValues({ ...values, provider: event.target.value })}
      />
      <Input
        aria-label={values.type === "mobile_money" ? "Phone number" : "Last 4 digits of the card"}
        inputMode="numeric"
        placeholder={values.type === "mobile_money" ? "Phone Number" : "Last 4 digits"}
        maxLength={values.type === "mobile_money" ? 15 : 4}
        value={values.last4}
        onChange={(event) => setValues({ ...values, last4: event.target.value.replace(/\D/g, "") })}
      />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={values.isDefault}
          onCheckedChange={(checked) => setValues({ ...values, isDefault: checked === true })}
        />
        Set as default
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => onSubmit(values)}
          disabled={isSubmitting}
          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Add
        </Button>
        <Button
          onClick={onCancel}
          className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold flex items-center justify-center gap-2"
        >
          <X size={16} />
          Cancel
        </Button>
      </div>
    </div>
  )
}

function SavedItemsSection({
  savedItemIds,
  onRemove,
}: {
  savedItemIds: string[]
  onRemove: (itemId: string) => void
}) {
  // "Saved items" is client-only state (see lib/user-context.tsx — the backend
  // has no endpoint to read/write savedItems), so each id is resolved to a
  // real product individually rather than filtered out of a list response.
  const productQueries = useQueries({
    queries: savedItemIds.map((id) => ({ queryKey: ["product", id], queryFn: () => fetchProduct(id) })),
  })

  if (savedItemIds.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Heart size={32} className="mx-auto text-muted-foreground mb-2 opacity-50" />
        <p className="text-muted-foreground">No saved items yet</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {productQueries.map((query, index) => {
        const itemId = savedItemIds[index]
        if (query.isLoading) return <Card key={itemId} className="p-4 h-20 animate-pulse bg-muted" />
        if (query.isError || !query.data) return null
        return <SavedItemCard key={itemId} item={query.data} onRemove={() => onRemove(itemId)} />
      })}
    </div>
  )
}

function SavedItemCard({ item, onRemove }: { item: Product; onRemove: () => void }) {
  const displayPrice = item.discountPrice ?? item.price
  return (
    <Card className="p-3 md:p-4 hover:bg-muted transition-colors">
      <div className="flex items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <OptimizedImage
            src={item.images[0] ?? "/placeholder.svg"}
            alt={item.name}
            className="w-12 h-12 md:w-16 md:h-16 rounded flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{item.name}</h3>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{item.category}</p>
            <p className="text-sm md:text-base font-bold text-accent mt-1">{formatCurrency(displayPrice)}</p>
          </div>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Remove ${item.name} from saved items`}
          className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
        >
          <X size={18} className="md:w-5 md:h-5 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
    </Card>
  )
}

function SettingsSection({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-4 text-sm md:text-base">Account Actions</h3>
        <Button
          onClick={onLogout}
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </Card>
    </div>
  )
}

function ProfileLoadingState() {
  return (
    <main className="w-full max-w-2xl mx-auto px-4 py-6">
      <Card className="p-8 text-center text-muted-foreground">
        <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
        Loading your profile...
      </Card>
    </main>
  )
}

function LoadingCard({ label }: { label: string }) {
  return (
    <Card className="p-8 text-center text-muted-foreground">
      <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
      {label}
    </Card>
  )
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

