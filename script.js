const products = [
  {id:1,name:"Contour Performance Top",category:"tops",label:"TOP",price:18900,img:"assets/product-01.jpg",desc:"Эластичный спортивный топ с плотной посадкой и минималистичным дизайном."},
  {id:2,name:"Motion Leggings",category:"bottoms",label:"BESTSELLER",price:24900,img:"assets/product-02.jpg",desc:"Высокая посадка и эластичная ткань для тренировок и активного дня."},
  {id:3,name:"Second Skin Bodysuit",category:"sets",label:"NEW",price:32900,img:"assets/product-03.jpg",desc:"Обтекаемый силуэт и комфортная посадка. Универсальная база для activewear-гардероба."},
  {id:4,name:"Core Zip Jacket",category:"outerwear",label:"NEW",price:36900,img:"assets/product-04.jpg",desc:"Лёгкая спортивная куртка на молнии — для разминки, прогулок и дороги в зал."},
  {id:5,name:"Studio Set",category:"sets",label:"2108 EDIT",price:44900,img:"assets/product-05.jpg",desc:"Комплект из базовых элементов коллекции 2108 FITWEAR."},
  {id:6,name:"Essential Training Set",category:"sets",label:"LIMITED",price:42900,img:"assets/product-06.jpg",desc:"Сдержанный чёрный комплект для тренировок и повседневного образа."},
  {id:7,name:"Lace Back Top",category:"tops",label:"DETAIL",price:19900,img:"assets/product-07.jpg",desc:"Топ с выразительной спинкой и поддерживающей посадкой."},
  {id:8,name:"Minimal Performance Bottoms",category:"bottoms",label:"CORE",price:23900,img:"assets/product-08.jpg",desc:"Минималистичная модель с комфортной посадкой и чистыми линиями."},
  {id:9,name:"Everyday Zip Layer",category:"outerwear",label:"CORE",price:34900,img:"assets/product-09.jpg",desc:"Универсальный верхний слой для дороги в зал и активного города."},
  {id:10,name:"2108 Signature",category:"tops",label:"SIGNATURE",price:21900,img:"assets/product-10.jpg",desc:"Фирменная модель 2108 FITWEAR с лаконичным силуэтом."},
  {id:11,name:"Training Leggings",category:"bottoms",label:"CORE",price:25900,img:"assets/product-11.jpg",desc:"Тренировочные легинсы с высокой посадкой."},
  {id:12,name:"Soft Motion Layer",category:"outerwear",label:"NEW",price:35900,img:"assets/product-12.jpg",desc:"Мягкий слой для комфортного движения до и после тренировки."}
];

let cart = [];
let activeProduct = null;

const productsEl = document.getElementById("products");
const cartEl = document.getElementById("cart");
const cartOverlay = document.getElementById("cartOverlay");
const cartItemsEl = document.getElementById("cartItems");
const cartCountEl = document.querySelector(".cart-count");
const cartTotalEl = document.getElementById("cartTotal");
const modal = document.getElementById("productModal");

function money(n){ return new Intl.NumberFormat("ru-RU").format(n) + " ₸"; }

function renderProducts(filter="all", search=""){
  const q = search.trim().toLowerCase();
  const list = products.filter(p =>
    (filter === "all" || p.category === filter) &&
    (!q || p.name.toLowerCase().includes(q) || p.category.includes(q))
  );
  productsEl.innerHTML = list.length ? list.map(p => `
    <article class="product">
      <div class="product-image">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        <span class="product-badge">${p.label}</span>
        <button class="product-like" aria-label="Избранное">♡</button>
      </div>
      <div class="product-info">
        <div>
          <div class="product-name">${p.name}</div>
          <div class="product-meta">${p.category.toUpperCase()} · S / M / L</div>
        </div>
        <div class="product-price">${money(p.price)}</div>
      </div>
      <button class="btn btn-dark full quick-view" data-id="${p.id}">ПОСМОТРЕТЬ ТОВАР ↗</button>
    </article>
  `).join("") : `<p style="grid-column:1/-1;color:#777;padding:40px 0">Ничего не найдено.</p>`;

  document.querySelectorAll(".quick-view").forEach(btn =>
    btn.addEventListener("click", () => openProduct(Number(btn.dataset.id)))
  );
}

function openProduct(id){
  activeProduct = products.find(p => p.id === id);
  document.getElementById("modalImg").src = activeProduct.img;
  document.getElementById("modalImg").alt = activeProduct.name;
  document.getElementById("modalCategory").textContent = activeProduct.category.toUpperCase() + " · 2108 FITWEAR";
  document.getElementById("modalName").textContent = activeProduct.name;
  document.getElementById("modalPrice").textContent = money(activeProduct.price);
  document.getElementById("modalDescription").textContent = activeProduct.desc;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
}
function closeProduct(){
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
}
function openCart(){ cartEl.classList.add("open"); cartOverlay.classList.add("open"); }
function closeCart(){ cartEl.classList.remove("open"); cartOverlay.classList.remove("open"); }

function addToCart(product){
  const found = cart.find(i => i.id === product.id);
  if(found) found.qty++;
  else cart.push({...product, qty:1});
  renderCart();
  closeProduct();
  openCart();
}

function renderCart(){
  const count = cart.reduce((s,i)=>s+i.qty,0);
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  cartCountEl.textContent = count;
  cartTotalEl.textContent = money(total);

  if(!cart.length){
    cartItemsEl.innerHTML = `<div class="empty-cart">Корзина пока пуста.<br>Выбери что-нибудь из коллекции.</div>`;
  } else {
    cartItemsEl.innerHTML = cart.map(i => `
      <div class="cart-item">
        <div class="cart-item-img"><img src="${i.img}" alt="${i.name}"></div>
        <div>
          <div class="cart-item-name">${i.name}</div>
          <div class="cart-item-meta">${i.qty} × ${money(i.price)}</div>
        </div>
        <button class="remove-item" data-remove="${i.id}" aria-label="Удалить">×</button>
      </div>
    `).join("");
    document.querySelectorAll("[data-remove]").forEach(b =>
      b.addEventListener("click", () => {
        cart = cart.filter(i => i.id !== Number(b.dataset.remove));
        renderCart();
      })
    );
  }

  const text = cart.length
    ? "Здравствуйте! Хочу заказать:%0A" + cart.map(i => `— ${i.name} × ${i.qty} — ${money(i.price*i.qty)}`).join("%0A") + `%0A%0AИтого: ${money(total)}`
    : "Здравствуйте! Хочу узнать о товарах 2108 FITWEAR.";
  document.getElementById("whatsappOrder").href = `https://wa.me/7760070870?text=${text}`;
}

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(btn.dataset.filter, document.getElementById("searchInput").value);
  });
});

document.getElementById("searchBtn").addEventListener("click", () =>
  document.getElementById("searchbar").classList.toggle("open")
);
document.getElementById("searchInput").addEventListener("input", e => {
  const active = document.querySelector(".filter.active").dataset.filter;
  renderProducts(active, e.target.value);
});
document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
document.getElementById("modalClose").addEventListener("click", closeProduct);
document.querySelector(".modal-backdrop").addEventListener("click", closeProduct);
document.getElementById("modalAdd").addEventListener("click", () => activeProduct && addToCart(activeProduct));
document.addEventListener("keydown", e => {
  if(e.key === "Escape"){ closeProduct(); closeCart(); }
});

document.getElementById("footerWhatsapp").href = "https://wa.me/7760070870";

renderProducts();
renderCart();

/*
  ВАЖНО ПЕРЕД ПУБЛИКАЦИЕЙ:
  1) Заменить номер 77000000000 на WhatsApp заказчика.
  2) Проверить/заменить ссылку Instagram.
  3) Заменить названия, цены, размеры и описания на реальные данные бренда.
  4) При необходимости заменить изображения в /assets на оригинальные фото заказчика.
*/
