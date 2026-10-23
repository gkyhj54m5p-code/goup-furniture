/**
 * Go Up Office Furniture - Core Application Logic
 * Integrates WhatsApp Quotation, Catalog Filtering, Instant Search, Lightbox, and Measurement Booking
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global App State
  const state = {
    activeCategory: 'all',
    searchQuery: '',
    cart: JSON.parse(localStorage.getItem('goup_quote_cart')) || [],
    currentLightboxProduct: null
  };

  // DOM Elements
  const productsContainer = document.getElementById('productsContainer');
  const categoryPillsContainer = document.getElementById('categoryPillsContainer');
  const searchInput = document.getElementById('catalogSearchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const productCountDisplay = document.getElementById('productCountDisplay');

  // Modals & Drawers
  const cartModal = document.getElementById('cartModal');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartCountBadges = document.querySelectorAll('.cart-badge');
  const cartTotalItemsCount = document.getElementById('cartTotalItemsCount');
  
  const lightboxModal = document.getElementById('lightboxModal');
  const measurementModal = document.getElementById('measurementModal');
  const waChatBox = document.getElementById('waChatBox');

  // Toast
  const toastNotice = document.getElementById('toastNotice');
  const toastMessage = document.getElementById('toastMessage');

  /* ===================================================================
     INITIALIZATION & RENDERING
     =================================================================== */
  initCategoryPills();
  renderProducts();
  updateCartUI();
  setupEventListeners();

  /* ===================================================================
     CATEGORY PILLS
     =================================================================== */
  function initCategoryPills() {
    if (!categoryPillsContainer) return;
    categoryPillsContainer.innerHTML = '';

    CATEGORIES.forEach(cat => {
      const button = document.createElement('button');
      button.className = `cat-pill ${cat.id === state.activeCategory ? 'active' : ''}`;
      button.setAttribute('data-category', cat.id);
      button.innerHTML = `
        <i class="fas ${cat.icon}"></i>
        <span>${cat.name}</span>
      `;
      button.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        button.classList.add('active');
        state.activeCategory = cat.id;
        renderProducts();
      });
      categoryPillsContainer.appendChild(button);
    });
  }

  /* ===================================================================
     PRODUCTS RENDERING & INSTANT SEARCH
     =================================================================== */
  function getFilteredProducts() {
    return PRODUCTS.filter(product => {
      // Category Match
      const matchesCategory = state.activeCategory === 'all' || product.categoryId === state.activeCategory;
      
      // Search Match
      const query = state.searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const codeMatch = product.code.toLowerCase().includes(query);
      const nameMatch = product.name.toLowerCase().includes(query);
      const catMatch = product.category.toLowerCase().includes(query);
      const matMatch = (product.materials || '').toLowerCase().includes(query);
      const descMatch = (product.description || '').toLowerCase().includes(query);

      return matchesCategory && (codeMatch || nameMatch || catMatch || matMatch || descMatch);
    });
  }

  function renderProducts() {
    if (!productsContainer) return;
    const filtered = getFilteredProducts();

    // Update Counter
    if (productCountDisplay) {
      productCountDisplay.innerHTML = `عرض <strong>${filtered.length}</strong> من إجمالي <strong>${PRODUCTS.length}</strong> موديل`;
    }

    if (filtered.length === 0) {
      productsContainer.innerHTML = `
        <div class="catalog-empty-state">
          <i class="fas fa-search"></i>
          <h3>لم نعثر على موديلات تطابق بحثك</h3>
          <p class="text-muted">جرب البحث بكلمة أخرى أو كود مختلف مثل (M-O-01, DO-08, W-S-01, إلخ)</p>
          <button class="btn-primary-lg" style="margin-top: 18px; padding: 10px 24px; font-size: 0.9rem;" id="resetFilterBtn">
            إعادة تعيين الفلتر والبحث
          </button>
        </div>
      `;
      const resetBtn = document.getElementById('resetFilterBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.searchQuery = '';
          state.activeCategory = 'all';
          if (searchInput) searchInput.value = '';
          if (searchClearBtn) searchClearBtn.style.display = 'none';
          initCategoryPills();
          renderProducts();
        });
      }
      return;
    }

    productsContainer.innerHTML = filtered.map(item => {
      const isAlreadyInCart = state.cart.some(c => c.id === item.id);
      return `
        <div class="product-card" data-product-id="${item.id}">
          <div class="product-image-wrap" onclick="window.appOpenLightbox('${item.id}')">
            <span class="product-code-pill">${item.code}</span>
            <span class="product-page-pill">
              <i class="fas fa-book-open"></i> ${item.catalogPage || 'الكتالوج'}
            </span>
            <span class="product-warranty-badge">
              <i class="fas fa-shield-alt"></i> ضمان 5 سنوات
            </span>
            <img src="${item.image}" alt="${item.name}" loading="lazy" />
            <div class="image-zoom-overlay">
              <span><i class="fas fa-expand-arrows-alt"></i> معاينة مكبرة وتفاصيل</span>
            </div>
          </div>

          <div class="product-details">
            <div class="product-card-top-meta">
              <span class="product-cat-name">
                <i class="fas fa-folder-open"></i> ${item.category}
              </span>
              <span class="catalog-ref-tag">
                <i class="fas fa-bookmark text-primary"></i> ${item.catalogPage}
              </span>
            </div>
            
            <h3 class="product-title" title="${item.name}">${item.name}</h3>

            <div class="product-specs">
              <div class="spec-line">
                <strong><i class="fas fa-ruler-combined text-primary"></i> المقاس:</strong>
                <span>${item.dimensions}</span>
              </div>
              <div class="spec-line">
                <strong><i class="fas fa-layer-group text-primary"></i> الخامة:</strong>
                <span title="${item.materials}">${item.materials.length > 55 ? item.materials.substring(0, 52) + '...' : item.materials}</span>
              </div>
            </div>

            <div class="product-actions-row">
              <button 
                class="btn-add-quote ${isAlreadyInCart ? 'added' : ''}" 
                onclick="window.appAddToCart('${item.id}')"
                id="btn-cart-${item.id}">
                <i class="fas ${isAlreadyInCart ? 'fa-check' : 'fa-cart-plus'}"></i>
                <span>${isAlreadyInCart ? 'في السلة' : 'إضافة للتسعير'}</span>
              </button>
              
              <button 
                class="btn-quick-wa" 
                onclick="window.appQuickWaQuote('${item.id}')" 
                title="طلب تسعير فوري للموديل عبر واتساب">
                <i class="fab fa-whatsapp"></i>
                <span>تسعير فوري</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ===================================================================
     CART MANAGEMENT (سلة عرض السعر)
     =================================================================== */
  function saveCart() {
    localStorage.setItem('goup_quote_cart', JSON.stringify(state.cart));
    updateCartUI();
  }

  function updateCartUI() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);

    // Update Badges
    cartCountBadges.forEach(badge => {
      badge.textContent = totalCount;
      badge.classList.remove('bump');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('bump');
    });

    if (cartTotalItemsCount) {
      cartTotalItemsCount.textContent = `${totalCount} قطعة`;
    }

    // Update Cart Modal List
    if (!cartItemsList) return;

    if (state.cart.length === 0) {
      cartItemsList.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: #718096;">
          <i class="fas fa-shopping-basket" style="font-size: 2.8rem; margin-bottom: 12px; color: #CBD5E0;"></i>
          <h4 style="color: #2D3238; margin-bottom: 6px;">سلة طلب التسعير فارغة</h4>
          <p style="font-size: 0.88rem;">تصفح الكتالوج واضغط "إضافة للتسعير" لتجميع الموديلات التي ترغب في طلب عرض سعر لها.</p>
        </div>
      `;
      return;
    }

    cartItemsList.innerHTML = state.cart.map(item => {
      return `
        <div class="cart-item-row" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" />
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <div class="item-code">${item.code} - ${item.category} <span style="background: #FFF3E0; color: #FF5722; padding: 1px 6px; border-radius: 4px; font-size: 0.75rem; margin-right: 6px;">${item.catalogPage || 'الكتالوج'}</span></div>
            <div style="font-size: 0.78rem; color: #718096; margin-top: 2px;">
              ${item.dimensions}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="qty-counter">
              <button class="qty-btn" onclick="window.appUpdateCartQty('${item.id}', -1)">-</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" onclick="window.appUpdateCartQty('${item.id}', 1)">+</button>
            </div>
            <button class="cart-remove-btn" onclick="window.appRemoveFromCart('${item.id}')" title="حذف">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.appAddToCart = function(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = state.cart.find(c => c.id === productId);
    if (existing) {
      existing.qty += 1;
      showToast(`تم زيادة كمية الموديل ${product.code} في سلة التسعير`);
    } else {
      state.cart.push({
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        catalogPage: product.catalogPage,
        dimensions: product.dimensions,
        image: product.image,
        qty: 1
      });
      showToast(`تمت إضافة الموديل ${product.code} (${product.catalogPage || ''}) إلى سلة التسعير بنجاح`);
    }

    saveCart();
    renderProducts();
  };

  window.appUpdateCartQty = function(productId, delta) {
    const existing = state.cart.find(c => c.id === productId);
    if (!existing) return;

    existing.qty += delta;
    if (existing.qty <= 0) {
      window.appRemoveFromCart(productId);
      return;
    }
    saveCart();
  };

  window.appRemoveFromCart = function(productId) {
    state.cart = state.cart.filter(c => c.id !== productId);
    saveCart();
    renderProducts();
    showToast('تم إزالة المنتج من السلة');
  };

  window.appClearCart = function() {
    if (state.cart.length === 0) return;
    if (confirm('هل أنت متأكد من تفريغ كافة المنتجات من سلة التسعير؟')) {
      state.cart = [];
      saveCart();
      renderProducts();
      showToast('تم إفراغ سلة التسعير بالكامل');
    }
  };

  /* ===================================================================
     WHATSAPP INTEGRATION (Direct WhatsApp Cart & Quote)
     =================================================================== */
  window.appSendCartToWhatsApp = function() {
    if (state.cart.length === 0) {
      alert('سلة طلب عرض السعر فارغة حالياً. يرجى إضافة موديلات أولاً.');
      return;
    }

    const clientNotesInput = document.getElementById('cartClientNotes');
    const clientNotes = clientNotesInput ? clientNotesInput.value.trim() : '';

    let message = `*طلب عرض سعر رسمي من شركة Go Up للأثاث المكتبي*\n`;
    message += `-----------------------------------------\n`;
    message += `تحية طيبة، أود الاستفسار وطلب عرض سعر للبنود التالية من الكتالوج الرسمي:\n\n`;

    state.cart.forEach((item, index) => {
      message += `${index + 1}) *كود:* ${item.code} (${item.catalogPage || 'الكتالوج'})\n`;
      message += `   *الموديل:* ${item.name}\n`;
      message += `   *القسم:* ${item.category}\n`;
      message += `   *الكمية المطلوبة:* ${item.qty} قطعة\n`;
      message += `   *الأبعاد:* ${item.dimensions}\n\n`;
    });

    message += `-----------------------------------------\n`;
    if (clientNotes) {
      message += `📝 *ملاحظات وتفاصيل إضافية من العميل:*\n${clientNotes}\n\n`;
    }
    message += `📐 هل متاح تحديد موعد لمعاينة هندسية لمقر الشركة لرفع المقاسات؟\n`;
    message += `برجاء إرسال تفاصيل الأسعار ومواعيد التوريد الرسمية. شكراً لكم.`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `${COMPANY_INFO.whatsappUrl}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  window.appQuickWaQuote = function(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    let message = `*طلب تسعير واستفسار من شركة Go Up للأثاث المكتبي*\n`;
    message += `-----------------------------------------\n`;
    message += `السلام عليكم ورحمة الله، أود الاستفسار وطلب تسعير الموديل التالي من الكتالوج الرسمي:\n\n`;
    message += `📌 *كود الموديل:* ${product.code}\n`;
    message += `📌 *اسم الموديل:* ${product.name}\n`;
    message += `📌 *القسم:* ${product.category}\n`;
    message += `📖 *مرجع الكتالوج:* ${product.catalogPage || 'كتالوج 2026'}\n`;
    message += `📏 *المقاس:* ${product.dimensions}\n`;
    message += `🪵 *الخامات:* ${product.materials}\n`;
    message += `🛡️ *الضمان:* ${product.warranty}\n\n`;
    message += `-----------------------------------------\n`;
    message += `برجاء إفادتي بالسعر وخيارات الألوان ومواعيد التسليم المتاحة. شكراً جزيلاً!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`${COMPANY_INFO.whatsappUrl}?text=${encodedMessage}`, '_blank');
  };

  /* ===================================================================
     LIGHTBOX MODAL (المعاينة المكبرة)
     =================================================================== */
  window.appOpenLightbox = function(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product || !lightboxModal) return;

    state.currentLightboxProduct = product;

    document.getElementById('lightboxImg').src = product.image;
    document.getElementById('lightboxCode').textContent = product.code;
    document.getElementById('lightboxTitle').textContent = product.name;
    document.getElementById('lightboxCategory').textContent = product.category;
    
    const catPageEl = document.getElementById('lightboxCatalogPage');
    if (catPageEl) catPageEl.textContent = product.catalogPage || 'الكتالوج الرسمي';

    document.getElementById('lightboxDimensions').textContent = product.dimensions;
    document.getElementById('lightboxMaterials').textContent = product.materials;
    document.getElementById('lightboxWarranty').textContent = product.warranty;
    document.getElementById('lightboxDesc').textContent = product.description;

    const isAdded = state.cart.some(c => c.id === product.id);
    const modalAddBtn = document.getElementById('lightboxAddCartBtn');
    if (modalAddBtn) {
      modalAddBtn.innerHTML = `
        <i class="fas ${isAdded ? 'fa-check' : 'fa-cart-plus'}"></i>
        <span>${isAdded ? 'في السلة بالفعل' : 'إضافة لسلة التسعير'}</span>
      `;
      modalAddBtn.onclick = () => {
        window.appAddToCart(product.id);
        modalAddBtn.innerHTML = '<i class="fas fa-check"></i> <span>تمت الإضافة</span>';
      };
    }

    const modalWaBtn = document.getElementById('lightboxWaBtn');
    if (modalWaBtn) {
      modalWaBtn.onclick = () => window.appQuickWaQuote(product.id);
    }

    openModal(lightboxModal);
  };

  /* ===================================================================
     SPACE MEASUREMENT BOOKING (طلب رفع المقاسات والمعاينة)
     =================================================================== */
  const measurementForm = document.getElementById('measurementForm');
  if (measurementForm) {
    measurementForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('measureName').value.trim();
      const phone = document.getElementById('measurePhone').value.trim();
      const location = document.getElementById('measureLocation').value.trim();
      const space = document.getElementById('measureSpace').value.trim();
      const activity = document.getElementById('measureActivity').value;
      const date = document.getElementById('measureDate').value;
      const notes = document.getElementById('measureNotes').value.trim();

      if (!name || !phone) {
        alert('يرجى ملء اسم الشركة ورقم الهاتف للتواصل.');
        return;
      }

      let msg = `*طلب موعد رفع مقاسات ومعاينة هندسية مجانية*\n`;
      msg += `-----------------------------------------\n`;
      msg += `👤 *اسم الشركة / العميل:* ${name}\n`;
      msg += `📞 *رقم الهاتف / الواتساب:* ${phone}\n`;
      msg += `📍 *الموقع / المحافظة:* ${location || 'غير محدد'}\n`;
      msg += `📐 *المساحة التقريبية:* ${space ? space + ' م²' : 'غير محددة'}\n`;
      msg += `🏢 *نوع النشاط:* ${activity || 'مكتب إداري'}\n`;
      msg += `📅 *التاريخ المقترح للزيارة:* ${date || 'في أقرب وقت ممكن'}\n`;
      if (notes) {
        msg += `📝 *ملاحظات خاصة:* ${notes}\n`;
      }
      msg += `-----------------------------------------\n`;
      msg += `نرجو التكرم بالتواصل لتأكيد حضور المهندس المختص. تحياتنا، شركة Go Up.`;

      const encoded = encodeURIComponent(msg);
      window.open(`${COMPANY_INFO.whatsappUrl}?text=${encoded}`, '_blank');

      closeModal(measurementModal);
      measurementForm.reset();
      showToast('تم إرسال طلب المعاينة الهندسية بنجاح عبر الواتساب!');
    });
  }

  /* ===================================================================
     FLOATING WHATSAPP CHAT POPUP
     =================================================================== */
  const waTriggerBtn = document.getElementById('waTriggerBtn');
  const waCloseBtn = document.getElementById('waCloseBtn');
  const waCustomSendBtn = document.getElementById('waCustomSendBtn');
  const waCustomInput = document.getElementById('waCustomInput');

  if (waTriggerBtn && waChatBox) {
    waTriggerBtn.addEventListener('click', () => {
      waChatBox.classList.toggle('open');
    });
  }

  if (waCloseBtn && waChatBox) {
    waCloseBtn.addEventListener('click', () => {
      waChatBox.classList.remove('open');
    });
  }

  // Pre-configured WhatsApp Queries
  window.appSendWaInquiry = function(type) {
    let msg = '';
    if (type === 'quote') {
      msg = 'مرحباً، أود الحصول على عرض سعر لمجموعة من الأثاث المكتبي والموديلات المعروضة لديكم.';
    } else if (type === 'measurement') {
      msg = 'السلام عليكم، أود حجز موعد لزيارة مهندس لمقر شركتنا لرفع المقاسات واقتراح التوزيع والمخطط المناسب.';
    } else if (type === 'catalog') {
      msg = 'مرحباً، أود الاستفسار عن كتالوج Go Up الرسمي لعام 2026 وقائمة الأسعار للمشروعات.';
    } else if (type === 'general') {
      msg = 'السلام عليكم، أود التحدث مباشرة مع مسؤول المبيعات للاستفسار عن المشروعات وتجهيزات المكاتب.';
    }

    const encoded = encodeURIComponent(msg);
    window.open(`${COMPANY_INFO.whatsappUrl}?text=${encoded}`, '_blank');
    if (waChatBox) waChatBox.classList.remove('open');
  };

  if (waCustomSendBtn && waCustomInput) {
    const handleSendCustom = () => {
      const text = waCustomInput.value.trim();
      if (!text) return;
      const encoded = encodeURIComponent(text);
      window.open(`${COMPANY_INFO.whatsappUrl}?text=${encoded}`, '_blank');
      waCustomInput.value = '';
      if (waChatBox) waChatBox.classList.remove('open');
    };

    waCustomSendBtn.addEventListener('click', handleSendCustom);
    waCustomInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendCustom();
    });
  }

  /* ===================================================================
     CATALOG PDF DOWNLOAD TRIGGER
     =================================================================== */
  window.appDownloadCatalog = function() {
    // Direct trigger to view / download the official PDF catalog brochure
    const catalogPath = 'assets/catalog/Go-Up-Catalog-2026.pdf';
    const link = document.createElement('a');
    link.href = catalogPath;
    link.download = 'Go-Up-Catalog-2026.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('يتم الآن فتح الكتالوج الرسمي الكامل لشركة Go Up 2026');
  };

  /* ===================================================================
     GENERIC MODAL HELPERS & LISTENERS
     =================================================================== */
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('show');
    document.body.style.overflow = '';
  }

  function setupEventListeners() {
    // Open Cart Modal
    const cartToggleBtn = document.getElementById('cartToggleBtn');
    if (cartToggleBtn && cartModal) {
      cartToggleBtn.addEventListener('click', () => openModal(cartModal));
    }

    // Open Measurement Modal
    const openMeasurementBtns = document.querySelectorAll('.js-open-measurement');
    openMeasurementBtns.forEach(btn => {
      btn.addEventListener('click', () => openModal(measurementModal));
    });

    // Close Modals on close button or backdrop
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
      const closeButtons = modal.querySelectorAll('.modal-close-btn');
      closeButtons.forEach(btn => {
        btn.addEventListener('click', () => closeModal(modal));
      });
    });

    // Escape Key to Close All Modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.show').forEach(m => closeModal(m));
        if (waChatBox) waChatBox.classList.remove('open');
      }
    });

    // Live Search Input Listener
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (searchClearBtn) {
          searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
        }
        renderProducts();
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        state.searchQuery = '';
        if (searchInput) searchInput.value = '';
        searchClearBtn.style.display = 'none';
        renderProducts();
      });
    }

    // Mobile Navbar Toggle
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');
    if (mobileNavToggle && navMenu) {
      mobileNavToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        const icon = mobileNavToggle.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-bars');
          icon.classList.toggle('fa-times');
        }
      });

      // Close menu on nav link click
      navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('open');
          const icon = mobileNavToggle.querySelector('i');
          if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
          }
        });
      });
    }

    // Header Shadow on Scroll
    const mainHeader = document.querySelector('.main-header');
    window.addEventListener('scroll', () => {
      if (mainHeader) {
        if (window.scrollY > 30) {
          mainHeader.classList.add('scrolled');
        } else {
          mainHeader.classList.remove('scrolled');
        }
      }
    });
  }

  /* ===================================================================
     TOAST SYSTEM
     =================================================================== */
  function showToast(message) {
    if (!toastNotice || !toastMessage) return;
    toastMessage.textContent = message;
    toastNotice.classList.add('show');
    setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 3800);
  }
});
