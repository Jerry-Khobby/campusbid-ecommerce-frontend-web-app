"use client"

import { Card } from "@/components/ui/card"

export default function VendorDemoPage() {
  const stats = [
    { name: "Total Revenue", value: "$12,450", change: "+12.5%", icon: "💰" },
    { name: "Total Orders", value: "156", change: "+8.2%", icon: "🛒" },
    { name: "Active Products", value: "24", change: "+2", icon: "📦" },
    { name: "Pending Bids", value: "18", change: "+5", icon: "⚡" },
  ]

  const recentOrders = [
    { id: "ORD-001", customer: "John Doe", product: "Coffee & Pastry", amount: "$12.99", status: "Preparing" },
    { id: "ORD-002", customer: "Jane Smith", product: "Sandwich Combo", amount: "$15.50", status: "Ready" },
    { id: "ORD-003", customer: "Mike Johnson", product: "Protein Shake", amount: "$8.99", status: "Delivered" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border flex flex-col">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-lg">🏪</div>
              <div>
                <h1 className="text-lg font-bold">CampusBid</h1>
                <p className="text-xs text-muted-foreground">Vendor Portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {[
              { name: "Dashboard", icon: "📊", active: true },
              { name: "Products", icon: "📦", active: false },
              { name: "Orders", icon: "🛒", active: false },
              { name: "Bids", icon: "⚡", active: false },
              { name: "Messages", icon: "💬", active: false },
              { name: "Settings", icon: "⚙️", active: false },
            ].map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  item.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">V</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Vendor Name</p>
                <p className="text-xs text-muted-foreground truncate">vendor@example.com</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your store today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <Card key={stat.name} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                      {stat.icon}
                    </div>
                    <span className="text-sm font-medium text-green-600">{stat.change}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                </Card>
              ))}
            </div>

            {/* Recent Orders and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">{order.product}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.amount}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-700"
                              : order.status === "Ready"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <div className="text-2xl mb-2">📦</div>
                    <p className="text-sm font-medium">Add Product</p>
                  </button>
                  <button className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">🛒</div>
                    <p className="text-sm font-medium">View Orders</p>
                  </button>
                  <button className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">⚡</div>
                    <p className="text-sm font-medium">Review Bids</p>
                  </button>
                  <button className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-sm font-medium">Analytics</p>
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
