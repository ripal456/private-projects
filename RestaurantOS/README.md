# RestaurantOS 🍕

A full-featured Vue 3 web application demonstrating a modern restaurant ordering system with real-time kitchen dashboard integration. Features a customer-facing webshop and staff kitchen dashboard connected through shared Pinia state management.

---

## 📋 Project Overview

**RestaurantOS** is a two-view Vue 3 application that simulates a complete restaurant ordering ecosystem:

### View 1: Customer Webshop

- Browse menu items across multiple categories (Pizza, Pasta, Dessert, Drinks)
- Real-time category filtering
- Add items to cart with quantity management
- Live cart total calculation
- Place orders that instantly appear in the kitchen dashboard

### View 2: Kitchen Dashboard

- Real-time order management system
- Live order statistics (Total, New, Preparing, Ready)
- Filter orders by status
- Advance order status through workflow: New → Preparing → Ready → Done
- Visual progress tracking with color-coded status badges
- Toast notifications for order updates

### Key Feature: Shared State

Orders placed in the webshop **instantly appear** in the kitchen dashboard via Pinia's centralized state management, simulating a real WebSocket-based ordering system.

---

## 🛠 Tech Stack

| Layer                | Technology                         |
| -------------------- | ---------------------------------- |
| **Framework**        | Vue 3 (Composition API)            |
| **State Management** | Pinia                              |
| **Routing**          | Vue Router 4                       |
| **Styling**          | Tailwind CSS + Custom CSS          |
| **Build Tool**       | Vite 5                             |
| **External API**     | TheMealDB (free, no auth required) |
| **Data Fallback**    | Mock JSON (local)                  |

---

## 📁 Project Structure

```
res/
├── src/
│   ├── components/
│   │   ├── MenuCard.vue          # Menu item display card
│   │   ├── CartItem.vue          # Cart item with qty controls
│   │   ├── StatCard.vue          # Dashboard statistics card
│   │   └── OrderCard.vue         # Order display with status/progress
│   ├── views/
│   │   ├── WebshopView.vue       # Customer order interface
│   │   └── DashboardView.vue     # Kitchen management interface
│   ├── stores/
│   │   └── restaurant.js         # Pinia store (cart, orders, actions)
│   ├── router/
│   │   └── index.js              # Vue Router configuration
│   ├── data/
│   │   └── menu.js               # Menu data, categories, status config
│   ├── App.vue                   # Root app component with nav
│   ├── main.js                   # Entry point
│   └── style.css                 # Global styles + Tailwind import
├── index.html                     # HTML template
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── package.json                   # Dependencies & scripts
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Navigate to project directory
cd /Users/ripalshah/Documents/projects-main/res

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## ✨ Features Breakdown

### 1. **Menu & Category Filtering**

- 10 menu items across 4 categories
- Instant category filtering (All, Pizza, Pasta, Dessert, Drinks)
- Item badges (Popular, Chef, New)

### 2. **Shopping Cart**

- Add/remove items dynamically
- Adjust quantities with +/- buttons
- Real-time cart total calculation
- Cart count badge in navigation
- Empty state messaging

### 3. **Order Management**

- Place order → instantly syncs to dashboard
- Order ID generation (#1001, #1002, etc.)
- Order timestamp tracking
- Item list with quantities and prices

### 4. **Dashboard Statistics**

- **Total Orders**: Count of all orders
- **New**: Orders awaiting kitchen pickup
- **Preparing**: Orders being prepared
- **Ready**: Completed orders awaiting pickup

### 5. **Order Status Workflow**

```
New → Preparing → Ready → Done
```

- Color-coded status badges
- Progress bar visualization
- One-click status advancement
- Disabled button when workflow complete

### 6. **Real-Time Features**

- Toast notifications for actions
- Order filtering by status
- Auto-hide notifications (2.2s)
- Slide-in animations for new orders

---

## 📱 Pinia Store Structure

### State

```javascript
{
  cart: [],           // Current shopping cart items
  orders: [],         // All placed orders
  orderCounter: 1000  // Auto-incrementing order ID
}
```

### Computed Properties

- `cartItemCount`: Total items in cart (sum of quantities)
- `cartTotal`: Total price of all items

### Actions

- `addToCart(menuItemId)`: Add/increase item in cart
- `updateCartQty(menuItemId, delta)`: Adjust item quantity
- `clearCart()`: Empty the cart
- `placeOrder()`: Create order from cart, sync to store
- `advanceOrderStatus(orderId)`: Move order to next status

---

## 🎨 Design System

### Colors

- **Background**: `#0d0d0d` (dark-bg)
- **Surface**: `#161616` (dark-surface)
- **Accent**: `#e8ff4d` (neon-lime)
- **Secondary Accent**: `#ff6b35` (neon-orange)
- **Status Colors**:
  - New: Lime `#e8ff4d`
  - Preparing: Orange `#fb923c`
  - Ready: Green `#4ade80`
  - Done: Gray `#444`

### Typography

- **Display**: Syne (headings, titles)
- **Body**: DM Sans (text content)

### Components

- Rounded corners: `rounded-lg`, `rounded-xl`, `rounded-2xl`
- Borders: `1px solid rgba(255,255,255,0.1)`
- Transitions: `0.15s` to `0.5s` ease

---

## 🔄 Data Flow Diagram

```
┌─────────────────────┐
│   WebshopView       │
│  - Menu browsing    │
│  - Add to cart      │
│  - Place order      │
└──────────┬──────────┘
           │ store.placeOrder()
           ▼
    ┌──────────────┐
    │ Pinia Store  │
    │ - cart[]     │
    │ - orders[]   │
    └──────────┬───┘
               │ orders sync
               ▼
    ┌──────────────────────┐
    │  DashboardView       │
    │  - View orders       │
    │  - Update status     │
    │  - View stats        │
    └──────────────────────┘
```

---

## 🎯 Key Interactions

### Customer Flow

1. Browse menu by category
2. Click "+" to add items to cart
3. Adjust quantities in cart
4. Click "Place Order" → order created
5. Toast notification confirms order

### Kitchen Flow

1. See incoming orders in real-time
2. View order details and totals
3. Click "Start Preparing" → status changes
4. Click "Mark Ready" → order progress updates
5. Click "Mark Done" → order completes
6. Filter by status to focus on specific orders

---

## 🔧 Development Notes

### Adding New Menu Items

Edit `src/data/menu.js`:

```javascript
{
  id: 11,
  name: 'Lasagna',
  desc: 'Layers of pasta, meat sauce, béchamel',
  price: 14.90,
  emoji: '🍝',
  category: 'Pasta',
  badge: 'Popular'
}
```

### Customizing Colors

Edit `tailwind.config.js` `theme.colors` or update CSS variable in `src/style.css`

### Modifying Status Flow

Edit `src/data/menu.js` `STATUS_FLOW` array and corresponding config objects

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm run build
# Upload dist/ folder to Vercel
```

### Netlify

```bash
npm run build
# Connect Git repo and auto-deploy
```

### GitHub Pages

```bash
npm run build
# Deploy dist/ to gh-pages branch
```

---

## 🌐 External API Integration

RestaurantOS uses **TheMealDB** - a free, open meal database API with no authentication required.

### API Features

- **Endpoint**: https://www.themealdb.com/api/json/v1/1
- **Categories**: Seafood, Vegetarian, Pasta, Dessert, Breakfast, Chicken, Beef, Vegan
- **No API Key Required**: Public API with unlimited requests
- **Response Format**: JSON with meal details (name, ingredients, instructions, images)

### How It Works

1. App loads on startup
2. `src/services/foodAPI.js` fetches meals from TheMealDB
3. Meals are transformed to RestaurantOS format (name, price, category, emoji)
4. Menu displays real meals with dynamic categories
5. **Fallback**: If API is unavailable, uses mock data from `src/data/menu.js`

### Service Function: `loadCompleteMenu()`

```javascript
// Fetches meals from multiple categories
const menu = await loadCompleteMenu();
// Returns: Array of formatted menu items with real meal data
```

### Toggle Between API and Mock Data

To use mock data instead of API, edit `src/stores/restaurant.js`:

```javascript
async function loadMenu() {
  // Change: menu.value = await loadCompleteMenu();
  // To:     menu.value = MENU;  // Use mock data
}
```

---

## 📝 Data Sources

### Live API (Default)

Dynamically fetches 12-15 real meals from TheMealDB across multiple cuisines:

- Real meal names and descriptions
- Dynamic pricing (€8-€20)
- Automatic category assignment
- Popular/Chef/New badges

### Fallback Mock Data

10 Italian restaurant items (if API unavailable):

- 3 Pizzas (Margherita, Diavola, Truffle Fungi)
- 3 Pastas (Bolognese, Cacio e Pepe, Arrabbiata)
- 2 Desserts (Tiramisù, Panna Cotta)
- 2 Drinks (Sparkling Water, Aperol Spritz)

All prices in EUR (€)

---

## 🎓 Learning Outcomes

This project demonstrates:

- ✅ Vue 3 Composition API with `<script setup>`
- ✅ Pinia for centralized state management
- ✅ Vue Router for multi-view applications
- ✅ Tailwind CSS for rapid UI development
- ✅ Component composition and reusability
- ✅ Event handling and form validation
- ✅ Computed properties and reactive state
- ✅ Real-time data synchronization patterns
- ✅ **External API integration** (fetch, async/await)
- ✅ **Error handling and fallback states**
- ✅ **Dynamic data loading and transformation**

---

## 📄 License

Open source project for educational purposes.

---

## 🎯 Future Enhancements

- [ ] Backend API integration
- [ ] WebSocket for real-time updates
- [ ] User authentication
- [ ] Order history and receipts
- [ ] Preparation time estimates
- [ ] Customer notifications
- [ ] Payment processing
- [ ] Admin dashboard for menu management
- [ ] Analytics and reporting
- [ ] Multi-language support
