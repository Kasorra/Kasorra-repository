(function () {
  const seed = window.KasorraSeedData;
  const STORAGE_KEYS = {
    products: "kasorra.products",
    inquiries: "kasorra.inquiries",
    chatThreads: "kasorra.chatThreads",
    cart: "kasorra.cart",
  };

  const state = {
    query: "",
    categoryId: "all",
    subcategory: "all",
    location: "all",
    moqMax: "",
    priceMin: "",
    priceMax: "",
    supplierVerification: "all",
    activeSupplierId: seed.suppliers[0].id,
    activeProductId: seed.products[0].id,
    products: loadStoredArray(STORAGE_KEYS.products),
    inquiries: loadStoredArray(STORAGE_KEYS.inquiries),
    chatThreads: loadStoredObject(STORAGE_KEYS.chatThreads),
  };

  document.addEventListener("DOMContentLoaded", initMarketplace);

  /** Starts the marketplace module and connects it to the existing static page. */
  function initMarketplace() {
    hideLegacyMarketplaceSections();
    wireHeaderSearch();
    renderMarketplaceShell();
    renderAll();
    applyRouteState();
  }

  /** Reads an array from localStorage and falls back to an empty list on invalid data. */
  function loadStoredArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  /** Reads an object from localStorage and falls back to an empty object on invalid data. */
  function loadStoredObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (error) {
      return {};
    }
  }

  /** Persists a state slice so static-page interactions survive reloads. */
  function saveState(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /** Hides the original static marketplace cards so the connected app is the main source of truth. */
  function hideLegacyMarketplaceSections() {
    document.querySelectorAll(".category-section, .deals-section, .suppliers-section").forEach((section) => {
      section.classList.add("legacy-hidden");
      section.setAttribute("aria-hidden", "true");
    });
  }

  /** Adds search behavior and popular auto-suggestions to the existing header search bar. */
  function wireHeaderSearch() {
    const input = document.querySelector(".bar");
    const button = document.querySelector(".search-button");
    const searchBar = document.querySelector(".search-bar");

    if (!input || !button || !searchBar) return;

    input.placeholder = "Search products, suppliers, categories";
    input.setAttribute("aria-label", "Search products, suppliers, categories");

    const suggestions = document.createElement("div");
    suggestions.className = "suggestion-panel";
    suggestions.setAttribute("role", "listbox");
    suggestions.hidden = true;
    searchBar.appendChild(suggestions);

    input.addEventListener("input", () => renderSuggestions(input.value, suggestions));
    input.addEventListener("focus", () => renderSuggestions(input.value, suggestions));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applySearch(input.value);
        suggestions.hidden = true;
      }
      if (event.key === "Escape") {
        suggestions.hidden = true;
      }
    });
    button.addEventListener("click", () => {
      applySearch(input.value);
      suggestions.hidden = true;
    });
    document.addEventListener("click", (event) => {
      if (!searchBar.contains(event.target)) suggestions.hidden = true;
    });
  }

  /** Shows ranked suggestions from popular searches, products, suppliers, and categories. */
  function renderSuggestions(value, container) {
    const normalized = value.trim().toLowerCase();
    const catalogSuggestions = [
      ...seed.popularSearches,
      ...allProducts().map((product) => product.name),
      ...seed.suppliers.map((supplier) => supplier.companyName),
      ...seed.categories.map((category) => category.name),
    ];
    const matches = unique(catalogSuggestions)
      .filter((item) => !normalized || item.toLowerCase().includes(normalized))
      .slice(0, 7);

    container.hidden = matches.length === 0;
    container.innerHTML = matches
      .map((item) => `<button type="button" class="suggestion-item" data-suggestion="${escapeHtml(item)}">${escapeHtml(item)}</button>`)
      .join("");

    container.querySelectorAll("[data-suggestion]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.querySelector(".bar");
        if (input) input.value = button.dataset.suggestion;
        applySearch(button.dataset.suggestion);
        container.hidden = true;
      });
    });
  }

  /** Sends header searches to the dedicated search results page. */
  function applySearch(value) {
    const query = value.trim();
    if (!query) return;
    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
  }

  /** Builds the static shell that later render functions fill with state-aware content. */
  function renderMarketplaceShell() {
    const app = document.querySelector("#marketplace-app");
    if (!app) return;

    app.innerHTML = `
      <section class="market-toolbar">
        <div>
          <p class="section-eyebrow">Kasorra marketplace</p>
          <h2>Find verified suppliers, compare products, and start RFQs.</h2>
        </div>
        <div class="market-stats" id="marketStats"></div>
      </section>

      <section class="market-grid">
        <aside class="filter-panel" aria-label="Marketplace filters">
          <h3>Filters</h3>
          <label>Product name
            <input id="filterName" type="search" placeholder="Example: cement, pouch">
          </label>
          <label>Category
            <select id="filterCategory"></select>
          </label>
          <label>Subcategory
            <select id="filterSubcategory"></select>
          </label>
          <label>Supplier location
            <select id="filterLocation"></select>
          </label>
          <label>Maximum MOQ
            <input id="filterMoq" type="number" min="1" placeholder="Any">
          </label>
          <label>Supplier verification
            <select id="filterSupplierVerification">
              <option value="all">All suppliers</option>
              <option value="verified">Verified only</option>
              <option value="unverified">Unverified only</option>
            </select>
          </label>
          <div class="range-row">
            <label>Min price
              <input id="filterPriceMin" type="number" min="0" placeholder="0">
            </label>
            <label>Max price
              <input id="filterPriceMax" type="number" min="0" placeholder="Any">
            </label>
          </div>
          <button type="button" class="secondary-action" id="resetFilters">Reset filters</button>
        </aside>

        <div class="market-content">
          <section class="module-block">
            <div class="module-heading">
              <div>
                <p class="section-eyebrow">Browse categories</p>
                <h3>Broad categories and subcategories</h3>
              </div>
              <button type="button" class="link-action" id="showAllProducts">View all products</button>
            </div>
            <div class="category-browser" id="categoryBrowser"></div>
          </section>

          <section class="module-block">
            <div class="module-heading">
              <div>
                <p class="section-eyebrow">Search results</p>
                <h3 id="resultsTitle">Product listings</h3>
              </div>
              <button type="button" class="primary-action" id="openUpload">Upload product</button>
            </div>
            <div class="product-results" id="productResults"></div>
          </section>
        </div>
      </section>

      <section class="profile-and-tools">
        <div class="profile-panel" id="supplierProfile"></div>
        <div class="supplier-dashboard" id="supplierDashboard"></div>
      </section>

      <div class="modal-host" id="modalHost" hidden></div>
    `;

    bindFilterControls();
    document.querySelector("#showAllProducts")?.addEventListener("click", resetFilters);
    document.querySelector("#openUpload")?.addEventListener("click", openUploadModal);
  }

  /** Connects filter fields to marketplace state and re-renders when buyers refine results. */
  function bindFilterControls() {
    const controls = {
      query: document.querySelector("#filterName"),
      categoryId: document.querySelector("#filterCategory"),
      subcategory: document.querySelector("#filterSubcategory"),
      location: document.querySelector("#filterLocation"),
      moqMax: document.querySelector("#filterMoq"),
      priceMin: document.querySelector("#filterPriceMin"),
      priceMax: document.querySelector("#filterPriceMax"),
      supplierVerification: document.querySelector("#filterSupplierVerification"),
    };

    Object.entries(controls).forEach(([key, element]) => {
      if (!element) return;
      element.addEventListener("input", () => {
        state[key] = element.value;
        if (key === "categoryId") state.subcategory = "all";
        renderAll();
      });
      element.addEventListener("change", () => {
        state[key] = element.value;
        if (key === "categoryId") state.subcategory = "all";
        renderAll();
      });
    });

    document.querySelector("#resetFilters")?.addEventListener("click", resetFilters);
  }

  /** Clears filters and returns buyers to the full catalog. */
  function resetFilters() {
    state.query = "";
    state.categoryId = "all";
    state.subcategory = "all";
    state.location = "all";
    state.moqMax = "";
    state.priceMin = "";
    state.priceMax = "";
    state.supplierVerification = "all";
    const headerInput = document.querySelector(".bar");
    if (headerInput) headerInput.value = "";
    renderAll();
  }

  /** Re-renders every connected module after state changes. */
  function renderAll() {
    syncFilterFields();
    renderStats();
    renderCategoryBrowser();
    renderProductResults();
    renderSupplierProfile(state.activeSupplierId);
    renderSupplierDashboard();
  }

  /** Keeps filter form fields aligned with the current state object. */
  function syncFilterFields() {
    const categoryOptions = [`<option value="all">All categories</option>`]
      .concat(seed.categories.map((category) => `<option value="${category.id}">${category.name}</option>`))
      .join("");
    const activeCategory = seed.categories.find((category) => category.id === state.categoryId);
    const subcategories = activeCategory ? activeCategory.subcategories : unique(seed.categories.flatMap((category) => category.subcategories));
    const subcategoryOptions = [`<option value="all">All subcategories</option>`]
      .concat(subcategories.map((subcategory) => `<option value="${escapeHtml(subcategory)}">${escapeHtml(subcategory)}</option>`))
      .join("");
    const locationOptions = [`<option value="all">All locations</option>`]
      .concat(unique(seed.suppliers.map((supplier) => supplier.location)).map((location) => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`))
      .join("");

    setSelect("#filterCategory", categoryOptions, state.categoryId);
    setSelect("#filterSubcategory", subcategoryOptions, state.subcategory);
    setSelect("#filterLocation", locationOptions, state.location);
    setInputValue("#filterName", state.query);
    setInputValue("#filterMoq", state.moqMax);
    setInputValue("#filterPriceMin", state.priceMin);
    setInputValue("#filterPriceMax", state.priceMax);
    setSelect("#filterSupplierVerification", `
      <option value="all">All suppliers</option>
      <option value="verified">Verified only</option>
      <option value="unverified">Unverified only</option>
    `, state.supplierVerification);
  }

  /** Updates a select element without losing its intended value. */
  function setSelect(selector, html, value) {
    const element = document.querySelector(selector);
    if (!element) return;
    if (element.innerHTML !== html) element.innerHTML = html;
    element.value = value;
  }

  /** Updates an input value only when needed to avoid cursor jumps while typing. */
  function setInputValue(selector, value) {
    const element = document.querySelector(selector);
    if (element && element.value !== String(value)) element.value = value;
  }

  /** Shows catalog metrics based on the current seed and stored product data. */
  function renderStats() {
    const products = allProducts();
    const stats = document.querySelector("#marketStats");
    if (!stats) return;
    stats.innerHTML = `
      <span>${products.length} products</span>
      <span>${seed.suppliers.filter((supplier) => supplier.verified).length} verified suppliers</span>
      <span>${seed.categories.length} categories</span>
      <span>${state.inquiries.length} RFQs logged</span>
    `;
  }

  /** Renders category cards and subcategory filter buttons. */
  function renderCategoryBrowser() {
    const container = document.querySelector("#categoryBrowser");
    if (!container) return;

    container.innerHTML = seed.categories
      .map((category) => {
        const count = allProducts().filter((product) => product.categories.includes(category.id)).length;
        const activeClass = state.categoryId === category.id ? "active" : "";
        return `
          <article class="category-card ${activeClass}">
            <button type="button" data-category="${category.id}">
              <span>${category.name}</span>
              <strong>${count} listings</strong>
            </button>
            <p>${category.description}</p>
            <div class="subcategory-list">
              ${category.subcategories
                .map((subcategory) => `<button type="button" data-category="${category.id}" data-subcategory="${escapeHtml(subcategory)}">${escapeHtml(subcategory)}</button>`)
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");

    container.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        state.categoryId = button.dataset.category;
        state.subcategory = button.dataset.subcategory || "all";
        state.query = "";
        renderAll();
      });
    });
  }

  /** Filters the product catalog by search query, category, supplier location, MOQ, and price. */
  function filteredProducts() {
    const query = state.query.trim().toLowerCase();
    const maxMoq = Number(state.moqMax);
    const minPrice = Number(state.priceMin);
    const maxPrice = Number(state.priceMax);

    return allProducts().filter((product) => {
      const supplier = supplierById(product.supplierId);
      const searchable = [
        product.name,
        product.description,
        product.subcategory,
        supplier.companyName,
        supplier.location,
        ...product.categories.map((id) => categoryById(id)?.name || ""),
      ]
        .join(" ")
        .toLowerCase();

      if (query && !searchable.includes(query)) return false;
      if (state.categoryId !== "all" && !product.categories.includes(state.categoryId)) return false;
      if (state.subcategory !== "all" && product.subcategory !== state.subcategory) return false;
      if (state.location !== "all" && supplier.location !== state.location) return false;
      if (state.supplierVerification === "verified" && !supplier.verified) return false;
      if (state.supplierVerification === "unverified" && supplier.verified) return false;
      if (state.moqMax && product.moq > maxMoq) return false;
      if (state.priceMin && product.price < minPrice) return false;
      if (state.priceMax && product.price > maxPrice) return false;
      return true;
    });
  }

  /** Renders product cards and connects product, profile, cart, RFQ, and chat actions. */
  function renderProductResults() {
    const container = document.querySelector("#productResults");
    const title = document.querySelector("#resultsTitle");
    if (!container || !title) return;

    const products = filteredProducts();
    title.textContent = `${products.length} product listing${products.length === 1 ? "" : "s"}`;

    if (!products.length) {
      container.innerHTML = `
        <div class="empty-state">
          <h4>No matching listings</h4>
          <p>Try removing filters or searching a broader category.</p>
          <button type="button" class="secondary-action" id="emptyReset">Clear filters</button>
        </div>
      `;
      document.querySelector("#emptyReset")?.addEventListener("click", resetFilters);
      return;
    }

    container.innerHTML = products
      .map((product) => {
        const supplier = supplierById(product.supplierId);
        return `
          <article class="product-card" data-product-card="${product.id}">
            <button type="button" class="media-button" data-view-product="${product.id}" aria-label="View ${escapeHtml(product.name)}">
              ${renderMedia(product)}
            </button>
            <div class="product-card-body">
              <div class="tag-row">
                ${product.categories.map((id) => `<span>${categoryById(id)?.name || id}</span>`).join("")}
                ${product.sampleMoq ? `<span>Sample MOQ ${product.sampleMoq}</span>` : ""}
              </div>
              <h4>${escapeHtml(product.name)}</h4>
              <p>${escapeHtml(product.description)}</p>
              <dl class="product-facts">
                <div><dt>Price</dt><dd>${formatMoney(product.price)}</dd></div>
                <div><dt>MOQ</dt><dd>${product.moq}</dd></div>
                <div><dt>Availability</dt><dd>${escapeHtml(product.availability)}</dd></div>
              </dl>
              <button type="button" class="supplier-link" data-view-supplier="${supplier.id}">
                ${escapeHtml(supplier.companyName)} - ${escapeHtml(supplier.location)}
              </button>
              <div class="trust-row">
                ${supplier.verified ? `<span>Verified Supplier</span>` : ""}
                ${supplier.escrowEnabled ? `<span>Escrow Enabled</span>` : ""}
                <span>${supplier.rating.toFixed(1)} rating</span>
              </div>
              <div class="product-actions">
                <button type="button" class="primary-action" data-rfq="${product.id}">Request Quote</button>
                <button type="button" class="secondary-action" data-cart="${product.id}">Add to Cart</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    container.querySelectorAll("[data-view-product]").forEach((button) => {
      button.addEventListener("click", () => openProductModal(button.dataset.viewProduct));
    });
    container.querySelectorAll("[data-view-supplier]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeSupplierId = button.dataset.viewSupplier;
        renderSupplierProfile(state.activeSupplierId);
        document.querySelector("#supplierProfile")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    container.querySelectorAll("[data-rfq]").forEach((button) => {
      button.addEventListener("click", () => openInquiryModal(button.dataset.rfq));
    });
    container.querySelectorAll("[data-cart]").forEach((button) => {
      button.addEventListener("click", () => addToCart(button.dataset.cart));
    });
  }

  /** Renders product images or uploaded videos while preserving card dimensions. */
  function renderMedia(product) {
    if (product.mediaType === "video") {
      return `<video src="${escapeHtml(product.mediaUrl)}" muted playsinline></video>`;
    }
    return `<img src="${escapeHtml(product.mediaUrl)}" alt="${escapeHtml(product.name)}">`;
  }

  /** Opens a detailed product listing with specs, supplier data, and RFQ actions. */
  function openProductModal(productId) {
    const product = productById(productId);
    const supplier = supplierById(product.supplierId);
    state.activeProductId = productId;
    state.activeSupplierId = supplier.id;

    openModal(`
      <div class="modal-card large-modal">
        <button type="button" class="modal-close" data-close-modal>Close</button>
        <div class="listing-detail">
          <div class="listing-media">${renderMedia(product)}</div>
          <div>
            <p class="section-eyebrow">${escapeHtml(product.subcategory)}</p>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description)}</p>
            <dl class="product-facts wide">
              <div><dt>Price</dt><dd>${formatMoney(product.price)}</dd></div>
              <div><dt>MOQ</dt><dd>${product.moq}</dd></div>
              <div><dt>Sample order</dt><dd>${product.sampleMoq} units</dd></div>
              <div><dt>Availability</dt><dd>${escapeHtml(product.availability)}</dd></div>
            </dl>
            <h4>Product specs</h4>
            <ul class="spec-list">${product.specs.map((spec) => `<li>${escapeHtml(spec)}</li>`).join("")}</ul>
            <button type="button" class="supplier-link" data-modal-supplier="${supplier.id}">
              View ${escapeHtml(supplier.companyName)} profile
            </button>
            <div class="product-actions stacked-actions">
              <button type="button" class="primary-action" data-modal-rfq="${product.id}">Request Quote</button>
              <button type="button" class="secondary-action" data-modal-cart="${product.id}">Add to Cart</button>
              <button type="button" class="secondary-action" data-modal-chat="${product.id}">Open RFQ Chat</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.querySelector("[data-modal-supplier]")?.addEventListener("click", (event) => {
      state.activeSupplierId = event.currentTarget.dataset.modalSupplier;
      closeModal();
      renderSupplierProfile(state.activeSupplierId);
      document.querySelector("#supplierProfile")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.querySelector("[data-modal-rfq]")?.addEventListener("click", (event) => openInquiryModal(event.currentTarget.dataset.modalRfq));
    document.querySelector("[data-modal-cart]")?.addEventListener("click", (event) => addToCart(event.currentTarget.dataset.modalCart));
    document.querySelector("[data-modal-chat]")?.addEventListener("click", (event) => openChatModal(event.currentTarget.dataset.modalChat));
  }

  /** Renders the active supplier company profile with catalog previews, reviews, and trust signals. */
  function renderSupplierProfile(supplierId) {
    const container = document.querySelector("#supplierProfile");
    const supplier = supplierById(supplierId);
    if (!container || !supplier) return;

    const catalog = allProducts().filter((product) => product.supplierId === supplier.id).slice(0, 4);
    container.innerHTML = `
      <div class="supplier-profile-header">
        <img src="${escapeHtml(supplier.logo)}" alt="${escapeHtml(supplier.companyName)} logo">
        <div>
          <p class="section-eyebrow">Company profile</p>
          <h3>${escapeHtml(supplier.companyName)}</h3>
          <p>${escapeHtml(supplier.description)}</p>
        </div>
      </div>
      <div class="trust-row prominent">
        <span>${supplier.verificationType} Verified</span>
        ${supplier.verified ? `<span>Verified Supplier</span>` : ""}
        ${supplier.escrowEnabled ? `<span>Escrow Enabled</span>` : `<span>Direct payment review required</span>`}
        <span>${supplier.yearsActive} years active</span>
      </div>
      <dl class="profile-stats">
        <div><dt>Location</dt><dd>${escapeHtml(supplier.location)}</dd></div>
        <div><dt>Rating</dt><dd>${supplier.rating.toFixed(1)} from ${supplier.reviewCount} reviews</dd></div>
        <div><dt>Categories</dt><dd>${supplier.categories.map((id) => categoryById(id)?.name || id).join(", ")}</dd></div>
      </dl>
      <div class="profile-actions">
        <button type="button" class="primary-action" data-profile-inquiry="${supplier.id}">Send Inquiry</button>
        <button type="button" class="secondary-action" data-profile-chat="${catalog[0]?.id || ""}">Start RFQ Chat</button>
      </div>
      <div class="catalog-preview">
        <h4>Product catalog preview</h4>
        <div class="mini-product-grid">
          ${catalog
            .map(
              (product) => `
                <button type="button" class="mini-product" data-profile-product="${product.id}">
                  <span>${escapeHtml(product.name)}</span>
                  <strong>${formatMoney(product.price)}</strong>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
      <div class="review-preview">
        <h4>Buyer reviews</h4>
        ${supplier.reviews.map((review) => `<blockquote>${escapeHtml(review)}</blockquote>`).join("")}
      </div>
    `;

    container.querySelector("[data-profile-inquiry]")?.addEventListener("click", () => openInquiryModal(catalog[0]?.id, supplier.id));
    container.querySelector("[data-profile-chat]")?.addEventListener("click", (event) => {
      if (event.currentTarget.dataset.profileChat) openChatModal(event.currentTarget.dataset.profileChat);
    });
    container.querySelectorAll("[data-profile-product]").forEach((button) => {
      button.addEventListener("click", () => openProductModal(button.dataset.profileProduct));
    });
  }

  /** Opens a supplier product-upload form and stores new listings in localStorage. */
  function openUploadModal() {
    const categoryOptions = seed.categories.map((category) => `<option value="${category.id}">${category.name}</option>`).join("");
    const supplierOptions = seed.suppliers.map((supplier) => `<option value="${supplier.id}">${supplier.companyName}</option>`).join("");
    openModal(`
      <div class="modal-card">
        <button type="button" class="modal-close" data-close-modal>Close</button>
        <p class="section-eyebrow">Supplier tools</p>
        <h3>Upload product listing</h3>
        <form id="productUploadForm" class="stack-form">
          <label>Supplier
            <select name="supplierId" required>${supplierOptions}</select>
          </label>
          <label>Product name
            <input name="name" required maxlength="80" placeholder="Example: Food-safe corrugated tray">
          </label>
          <label>Description
            <textarea name="description" required maxlength="220" placeholder="Describe buyer use cases, materials, or lead time"></textarea>
          </label>
          <div class="range-row">
            <label>MOQ
              <input name="moq" required type="number" min="1">
            </label>
            <label>Sample MOQ
              <input name="sampleMoq" required type="number" min="1">
            </label>
          </div>
          <div class="range-row">
            <label>Unit price
              <input name="price" required type="number" min="0" step="0.01">
            </label>
            <label>Availability
              <input name="availability" required placeholder="In stock, Made to order">
            </label>
          </div>
          <label>Categories
            <select name="categories" multiple required>${categoryOptions}</select>
          </label>
          <label>Subcategory
            <input name="subcategory" required placeholder="Example: Labels">
          </label>
          <label>Specs
            <textarea name="specs" required placeholder="Separate specs with commas"></textarea>
          </label>
          <label>Image or video file
            <input name="media" type="file" accept="image/*,video/*">
          </label>
          <button type="submit" class="primary-action">Publish listing</button>
        </form>
      </div>
    `);

    document.querySelector("#productUploadForm")?.addEventListener("submit", handleProductUpload);
  }

  /** Converts the upload form into a product record and adds it to the live catalog. */
  function handleProductUpload(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("media");

    const createProduct = (mediaUrl, mediaType) => {
      const product = {
        id: `custom-${Date.now()}`,
        supplierId: data.get("supplierId"),
        name: data.get("name").trim(),
        description: data.get("description").trim(),
        categories: Array.from(form.elements.categories.selectedOptions).map((option) => option.value),
        subcategory: data.get("subcategory").trim(),
        moq: Number(data.get("moq")),
        sampleMoq: Number(data.get("sampleMoq")),
        price: Number(data.get("price")),
        availability: data.get("availability").trim(),
        specs: data.get("specs").split(",").map((spec) => spec.trim()).filter(Boolean),
        mediaUrl,
        mediaType,
        popular: false,
      };

      state.products.unshift(product);
      saveState(STORAGE_KEYS.products, state.products);
      state.activeProductId = product.id;
      state.activeSupplierId = product.supplierId;
      closeModal();
      renderAll();
      showToast("Product listing published.");
    };

    if (file && file.size) {
      const reader = new FileReader();
      reader.onload = () => createProduct(reader.result, file.type.startsWith("video") ? "video" : "image");
      reader.readAsDataURL(file);
      return;
    }

    createProduct("images/package.png", "image");
  }

  /** Opens the secure inquiry form from a product listing or supplier profile. */
  function openInquiryModal(productId, supplierIdOverride) {
    const product = productId ? productById(productId) : null;
    const supplier = supplierIdOverride ? supplierById(supplierIdOverride) : supplierById(product.supplierId);
    const supplierProducts = allProducts().filter((item) => item.supplierId === supplier.id);
    const productOptions = supplierProducts
      .map((item) => `<option value="${item.id}" ${item.id === product?.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`)
      .join("");

    openModal(`
      <div class="modal-card">
        <button type="button" class="modal-close" data-close-modal>Close</button>
        <p class="section-eyebrow">Secure RFQ inquiry</p>
        <h3>Send inquiry to ${escapeHtml(supplier.companyName)}</h3>
        <form id="inquiryForm" class="stack-form">
          <input type="hidden" name="supplierId" value="${supplier.id}">
          <label>Product
            <select name="productId" required>${productOptions}</select>
          </label>
          <div class="range-row">
            <label>Quantity
              <input name="quantity" required type="number" min="1" value="${product?.sampleMoq || 1}">
            </label>
            <label>Target price
              <input name="targetPrice" type="number" min="0" step="0.01" placeholder="${product ? product.price : ""}">
            </label>
          </div>
          <label>Message
            <textarea name="message" required placeholder="Share specs, delivery location, and required lead time"></textarea>
          </label>
          <label>Priority
            <select name="priority">
              <option>Standard</option>
              <option>Urgent</option>
              <option>Sample order</option>
            </select>
          </label>
          <label class="checkbox-row">
            <input name="escrowRequested" type="checkbox" ${supplier.escrowEnabled ? "checked" : ""}>
            Request escrow protection
          </label>
          <button type="submit" class="primary-action">Log inquiry</button>
        </form>
      </div>
    `);

    document.querySelector("#inquiryForm")?.addEventListener("submit", handleInquirySubmit);
  }

  /** Validates and logs RFQ inquiries into the supplier dashboard. */
  function handleInquirySubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const product = productById(data.get("productId"));
    const inquiry = {
      id: `RFQ-${Date.now()}`,
      supplierId: data.get("supplierId"),
      productId: data.get("productId"),
      quantity: Number(data.get("quantity")),
      targetPrice: data.get("targetPrice") ? Number(data.get("targetPrice")) : null,
      message: data.get("message").trim(),
      priority: data.get("priority"),
      escrowRequested: data.get("escrowRequested") === "on",
      status: "Logged in supplier dashboard",
      createdAt: new Date().toISOString(),
    };

    state.inquiries.unshift(inquiry);
    saveState(STORAGE_KEYS.inquiries, state.inquiries);
    ensureChatThread(product.id);
    closeModal();
    renderAll();
    showToast("Inquiry logged and visible in the supplier dashboard.");
    openChatModal(product.id);
  }

  /** Renders supplier-side inquiry logs with chat and Kasorra support escalation controls. */
  function renderSupplierDashboard() {
    const container = document.querySelector("#supplierDashboard");
    if (!container) return;

    const inquiries = state.inquiries.slice(0, 8);
    container.innerHTML = `
      <div class="module-heading">
        <div>
          <p class="section-eyebrow">Supplier dashboard</p>
          <h3>Inquiry log and RFQ chats</h3>
        </div>
      </div>
      ${
        inquiries.length
          ? inquiries
              .map((inquiry) => {
                const product = productById(inquiry.productId);
                const supplier = supplierById(inquiry.supplierId);
                return `
                  <article class="inquiry-item">
                    <div>
                      <strong>${escapeHtml(product.name)}</strong>
                      <span>${escapeHtml(supplier.companyName)} - ${new Date(inquiry.createdAt).toLocaleString()}</span>
                      <p>${escapeHtml(inquiry.message)}</p>
                      <small>${inquiry.status} - Qty ${inquiry.quantity}${inquiry.escrowRequested ? " - Escrow requested" : ""}</small>
                    </div>
                    <div class="inquiry-actions">
                      <button type="button" class="secondary-action" data-chat-inquiry="${product.id}">Chat</button>
                      <button type="button" class="danger-action" data-escalate="${inquiry.id}">Escalate</button>
                    </div>
                  </article>
                `;
              })
              .join("")
          : `<div class="empty-state compact"><h4>No inquiries yet</h4><p>RFQs sent from listings or profiles will appear here.</p></div>`
      }
    `;

    container.querySelectorAll("[data-chat-inquiry]").forEach((button) => {
      button.addEventListener("click", () => openChatModal(button.dataset.chatInquiry));
    });
    container.querySelectorAll("[data-escalate]").forEach((button) => {
      button.addEventListener("click", () => escalateInquiry(button.dataset.escalate));
    });
  }

  /** Marks an inquiry as escalated to Kasorra support for dispute handling. */
  function escalateInquiry(inquiryId) {
    state.inquiries = state.inquiries.map((inquiry) =>
      inquiry.id === inquiryId ? { ...inquiry, status: "Escalated to Kasorra support" } : inquiry
    );
    saveState(STORAGE_KEYS.inquiries, state.inquiries);
    renderSupplierDashboard();
    showToast("Kasorra support escalation opened.");
  }

  /** Opens a simulated real-time RFQ chat tied to the selected product thread. */
  function openChatModal(productId) {
    const product = productById(productId);
    const supplier = supplierById(product.supplierId);
    const thread = ensureChatThread(productId);

    openModal(`
      <div class="modal-card chat-card">
        <button type="button" class="modal-close" data-close-modal>Close</button>
        <p class="section-eyebrow">RFQ negotiation chat</p>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="chat-context">${escapeHtml(supplier.companyName)} - ${supplier.escrowEnabled ? "Escrow available" : "Direct payment review required"}</p>
        <div class="chat-log" id="chatLog">
          ${thread.messages.map(renderChatMessage).join("")}
        </div>
        <form id="chatForm" class="chat-form">
          <input name="message" required placeholder="Type a price, lead time, or sample request">
          <button type="submit" class="primary-action">Send</button>
        </form>
      </div>
    `);

    scrollChatToBottom();
    document.querySelector("#chatForm")?.addEventListener("submit", (event) => handleChatSubmit(event, productId));
  }

  /** Creates a chat thread with an initial supplier message when one does not exist. */
  function ensureChatThread(productId) {
    if (!state.chatThreads[productId]) {
      const product = productById(productId);
      const supplier = supplierById(product.supplierId);
      state.chatThreads[productId] = {
        productId,
        messages: [
          {
            sender: supplier.companyName,
            role: "supplier",
            text: `Thanks for your interest in ${product.name}. Share quantity, delivery city, and target lead time so we can quote accurately.`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      saveState(STORAGE_KEYS.chatThreads, state.chatThreads);
    }
    return state.chatThreads[productId];
  }

  /** Appends buyer chat messages and simulates a live supplier response. */
  function handleChatSubmit(event, productId) {
    event.preventDefault();
    const input = event.currentTarget.elements.message;
    const text = input.value.trim();
    if (!text) return;

    const thread = ensureChatThread(productId);
    thread.messages.push({
      sender: "Buyer",
      role: "buyer",
      text,
      timestamp: new Date().toISOString(),
    });
    input.value = "";
    saveState(STORAGE_KEYS.chatThreads, state.chatThreads);
    refreshChatLog(productId);

    setTimeout(() => {
      const product = productById(productId);
      const supplier = supplierById(product.supplierId);
      thread.messages.push({
        sender: supplier.companyName,
        role: "supplier",
        text: "Received. We can prepare a formal quotation with sample MOQ, bulk tiers, and escrow terms from this thread.",
        timestamp: new Date().toISOString(),
      });
      saveState(STORAGE_KEYS.chatThreads, state.chatThreads);
      refreshChatLog(productId);
    }, 700);
  }

  /** Renders an individual chat bubble. */
  function renderChatMessage(message) {
    return `
      <div class="chat-message ${message.role}">
        <strong>${escapeHtml(message.sender)}</strong>
        <p>${escapeHtml(message.text)}</p>
        <time>${new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
      </div>
    `;
  }

  /** Refreshes the open chat log after messages are added. */
  function refreshChatLog(productId) {
    const log = document.querySelector("#chatLog");
    if (!log) return;
    log.innerHTML = ensureChatThread(productId).messages.map(renderChatMessage).join("");
    scrollChatToBottom();
  }

  /** Keeps the newest negotiation message visible. */
  function scrollChatToBottom() {
    const log = document.querySelector("#chatLog");
    if (log) log.scrollTop = log.scrollHeight;
  }

  /** Adds a product to the local cart store and shows buyer feedback. */
  function addToCart(productId) {
    const cart = loadStoredArray(STORAGE_KEYS.cart);
    const existing = cart.find((item) => item.productId === productId);
    if (existing) existing.quantity += 1;
    else cart.push({ productId, quantity: 1, addedAt: new Date().toISOString() });
    saveState(STORAGE_KEYS.cart, cart);
    showToast("Product added to cart.");
  }

  /** Applies product, supplier, category, or query URL parameters after the first render. */
  function applyRouteState() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const query = params.get("q");
    const supplierId = params.get("supplier");
    const productId = params.get("product");

    if (category && categoryById(category)) state.categoryId = category;
    if (query) state.query = query;
    if (supplierId && seed.suppliers.some((supplier) => supplier.id === supplierId)) state.activeSupplierId = supplierId;
    if (productId && allProducts().some((product) => product.id === productId)) state.activeProductId = productId;

    if (category || query || supplierId || productId) {
      renderAll();
      document.querySelector("#marketplace-app")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (supplierId) {
      document.querySelector("#supplierProfile")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (productId) {
      openProductModal(productId);
    }
  }

  /** Opens a modal and binds close controls. */
  function openModal(html) {
    const host = document.querySelector("#modalHost");
    if (!host) return;
    host.innerHTML = html;
    host.hidden = false;
    document.body.classList.add("no-scroll");
    host.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
    host.addEventListener("click", handleModalBackdropClick);
  }

  /** Closes the active modal and restores page scrolling. */
  function closeModal() {
    const host = document.querySelector("#modalHost");
    if (!host) return;
    host.hidden = true;
    host.innerHTML = "";
    host.removeEventListener("click", handleModalBackdropClick);
    document.body.classList.remove("no-scroll");
  }

  /** Closes the modal when buyers click outside the modal card. */
  function handleModalBackdropClick(event) {
    if (event.target.id === "modalHost") closeModal();
  }

  /** Shows a temporary status message for saved actions. */
  function showToast(message) {
    const existing = document.querySelector(".market-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "market-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  /** Combines seed products with supplier-uploaded listings. */
  function allProducts() {
    return [...state.products, ...seed.products];
  }

  /** Finds a product by id and returns a safe fallback if data is missing. */
  function productById(productId) {
    return allProducts().find((product) => product.id === productId) || allProducts()[0];
  }

  /** Finds a supplier by id and returns a safe fallback if data is missing. */
  function supplierById(supplierId) {
    return seed.suppliers.find((supplier) => supplier.id === supplierId) || seed.suppliers[0];
  }

  /** Finds a category by id. */
  function categoryById(categoryId) {
    return seed.categories.find((category) => category.id === categoryId);
  }

  /** Formats Philippine peso amounts without relying on non-ASCII source text. */
  function formatMoney(value) {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
  }

  /** Removes duplicate primitive values while preserving order. */
  function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  /** Escapes dynamic text before inserting template HTML. */
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
