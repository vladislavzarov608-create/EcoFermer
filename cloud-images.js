/* Экофермер: облачные фотографии товаров через Supabase Storage + таблицу product_images. */
(() => {
  const cfg = window.ECOFERMER_SUPABASE_CONFIG || {};
  const configured = cfg.url && cfg.anonKey && !String(cfg.url).includes('ВСТАВЬТЕ') && !String(cfg.anonKey).includes('ВСТАВЬТЕ');
  const isAdmin = !!document.querySelector('#productForm');
  let client = null;
  const $ = (s, root = document) => root.querySelector(s);
  const say = (el, msg, error = false) => { if (el) { el.textContent = msg; el.style.color = error ? '#a33b2f' : '#426747'; } };

  if (!configured) {
    if (isAdmin) {
      const note = document.createElement('div');
      note.className = 'notice';
      note.textContent = 'Облачные фотографии пока не настроены. Заполни cloud-images-config.js данными своего проекта Supabase и выполни SQL из supabase-setup.sql.';
      $('#products .admin-heading')?.after(note);
    }
    return;
  }
  if (!window.supabase?.createClient) {
    console.error('Не загрузилась библиотека Supabase. Проверь подключение к CDN.');
    return;
  }
  client = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });

  async function getImageMap() {
  const { data, error } = await client
    .from('product_images')
    .select('product_id,image_url');

  if (error) throw error;

  return new Map(
    (data || []).map(row => [
      String(row.product_id),
      row.image_url
    ])
  );
}
async function syncStorefront() {
  if (isAdmin) return;

  try {
    const { data, error } = await client
      .from('products')
      .select('id,name,description,price,image_url,category,unit,stock,is_active,tag')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Если облачный каталог пока пуст, оставляем локальные товары.
    if (Array.isArray(data) && data.length > 0) {
      if (typeof window.setEcofermerProductsFromCloud === 'function') {
        window.setEcofermerProductsFromCloud(data);
      }
    }

    const map = await getImageMap();

    if (typeof window.applyCloudImageMap === 'function') {
      window.applyCloudImageMap(map);
    }

    window.ecofermerCloudImageMap = map;

  } catch (err) {
    console.warn('Не удалось загрузить облачный каталог:', err.message);
  }
}

  function addAdminControls() {
    const form = $('#productForm');
    if (!form) return;
    const panel = document.createElement('div');
    panel.className = 'notice';
    panel.style.gridColumn = '1/-1';
    panel.innerHTML = `
      <strong>Облачные фотографии</strong>
      <div id="ecoCloudAuth" style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-top:10px;align-items:end">
        <label style="display:flex;flex-direction:column;gap:5px">Email администратора<input id="ecoCloudEmail" type="email" autocomplete="username" placeholder="admin@example.com"></label>
        <label style="display:flex;flex-direction:column;gap:5px">Пароль<input id="ecoCloudPassword" type="password" autocomplete="current-password" placeholder="Пароль Supabase"></label>
        <button class="admin-btn" type="button" id="ecoCloudLogin">Войти</button>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px"><span id="ecoCloudStatus">Войдите, чтобы загружать изображения в общее хранилище.</span><button type="button" class="action-link" id="ecoCloudLogout" hidden>Выйти</button></div>
      <label style="display:flex;flex-direction:column;gap:6px;margin-top:12px">Выбрать фотографию с устройства<input id="ecoCloudFile" type="file" accept="image/jpeg,image/png,image/webp" style="width:100%"></label>
      <small style="display:block;margin-top:5px">JPG, PNG или WEBP; до 5 МБ. После сохранения фотография станет доступна посетителям сайта.</small>
      <img id="ecoCloudPreview" alt="Предпросмотр фотографии" style="display:none;max-width:180px;max-height:140px;object-fit:cover;margin-top:10px;border-radius:6px">
    `;
    const imgLabel = form.querySelector('input[name="img"]')?.closest('label');
    if (imgLabel) imgLabel.after(panel); else form.prepend(panel);
    const status = $('#ecoCloudStatus', panel), fileInput = $('#ecoCloudFile', panel), preview = $('#ecoCloudPreview', panel);

    async function refreshAuth() {
      const { data } = await client.auth.getSession();
      const signedIn = !!data.session;
      $('#ecoCloudLogin', panel).hidden = signedIn;
      $('#ecoCloudEmail', panel).hidden = signedIn;
      $('#ecoCloudPassword', panel).hidden = signedIn;
      $('#ecoCloudLogout', panel).hidden = !signedIn;
      say(status, signedIn ? `Вход выполнен: ${data.session.user.email}. Загрузка доступна.` : 'Войдите, чтобы загружать изображения в общее хранилище.');
    }
    $('#ecoCloudLogin', panel).onclick = async () => {
      const email = $('#ecoCloudEmail', panel).value.trim();
      const password = $('#ecoCloudPassword', panel).value;
      if (!email || !password) return say(status, 'Укажи email и пароль администратора.', true);
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) return say(status, error.message, true);
      await refreshAuth();
    };
    $('#ecoCloudLogout', panel).onclick = async () => { await client.auth.signOut(); await refreshAuth(); };
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (!file) { preview.style.display = 'none'; return; }
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        fileInput.value = ''; preview.style.display = 'none'; return say(status, 'Выбери JPG, PNG или WEBP размером не более 5 МБ.', true);
      }
      preview.src = URL.createObjectURL(file); preview.style.display = 'block'; say(status, `Выбрано: ${file.name}`);
    };
    refreshAuth();

    // Перехватываем сохранение формы только на время облачной операции, затем передаём управление штатному admin.js.
    const originalSubmit = form.onsubmit;
    form.onsubmit = event => {
      event.preventDefault();
      (async () => {
      const submit = form.querySelector('button[type="submit"]');
      const file = fileInput.files?.[0];
      const { data: sessionData } = await client.auth.getSession();
      const session = sessionData.session;
      if (file && !session) return say(status, 'Сначала войди в аккаунт администратора.', true);
      if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type))) return say(status, 'Недопустимый формат или размер файла (максимум 5 МБ).', true);
      if (submit) submit.disabled = true;
      try {
        const productId = form.elements.id.value || String(Date.now());
        form.elements.id.value = productId;
        if (file) {
          const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
          const path = `products/${productId}/${Date.now()}.${ext}`;
          const { error: uploadError } = await client.storage.from(cfg.bucket || 'product-images').upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: true });
          if (uploadError) throw uploadError;
          const { data: urlData } = client.storage.from(cfg.bucket || 'product-images').getPublicUrl(path);
          form.elements.img.value = urlData.publicUrl;
          const { error: dbError } = await client.from('product_images').upsert({ product_id: String(productId), image_url: urlData.publicUrl, storage_path: path, updated_at: new Date().toISOString() });
          if (dbError) throw dbError;
          say(status, 'Фотография загружена в облако и привязана к товару.');
        } else if (form.elements.img.value.trim() && session) {
          const { error } = await client.from('product_images').upsert({ product_id: String(productId), image_url: form.elements.img.value.trim(), storage_path: '', updated_at: new Date().toISOString() });
          if (error) throw error;
        }
        if (typeof originalSubmit === 'function') originalSubmit.call(form, { preventDefault() {}, target: form });
        fileInput.value = ''; preview.style.display = 'none';
        if (file) say(status, 'Готово! Фотография сохранена и доступна покупателям после обновления витрины.');
      } catch (err) { say(status, `Не удалось сохранить фото: ${err.message}`, true); }
      finally { if (submit) submit.disabled = false; }
      })();
    };
  }

  if (isAdmin) addAdminControls(); else syncStorefront();
})();
