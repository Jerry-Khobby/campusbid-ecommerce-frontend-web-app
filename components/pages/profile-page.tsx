"use client"

import type React from "react"

import { useState } from "react"
import { User, LogOut, Settings, Heart, CreditCard, Bell, Edit2, Check, X, Upload } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { mockItems } from "@/lib/mock-data"
import { OptimizedImage } from "@/components/optimized-image"

export default function ProfilePage() {
  const { user, logout, updateProfile, toggleSaveItem, updateProfileImage } = useUser()
  const { addNotification } = useNotification()
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "saved" | "payment">("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  })

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        updateProfileImage(imageUrl)
        addNotification("Profile picture updated successfully", "success")
      }
      reader.onerror = () => {
        addNotification("Failed to read the selected image, please try again", "error")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = () => {
    updateProfile(editData)
    setIsEditing(false)
    addNotification("Profile updated successfully", "success")
  }

  const handleLogout = () => {
    logout()
    addNotification("Logged out successfully", "info")
  }

  const savedItems = user ? mockItems.filter((item) => user.savedItems.includes(item.id)) : []

  const handleRemoveSavedItem = (itemId: number) => {
    if (user) {
      toggleSaveItem(itemId)
      addNotification("Item removed from saved", "info")
    }
  }

  if (!user) {
    return (
      <main className="w-full max-w-2xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to view your profile</p>
        </div>
      </main>
    )
  }

  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Logged in as <span className="font-semibold">Buyer</span>
        </p>
      </div>

      {/* User Info Card */}
      <Card className="p-4 md:p-6 mb-6 bg-card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
          {/* Profile Image */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-accent flex items-center justify-center overflow-hidden">
              {user.profileImage ? (
                <OptimizedImage src={user.profileImage} alt={user.name} className="w-full h-full" showSkeleton={false} />
              ) : (
                <span className="text-2xl font-bold text-accent-foreground">{user.avatar}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-accent text-accent-foreground p-1.5 md:p-1 rounded-full cursor-pointer hover:bg-accent/90 transition-colors">
              <Upload size={16} className="md:w-3.5 md:h-3.5" />
              <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
            </label>
          </div>
          {/* User Details */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl md:text-xl font-bold text-foreground">{user.name}</h2>
            <p className="text-sm md:text-base text-muted-foreground">{user.email}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Member since {user.joinDate}</p>
          </div>
          {/* Edit Button */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            >
              <Edit2 size={20} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 md:pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-accent">{user.stats.orders}</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </div>
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-accent">{user.stats.bidsWon}</p>
            <p className="text-xs text-muted-foreground">Bids Won</p>
          </div>
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-accent">{user.stats.rating}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
        </div>
      </Card>

      {/* Edit Profile Modal */}
      {isEditing && (
        <Card className="p-4 md:p-6 mb-6 bg-muted border-2 border-accent">
          <h3 className="font-bold text-foreground mb-4">Edit Profile</h3>
          <div className="space-y-4 mb-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Full Name</label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Email</label>
              <Input
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder="your@email.com"
                type="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Phone</label>
              <Input
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Buttons */}
            <Button
              onClick={handleSaveProfile}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Save Changes
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold flex items-center justify-center gap-2"
            >
              <X size={16} />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: "profile", label: "Profile", icon: User },
          { id: "saved", label: "Saved Items", icon: Heart },
          { id: "payment", label: "Payment", icon: CreditCard },
          { id: "settings", label: "Settings", icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm md:text-base ${
              activeTab === id
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3 text-sm md:text-base">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground">{user.name}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-foreground">{user.phone}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium text-foreground">{user.joinDate}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-medium text-accent capitalize">Buyer</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Saved Items Tab */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            {savedItems.length > 0 ? (
              savedItems.map((item) => (
                <Card key={item.id} className="p-3 md:p-4 hover:bg-muted transition-colors">
                  <div className="flex items-center justify-between gap-3 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <OptimizedImage
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 md:w-16 md:h-16 rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{item.name}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{item.vendor}</p>
                        <p className="text-sm md:text-base font-bold text-accent mt-1">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSavedItem(item.id)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                    >
                      <X size={18} className="md:w-5 md:h-5 text-muted-foreground" />
                    </button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <Heart size={32} className="mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-muted-foreground">No saved items yet</p>
              </Card>
            )}
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === "payment" && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3 text-sm md:text-base">Payment Methods</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm md:text-base truncate">Visa ending in 4242</p>
                    <p className="text-xs text-muted-foreground">Expires 12/26</p>
                  </div>
                  <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded flex-shrink-0 ml-2">
                    Default
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm md:text-base truncate">
                      Mastercard ending in 5555
                    </p>
                    <p className="text-xs text-muted-foreground">Expires 08/25</p>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-2 text-sm md:text-base">
                Add Payment Method
              </Button>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm md:text-base">
                <Bell size={18} />
                Notification Preferences
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Order Updates", description: "Get notified about order status changes" },
                  { label: "Flash Sales", description: "Receive alerts for new flash sales" },
                  { label: "Bid Notifications", description: "Get notified when you're outbid" },
                  { label: "Promotional Emails", description: "Receive special offers and promotions" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm md:text-base">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded flex-shrink-0" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4 text-sm md:text-base">Account Actions</h3>
              <Button
                onClick={handleLogout}
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <LogOut size={16} />
                Sign Out
              </Button>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
