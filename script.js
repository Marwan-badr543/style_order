   // دالة لتصفية معرّف المنتج وجعله صالحًا للاستخدام في HTML و CSS
   function sanitizeId(name) {
    return name.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }

  // كائن لتخزين بيانات المنتجات (السعر وتكلفة التثبيت)
  let productData = {};

  // تُحدث دالة updateTotal جميع القيم سواء للمنتج المحلي أو الإجمالي العام فوراً
  function updateTotal() {
    let globalTotal = 0;
    document.querySelectorAll('input[name="product"]').forEach(productCheckbox => {
      let productId = productCheckbox.id;
      let productName = productCheckbox.dataset.originalName;
      let quantitySpan = document.querySelector(`#quantity-${productId} .quantity-value`);
      let quantity = quantitySpan ? parseInt(quantitySpan.textContent) : 1;
      let productTotal = 0;
      
      if (productData[productName]) {
        let price = productData[productName].price;
        // إذا كان المنتج مختاراً نحسب الإجمالي، وإلا يكون صفر
        if (productCheckbox.checked) {
          productTotal = price * quantity;
          // إذا كان المنتج يحتوي على "TV" ننفذ حساب خيارات التثبيت وMoving Stand
          if (productName.includes("TV")) {
            const instOption = document.querySelector(`input[name="inst-${productId}"]:checked`);
            if (instOption && instOption.value === "with") {
              let fixingCost = productData[productName].fixingCost;
              productTotal += fixingCost * quantity;
            }
            const msOption = document.querySelector(`input[name="moving-stand-${productId}"]:checked`);
            if (msOption) {
              if (msOption.value === "with") {
                const msQuantitySpan = document.querySelector(`#moving-stand-quantity-${productId} .quantity-value`);
                const msQuantity = msQuantitySpan ? parseInt(msQuantitySpan.textContent) : 1;
                productTotal += 18 * msQuantity;
              } else if (msOption.value === "without") {
                const fsQuantitySpan = document.querySelector(`#fixed-stand-quantity-${productId} .quantity-value`);
                const fsQuantity = fsQuantitySpan ? parseInt(fsQuantitySpan.textContent) : 1;
                let fixedCost = productData[productName].fixed_stand_cost || 0;
                productTotal += fixedCost * fsQuantity;
              }
            }
          }
        }
        globalTotal += productTotal;
      }
      // تحديث حقل إجمالي المنتج المحلي؛ إذا لم يكن مختاراً فنعرض 0
      let localTotalField = document.getElementById(`product-total-${productId}`);
      if (localTotalField) {
        localTotalField.textContent = productCheckbox.checked ? productTotal.toFixed(2) + " BHD" : "0 BHD";
      }
    });
    document.getElementById("total-field").value = globalTotal.toFixed(2) + " BHD";
  }

  // عند تغيير الكمية أو الخيارات أو اختيار المنتج
  function updateQuantity(productId, change) {
    const quantitySpan = document.querySelector(`#quantity-${productId} .quantity-value`);
    if (quantitySpan) {
      let currentQuantity = parseInt(quantitySpan.textContent);
      currentQuantity = Math.max(1, currentQuantity + change);
      quantitySpan.textContent = currentQuantity;
    }
    updateTotal();
    updateCart();
  }

  // عند تبديل حالة اختيار المنتج
  function toggleProduct(productId) {
    const checkbox = document.getElementById(productId);
    const card = document.getElementById(`card-${productId}`);
    
    if (productData[checkbox.dataset.originalName] && productData[checkbox.dataset.originalName].inStock) {
      checkbox.checked = !checkbox.checked;
      card.classList.toggle('selected', checkbox.checked);
      
      // Update quantity controls visibility
      const quantityControls = document.getElementById(`quantity-${productId}`);
      if (checkbox.checked) {
        quantityControls.style.display = "flex";
        // Set initial product total
        const price = productData[checkbox.dataset.originalName].price;
        document.getElementById(`product-total-${productId}`).textContent = price.toFixed(2) + " BHD";
      } else {
        quantityControls.style.display = "none";
        const quantitySpan = quantityControls.querySelector('.quantity-value');
        if (quantitySpan) {
          quantitySpan.textContent = "1";
        }
        document.getElementById(`product-total-${productId}`).textContent = "0 BHD";
      }

      // Update global total and cart
      updateTotal();
      updateCart();
    }
  }

  // عند إظهار/إخفاء عناصر التحكم بالكميات وخيارات المنتج
  function toggleQuantity(productId) {
    const quantityControls = document.getElementById(`quantity-${productId}`);
    const checkbox = document.getElementById(productId);
    if (checkbox && checkbox.checked) {
      quantityControls.style.display = "flex";
    } else if (quantityControls) {
      quantityControls.style.display = "none";
      const quantitySpan = quantityControls.querySelector('.quantity-value');
      if (quantitySpan) {
        quantitySpan.textContent = "1";
      }
    }
    // لمنتجات التلفزيون: إظهار أو إخفاء خيارات Moving Stand
    if (checkbox.dataset.originalName.includes("TV")) {
      const movingStandControls = document.getElementById(`moving-stand-${productId}`);
      if (checkbox.checked) {
        movingStandControls.style.display = "flex";
      } else {
        movingStandControls.style.display = "none";
        const defaultOption = movingStandControls.querySelector('input[value="none"]');
        if (defaultOption) { 
          defaultOption.checked = true;
          updateProductOptions(productId, productData[checkbox.dataset.originalName].fixingCost, "movingStand");
        }
      }
    }
    updateTotal();
  }

  // تحديث خيارات التثبيت وMoving Stand وتحديث السعر
  function updateProductOptions(productId, fixingCost, optionType) {
    const checkbox = document.getElementById(productId);
    if(optionType === "installation") {
      const instOption = document.querySelector(`input[name="inst-${productId}"]:checked`);
      checkbox.dataset.installation = instOption ? instOption.value : "with";
      const value = instOption.value === "with" ? 
          (fixingCost === 0 ? "With Installation (Free)" : `With Installation (${fixingCost} BHD)`) : 
          "Without Installation";
      updateInstallationInput(productId, value);
      const dropdown = document.querySelector(`#installation-options-${productId}`);
      dropdown.style.display = 'none';
    } else if(optionType === "movingStand") {
      const msOption = document.querySelector(`input[name="moving-stand-${productId}"]:checked`);
      
      // Show quantity controls first
      const movingStandQuantityControls = document.querySelector(`#moving-stand-quantity-${productId}`);
      const fixedStandQuantityControls = document.querySelector(`#fixed-stand-quantity-${productId}`);
      
      if (msOption) {
        if (msOption.value === "with") {
          if (movingStandQuantityControls) {
            movingStandQuantityControls.style.display = "flex";
            fixedStandQuantityControls.style.display = "none";
          }
        } else if (msOption.value === "without") {
          if (fixedStandQuantityControls) {
            fixedStandQuantityControls.style.display = "flex";
            movingStandQuantityControls.style.display = "none";
          }
        } else {
          // For "No Stand" option, finalize immediately
          checkbox.dataset.movingStand = "none";
          const standInput = document.querySelector(`#stand-options-${productId}`).parentElement.querySelector('.stand-input');
          standInput.value = "No Stand";
          const dropdown = document.querySelector(`#stand-options-${productId}`);
          dropdown.style.display = 'none';
          movingStandQuantityControls.style.display = "none";
          fixedStandQuantityControls.style.display = "none";
        }
      }
    }
    updateTotal();
  }

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        let latitude = position.coords.latitude;
        let longitude = position.coords.longitude;
        let locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        document.getElementById("location").value = locationUrl;
        document.getElementById("location-link").href = locationUrl;
        document.getElementById("location-link").style.display = "inline";
      }, function (error) {
        alert("حدث خطأ أثناء جلب الموقع. تأكد من تفعيل GPS في جهازك.");
      });
    } else {
      alert("المتصفح لا يدعم تحديد الموقع الجغرافي.");
    }
  }

  function toggleBranchDropdown() {
    let branchDropdown = document.getElementById("branch-select");
    let deliveryMethod = document.querySelector('input[name="delivery-method"]:checked').value;
    branchDropdown.style.display = (deliveryMethod === "branch_pickup") ? "inline" : "none";
  }

  async function submitForm(event) {
    event.preventDefault();
    const submitButton = document.querySelector(".sum");
    const headerOrderButton = document.querySelector(".header-order-btn");
    
    // Disable both buttons
    submitButton.disabled = true;
    headerOrderButton.disabled = true;
    
    // Update both buttons text
    submitButton.value = "Processing...";
    headerOrderButton.value = "Processing...";
    
    let selectedProducts = [];
    document.querySelectorAll('input[name="product"]:checked').forEach(product => {
      let productId = product.id;
      let quantitySpan = document.querySelector(`#quantity-${productId} .quantity-value`);
      if (quantitySpan) {
        // Get installation option
        let installationCode = ""; // Default empty
        const instOption = document.querySelector(`input[name="inst-${productId}"]:checked`);
        if (instOption) {
          const fixingCost = productData[product.dataset.originalName].fixingCost;
          installationCode = instOption.value === "with" ? 
            (fixingCost === 0 ? "[WI(free)]" : "[WI(paid)]") : 
            "[WTI]";
        }

        // Get stand options and quantities
        let standCodes = []; // Array to hold both stand codes if present
        const standOption = document.querySelector(`input[name="moving-stand-${productId}"]:checked`);
        if (standOption) {
          if (standOption.value === "with") {
            const msQuantitySpan = document.querySelector(`#moving-stand-quantity-${productId} .quantity-value`);
            const msQuantity = msQuantitySpan ? parseInt(msQuantitySpan.textContent) : 1;
            standCodes.push(`[MS][${msQuantity}]`);
          } else if (standOption.value === "without") {
            const fsQuantitySpan = document.querySelector(`#fixed-stand-quantity-${productId} .quantity-value`);
            const fsQuantity = fsQuantitySpan ? parseInt(fsQuantitySpan.textContent) : 1;
            standCodes.push(`[FS][${fsQuantity}]`);
          }
        }

        // Get product quantity for internal use (not shown in name)
        const quantity = parseInt(quantitySpan.textContent);

        // Combine product name with codes (without product quantity)
        const formattedName = `${product.value}${installationCode}${standCodes.join('')}`;
        
        selectedProducts.push({
          name: formattedName,
          quantity: quantity
        });
      }
    });
    
    const formData = {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      area: document.getElementById("area").value,
      location: document.getElementById("location").value,
      paymentMethod: document.querySelector('input[name="payment-method"]:checked').value,
      deliveryMethod: document.querySelector('input[name="delivery-method"]:checked').value,
      branch: (document.getElementById("branch-select").style.display !== "none") ? document.getElementById("branch-select").value : "",
      notes: document.getElementById("notes").value,
      products: selectedProducts,
      total: document.getElementById("total-field").value,
      timestamp: new Date().toISOString(),
      delivery_dateD: selectedDate || '',
      delivery_time: selectedTime || ''
    };
    
    // Check if date and time are selected
    if (!selectedDate || !selectedTime) {
      alert("Please select both a day and time for delivery!");
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/submit-form', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert("✅ Order submitted successfully!");
        // Reset form and cart
        document.querySelector('form').reset();
        document.querySelectorAll('input[name="product"]:checked').forEach(checkbox => {
          checkbox.checked = false;
        });
        updateTotal();
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error submitting order: ${error.message}. Please try again or contact support.`);
    } finally {
      // Always reset buttons regardless of success/failure
      submitButton.disabled = false;
      headerOrderButton.disabled = false;
      submitButton.value = "Order Now";
      headerOrderButton.value = "Order";
    }
  }

  // Add this function at the beginning of your script section
  function toggleCart() {
      const cartBox = document.getElementById('cartBox');
      cartBox.classList.toggle('show-cart');
  }

  // Close cart when clicking outside
  document.addEventListener('click', function(event) {
      const cartBox = document.getElementById('cartBox');
      const cartIcon = document.querySelector('.cart-icon');
      if (!cartBox.contains(event.target) && !cartIcon.contains(event.target)) {
          cartBox.classList.remove('show-cart');
      }
  });

  document.addEventListener("DOMContentLoaded", function() {
    document.querySelector('.audio-section').style.display = "none";
    document.querySelectorAll('input[name="audio-option"]').forEach(option => {
      option.addEventListener('change', updateTotal);
    });
    const searchInput = document.getElementById("product-search");
    searchInput.addEventListener("input", function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const productCards = document.querySelectorAll(".product-card");
      productCards.forEach(card => {
        const productName = card.querySelector(".product-name").textContent.toLowerCase();
        card.style.display = productName.includes(searchTerm) ? "flex" : "none";
      });
    });
    const products = [
      { name: "JVC TV 100 LT-100NQ7225 144HZ", price: 840, images: ["/ordersERP/images/346-1-lt-55vaq6200-05149747084.jpg", "https://jvctv.eu/storage/products/image/s/408-1-lt-43vaq3300-58583735921.png"], fixingCost: 0, inStock: true, moving_standAB: false, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 43 LT-43N7125 FHD", price: 100, images: ["", ""], fixingCost: 0, inStock: true, moving_standAB: true, fixed_stand_cost:5 , fixed_stand_enabled:true},
      { name: "JVC TV 50 LT-50N7125", price: 120, images: ["", ""], fixingCost: 9, inStock: false, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 55 LT-55N7125", price: 90, images: ["", ""], fixingCost: 9, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 65 LT-65N7125 4K", price: 0, images: ["", ""], fixingCost: 12, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 65 LT-65NQ 7225 Q 144HZ", price: 0, images: ["", ""], fixingCost: 12, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 65 LT-65NQ7125 Q", price: 0, images: ["", ""], fixingCost: 12, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 75 LT-75N7125", price: 0, images: ["", ""], fixingCost: 15, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 75 LT-75NQ 7225 Q 144HZ", price: 0, images: ["", ""], fixingCost: 15, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 75 LT-75NQ7125 Q", price: 0, images: ["", ""], fixingCost: 15, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 85 LT-85NQ7225 144HZ", price: 0, images: ["", ""], fixingCost: 18, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 55 LT-55NQ 6115 Q", price: 145, images: ["/ordersERP/images/346-1-lt-55vaq6200-05149747084.jpg", "https://jvctv.eu/storage/products/image/s/408-1-lt-43vaq3300-58583735921.png"], fixingCost: 5, inStock: true, moving_standAB: true, fixed_stand_cost:5 , fixed_stand_enabled:true},
      { name: "JVC TV 65 LT-65NQ 6115 Q", price: 0, images: ["", ""], fixingCost: 12, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 65 LT-65NQ71155", price: 0, images: ["", ""], fixingCost: 12, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "JVC TV 85 LT-85N7125", price: 0, images: ["", ""], fixingCost: 18, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 43  Full HD Frameless MG43Y24FSBT2/14 2 YEARS WARRANTY.", price: 0, images: ["", ""], fixingCost: 8, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 50 Full HD Unbreakable MG50Y030FSBT2/14 2 YEARS WARRANTY.", price: 0, images: ["", ""], fixingCost: 9, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 55  Full HD Frameless MG55Y24FSBT2/14 2 YEARS WARRANTY.", price: 0, images: ["", ""], fixingCost: 9, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 65 Frameless MG65Y24USBT2/14 2 YEARS WARRANTY.", price: 0, images: ["", ""], fixingCost: 12, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 65 Premium MGP65DT24USGT2Q 2 YEARS WARRANTY.", price: 0, images: ["", ""], fixingCost: 12, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 65 PRO Frameless 2 YEARS WARRANTY", price: 0, images: ["", ""], fixingCost: 12, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 65 Unbreakable MG65GB030USBT2/13 2 YEARS WARRANTY.", price: 0, images: ["", ""], fixingCost: 12, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 70 Frameless MG70Y24USBT2/14 2 YEARS WARRANTY.", price: 0, images: ["", ""], fixingCost: 14, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 75 Frameless MG75Y24USBT2/14 2 YEARS WARRANTY.", price: 0, images: ["", ""], fixingCost: 15, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 85 Frameless MG85Y24USBT2/13 2 YEARS WARRANTY.", price: 0, images: ["", ""], fixingCost: 18, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "Magic TV 55 Full HD Unbreakable MG55Y030FSB/14 2 YEARS WARRANTY.", price: 10, images: ["", ""], fixingCost: 9, inStock: true, moving_standAB: true, fixed_stand_cost:10 , fixed_stand_enabled:true},
      { name: "AI General Washing Machine 10Kg", price: 0, images: ["", ""], fixingCost: 0, inStock: true },
      { name: "AI General Washing Machine 12Kg", price: 20, images: ["", ""], fixingCost: 0, inStock: true },
      { name: "AI General Washing Machine 8Kg", price: 0, images: ["", ""], fixingCost: 0, inStock: true },
      { name: "STAND SG-808 FB", price: 0, images: ["", ""], fixingCost: 0, inStock: true },
      { name: "STAND SG-809 FB", price: 0, images: ["", ""], fixingCost: 0, inStock: true },
      { name: "STAND SG-816", price: 0, images: ["", ""], fixingCost: 0, inStock: true },
      { name: "STAND SG-871", price: 0, images: ["", ""], fixingCost: 0, inStock: true },
      { name: "STAND SG-865", price: 0, images: ["", ""], fixingCost: 0, inStock: true },
      { name: "STAR GOLD MOVING STAND SG-814MTB", price: 0, images: ["", ""], fixingCost: 0, inStock: true },
      { name: "STAR GOLD STAND Sg-817tc", price: 0, images: ["", ""], fixingCost: 0, inStock: true },
      { name: "STAR GOLD STAND Sg-837tc", price: 20, images: ["", ""], fixingCost: 10, inStock: true }
    ];
    let productsContainer = document.getElementById("products-list");
    let productsHTML = "";
    products.forEach(product => {
      productData[product.name] = {
        price: product.price,
        fixingCost: product.fixingCost,
        inStock: product.inStock,
        fixed_stand_cost: product.fixed_stand_cost,
        images: product.images
      };
      let installationHTML = "";
      let fixingHTML = "";
      let movingStandHTML = "";
      if(product.name.includes("TV")) {
        installationHTML = `
          <div class="installation-dropdown">
              <div class="installation-input-container" onclick="toggleInstallationDropdown('${sanitizeId(product.name)}')">
                  <input type="text" class="installation-input" value="Without Installation" readonly>
                  <button class="installation-dropdown-btn" title="Toggle installation options">
                      <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M6 9l6 6 6-6"/>
                      </svg>
                  </button>
              </div>
              <div class="installation-options" id="installation-options-${sanitizeId(product.name)}" style="display: none;">
                  <label class="radio-label" onclick="selectInstallationOption('${sanitizeId(product.name)}', 'without')">
                      <input type="radio" name="inst-${sanitizeId(product.name)}" value="without" class="free-option" checked>
                      Without Installation
                      <span class="cost-text free-cost">Free</span>
                  </label>
                  <label class="radio-label" onclick="selectInstallationOption('${sanitizeId(product.name)}', 'with')">
                      <input type="radio" name="inst-${sanitizeId(product.name)}" value="with" class="${product.fixingCost === 0 ? 'free-option' : 'paid-option'}">
                      With Installation
                      <span class="cost-text ${product.fixingCost === 0 ? 'free-cost' : 'paid-cost'}">
                          ${product.fixingCost === 0 ? 'Free' : product.fixingCost + ' BHD'}
                      </span>
                      <div class="quantity-controls" id="installation-quantity-${sanitizeId(product.name)}" style="display:none;">
                          <button type="button" class="quantity-btn minus" onclick="event.stopPropagation(); updateInstallationQuantity('${sanitizeId(product.name)}', -1)">-</button>
                          <span class="quantity-value">1</span>
                          <button type="button" class="quantity-btn plus" onclick="event.stopPropagation(); updateInstallationQuantity('${sanitizeId(product.name)}', 1)">+</button>
                      </div>
                  </label>
              </div>
          </div>
        `;
        if(product.moving_standAB === true) {
          movingStandHTML = `
              <div class="stand-dropdown">
                  <div class="stand-input-container" onclick="toggleStandDropdown('${sanitizeId(product.name)}')">
                      <input type="text" class="stand-input" value="No Stand" readonly>
                      <button class="stand-dropdown-btn" title="Toggle stand options">
                          <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M6 9l6 6 6-6"/>
                          </svg>
                      </button>
                  </div>
                  <div class="stand-options" id="stand-options-${sanitizeId(product.name)}" style="display: none;">
                      <label class="radio-label" onclick="selectStandOption('${sanitizeId(product.name)}', 'none')">
                          <input type="radio" name="moving-stand-${sanitizeId(product.name)}" value="none" class="free-option">
                          No Stand
                          <span class="cost-text free-cost">Free</span>
                      </label>
                      <label class="radio-label" onclick="selectStandOption('${sanitizeId(product.name)}', 'with')">
                          <input type="radio" name="moving-stand-${sanitizeId(product.name)}" value="with" class="paid-option">
                          With Moving Stand
                          <span class="cost-text paid-cost">18 BHD</span>
                          <div class="quantity-controls" id="moving-stand-quantity-${sanitizeId(product.name)}" style="display:none;">
                              <button type="button" class="quantity-btn minus" onclick="event.stopPropagation(); updateMovingStandQuantity('${sanitizeId(product.name)}', -1)">-</button>
                              <span class="quantity-value">1</span>
                              <button type="button" class="quantity-btn plus" onclick="event.stopPropagation(); updateMovingStandQuantity('${sanitizeId(product.name)}', 1)">+</button>
                          </div>
                      </label>
                      ${product.fixed_stand_enabled ? `
                      <label class="radio-label" onclick="selectStandOption('${sanitizeId(product.name)}', 'without')">
                          <input type="radio" name="moving-stand-${sanitizeId(product.name)}" value="without" class="paid-option">
                          With Fixed Stand
                          <span class="cost-text paid-cost">${product.fixed_stand_cost} BHD</span>
                          <div class="quantity-controls" id="fixed-stand-quantity-${sanitizeId(product.name)}" style="display:none;">
                              <button type="button" class="quantity-btn minus" onclick="event.stopPropagation(); updateFixedStandQuantity('${sanitizeId(product.name)}', -1)">-</button>
                              <span class="quantity-value">1</span>
                              <button type="button" class="quantity-btn plus" onclick="event.stopPropagation(); updateFixedStandQuantity('${sanitizeId(product.name)}', 1)">+</button>
                          </div>
                      </label>
                      ` : ''}
                  </div>
              </div>
          `;
        }
      }
      let productHTML = `
        <div class="product-card ${!product.inStock ? 'out-of-stock' : ''}" id="card-${sanitizeId(product.name)}" onclick="${product.inStock ? `toggleProduct('${sanitizeId(product.name)}')` : ''}">
          <input type="checkbox" id="${sanitizeId(product.name)}" name="product" value="${product.name}" data-original-name="${product.name}" 
          data-installation="with" data-moving-stand="with"
          onchange="toggleQuantity('${sanitizeId(product.name)}'); updateProductOptions('${sanitizeId(product.name)}', ${product.fixingCost}, 'installation');" ${!product.inStock ? 'disabled' : ''}>
          <div class="product-image" id="image-container-${sanitizeId(product.name)}">
            <button type="button" class="slider-btn prev" onclick="prevImage(event, '${sanitizeId(product.name)}')">❮</button>
            <img src="${product.images && product.images[0] ? product.images[0] : ''}" alt="${product.name}" data-index="0">
            <button type="button" class="slider-btn next" onclick="nextImage(event, '${sanitizeId(product.name)}')">❯</button>
            ${!product.inStock ? '<div class="out-of-stock-label">Out of Stock</div>' : ''}
            <div class="border">
              <p class="product-name">${product.name}</p>
              <p class="product-price">${product.price} BHD</p>
            </div>
          </div>
          <div class="product-info">
            ${fixingHTML}
            ${installationHTML}
            ${movingStandHTML}
            <div class="quantity-controls" id="quantity-${sanitizeId(product.name)}" style="display:none;">
              <button type="button" class="quantity-btn minus" onclick="event.stopPropagation(); updateQuantity('${sanitizeId(product.name)}', -1)">-</button>
              <span class="quantity-value">1</span>
              <button type="button" class="quantity-btn plus" onclick="event.stopPropagation(); updateQuantity('${sanitizeId(product.name)}', 1)">+</button>
            </div>
            <div class="product-total" id="product-total-${sanitizeId(product.name)}">0 BHD</div>
          </div>
        </div>
      `;
      productsHTML += productHTML;
    });
    productsContainer.innerHTML = productsHTML;
    products.forEach(product => {
      if(product.name.includes("TV")){
        updateProductOptions(sanitizeId(product.name), product.fixingCost, "installation");
        updateProductOptions(sanitizeId(product.name), product.fixingCost, "movingStand");
        // Set default installation option to "without"
        const instInput = document.querySelector(`#card-${sanitizeId(product.name)} .installation-input`);
        if (instInput) {
          instInput.value = "Without Installation";
        }
        const withoutInstRadio = document.querySelector(`#installation-options-${sanitizeId(product.name)} input[value="without"]`);
        if (withoutInstRadio) {
          withoutInstRadio.checked = true;
        }
      }
    });
    document.querySelectorAll('.input-container input').forEach(input => {
      const underline = input.nextElementSibling;
      input.addEventListener('focus', () => {
        underline.style.transform = 'scaleX(1)';
        underline.style.backgroundColor = 'black';
      });
      input.addEventListener('blur', () => {
        underline.style.transform = 'scaleX(0)';
        underline.style.backgroundColor = '#ccc';
      });
    });
  });

  // Add this function to your existing script section
  function scrollToProducts(event) {
      event.preventDefault();
      const productsSection = document.querySelector('.products-section');
      productsSection.scrollIntoView({ behavior: 'smooth' });
  }

  // Add this function to scroll to the form
  function scrollToForm() {
      const form = document.querySelector('form');
      form.scrollIntoView({ behavior: 'smooth' });
  }

  function submitMainForm() {
    submitForm(new Event('submit'));
  }

  // Update the handleNavClick function
  function handleNavClick(event, element) {
    event.preventDefault();
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    // Add active class to clicked link
    element.classList.add('active');
    
    // Handle scrolling with offset for header height
    const targetId = element.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    const headerHeight = document.querySelector('.main-header').offsetHeight;
    
    if (targetElement) {
      // Get the products section element
      const productsSection = document.querySelector('.products-section');
      
      // If clicking on products link, scroll to products section
      if (targetId === 'products-list' && productsSection) {
        const elementPosition = productsSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        // For other links, use the target element
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  }

  // Add these functions after the existing functions
  function updateCart() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.querySelector('.cart-items');
    const totalAmount = document.querySelector('.total-amount');
    const selectedProducts = document.querySelectorAll('input[name="product"]:checked');
    
    // Update cart count
    cartCount.textContent = selectedProducts.length;
    
    // Clear current cart items
    cartItems.innerHTML = '';
    
    // Add selected products to cart
    selectedProducts.forEach(product => {
      const productId = product.id;
      const productName = product.dataset.originalName;
      const quantitySpan = document.querySelector(`#quantity-${productId} .quantity-value`);
      const quantity = quantitySpan ? parseInt(quantitySpan.textContent) : 1;
      const productTotal = document.getElementById(`product-total-${productId}`).textContent;
      const productImage = document.querySelector(`#card-${productId} img`).src || 'https://placehold.co/100x100';
      
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <img src="${productImage}" alt="${productName}">
        <div class="cart-item-details">
          <h4>${productName}</h4>
          <p>Quantity: ${quantity}</p>
          <p>${productTotal}</p>
        </div>
        <button class="delete-item" onclick="removeFromCart('${productId}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      `;
      cartItems.appendChild(cartItem);
    });
    
    // Update total amount
    const total = document.getElementById('total-field').value;
    totalAmount.textContent = total;
  }

  function removeFromCart(productId) {
    const checkbox = document.getElementById(productId);
    if (checkbox) {
      // Uncheck the checkbox
      checkbox.checked = false;
      
      // Remove selected class from card
      const card = document.getElementById(`card-${productId}`);
      if (card) {
        card.classList.remove('selected');
      }
      
      // Reset quantity to 1
      const quantityControls = document.getElementById(`quantity-${productId}`);
      if (quantityControls) {
        const quantitySpan = quantityControls.querySelector('.quantity-value');
        if (quantitySpan) {
          quantitySpan.textContent = "1";
        }
        quantityControls.style.display = "none";
      }
      
      // Reset installation option to "Without Installation"
      const instInput = document.querySelector(`#card-${productId} .installation-input`);
      if (instInput) {
        instInput.value = "Without Installation";
        const withoutInstRadio = document.querySelector(`#installation-options-${productId} input[value="without"]`);
        if (withoutInstRadio) {
          withoutInstRadio.checked = true;
        }
      }
      
      // Reset stand option to "No Stand"
      const standInput = document.querySelector(`#card-${productId} .stand-input`);
      if (standInput) {
        standInput.value = "No Stand";
        const noStandRadio = document.querySelector(`#stand-options-${productId} input[value="none"]`);
        if (noStandRadio) {
          noStandRadio.checked = true;
        }
        
        // Hide stand quantity controls
        const movingStandQuantity = document.querySelector(`#moving-stand-quantity-${productId}`);
        const fixedStandQuantity = document.querySelector(`#fixed-stand-quantity-${productId}`);
        if (movingStandQuantity) movingStandQuantity.style.display = "none";
        if (fixedStandQuantity) fixedStandQuantity.style.display = "none";
      }
      
      // Reset product total
      const productTotal = document.getElementById(`product-total-${productId}`);
      if (productTotal) {
        productTotal.textContent = "0 BHD";
      }
      
      // Update total and cart
      updateTotal();
      updateCart();
    }
  }

  // Add this CSS to style the cart items
  const style = document.createElement('style');
  style.textContent = `
    // .cart-header h3 {
    //   margin: 0;
    //   color: #333;
    // }

    // .cart-items {
    //   flex: 1;
    //   overflow-y: auto;
    //   padding: 10px;
    // }

    // .cart-item {
    //   display: flex;
    //   align-items: center;
    //   padding: 10px;
    //   border-bottom: 1px solid #eee;
    //   gap: 10px;
    // }
    
    // .cart-item img {
    //   width: 60px;
    //   height: 60px;
    //   object-fit: cover;
    //   border-radius: 8px;
    // }
    
    // .cart-item-details {
    //   flex: 1;
    // }
    
    // .cart-item-details h4 {
    //   margin: 0;
    //   font-size: 14px;
    //   color: #333;
    // }
    
    // .cart-item-details p {
    //   margin: 5px 0;
    //   font-size: 12px;
    //   color: #666;
    // }

    // .delete-item {
    //   background: none;
    //   border: none;
    //   padding: 8px;
    //   cursor: pointer;
    //   color: #ff4444;
    //   transition: color 0.2s ease;
    //   display: flex;
    //   align-items: center;
    //   justify-content: center;
    // }

    // .delete-item:hover {
    //   color: #cc0000;
    // }

    // .cart-item {
    //   position: relative;
    // }

    // .filter-section {
    //   margin: 1rem 0;
    //   padding: 0 1rem;
    //   position: relative;
    // }

    // .filter-toggle {
    //   display: flex;
    //   align-items: center;
    //   gap: 0.5rem;
    //   padding: 0.5rem 1rem;
    //   background-color: #f3f4f6;
    //   border: 1px solid #e5e7eb;
    //   border-radius: 0.5rem;
    //   cursor: pointer;
    //   font-size: 0.875rem;
    //   color: #374151;
    //   transition: all 0.2s;
    //   width: 150px;
    // }

    // .filter-toggle:hover {
    //   background-color: #e5e7eb;
    // }

    // .filter-toggle svg {
    //   margin-right: 0.25rem;
    // }

    // .filter-options {
    //   position: absolute;
    //   top: 100%;
    //   left: 1rem;
    //   margin-top: 0.5rem;
    //   padding: 0.5rem;
    //   background-color: white;
    //   border: 1px solid #e5e7eb;
    //   border-radius: 0.5rem;
    //   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    //   z-index: 1000;
    //   min-width: 200px;
    //   display: none;
    // }

    // .filter-options.show {
    //   display: block;
    // }

    // .filter-grid {
    //   display: flex;
    //   flex-direction: column;
    //   gap: 0.5rem;
    // }

    // .filter-group {
    //   display: flex;
    //   flex-direction: column;
    //   gap: 0.25rem;
    // }



    // .filter-group select {
    //   padding: 0.25rem;
    //   border: 1px solid #e5e7eb;
    //   border-radius: 0.375rem;
    //   // font-size: 0.75rem;
    //   color: #374151;
    //   background-color: white;
    //   cursor: pointer;
    //   width: 100%;
    // }

    // .filter-group select:focus {
    //   outline: none;
    //   border-color: #3b82f6;
    //   box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    // }

    // .stock-toggle {
    //   display: flex;
    //   align-items: center;
    //   gap: 0.5rem;
    //   cursor: pointer;
    //   padding: 0.25rem;
    //   font-size: 1rem;
    // }

    // .stock-toggle input[type="checkbox"] {
    //   width: 1rem;
    //   height: 1rem;
    //   border: 1px solid #e5e7eb;
    //   // border-radius: 0.25rem;
    //   cursor: pointer;
    // }

    // .clear-filters {
    //   margin-top: 0.5rem;
    //   padding: 0.25rem 0.5rem;
    //   background-color: #f3f4f6;
    //   border: 1px solid #e5e7eb;
    //   border-radius: 0.375rem;
    //   cursor: pointer;
    //   font-size: 1rem;
    //   color: #374151;
    //   transition: all 0.2s;
    //   width: 100%;
    // }

    // .clear-filters:hover {
    //   background-color: #e5e7eb;
    // }

    .product-image {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .slider-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      z-index: 2;
      transition: background-color 0.3s ease;
      opacity: 0;
    }

    .product-image:hover .slider-btn {
      opacity: 1;
    }

    .slider-btn:hover {
      background: rgba(0, 0, 0, 0.8);
    }

    .slider-btn.prev {
      left: 10px;
    }

    .slider-btn.next {
      right: 10px;
    }

    .slider-btn:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
    }

    @media (max-width: 768px) {
      .slider-btn {
        opacity: 1;
        width: 25px;
        height: 25px;
        font-size: 16px;
      }
    }

    .product-card {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 200px;
      min-height: 500px;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: white;
      transition: all 0.3s ease;
      cursor: pointer;
      gap: 0.5rem;
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .installation-dropdown,
    .stand-dropdown {
      margin-bottom: 0.25rem;
    }

    @media screen and (max-width: 768px) {
      .product-card {
        min-height: 480px;
        width: 180px;
      }
    }

    @media screen and (max-width: 480px) {
      .product-card {
        min-height: 460px;
        width: 160px;
      }
    }

    @media screen and (max-width: 320px) {
      .product-card {
        min-height: 440px;
        width: 140px;
      }
    }
  `;
  document.head.appendChild(style);

  function toggleInstallationDropdown(productId) {
      event.preventDefault();
      event.stopPropagation();
      const dropdown = document.querySelector(`#installation-options-${productId}`);
      const input = dropdown.parentElement.querySelector('.installation-input');
      
      // Close all other dropdowns first
      document.querySelectorAll('.installation-options').forEach(d => {
          if (d !== dropdown) {
              d.style.display = 'none';
          }
      });
      
      // Toggle current dropdown
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      
      if (dropdown.style.display === 'block') {
          input.focus();
      }
  }

  function updateInstallationInput(productId, value) {
      event.stopPropagation();
      const input = document.querySelector(`#installation-options-${productId}`).parentElement.querySelector('.installation-input');
      input.value = value;
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
      // Close installation dropdowns
      document.querySelectorAll('.installation-options').forEach(dropdown => {
          if (!dropdown.contains(event.target) && !dropdown.parentElement.querySelector('.installation-input-container').contains(event.target)) {
              dropdown.style.display = 'none';
          }
      });
      
      // Close stand dropdowns
      document.querySelectorAll('.stand-options').forEach(dropdown => {
          const productId = dropdown.id.replace('stand-options-', '');
          const checkbox = document.getElementById(productId);
          const standInput = dropdown.parentElement.querySelector('.stand-input');
          
          if (!dropdown.contains(event.target) && !dropdown.parentElement.querySelector('.stand-input-container').contains(event.target)) {
              const msOption = document.querySelector(`input[name="moving-stand-${productId}"]:checked`);
              
              if (msOption) {
                  if (msOption.value === "with") {
                      const quantitySpan = document.querySelector(`#moving-stand-quantity-${productId} .quantity-value`);
                      if (quantitySpan) {
                          const quantity = parseInt(quantitySpan.textContent);
                          standInput.value = `With Moving Stand (18 BHD) x${quantity}`;
                          checkbox.dataset.movingStand = "with";
                      }
                  } else if (msOption.value === "without") {
                      const quantitySpan = document.querySelector(`#fixed-stand-quantity-${productId} .quantity-value`);
                      if (quantitySpan) {
                          const quantity = parseInt(quantitySpan.textContent);
                          const fixedCost = productData[checkbox.dataset.originalName].fixed_stand_cost || 0;
                          standInput.value = `With Fixed Stand (${fixedCost} BHD) x${quantity}`;
                          checkbox.dataset.movingStand = "without";
                      }
                  } else {
                      standInput.value = "No Stand";
                      checkbox.dataset.movingStand = "none";
                  }
              }
              
              dropdown.style.display = 'none';
          }
      });
  });

  function toggleStandDropdown(productId) {
      event.preventDefault();
      event.stopPropagation();
      const dropdown = document.querySelector(`#stand-options-${productId}`);
      const input = dropdown.parentElement.querySelector('.stand-input');
      
      // Close all other dropdowns first
      document.querySelectorAll('.stand-options').forEach(d => {
          if (d !== dropdown) {
              d.style.display = 'none';
          }
      });
      
      // Toggle current dropdown
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      
      if (dropdown.style.display === 'block') {
          input.focus();
      }
  }

  // Add these functions after the existing functions
  function updateMovingStandQuantity(productId, change) {
      const quantitySpan = document.querySelector(`#moving-stand-quantity-${productId} .quantity-value`);
      if (quantitySpan) {
          let currentQuantity = parseInt(quantitySpan.textContent);
          currentQuantity = Math.max(1, currentQuantity + change);
          quantitySpan.textContent = currentQuantity;
          
          const standInput = document.querySelector(`#stand-options-${productId}`).parentElement.querySelector('.stand-input');
          standInput.value = `With Moving Stand (18 BHD) x${currentQuantity}`;
          
          const checkbox = document.getElementById(productId);
          checkbox.dataset.movingStand = "with";
          
          // Update both total and cart
          updateTotal();
          updateCart();
      }
  }

  function updateFixedStandQuantity(productId, change) {
      const quantitySpan = document.querySelector(`#fixed-stand-quantity-${productId} .quantity-value`);
      if (quantitySpan) {
          let currentQuantity = parseInt(quantitySpan.textContent);
          currentQuantity = Math.max(1, currentQuantity + change);
          quantitySpan.textContent = currentQuantity;
          
          const standInput = document.querySelector(`#stand-options-${productId}`).parentElement.querySelector('.stand-input');
          const fixedCost = productData[document.getElementById(productId).dataset.originalName].fixed_stand_cost || 0;
          standInput.value = `With Fixed Stand (${fixedCost} BHD) x${currentQuantity}`;
          
          const checkbox = document.getElementById(productId);
          checkbox.dataset.movingStand = "without";
          
          // Update both total and cart
          updateTotal();
          updateCart();
      }
  }

  function selectInstallationOption(productId, value) {
      const radio = document.querySelector(`input[name="inst-${productId}"][value="${value}"]`);
      if (radio) {
          radio.checked = true;
          const checkbox = document.getElementById(productId);
          const originalName = checkbox.dataset.originalName;
          const fixingCost = productData[originalName].fixingCost;
          
          // Get quantity controls
          const installationQuantityControls = document.querySelector(`#installation-quantity-${productId}`);
          
          if (value === "with") {
              if (installationQuantityControls) {
                  installationQuantityControls.style.display = "flex";
                  const quantity = installationQuantityControls.querySelector('.quantity-value').textContent;
                  const costText = fixingCost === 0 ? 'Free' : `${fixingCost} BHD`;
                  const inputField = document.querySelector(`#card-${productId} .installation-input`);
                  if (inputField) {
                      inputField.value = `With Installation (${costText}) x${quantity}`;
                  }
              }
          } else {
              if (installationQuantityControls) {
                  installationQuantityControls.style.display = "none";
                  installationQuantityControls.querySelector('.quantity-value').textContent = "1";
              }
              const inputField = document.querySelector(`#card-${productId} .installation-input`);
              if (inputField) {
                  inputField.value = "Without Installation";
              }
          }
          
          // Close the dropdown
          const dropdown = document.querySelector(`#installation-options-${productId}`);
          if (dropdown) {
              dropdown.style.display = 'none';
          }
          
          // Update the total and cart
          updateTotal();
          updateCart();
      }
  }

  function selectStandOption(productId, value) {
    const radio = document.querySelector(`input[name="moving-stand-${productId}"][value="${value}"]`);
    if (radio) {
      radio.checked = true;
      const checkbox = document.getElementById(productId);
      const standInput = document.querySelector(`#stand-options-${productId}`).parentElement.querySelector('.stand-input');
      
      // Get both quantity control elements
      const movingStandQuantityControls = document.querySelector(`#moving-stand-quantity-${productId}`);
      const fixedStandQuantityControls = document.querySelector(`#fixed-stand-quantity-${productId}`);
      
      // First, hide both quantity controls and reset their values
      if (movingStandQuantityControls) {
        movingStandQuantityControls.style.display = "none";
        movingStandQuantityControls.querySelector('.quantity-value').textContent = "1";
      }
      if (fixedStandQuantityControls) {
        fixedStandQuantityControls.style.display = "none";
        fixedStandQuantityControls.querySelector('.quantity-value').textContent = "1";
      }
      
      // Then show the appropriate one based on selection
      if (value === "with") {
        if (movingStandQuantityControls) {
          movingStandQuantityControls.style.display = "flex";
          standInput.value = "With Moving Stand (18 BHD) x1";
        }
      } else if (value === "without") {
        if (fixedStandQuantityControls) {
          fixedStandQuantityControls.style.display = "flex";
          const fixedCost = productData[checkbox.dataset.originalName].fixed_stand_cost || 0;
          standInput.value = `With Fixed Stand (${fixedCost} BHD) x1`;
        }
      } else {
        // For "No Stand" option
        standInput.value = "No Stand";
      }
      
      checkbox.dataset.movingStand = value;
      
      // Update the total and cart
      updateTotal();
      updateCart();
    }
  }

  // Add image slider functionality
  function nextImage(event, productId) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const checkbox = document.getElementById(productId);
    if (!checkbox) {
      console.log('Checkbox not found for:', productId);
      return false;
    }
    
    const originalName = checkbox.dataset.originalName;
    const product = productData[originalName]; // Use productData instead of products array
    
    if (!product || !product.images || product.images.length <= 1) {
      console.log('No valid images found for:', originalName);
      return false;
    }
    
    const imageContainer = document.getElementById(`image-container-${productId}`);
    const img = imageContainer.querySelector('img');
    const currentIndex = parseInt(img.getAttribute('data-index') || 0);
    const nextIndex = (currentIndex + 1) % product.images.length;
    
    console.log('Switching image:', {
      productId,
      originalName,
      currentIndex,
      nextIndex,
      images: product.images
    });
    
    img.src = product.images[nextIndex];
    img.setAttribute('data-index', nextIndex);
    
    return false;
  }

  function prevImage(event, productId) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const checkbox = document.getElementById(productId);
    if (!checkbox) {
      console.log('Checkbox not found for:', productId);
      return false;
    }
    
    const originalName = checkbox.dataset.originalName;
    const product = productData[originalName]; // Use productData instead of products array
    
    if (!product || !product.images || product.images.length <= 1) {
      console.log('No valid images found for:', originalName);
      return false;
    }
    
    const imageContainer = document.getElementById(`image-container-${productId}`);
    const img = imageContainer.querySelector('img');
    const currentIndex = parseInt(img.getAttribute('data-index') || 0);
    const prevIndex = (currentIndex - 1 + product.images.length) % product.images.length;
    
    console.log('Switching image:', {
      productId,
      originalName,
      currentIndex,
      prevIndex,
      images: product.images
    });
    
    img.src = product.images[prevIndex];
    img.setAttribute('data-index', prevIndex);
    
    return false;
  }

  // Add these new functions after the existing functions
  function updateInstallationQuantity(productId, change) {
      const quantitySpan = document.querySelector(`#installation-quantity-${productId} .quantity-value`);
      if (quantitySpan) {
          let currentQuantity = parseInt(quantitySpan.textContent);
          currentQuantity = Math.max(1, currentQuantity + change);
          quantitySpan.textContent = currentQuantity;
          
          const installationInput = document.querySelector(`#card-${productId} .installation-input`);
          const fixingCost = productData[document.getElementById(productId).dataset.originalName].fixingCost;
          const costText = fixingCost === 0 ? 'Free' : `${fixingCost} BHD`;
          installationInput.value = `With Installation (${costText}) x${currentQuantity}`;
          
          // Update the total and cart
          updateTotal();
          updateCart();
      }
  }

        //----fltirs----\\\
          document.addEventListener('DOMContentLoaded', function() {
          const filterButton = document.querySelector('.filter-button');
          const filterOptions = document.querySelector('.filter-options');
          const clearFiltersButton = document.querySelector('.clear-filters');
          const priceFilter = document.getElementById('price-filter');
          const brandFilter = document.getElementById('brand-filter');
          const sizeFilter = document.getElementById('size-filter');
          const inStockFilter = document.getElementById('in-stock-filter');
      
          // Toggle filter dropdown
          filterButton.addEventListener('click', function(e) {
              e.stopPropagation();
              filterOptions.classList.toggle('show');
          });
      
          // Close filter dropdown when clicking outside
          document.addEventListener('click', function(e) {
              if (!filterOptions.contains(e.target) && !filterButton.contains(e.target)) {
                  filterOptions.classList.remove('show');
              }
          });
      
          // Function to filter products
          function filterProducts() {
              const productCards = document.querySelectorAll('.product-card');
              const selectedPrice = priceFilter.value;
              const selectedBrand = brandFilter.value;
              const selectedSize = sizeFilter.value;
              const showInStock = inStockFilter.checked;
      
              productCards.forEach(card => {
                  const productName = card.querySelector('.product-name').textContent;
                  const productPrice = parseFloat(card.querySelector('.product-price').textContent);
                  const isInStock = !card.classList.contains('out-of-stock');
                  
                  let matchesPrice = true;
                  let matchesBrand = true;
                  let matchesSize = true;
                  let matchesStock = true;
      
                  if (selectedPrice) {
                      switch(selectedPrice) {
                          case '0-100':
                              matchesPrice = productPrice < 100;
                              break;
                          case '100-500':
                              matchesPrice = productPrice >= 100 && productPrice <= 500;
                              break;
                          case '500+':
                              matchesPrice = productPrice > 500;
                              break;
                      }
                  }
      
                  if (selectedBrand) {
                      matchesBrand = productName.includes(selectedBrand);
                  }
      
                  if (selectedSize) {
                      matchesSize = productName.includes(selectedSize + ' inch');
                  }
      
                  if (showInStock) {
                      matchesStock = isInStock;
                  }
      
                  if (matchesPrice && matchesBrand && matchesSize && matchesStock) {
                      card.style.display = 'flex';
                  } else {
                      card.style.display = 'none';
                  }
              });
          }
      
          // Add event listeners to all filter inputs
          priceFilter.addEventListener('change', filterProducts);
          brandFilter.addEventListener('change', filterProducts);
          sizeFilter.addEventListener('change', filterProducts);
          inStockFilter.addEventListener('change', filterProducts);
      
          // Clear all filters
          clearFiltersButton.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              priceFilter.value = '';
              brandFilter.value = '';
              sizeFilter.value = '';
              inStockFilter.checked = false;
              filterProducts();
          });
      });

      //size range\\
      
      const sizes = [22 ,36, 38, 40, 42, 44];
      const rangeInput = document.getElementById('customRange1');
      const rangeValue = document.getElementById('rangeValue');
      
      function updateRangeValue() {
          const index = parseInt(rangeInput.value);
          const size = sizes[index];
          rangeValue.textContent = size;
      
          // حساب الموضع النسبى للـthumb
          const rangeWidth = rangeInput.offsetWidth;
          const thumbPosition = (rangeInput.value - rangeInput.min) / (rangeInput.max - rangeInput.min);
          const offset = thumbPosition * rangeWidth;
      
          // تحريك الرقم فوق المؤشر
          rangeValue.style.left = `${offset}px`;
      }
      
      rangeInput.addEventListener('input', updateRangeValue);
      window.addEventListener('load', updateRangeValue);
      