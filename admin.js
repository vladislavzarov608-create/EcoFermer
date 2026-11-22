const $=s=>document.querySelector(s);
const categoryNames={
  beef:"Говядина",
  pork:"Свинина",
  lamb:"Баранина",
  poultry:"Птица",
  sausages:"Колбасные изделия",
  cheese:"Сыры",
  dairy:"Молочная продукция"
};
const fmt=n=>new Intl.NumberFormat("ru-RU").format(n||0)+" ₽";
let products=JSON.parse(localStorage.getItem("ecoProducts")||"null")||[];
let orders=JSON.parse(localStorage.getItem("ecoOrders")||"[]");
function saveProducts(){localStorage.setItem("ecoProducts",JSON.stringify(products));}
function refresh(){
 products=JSON.parse(localStorage.getItem("ecoProducts")||"null")||[];
 orders=JSON.parse(localStorage.getItem("ecoOrders")||"[]");
 $("#statProducts").textContent=products.length;
 $("#statOrders").textContent=orders.length;
 $("#statNew").textContent=orders.filter(o=>o.status==="Новый").length;
 $("#statRevenue").textContent=fmt(orders.reduce((s,o)=>s+(o.total||0),0));
 renderProducts();renderOrders();renderRecent();
}
function renderProducts(){
 $("#productsTable").innerHTML=products.map(p=>`<tr><td><b>${p.name}</b></td><td>${categoryNames[p.category]||p.category}</td><td>${fmt(p.price)}</td><td>${p.stock??"—"}</td><td><span class="status">${p.active===false?"Скрыт":"Опубликован"}</span></td><td><button class="action-link" data-edit="${p.id}">Изменить</button> <button class="action-link" data-delete="${p.id}">Удалить</button></td></tr>`).join("")||'<tr><td colspan="6">Товаров пока нет</td></tr>';
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editProduct(b.dataset.edit));
 document.querySelectorAll("[data-delete]").forEach(b => {
  b.onclick = async () => {
    if (!confirm("Удалить товар? Это действие удалит его из облачного каталога.")) return;

    try {
      if (typeof window.ecofermerDeleteCloudProduct !== 'function') {
        throw new Error('Функция облачного удаления не найдена. Обновите страницу.');
      }

      await window.ecofermerDeleteCloudProduct(b.dataset.delete);

      products = products.filter(p => String(p.id) !== String(b.dataset.delete));
      saveProducts();
      refresh();

      alert('Товар успешно удалён из облачного каталога.');
    } catch (err) {
      alert('Не удалось удалить товар: ' + err.message);
    }
  };
});
}
async function renderOrders() {
  const config = window.ECOFERMER_SUPABASE_CONFIG;
  const client = window.supabase.createClient(
    config.url,
    config.anonKey
  );

  const { data, error } = await client
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ошибка загрузки заказов:", error);
    $("#emptyDeliveryOrders").textContent = "Не удалось загрузить заказы.";
    $("#emptyPickupOrders").textContent = "Не удалось загрузить заказы.";
    return;
  }

  orders = (data || []).map(o => ({
    id: o.order_number,
    dbId: o.id,
    createdAt: o.created_at,
    name: o.customer_name,
    phone: o.phone,
    fulfillment: o.fulfillment,
    address: o.address,
    comment: o.comment,
    items: o.items,
    total: Number(o.total),
    status: o.status
  }));

  const deliveryOrders = orders.filter(o => o.fulfillment === "Доставка");
  const pickupOrders = orders.filter(o => o.fulfillment === "Самовывоз");

  function renderTable(list) {
    return list.map(o => `
      <tr>
        <td><b>${o.id}</b></td>
        <td>${new Date(o.createdAt).toLocaleString("ru-RU")}</td>
        <td>${o.name}<br>${o.phone}</td>
        <td>${o.address || "Не указан"}</td>
        <td>${(o.items || []).map(i => `${i.name} × ${i.qty}`).join("<br>")}</td>
        <td><b>${fmt(o.total)}</b></td>
        <td>
          <select data-status="${o.dbId}">
            ${["Новый","Подтверждён","Готовится","Передан в доставку","Выполнен","Отменён"]
              .map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
      </tr>
    `).join("");
  }

  $("#deliveryOrdersTable").innerHTML = renderTable(deliveryOrders);
  $("#pickupOrdersTable").innerHTML = renderTable(pickupOrders);

  $("#emptyDeliveryOrders").style.display = deliveryOrders.length ? "none" : "block";
  $("#emptyPickupOrders").style.display = pickupOrders.length ? "none" : "block";

  $("#statOrders").textContent = orders.length;
  $("#statNew").textContent = orders.filter(o => o.status === "Новый").length;
  $("#statRevenue").textContent = fmt(
    orders.reduce((sum, o) => sum + o.total, 0)
  );

  renderRecent();

  document.querySelectorAll("[data-status]").forEach(sel => {
    sel.onchange = async () => {
      const { error } = await client
        .from("orders")
        .update({ status: sel.value })
        .eq("id", sel.dataset.status);

      if (error) {
        alert("Не удалось изменить статус: " + error.message);
        return;
      }

      renderOrders();
    };
  });
}
function renderRecent(){
 const recentElement = $("#recentOrders");

 if (!recentElement) {
   return;
 }

 const recent = orders.slice(0, 5);

 recentElement.innerHTML = recent.length
   ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Номер</th><th>Покупатель</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>${recent.map(o=>`<tr><td>${o.id}</td><td>${o.name||"—"}</td><td>${fmt(o.total)}</td><td><span class="status">${o.status||"Новый"}</span></td></tr>`).join("")}</tbody></table></div>`
   : '<p class="empty-note">Новых заказов пока нет.</p>';
}
function editProduct(id){
 const p=products.find(x=>String(x.id)===String(id));const f=$("#productForm");f.reset();
 $("#productEditor").hidden=false;$("#editorTitle").textContent=p?"Редактирование товара":"Новый товар";
 f.elements.id.value=p?.id||"";
 ["name","category","price","old_price","stock","unit","tag","desc","img"].forEach(k=>f.elements[k].value=p?.[k]??(k==="unit"?"кг":k==="stock"?0:""));
 f.elements.active.checked=p?.active!==false;
 $("#productEditor").scrollIntoView({behavior:"smooth"});
}
$("#addProduct").onclick=()=>editProduct(null);
$("#cancelEdit").onclick=()=>$("#productEditor").hidden=true;
$("#productForm").onsubmit=e=>{
 e.preventDefault();const f=e.target;const id=f.elements.id.value?String(f.elements.id.value):String(Date.now());
 const p={id,name:f.elements.name.value.trim(),category:f.elements.category.value,label:categoryNames[f.elements.category.value].toUpperCase(),price:Number(f.elements.price.value),old_price:f.elements.old_price.value
  ? Number(f.elements.old_price.value)
  : null,stock:Number(f.elements.stock.value),unit:f.elements.unit.value||"кг",tag:f.elements.tag.value,desc:f.elements.desc.value,img:f.elements.img.value||"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80",active:f.elements.active.checked};
 const i=products.findIndex(x=>x.id===id);if(i>=0)products[i]=p;else products.push(p);
 saveProducts();$("#productEditor").hidden=true;refresh();alert("Товар сохранён в административной панели и отправлен в облачный каталог.");
};
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".admin-section").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab));});
$("#resetDemo").onclick=()=>{if(confirm("Удалить локальные товары и заказы?")){localStorage.removeItem("ecoProducts");localStorage.removeItem("ecoOrders");refresh();}};
refresh();
