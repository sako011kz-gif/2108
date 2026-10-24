
"use strict";

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// Замени на реальный номер WhatsApp магазина без + и пробелов.
const WHATSAPP = "77760070870";

const $ = id => document.getElementById(id);

let products = [];
let cart = [];
let activeProduct = null;
let activeSize = null;
let activeFilter = "all";
let searchQuery = "";

try {
  const saved = JSON.parse(localStorage.getItem("2108_cart") || "[]");
  cart = Array.isArray(saved) ? saved : [];
} catch {
  cart = [];
}

const money = value =>
  new Intl.NumberFormat("ru-RU").format(Number(value) || 0) + " ₸";

const esc = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

function getImage(product) {
  const images = product?.image_urls;

  if (Array.isArray(images)) {
    return images[0] || "";
  }

  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed[0] || "";
    } catch {
      return images;
    }
  }

  return "";
}

function getSizes(product) {
  return Array.isArray(product?.sizes) && product.sizes.length
    ? product.sizes
    : ["S", "M", "L"];
}

function placeholderImage() {
  return `
    <div class="product-no-image">
      <span>2108</span>
      <small>FITWEAR</small>
    </div>
  `;
}

function imageMarkup(url, alt = "2108 FITWEAR") {
  if (!url) return placeholderImage();

  return `
    <div class="image-frame">
      <img
        src="${esc(url)}"
        alt="${esc(alt)}"
        loading="lazy"
        onerror="
          this.style.display='none';
          this.parentElement.classList.add('image-unavailable');
        "
      >
      <span class="image-fallback">2108</span>
    </div>
  `;
}

// -------------------------
// ЗАГРУЗКА ТОВАРОВ ИЗ SUPABASE
// -------------------------

async function loadProducts() {
  const container = $("products");

  if (container) {
    container.innerHTML =
      '<div class="loading">ЗАГРУЖАЕМ КОЛЛЕКЦИЮ…</div>';
    container.setAttribute("aria-busy", "true");
  }

  try {
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    products = Array.isArray(data) ? data : [];

    renderProducts();
    renderCart();
  } catch (error) {
    console.error("Ошибка загрузки товаров:", error);

    if (container) {
      container.innerHTML = `
        <div class="empty-products">
          <strong>НЕ УДАЛОСЬ ЗАГРУЗИТЬ КАТАЛОГ</strong>
          <p>Проверь подключение к Supabase и настройки доступа.</p>
          <button class="btn btn-dark" id="retryProducts" type="button">
            ПОПРОБОВАТЬ СНОВА
          </button>
        </div>
      `;

      $("retryProducts")?.addEventListener("click", loadProducts);
    }
  } finally {
    container?.setAttribute("aria-busy", "false");
  }
}

// -------------------------
// КАТАЛОГ, ПОИСК И ФИЛЬТРЫ
// -------------------------

function renderProducts() {
  const container = $("products");
  if (!container) return;

  const query = searchQuery.toLowerCase().trim();

  const filtered = products.filter(product => {
    const name = String(product.name || "").toLowerCase();
    const category = String(product.category || "").toLowerCase();

    const matchesCategory =
      activeFilter === "all" || category === activeFilter;

    const matchesSearch =
      !query || name.includes(query) || category.includes(query);

    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-products">
        <span class="empty-products-mark">2108</span>
        <p>
          ${query
            ? "ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО."
            : "В ЭТОЙ КАТЕГОРИИ ПОКА НЕТ ТОВАРОВ."}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(product => {
    const sizes = getSizes(product);
    const image = getImage(product);

    return `
      <article class="product">
        <div class="product-image">
          ${imageMarkup(image, product.name || "2108 FITWEAR")}

          ${product.badge
            ? `<span class="product-badge">${esc(product.badge)}</span>`
            : ""}

          <button
            class="product-like"
            type="button"
            aria-label="Добавить в избранное"
            aria-pressed="false"
            title="Избранное"
          >♡</button>
        </div>

        <div class="product-info">
          <div>
            <div class="product-name">
              ${esc(product.name || "Новый товар")}
            </div>
            <div class="product-meta">
              ${esc(product.category || "COLLECTION").toUpperCase()}
              · ${sizes.map(esc).join(" / ")}
            </div>
          </div>

          <div class="product-price">${money(product.price)}</div>
        </div>

        <button
          class="btn btn-dark full quick-view"
          type="button"
          data-id="${esc(product.id)}"
        >
          ПОСМОТРЕТЬ ТОВАР ↗
        </button>
      </article>
    `;
  }).join("");

  container.querySelectorAll(".quick-view").forEach(button => {
    button.addEventListener("click", () => {
      openProduct(button.dataset.id);
    });
  });

  // Визуальное избранное на текущей странице.
  container.querySelectorAll(".product-like").forEach(button => {
    button.addEventListener("click", () => {
      const liked = button.classList.toggle("is-liked");
      button.textContent = liked ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(liked));
      button.setAttribute(
        "aria-label",
        liked ? "Убрать из избранного" : "Добавить в избранное"
      );
    });
  });
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";

    document.querySelectorAll(".filter").forEach(item => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    renderProducts();
  });
});

$("searchBtn")?.addEventListener("click", () => {
  const searchbar = $("searchbar");
  const willOpen = !searchbar?.classList.contains("open");

  searchbar?.classList.toggle("open", willOpen);
  $("searchBtn")?.setAttribute("aria-expanded", String(willOpen));

  if (willOpen) {
    $("searchInput")?.focus();
  } else {
    searchQuery = "";
    if ($("searchInput")) $("searchInput").value = "";
    renderProducts();
  }
});

$("searchInput")?.addEventListener("input", event => {
  searchQuery = event.target.value || "";
  renderProducts();
});

// -------------------------
// ОКНО ТОВАРА
// -------------------------

function openProduct(id) {
  activeProduct = products.find(
    product => String(product.id) === String(id)
  );

  if (!activeProduct) return;

  activeSize = null;

  const image = getImage(activeProduct);
  const modalImg = $("modalImg");

  if (modalImg) {
    modalImg.onerror = () => {
      modalImg.hidden = true;
      modalImg.style.display = "none";
    };

    modalImg.onload = () => {
      modalImg.hidden = false;
      modalImg.style.display = "block";
    };

    modalImg.src = image || "";
    modalImg.alt = activeProduct.name || "2108 FITWEAR";
    modalImg.hidden = !image;
    modalImg.style.display = image ? "block" : "none";
  }

  $("modalName").textContent =
    activeProduct.name || "Новый товар";

  $("modalPrice").textContent = money(activeProduct.price);

  $("modalCategory").textContent =
    `${String(activeProduct.category || "COLLECTION").toUpperCase()} · 2108 FITWEAR`;

  $("modalDescription").textContent =
    activeProduct.description || "Качество и комфорт в каждой детали.";

  const sizes = getSizes(activeProduct);

  $("modalSizes").innerHTML = sizes.map(size => `
    <button
      type="button"
      class="size-option"
      data-size="${esc(size)}"
      aria-pressed="false"
    >${esc(size)}</button>
  `).join("");

  $("modalSizes").querySelectorAll(".size-option").forEach(button => {
    button.addEventListener("click", () => {
      activeSize = button.dataset.size;

      $("modalSizes").querySelectorAll(".size-option").forEach(option => {
        const selected = option === button;
        option.classList.toggle("active", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
    });
  });

  $("productModal")?.classList.add("open");
  $("productModal")?.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function closeProduct() {
  $("productModal")?.classList.remove("open");
  $("productModal")?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");

  activeProduct = null;
  activeSize = null;
}

$("modalClose")?.addEventListener("click", closeProduct);

document.querySelector(".modal-backdrop")?.addEventListener(
  "click",
  closeProduct
);

$("modalAdd")?.addEventListener("click", () => {
  if (!activeProduct) return;

  const sizes = getSizes(activeProduct);

  if (sizes.length && !activeSize) {
    $("modalSizes")?.classList.add("size-required");

    window.setTimeout(() => {
      $("modalSizes")?.classList.remove("size-required");
    }, 1200);

    return;
  }

  addToCart(activeProduct, activeSize);
  closeProduct();
  openCart();
});

// -------------------------
// КОРЗИНА
// -------------------------

function saveCart() {
  try {
    localStorage.setItem("2108_cart", JSON.stringify(cart));
  } catch (error) {
    console.warn("Не удалось сохранить корзину:", error);
  }

  renderCart();
}

function addToCart(product, size) {
  const cartKey = `${product.id}_${size || ""}`;

  const existing = cart.find(item =>
    String(item.cartKey || `${item.id}_${item.size || ""}`) === cartKey
  );

  if (existing) {
    existing.qty = (Number(existing.qty) || 0) + 1;
  } else {
    cart.push({
      ...product,
      size: size || null,
      cartKey,
      qty: 1
    });
  }

  saveCart();
}

function renderCart() {
  const countElement =
    $("cart-count") || document.querySelector(".cart-count");

  const itemsElement = $("cartItems");
  const totalElement = $("cartTotal");

  const count = cart.reduce(
    (sum, item) => sum + (Number(item.qty) || 0),
    0
  );

  const total = cart.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0
  );

  if (countElement) countElement.textContent = count;
  if (totalElement) totalElement.textContent = money(total);

  if (itemsElement) {
    itemsElement.innerHTML = cart.length
      ? cart.map(item => {
          const key = String(
            item.cartKey || `${item.id}_${item.size || ""}`
          );

          return `
            <div class="cart-item">
              <div class="cart-item-img">
                ${imageMarkup(getImage(item), item.name)}
              </div>

              <div class="cart-item-details">
                <div class="cart-item-name">${esc(item.name)}</div>
                <div class="cart-item-meta">
                  ${item.size ? `Размер: ${esc(item.size)} · ` : ""}
                  ${Number(item.qty) || 0} × ${money(item.price)}
                </div>
              </div>

              <button
                class="remove-item"
                type="button"
                data-remove="${esc(key)}"
                aria-label="Удалить товар"
              >×</button>
            </div>
          `;
        }).join("")
      : `
        <div class="empty-cart">
          Корзина пока пуста.<br>
          Выбери что-нибудь из коллекции.
        </div>
      `;

    itemsElement.querySelectorAll("[data-remove]").forEach(button => {
      button.addEventListener("click", () => {
        const key = button.dataset.remove;

        cart = cart.filter(item =>
          String(item.cartKey || `${item.id}_${item.size || ""}`) !== key
        );

        saveCart();
      });
    });
  }

  const orderText = cart.length
    ? "Здравствуйте! Хочу заказать:\n" +
      cart.map(item =>
        `— ${item.name}` +
        (item.size ? `, размер ${item.size}` : "") +
        ` × ${Number(item.qty) || 0} — ` +
        money((Number(item.price) || 0) * (Number(item.qty) || 0))
      ).join("\n") +
      "\n\nИтого: " + money(total)
    : "Здравствуйте! Хочу узнать о товарах 2108 FITWEAR.";

  if ($("whatsappOrder")) {
    $("whatsappOrder").href =
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(orderText)}`;
  }
}

function openCart() {
  $("cart")?.classList.add("open");
  $("cart")?.setAttribute("aria-hidden", "false");
  $("cartOverlay")?.classList.add("open");
  document.body.classList.add("no-scroll");
}

function closeCart() {
  $("cart")?.classList.remove("open");
  $("cart")?.setAttribute("aria-hidden", "true");
  $("cartOverlay")?.classList.remove("open");
  document.body.classList.remove("no-scroll");
}

$("cartBtn")?.addEventListener("click", openCart);
$("cartClose")?.addEventListener("click", closeCart);
$("cartOverlay")?.addEventListener("click", closeCart);

// -------------------------
// МОБИЛЬНОЕ МЕНЮ
// -------------------------

$("mobileMenu")?.addEventListener("click", () => {
  const nav = $("nav");
  const isOpen = !nav?.classList.contains("mobile-open");

  nav?.classList.toggle("mobile-open", isOpen);
  $("mobileMenu")?.setAttribute("aria-expanded", String(isOpen));
  $("mobileMenu")?.setAttribute(
    "aria-label",
    isOpen ? "Закрыть меню" : "Открыть меню"
  );
});

$("nav")?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    $("nav")?.classList.remove("mobile-open");
    $("mobileMenu")?.setAttribute("aria-expanded", "false");
    $("mobileMenu")?.setAttribute("aria-label", "Открыть меню");
  });
});

// Закрытие окон клавишей Escape.
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;

  if ($("cart")?.classList.contains("open")) {
    closeCart();
  } else if ($("productModal")?.classList.contains("open")) {
    closeProduct();
  } else {
    $("nav")?.classList.remove("mobile-open");
    $("mobileMenu")?.setAttribute("aria-expanded", "false");
  }
});

// WhatsApp в футере.
if ($("footerWhatsapp")) {
  $("footerWhatsapp").href = `https://wa.me/${WHATSAPP}`;
}

// Запуск.
renderCart();
loadProducts();
	