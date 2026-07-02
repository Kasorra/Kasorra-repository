(function () {
  const CART_KEY = "kasorra.cart";
  const PRODUCT_STORAGE_KEY = "kasorra.products";
  const seed = window.KasorraSeedData;

  document.addEventListener("DOMContentLoaded", initSearchResults);

  /** Loads the query from the URL and renders the top related products. */
  function initSearchResults() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    const input = document.querySelector("#resultsSearchInput");
    if (input) input.value = query;

    renderResults(query);
    document.querySelector("#resultsSearchForm")?.addEventListener("submit", handleSearchSubmit);
  }

  /** Redirects search submissions back to this results page with a query parameter. */
  function handleSearchSubmit(event) {
    event.preventDefault();
    const query = document.querySelector("#resultsSearchInput")?.value.trim();
    if (!query) return;
    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
  }

  /** Renders up to 10 product cards ranked by relation to the search query. */
  function renderResults(query) {
    const title = document.querySelector("#searchTitle");
    const container = document.querySelector("#searchResults");
    if (!container || !title) return;

    const results = rankProducts(query).slice(0, 10);
    title.textContent = query ? `Results for "${query}"` : "Featured products";

    if (!results.length) {
      container.innerHTML = `
        <div class="empty-state">
          <h2>No matching products</h2>
          <p>Try a category like Packaging, Construction, Food Ingredients, or Tech Components.</p>
          <a class="primary-action" href="index.html#marketplace-app">Browse all listings</a>
        </div>
      `;
      return;
    }

    container.innerHTML = results.map(renderProductCard).join("");
    container.querySelectorAll("[data-cart]").forEach((button) => {
      button.addEventListener("click", () => addToCart(button.dataset.cart));
    });
  }

  /** Scores products by name, category, subcategory, supplier, and description matches. */
  function rankProducts(query) {
    const normalized = query.trim().toLowerCase();
    const scored = allProducts()
      .map((product) => {
        const supplier = supplierById(product.supplierId);
        const categoryLabels = product.categories.map((id) => categoryById(id)?.name || id);
        const searchable = [product.name, product.description, product.subcategory, supplier.companyName, ...categoryLabels]
          .join(" ")
          .toLowerCase();
        let score = product.popular ? 2 : 0;

        if (!normalized) return { product, score };
        if (product.name.toLowerCase().includes(normalized)) score += 8;
        if (categoryLabels.some((name) => name.toLowerCase().includes(normalized))) score += 7;
        if (product.subcategory.toLowerCase().includes(normalized)) score += 5;
        if (supplier.companyName.toLowerCase().includes(normalized)) score += 4;
        if (product.description.toLowerCase().includes(normalized)) score += 3;
        if (searchable.includes(normalized)) score += 1;
        return { product, score };
      })
      .filter((entry) => !normalized || entry.score > 0)
      .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
      .map((entry) => entry.product);

    if (!normalized || scored.length >= 10) return scored;

    const selectedIds = new Set(scored.map((product) => product.id));
    const fallback = allProducts()
      .filter((product) => !selectedIds.has(product.id))
      .sort((a, b) => Number(b.popular) - Number(a.popular) || a.name.localeCompare(b.name));

    return scored.concat(fallback);
  }

  /** Builds a search result card with product, supplier, cart, and deep-link actions. */
  function renderProductCard(product) {
    const supplier = supplierById(product.supplierId);
    const categories = product.categories.map((id) => categoryById(id)?.name || id).join(", ");

    return `
      <article class="product-card">
        <a class="media-button" href="index.html?product=${encodeURIComponent(product.id)}#marketplace-app" aria-label="Open ${escapeHtml(product.name)} listing">
          <img src="${escapeHtml(product.mediaUrl)}" alt="${escapeHtml(product.name)}">
        </a>
        <div class="product-card-body">
          <div class="tag-row"><span>${escapeHtml(categories)}</span><span>${escapeHtml(product.subcategory)}</span></div>
          <h2><a href="index.html?product=${encodeURIComponent(product.id)}#marketplace-app">${escapeHtml(product.name)}</a></h2>
          <p>${escapeHtml(product.description)}</p>
          <dl class="product-facts">
            <div><dt>Price</dt><dd>${formatMoney(product.price)}</dd></div>
            <div><dt>MOQ</dt><dd>${product.moq}</dd></div>
            <div><dt>Supplier</dt><dd>${supplier.verified ? "Verified" : "Pending"}</dd></div>
          </dl>
          <a class="supplier-link" href="index.html?supplier=${encodeURIComponent(supplier.id)}#supplierProfile">
            ${escapeHtml(supplier.companyName)}
          </a>
          <div class="product-actions">
            <a class="primary-action" href="index.html?product=${encodeURIComponent(product.id)}#marketplace-app">View listing</a>
            <button type="button" class="secondary-action" data-cart="${product.id}">Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }

  /** Adds a product from search results to the shared cart store. */
  function addToCart(productId) {
    const cart = loadCart();
    const existing = cart.find((item) => item.productId === productId);
    if (existing) existing.quantity += 1;
    else cart.push({ productId, quantity: 1, addedAt: new Date().toISOString() });
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    showToast("Product added to cart.");
  }

  /** Reads cart state from localStorage. */
  function loadCart() {
    try {
      const value = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  /** Finds a supplier by id. */
  function supplierById(supplierId) {
    return seed.suppliers.find((supplier) => supplier.id === supplierId) || seed.suppliers[0];
  }

  /** Finds a category by id. */
  function categoryById(categoryId) {
    return seed.categories.find((category) => category.id === categoryId);
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

  /** Shows a temporary saved-action message. */
  function showToast(message) {
    const existing = document.querySelector(".market-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "market-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  /** Escapes dynamic values before HTML insertion. */
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
