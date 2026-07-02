(function () {
  const CART_KEY = "kasorra.cart";
  const PRODUCT_STORAGE_KEY = "kasorra.products";
  const seed = window.KasorraSeedData;

  document.addEventListener("DOMContentLoaded", initEscrowPage);

  /** Renders checkout totals and binds the escrow confirmation action. */
  function initEscrowPage() {
    renderSummary();
    document.querySelector("#confirmEscrow")?.addEventListener("click", () => {
      alert("Escrow review confirmed. Connect this action to PayMongo or the escrow API.");
    });
  }

  /** Displays current cart value for the payment module. */
  function renderSummary() {
    const container = document.querySelector("#checkoutCartSummary");
    if (!container) return;

    const cart = loadCart();
    const total = cart.reduce((sum, item) => {
      const product = allProducts().find((candidate) => candidate.id === item.productId);
      return product ? sum + product.price * (Number(item.quantity) || 1) : sum;
    }, 0);

    container.innerHTML = `
      <h2>Cart total</h2>
      <p>${cart.length} product line${cart.length === 1 ? "" : "s"} pending payment review.</p>
      <strong class="checkout-total">${formatMoney(total)}</strong>
      <a class="secondary-action" href="cart-page.html">Edit cart</a>
    `;
  }

  /** Reads the cart from localStorage. */
  function loadCart() {
    try {
      const value = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
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

  /** Formats Philippine peso values. */
  function formatMoney(value) {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
  }
})();
