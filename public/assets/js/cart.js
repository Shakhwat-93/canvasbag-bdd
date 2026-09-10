const STORAGE_KEY = "canvasbag-cart";

// Retrieve cart items from localStorage
function getCartItems() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const items = stored ? JSON.parse(stored) : [];
    return items.map(item => {
      let img = item.image;
      if (!img || img === 'null' || img === 'undefined' || String(img).trim() === '') {
        img = '/brand/logo.webp';
      }
      item.image = img;
      return item;
    });
  } catch (e) {
    console.error("Failed to read cart from localStorage:", e);
    return [];
  }
}

// Save cart items to localStorage
function saveCartItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateCartUI();
  } catch (e) {
    console.warn("Failed to write cart to localStorage:", e);
  }
}

// Add item to cart
function addItem(item) {
  const quantity = item.quantity || 1;
  const items = getCartItems();

  let cleanImage = item.image;
  if (!cleanImage || cleanImage === 'null' || cleanImage === 'undefined' || String(cleanImage).trim() === '') {
    cleanImage = '/brand/logo.webp';
  }
  
  const existing = items.find(
    (entry) => entry.productId === item.productId && entry.variantId === item.variantId
  );

  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 10);
    if (!existing.image || existing.image === '/brand/logo.webp' || existing.image === 'null') {
      existing.image = cleanImage;
    }
  } else {
    items.push({
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      price: item.price,
      variantId: item.variantId || 'standard',
      variantName: item.variantName || 'Standard',
      image: cleanImage,
      quantity: quantity
    });
  }

  saveCartItems(items);

  // Trigger GTM/Meta Pixel Analytics
  trackEvent("add_to_cart", {
    value: item.price * quantity,
    items: [{
      item_id: item.productId,
      item_name: item.name,
      item_brand: "CanvasBag",
      item_variant: item.variantName || "Standard",
      price: item.price,
      quantity: quantity
    }]
  });

  showToast("Added to Cart", `${item.name} (${item.variantName || "Standard"}) added successfully.`);
}

// Remove item from cart
function removeItem(productId, variantId) {
  let items = getCartItems();
  const itemToRemove = items.find((i) => i.productId === productId && i.variantId === variantId);
  
  items = items.filter((item) => !(item.productId === productId && item.variantId === variantId));
  saveCartItems(items);

  if (itemToRemove) {
    // Trigger GTM/Meta Pixel Analytics
    trackEvent("remove_from_cart", {
      value: itemToRemove.price * itemToRemove.quantity,
      items: [{
        item_id: itemToRemove.productId,
        item_name: itemToRemove.name,
        item_brand: "CanvasBag",
        item_variant: itemToRemove.variantName || "Standard",
        price: itemToRemove.price,
        quantity: itemToRemove.quantity
      }]
    });
    showToast("Removed from Cart", `${itemToRemove.name} removed.`);
  }
}

// Update item quantity
function updateQuantity(productId, variantId, quantity) {
  const items = getCartItems();
  const existing = items.find((i) => i.productId === productId && i.variantId === variantId);

  if (existing) {
    existing.quantity = Math.min(Math.max(quantity, 1), 10);
    saveCartItems(items);
  }
}

// Clear cart
function clearCart() {
  saveCartItems([]);
}

/* ──────────────────────────────────────────────────────────
   DRAWER & MENU TOGGLE CONTROLS
   ────────────────────────────────────────────────────────── */

function toggleCartDrawer(isOpen) {
  const drawer = document.getElementById("cart-drawer");
  if (!drawer) return;

  const panel = drawer.querySelector(".relative");

  if (isOpen) {
    drawer.classList.remove("opacity-0", "pointer-events-none");
    panel.classList.remove("translate-x-full");
    renderCartDrawerItems();
  } else {
    drawer.classList.add("opacity-0", "pointer-events-none");
    panel.classList.add("translate-x-full");
  }
}

function toggleMobileMenu(isOpen) {
  const menu = document.getElementById("mobile-menu");
  if (!menu) return;

  const panel = menu.querySelector(".transition-transform");

  if (isOpen) {
    menu.classList.remove("opacity-0", "pointer-events-none");
    panel.classList.remove("translate-x-full");
  } else {
    menu.classList.add("opacity-0", "pointer-events-none");
    panel.classList.add("translate-x-full");
  }
}

function toggleMobileShop() {
  const submenu = document.getElementById("mobile-shop-submenu");
  const chevron = document.getElementById("mobile-shop-chevron");
  if (!submenu) return;

  if (submenu.classList.contains("hidden")) {
    submenu.classList.remove("hidden");
    chevron.classList.add("rotate-180");
  } else {
    submenu.classList.add("hidden");
    chevron.classList.remove("rotate-180");
  }
}

/* ──────────────────────────────────────────────────────────
   UI RENDERING ENGINES
   ────────────────────────────────────────────────────────── */

function updateCartUI() {
  const items = getCartItems();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Update header badges
  const badges = document.querySelectorAll("#cart-count-badge");
  badges.forEach(badge => {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  });

  // Update mobile cart badge
  const mobileCartBadge = document.getElementById("mobile-cart-badge");
  if (mobileCartBadge) {
    if (count > 0) {
      mobileCartBadge.textContent = count;
      mobileCartBadge.classList.remove("hidden");
    } else {
      mobileCartBadge.classList.add("hidden");
    }
  }

  // Helper to convert to Bangla digits
  const toBanglaDigits = (num) => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (digit) => banglaDigits[digit]);
  };

  // Update floating middle cart widget (Show ONLY when cart has items)
  const floatingWidget = document.getElementById("mobile-floating-cart-widget") || document.querySelector(".widget-cart-count")?.closest("button");
  if (floatingWidget) {
    if (count > 0) {
      floatingWidget.classList.remove("hidden");
      floatingWidget.classList.add("flex");
    } else {
      floatingWidget.classList.add("hidden");
      floatingWidget.classList.remove("flex");
    }
  }

  const widgetCounts = document.querySelectorAll(".widget-cart-count");
  widgetCounts.forEach(el => el.textContent = count);
  
  const widgetTotals = document.querySelectorAll(".widget-cart-total");
  widgetTotals.forEach(el => el.textContent = toBanglaDigits(subtotal));

  // Re-render items in active views
  renderCartDrawerItems();
  
  if (document.getElementById("cart-page-container") && typeof renderCartPage === 'function') {
    renderCartPage();
  }
  if (document.getElementById("checkout-form-container")) {
    if (typeof initializeCheckout === 'function') {
      initializeCheckout();
    } else if (typeof renderCheckoutSummary === 'function') {
      renderCheckoutSummary();
    }
  }
}

// Render items inside sliding Cart Drawer
function renderCartDrawerItems() {
  const container = document.getElementById("cart-drawer-items-container");
  if (!container) return;

  const items = getCartItems();
  let subtotal = 0;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <div class="grid h-16 w-16 place-items-center rounded-full bg-slate-50 border border-slate-100">
          <svg class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1,0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0,1-1.12-1.243l1.264-12A1.125 1.125 0 0,1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1,1-.75 0 .375.375 0 0,1 .75 0Zm7.5 0a.375.375 0 1,1-.75 0 .375.375 0 0,1 .75 0Z"/></svg>
        </div>
        <div class="space-y-1">
          <p class="text-sm font-bold text-slate-800">Your cart is empty</p>
          <p class="text-xs text-slate-400">Add premium carry items to start your style</p>
        </div>
        <button onclick="toggleCartDrawer(false)" class="bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
          Shop Carry
        </button>
      </div>
    `;
    
    // Disable Checkout button
    const summary = document.getElementById("cart-drawer-summary");
    if (summary) {
      summary.querySelector("a").classList.add("pointer-events-none", "opacity-50");
    }
  } else {
    // Enable checkout button
    const summary = document.getElementById("cart-drawer-summary");
    if (summary) {
      summary.querySelector("a").classList.remove("pointer-events-none", "opacity-50");
    }

    container.innerHTML = items.map((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      return `
        <div class="flex items-center gap-4 py-5 border-b border-slate-100 last:border-0">
          <div class="relative h-20 w-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-150 shrink-0 shadow-xs">
            <img src="${item.image || '/brand/logo.webp'}" alt="${item.name}" class="h-full w-full object-cover" onerror="this.onerror=null;this.src='/brand/logo.webp';" />
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-[14px] sm:text-[15px] font-black text-slate-900 leading-snug" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.name}</h4>
            <p class="text-xs text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              ${item.variantName}
            </p>
            <div class="flex items-center justify-between mt-3.5">
              <span class="text-[15px] font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 shadow-sm">${item.price} Tk</span>
              <!-- Quantity Selector -->
              <div class="flex items-center gap-2 border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button onclick="updateQuantity('${item.productId}', '${item.variantId}', ${item.quantity - 1})" class="h-7 w-7 rounded-lg bg-white flex items-center justify-center font-extrabold text-slate-850 hover:bg-slate-100 text-sm shadow-xs cursor-pointer select-none">-</button>
                <span class="text-sm font-black text-slate-900 w-6 text-center select-none">${item.quantity}</span>
                <button onclick="updateQuantity('${item.productId}', '${item.variantId}', ${item.quantity + 1})" class="h-7 w-7 rounded-lg bg-white flex items-center justify-center font-extrabold text-slate-850 hover:bg-slate-100 text-sm shadow-xs cursor-pointer select-none">+</button>
              </div>
            </div>
          </div>
          <button onclick="removeItem('${item.productId}', '${item.variantId}')" class="text-slate-400 hover:text-red-650 hover:bg-red-50 p-2.5 rounded-xl transition-all cursor-pointer shrink-0">
            <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      `;
    }).join("");
  }

  // Update subtotal
  const subtotalEl = document.getElementById("cart-drawer-subtotal");
  if (subtotalEl) {
    subtotalEl.textContent = `${subtotal} Tk`;
  }
}

/* ──────────────────────────────────────────────────────────
   PREMIUM FLOATING TOASTS
   ────────────────────────────────────────────────────────── */

function showToast(title, description) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "flex flex-col bg-white border border-slate-150 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)] pointer-events-auto transition-all duration-300 translate-y-5 opacity-0 w-72 sm:w-80";
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary shrink-0">
        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-slate-800">${title}</h4>
        <p class="text-[11px] text-slate-400 font-semibold mt-0.5 leading-relaxed">${description}</p>
      </div>
    </div>
  `;

  container.appendChild(toast);

  // Trigger entrance animation
  setTimeout(() => {
    toast.classList.remove("translate-y-5", "opacity-0");
  }, 50);

  // Auto dismiss
  setTimeout(() => {
    toast.classList.add("translate-y-5", "opacity-0");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Initial binding on load
window.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
});
