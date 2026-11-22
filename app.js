const defaultProducts = [
 {id:1,name:"Говяжий стейк",category:"beef",label:"ГОВЯДИНА",desc:"Для сочного стейка и особенного ужина.",price:1190,unit:"кг",tag:"Выбор недели",img:"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80",stock:12,active:true},
 {id:2,name:"Говядина для тушения",category:"beef",label:"ГОВЯДИНА",desc:"Насыщенный вкус для домашних блюд.",price:790,unit:"кг",tag:"На каждый день",img:"https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=700&q=80",stock:18,active:true},
 {id:3,name:"Свиная шея",category:"pork",label:"СВИНИНА",desc:"Отлично подходит для запекания и шашлыка.",price:690,unit:"кг",tag:"Популярное",img:"https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?auto=format&fit=crop&w=700&q=80",stock:15,active:true},
 {id:4,name:"Свиная вырезка",category:"pork",label:"СВИНИНА",desc:"Нежная часть для быстрых и вкусных блюд.",price:820,unit:"кг",tag:"",img:"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80",stock:9,active:true},
 {id:5,name:"Баранина на кости",category:"lamb",label:"БАРАНИНА",desc:"Для ароматного рагу и традиционных рецептов.",price:980,unit:"кг",tag:"",img:"https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=700&q=80",stock:7,active:true},
 {id:6,name:"Каре ягнёнка",category:"lamb",label:"БАРАНИНА",desc:"Для праздничного стола и особых случаев.",price:1590,unit:"кг",tag:"Премиум",img:"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80",stock:4,active:true},
 {id:7,name:"Филе куриное",category:"poultry",label:"ПТИЦА",desc:"Универсальный продукт для ежедневного меню.",price:430,unit:"кг",tag:"",img:"https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=700&q=80",stock:25,active:true},
 {id:8,name:"Бедро индейки",category:"poultry",label:"ПТИЦА",desc:"Сочное мясо для запекания и гриля.",price:570,unit:"кг",tag:"",img:"https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=700&q=80",stock:11,active:true}
];
let products = JSON.parse(localStorage.getItem("ecoProducts") || "null") || [];
let cart = JSON.parse(localStorage.getItem("farmCart") || "{}");
let activeCategory = "all";
const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
function renderProducts(){
 const shown = products.filter(p=>p.active!==false && (activeCategory==="all"||p.category===activeCategory));
 const allCount = document.querySelector('[data-category="all"] span');
if(allCount) allCount.textContent = products.filter(p=>p.active!==false).length;
 $("#productGrid").innerHTML = shown.map(p=>`<article class="product-card"><div class="product-image" style="background-image:url('${p.img}')">${p.tag?`<span class="product-tag">${p.tag}</span>`:""}</div><div class="product-info"><span class="product-category">${p.label}</span><h3>${p.name}</h3><p>${p.desc}</p><div class="product-bottom"><span class="price">${money(p.price)} <small>/ ${p.unit}</small></span><button class="add-btn" data-add="${p.id}" aria-label="Добавить ${p.name}">+</button></div></div></article>`).join("");
 document.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>addToCart(b.dataset.add)));
}
function addToCart(id){cart[id]=(cart[id]||0)+1;saveCart();toast("Добавлено в корзину");}
function saveCart(){localStorage.setItem("farmCart",JSON.stringify(cart));renderCart();}
function cartEntries(){return Object.entries(cart).filter(([id,q])=>q>0).map(([id,q])=>({product:products.find(p=>String(p.id)===String(id)),qty:q})).filter(x=>x.product);}
function total(){return cartEntries().reduce((s,x)=>s+x.product.price*x.qty,0);}
function renderCart(){
 const entries=cartEntries(), count=entries.reduce((s,x)=>s+x.qty,0);
 $("#cartCount").textContent=count;$("#drawerCount").textContent=`(${count})`;$("#cartTotal").textContent=money(total());$("#checkoutTotal").textContent=money(total());$("#goCheckout").disabled=!count;
 $("#cartItems").innerHTML=entries.length?entries.map(({product:p,qty})=>`<div class="cart-row"><div class="cart-thumb" style="background-image:url('${p.img}')"></div><div><h4>${p.name}</h4><small>${money(p.price)} / ${p.unit}</small><div class="qty"><button data-dec="${p.id}">−</button><span>${qty}</span><button data-inc="${p.id}">+</button></div></div><strong>${money(p.price*qty)}</strong></div>`).join(""):`<div class="empty-cart"><span>♧</span><h3>Корзина пока пуста</h3><p>Добавьте продукты из каталога — и мы подготовим ваш заказ.</p></div>`;
 document.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>{cart[b.dataset.inc]++;saveCart()});
 document.querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>{const id=b.dataset.dec;cart[id]--;if(cart[id]<=0)delete cart[id];saveCart()});
}
function openCart(){$("#cartDrawer").classList.add("open");$("#overlay").classList.add("show");}
function closeLayers(){$("#cartDrawer").classList.remove("open");$("#checkoutModal").classList.remove("open");$("#overlay").classList.remove("show");}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2100);}
$("#filters").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;activeCategory=b.dataset.category;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderProducts();});
$("#openCart").onclick=openCart;$("#closeCart").onclick=closeLayers;$("#overlay").onclick=closeLayers;
$("#goCheckout").onclick=()=>{$("#cartDrawer").classList.remove("open");$("#checkoutModal").classList.add("open");};
$("#closeCheckout").onclick=closeLayers;
function updateFulfillmentFields() {
  const fulfillment = document.querySelector('input[name="fulfillment"]:checked').value;

  const addressField = $("#addressField");
  const pickupPointField = $("#pickupPointField");

  const addressInput = addressField.querySelector("input");
  const pickupSelect = pickupPointField.querySelector("select");

  if (fulfillment === "Доставка") {
    addressField.style.display = "block";
    pickupPointField.style.display = "none";

    addressInput.required = true;
    pickupSelect.required = false;
    pickupSelect.value = "";
  } else {
    addressField.style.display = "none";
    pickupPointField.style.display = "block";

    addressInput.required = false;
    addressInput.value = "";
    pickupSelect.required = true;
  }
}

document.querySelectorAll('input[name="fulfillment"]').forEach(r => {
  r.addEventListener("change", updateFulfillmentFields);
});

updateFulfillmentFields();
$("#checkoutForm").addEventListener("submit", async e => {
  e.preventDefault();

  if (!cartEntries().length) return;

  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form).entries());

  const config = window.ECOFERMER_SUPABASE_CONFIG;

  if (!window.supabase || !config || !config.url || !config.anonKey) {
    toast("Ошибка подключения к серверу. Попробуйте позже.");
    return;
  }

  submitButton.disabled = true;

  try {
    const client = window.supabase.createClient(config.url, config.anonKey);

    const orderNumber = "EF-" + Date.now().toString().slice(-7);

    const order = {
      order_number: orderNumber,
      customer_name: data.name,
      phone: data.phone,
      fulfillment: data.fulfillment,
      address: data.address || "",
      comment: data.comment || "",
      items: cartEntries().map(x => ({
        name: x.product.name,
        qty: x.qty,
        price: x.product.price
      })),
      total: total(),
      status: "Новый"
    };

    const { error } = await client
      .from("orders")
      .insert(order);

    if (error) throw error;

    console.log("Order successfully saved:", order);

    closeLayers();
    cart = {};
    saveCart();
    form.reset();
    $("#addressField").style.display = "block";

    toast("Заказ " + orderNumber + " успешно отправлен!");

  } catch (error) {
    console.error("Order save error:", error);
    toast("Не удалось отправить заказ. Попробуйте ещё раз.");
  } finally {
    submitButton.disabled = false;
  }
});
// Информационные окна Экофермер
const infoModalData = {
  delivery: {
    title: "Доставка по Москве и Московской области",
    content: `
      <p>Мы ежедневно доставляем свежую мясную продукцию по Москве и Московской области.</p>
      <p><strong>Стоимость доставки:</strong></p>
      <ul>
        <li>При заказе от 5 000 ₽ — <strong>бесплатно.</strong></li>
        <li>При заказе менее 5 000 ₽ — <strong>500 ₽.</strong></li>
      </ul>
      <p><strong>Как оформить доставку:</strong></p>
      <ul>
        <li>Выберите продукты в каталоге и добавьте их в корзину.</li>
        <li>Перейдите к оформлению заказа.</li>
        <li>Укажите имя, номер телефона и полный адрес доставки.</li>
        <li>Отправьте заказ — мы свяжемся с вами для подтверждения.</li>
      </ul>
      <p><strong>График доставки:</strong> ежедневно, по предварительной договорённости. Дату и удобное время согласуем при подтверждении заказа.</p>
    `
  },

  pickup: {
    title: "Самовывоз — выберите удобную точку",
    content: `
      <p>Вы можете самостоятельно забрать свой заказ в одной из наших точек выдачи.</p>
      <p><strong>Москва:</strong></p>
      <ul>
        <li>Улица Молодцова, 2А.</li>
        <li>Алтуфьево, Бибиревский рынок.</li>
      </ul>
      <p><strong>Одинцово:</strong></p>
      <ul>
        <li>Улица Чистякова, 42.</li>
      </ul>
      <p><strong>График работы всех точек:</strong> ежедневно с 08:00 до 20:00.</p>
      <p><strong>Как получить заказ:</strong></p>
      <ul>
        <li>Выберите продукты в каталоге.</li>
        <li>Добавьте их в корзину и оформите заказ.</li>
        <li>Укажите номер телефона и выберите самовывоз.</li>
        <li>Согласуйте с нами удобную точку получения.</li>
      </ul>
      <p>Пожалуйста, дождитесь подтверждения заказа перед посещением точки выдачи.</p>
    `
  },

  care: {
    title: "Забота о вашем заказе",
    content: `
      <p>В «Экофермере» мы внимательно относимся к каждому заказу — от выбора продуктов до их передачи покупателю.</p>
      <p><strong>Как мы подготавливаем ваши покупки:</strong></p>
      <ul>
        <li><strong>Аккуратная упаковка.</strong> Мясная продукция заворачивается в крафтовую бумагу.</li>
        <li><strong>Большие заказы.</strong> Если вы заказываете много продукции, мы бережно упаковываем её в картонную коробку.</li>
        <li><strong>Внимательная комплектация.</strong> Проверяем состав заказа и количество выбранных продуктов.</li>
        <li><strong>Индивидуальный подход.</strong> Учитываем ваши пожелания и комментарии к заказу.</li>
      </ul>
      <p><strong>Наша цель — чтобы каждый заказ был аккуратно подготовлен и доставлен с заботой о покупателе.</strong></p>
      <p>Спасибо, что выбираете «Экофермер»!</p>
    `
  }
};
const infoModalOverlay = $("#infoModalOverlay");
const infoModalTitle = $("#infoModalTitle");
const infoModalContent = $("#infoModalContent");

function openInfoModal(type) {
  const info = infoModalData[type];
  if (!info) return;

  infoModalTitle.textContent = info.title;
  infoModalContent.innerHTML = info.content;
  infoModalOverlay.classList.add("show");
  document.body.style.overflow = "hidden";
  $("#infoModalClose").focus();
}

function closeInfoModal() {
  infoModalOverlay.classList.remove("show");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-info]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    openInfoModal(link.dataset.info);
  });
});

$("#infoModalClose").addEventListener("click", closeInfoModal);

infoModalOverlay.addEventListener("click", event => {
  if (event.target === infoModalOverlay) {
    closeInfoModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeInfoModal();
  }
});
// Конец информационных окон
$("#menuToggle").onclick=()=>$(".main-nav").classList.toggle("show");
window.applyCloudImageMap = function(map) {
  products.forEach(product => {
    const cloudUrl = map.get(String(product.id));
    if (cloudUrl) {
      product.img = cloudUrl;
    }
  });
window.setEcofermerProductsFromCloud = function(rows) {
  products = (rows || []).map(row => ({
    id: String(row.id),
    name: row.name,
    category: row.category || "",
    label: ({
      beef: "ГОВЯДИНА",
      pork: "СВИНИНА",
      lamb: "БАРАНИНА",
      poultry: "ПТИЦА"
    })[row.category] || row.category || "",
    desc: row.description || "",
    price: Number(row.price) || 0,
    unit: row.unit || "кг",
    tag: row.tag || "",
    img: row.image_url || "",
    stock: Number(row.stock) || 0,
    active: row.is_active !== false
  }));

  renderProducts();
  renderCart();
};
  renderProducts();
};

renderProducts();
renderCart();
