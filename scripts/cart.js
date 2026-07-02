(function () {
  const STORAGE_KEY = "kasorra.cart";
  const PRODUCT_STORAGE_KEY = "kasorra.products";
  const seed = window.KasorraSeedData;

  document.addEventListener("DOMContentLoaded", renderCart);

  /** Renders cart lines and the checkout summary from localStorage. */
  function renderCart() {
    const list = document.querySelector("#cartItems");
    const summary = document.querySelector("#cartSummary");
    if (!list || !summary) return;

    const cart = loadCart().filter((item) => productById(item.productId));
    saveCart(cart);

    if (!cart.length) {
      list.innerHTML = `
        <div class="empty-state">
          <h2>Your cart is empty</h2>
          <p>Add products from marketplace listings before starting checkout.</p>
          <a class="primary-action" href="index.html#marketplace-app">Browse products</a>
        </div>
      `;
      summary.innerHTML = renderSummary(0, 0);
      return;
    }

    list.innerHTML = cart.map(renderCartItem).join("");
    summary.innerHTML = renderSummary(cart.length, calculateTotal(cart));
    bindCartControls();
  }

  /** Builds a single cart row with product, supplier, quantity, and line total details. */
  function renderCartItem(item) {
    const product = productById(item.productId);
    const supplier = supplierById(product.supplierId);
    const quantity = Number(item.quantity) || 1;
    const lineTotal = product.price * quantity;

    return `
      <article class="cart-item" data-cart-item="${product.id}">
        <img src="${escapeHtml(product.mediaUrl)}" alt="${escapeHtml(product.name)}">
        <div class="cart-item-body">
          <div>
            <p class="section-eyebrow">${escapeHtml(categoryNames(product))}</p>
            <h2><a href="index.html?product=${encodeURIComponent(product.id)}#marketplace-app">${escapeHtml(product.name)}</a></h2>
            <p>${escapeHtml(product.description)}</p>
            <a class="supplier-link" href="index.html?supplier=${encodeURIComponent(supplier.id)}#supplierProfile">${escapeHtml(supplier.companyName)}</a>
          </div>
          <dl class="product-facts wide">
            <div><dt>Unit price</dt><dd>${formatMoney(product.price)}</dd></div>
            <div><dt>MOQ</dt><dd>${product.moq}</dd></div>
            <div><dt>Quantity</dt><dd>${quantity}</dd></div>
            <div><dt>Total</dt><dd>${formatMoney(lineTotal)}</dd></div>
          </dl>
          <div class="cart-controls">
            <button type="button" class="secondary-action" data-decrease="${product.id}">-</button>
            <input aria-label="Quantity for ${escapeHtml(product.name)}" type="number" min="1" value="${quantity}" data-quantity="${product.id}">
            <button type="button" class="secondary-action" data-increase="${product.id}">+</button>
            <button type="button" class="danger-action" data-remove="${product.id}">Remove</button>
          </div>
        </div>
      </article>
    `;
  }

  /** Builds checkout totals and links to the payment and escrow review module. */
  function renderSummary(lineCount, total) {
    return `
      <h2>Checkout summary</h2>
      <dl class="profile-stats">
        <div><dt>Product lines</dt><dd>${lineCount}</dd></div>
        <div><dt>Estimated total</dt><dd>${formatMoney(total)}</dd></div>
      </dl>
      <a class="primary-action checkout-button" href="payment-escrow.html">Checkout with escrow</a>
      <p class="cart-note">Final freight, samples, and supplier escrow terms are confirmed in checkout.</p>
    `;
  }

  /** Connects quantity, add, remove, and checkout controls to cart state. */
  function bindCartControls() {
    document.querySelectorAll("[data-increase]").forEach((button) => {
      button.addEventListener("click", () => changeQuantity(button.dataset.increase, 1));
    });
    document.querySelectorAll("[data-decrease]").forEach((button) => {
      button.addEventListener("click", () => changeQuantity(button.dataset.decrease, -1));
    });
    document.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", () => removeItem(button.dataset.remove));
    });
    document.querySelectorAll("[data-quantity]").forEach((input) => {
      input.addEventListener("change", () => setQuantity(input.dataset.quantity, Number(input.value)));
    });
  }

  /** Adds or subtracts from an item's quantity while keeping the value at one or more. */
  function changeQuantity(productId, delta) {
    const cart = loadCart().map((item) => {
      if (item.productId !== productId) return item;
      return { ...item, quantity: Math.max(1, (Number(item.quantity) || 1) + delta) };
    });
    saveCart(cart);
    renderCart();
  }

  /** Sets an item's exact quantity from the numeric input. */
  function setQuantity(productId, quantity) {
    const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
    const cart = loadCart().map((item) => item.productId === productId ? { ...item, quantity: safeQuantity } : item);
    saveCart(cart);
    renderCart();
  }

  /** Removes a product from the cart. */
  function removeItem(productId) {
    saveCart(loadCart().filter((item) => item.productId !== productId));
    renderCart();
  }

  /** Reads the cart from localStorage. */
  function loadCart() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  /** Persists the cart to localStorage. */
  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  /** Finds a product by id. */
  function productById(productId) {
    return allProducts().find((product) => product.id === productId);
  }

  /** Combines browser-uploaded products with seeded products. */
  function allProducts() {
    try {
      const stored = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY));
      return (Array.isArray(stored) ? stored : []).concat(seed.products);
    } catch (error) {
      return seed.products;
    }
  }

  /** Finds a supplier by id. */
  function supplierById(supplierId) {
    return seed.suppliers.find((supplier) => supplier.id === supplierId) || seed.suppliers[0];
  }

  /** Returns readable category labels for a product. */
  function categoryNames(product) {
    return product.categories
      .map((categoryId) => seed.categories.find((category) => category.id === categoryId)?.name || categoryId)
      .join(", ");
  }

  /** Formats Philippine peso values. */
  function formatMoney(value) {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
  }

  /** Escapes dynamic text before HTML insertion. */
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
