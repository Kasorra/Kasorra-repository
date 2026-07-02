(function () {
  const STORAGE_KEYS = {
    currentUser: "kasorra.currentUser",
    cart: "kasorra.cart",
    inquiries: "kasorra.inquiries",
  };

  document.addEventListener("DOMContentLoaded", initDashboard);

  /** Loads the current user and protects the dashboard from anonymous access. */
  function initDashboard() {
    const user = readObject(STORAGE_KEYS.currentUser);
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    renderDashboard(user);
    document.querySelector("#logoutButton")?.addEventListener("click", signOut);
  }

  /** Renders account-specific marketplace shortcuts and saved activity counts. */
  function renderDashboard(user) {
    const title = document.querySelector("#dashboardTitle");
    const subtitle = document.querySelector("#dashboardSubtitle");
    const cards = document.querySelector("#dashboardCards");
    const cartItems = readArray(STORAGE_KEYS.cart);
    const inquiries = readArray(STORAGE_KEYS.inquiries);

    if (title) title.textContent = `${user.businessName || user.email} dashboard`;
    if (subtitle) subtitle.textContent = `${capitalize(user.role || "buyer")} account signed in as ${user.email}.`;
    if (!cards) return;

    cards.innerHTML = `
      <article class="dashboard-card">
        <h2>Product sourcing</h2>
        <p>Browse product categories, compare MOQs, and add listings to your cart.</p>
        <a class="primary-action" href="index.html#marketplace-app">Open marketplace</a>
      </article>
      <article class="dashboard-card">
        <h2>Cart</h2>
        <p>${cartItems.length} saved product line${cartItems.length === 1 ? "" : "s"} ready for checkout review.</p>
        <a class="secondary-action" href="cart-page.html">Review cart</a>
      </article>
      <article class="dashboard-card">
        <h2>RFQ activity</h2>
        <p>${inquiries.length} logged inquir${inquiries.length === 1 ? "y" : "ies"} connected to supplier dashboards.</p>
        <a class="secondary-action" href="index.html#supplierProfile">Open supplier tools</a>
      </article>
    `;
  }

  /** Clears the active browser session and returns to the marketplace home page. */
  function signOut() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    window.location.href = "index.html";
  }

  /** Reads an object from localStorage with invalid JSON protection. */
  function readObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === "object" && !Array.isArray(value) ? value : null;
    } catch (error) {
      return null;
    }
  }

  /** Reads an array from localStorage with invalid JSON protection. */
  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  /** Capitalizes short display labels. */
  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
})();
