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
let products = JSON.parse(localStorage.getItem("ecoProducts") || "null") || defaultProducts;
let cart = JSON.parse(localStorage.getItem("farmCart") || "{}");
let activeCategory = "all";
const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
function renderProducts(){
 const shown = products.filter(p=>p.active!==false && (activeCategory==="all"||p.category===activeCategory));
 $("#productGrid").innerHTML = shown.map(p=>`<article class="product-card"><div class="product-image" style="background-image:url('${p.img}')">${p.tag?`<span class="product-tag">${p.tag}</span>`:""}</div><div class="product-info"><span class="product-category">${p.label}</span><h3>${p.name}</h3><p>${p.desc}</p><div class="product-bottom"><span class="price">${money(p.price)} <small>/ ${p.unit}</small></span><button class="add-btn" data-add="${p.id}" aria-label="Добавить ${p.name}">+</button></div></div></article>`).join("");
 document.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>addToCart(Number(b.dataset.add))));
}
function addToCart(id){cart[id]=(cart[id]||0)+1;saveCart();toast("Добавлено в корзину");}
function saveCart(){localStorage.setItem("farmCart",JSON.stringify(cart));renderCart();}
function cartEntries(){return Object.entries(cart).filter(([id,q])=>q>0).map(([id,q])=>({product:products.find(p=>p.id===Number(id)),qty:q})).filter(x=>x.product);}
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
document.querySelectorAll('input[name="fulfillment"]').forEach(r=>r.addEventListener("change",()=>{$("#addressField").style.display=document.querySelector('input[name="fulfillment"]:checked').value==="Доставка"?"block":"none";}));
$("#checkoutForm").addEventListener("submit",e=>{
 e.preventDefault();if(!cartEntries().length)return;
 const data=Object.fromEntries(new FormData(e.target).entries());
 const order={...data,items:cartEntries().map(x=>({name:x.product.name,qty:x.qty,price:x.product.price})),total:total(),createdAt:new Date().toISOString()};
 const savedOrders = JSON.parse(localStorage.getItem("ecoOrders") || "[]");
 order.id = "EF-" + Date.now().toString().slice(-7);
 order.status = "Новый";
 savedOrders.unshift(order);
 localStorage.setItem("ecoOrders", JSON.stringify(savedOrders));
 console.log("Demo order saved locally:",order);
 closeLayers();cart={};saveCart();e.target.reset();$("#addressField").style.display="block";
 toast("Демонстрационный заказ сформирован. Подключите сервер для приёма заказов.");
});
$("#menuToggle").onclick=()=>$(".main-nav").classList.toggle("show");
window.applyCloudImageMap = function(map) {
  products.forEach(product => {
    const cloudUrl = map.get(String(product.id));
    if (cloudUrl) {
      product.img = cloudUrl;
    }
  });

  renderProducts();
};

renderProducts();
renderCart();
