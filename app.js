/**
 * E Build Renovation & Construction - Interactive Landing Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Config: Set this to your Google Apps Script Webhook URL once deployed
  const WEBHOOK_URL = ''; 

  let modalCalendar;
  let inlineCalendar;

  // --- 1. Scrolled Header Animation ---
  const header = document.getElementById('main-header');
  const scrollThreshold = 50;

  window.addEventListener('scroll', () => {
    if (window.scrollY > scrollThreshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // --- 2. Mobile Navigation Toggle ---
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileNavMenu = document.getElementById('mobile-nav-menu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  const toggleMobileMenu = () => {
    mobileMenuToggle.classList.toggle('active');
    mobileNavMenu.classList.toggle('active');
    // Prevent scrolling behind the overlay when active
    document.body.style.overflow = mobileNavMenu.classList.contains('active') ? 'hidden' : 'auto';
  };

  mobileMenuToggle.addEventListener('click', toggleMobileMenu);

  // Close mobile menu when a navigation link is clicked
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileNavMenu.classList.contains('active')) {
        toggleMobileMenu();
      }
    });
  });

  // --- 3. Inquiry Form Validation & Webhook Submission ---
  const inquiryForm = document.getElementById('inquiry-form');
  const submitButton = document.getElementById('submit-button');
  const successScreen = document.getElementById('form-success-screen');

  // Handle Inline Card Option clicks
  const inlineCardOptions = document.querySelectorAll('.inline-card-option');
  const inlineLeadData = {
    propertyType: '',
    scopeWork: '',
    budget: ''
  };

  inlineCardOptions.forEach(card => {
    card.addEventListener('click', () => {
      const group = card.getAttribute('data-group');
      const value = card.getAttribute('data-value');

      // Unselect siblings
      const siblings = document.querySelectorAll(`.inline-card-option[data-group="${group}"]`);
      siblings.forEach(sib => sib.classList.remove('selected'));

      // Select clicked card
      card.classList.add('selected');

      // Record Value
      if (group === 'inline-property-type') inlineLeadData.propertyType = value;
      if (group === 'inline-scope-work') inlineLeadData.scopeWork = value;
      if (group === 'inline-budget') inlineLeadData.budget = value;
    });
  });

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Reset previous invalid marks
      const nameInput = document.getElementById('inline-name');
      const phoneInput = document.getElementById('inline-phone');
      const emailInput = document.getElementById('inline-email');
      const dateInput = document.getElementById('inline-date');
      const calendarWidget = document.getElementById('inline-calendar-widget');

      const inputs = [nameInput, phoneInput, emailInput];
      inputs.forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
      });
      if (calendarWidget) {
        calendarWidget.style.borderColor = '';
        calendarWidget.style.boxShadow = '';
      }

      const inlineCardGrids = document.querySelectorAll('.inline-cards-grid');
      inlineCardGrids.forEach(grid => {
        grid.style.outline = '';
        grid.style.padding = '';
        grid.style.borderRadius = '';
      });

      // Simple Validation Rules
      let isValid = true;
      let errorFields = [];

      // Validate card selections
      if (!inlineLeadData.propertyType) {
        isValid = false;
        const grid = document.querySelector('.inline-cards-grid[data-grid-group="property-type"]');
        if (grid) errorFields.push(grid);
      }
      if (!inlineLeadData.scopeWork) {
        isValid = false;
        const grid = document.querySelector('.inline-cards-grid[data-grid-group="scope-work"]');
        if (grid) errorFields.push(grid);
      }
      if (!inlineLeadData.budget) {
        isValid = false;
        const grid = document.querySelector('.inline-cards-grid[data-grid-group="budget"]');
        if (grid) errorFields.push(grid);
      }

      if (!nameInput.value.trim()) {
        isValid = false;
        errorFields.push(nameInput);
      }

      // Basic international phone regex
      const phoneRegex = /^[+]?[0-9\s\-()]{7,18}$/;
      if (!phoneInput.value.trim() || !phoneRegex.test(phoneInput.value.trim())) {
        isValid = false;
        errorFields.push(phoneInput);
      }

      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
        isValid = false;
        errorFields.push(emailInput);
      }

      if (!dateInput.value) {
        isValid = false;
        if (calendarWidget) errorFields.push(calendarWidget);
      }

      // Highlight invalid inputs
      if (!isValid) {
        errorFields.forEach(field => {
          if (field.classList.contains('inline-cards-grid')) {
            field.style.outline = '2px solid #ff4d4f';
            field.style.padding = '0.5rem';
            field.style.borderRadius = '4px';
          } else {
            field.style.borderColor = '#ff4d4f';
            field.style.boxShadow = '0 0 0 3px rgba(255, 77, 79, 0.15)';
          }
        });
        
        // Scroll to first invalid field
        errorFields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Prepare Payload
      const formData = {
        timestamp: new Date().toISOString(),
        form_type: 'Site Visit Booking (Inline)',
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        property_type: inlineLeadData.propertyType,
        scope_of_work: inlineLeadData.scopeWork,
        budget_tier: inlineLeadData.budget,
        preferred_date: dateInput.value
      };

      // UI Loading state
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = 'Booking... | 正在提交...';
      submitButton.style.opacity = '0.7';

      try {
        if (WEBHOOK_URL) {
          const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          if (!response.ok) throw new Error('Server error');
        } else {
          console.warn('Form Webhook URL is empty. Running in Demo mode.');
          console.log('Submitted Inline Payload:', formData);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Show success screen overlay
        successScreen.classList.add('active');
        inquiryForm.reset();
        
        // Reset visual cards selections
        document.querySelectorAll('.inline-card-option.selected').forEach(c => c.classList.remove('selected'));
        inlineLeadData.propertyType = '';
        inlineLeadData.scopeWork = '';
        inlineLeadData.budget = '';

        // Reset inline calendar selection
        if (inlineCalendar) {
          inlineCalendar.reset();
        }

        // Setup WhatsApp link
        const waBtn = document.getElementById('success-whatsapp-btn');
        const textParam = encodeURIComponent(
          `Hi E Build, I just booked a Site Visit for my project via the website inline form.\n\nName: ${formData.name}\nProperty: ${formData.property_type}\nScope: ${formData.scope_of_work}\nBudget: ${formData.budget_tier}\nPreferred Date: ${formData.preferred_date}`
        );
        waBtn.href = `https://wa.me/60123456789?text=${textParam}`;

      } catch (error) {
        console.error('Submission failed:', error);
        alert('Submission failed. Please try again or contact us directly via WhatsApp.\n提交失败。请重试或直接通过 WhatsApp 联系我们。');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        submitButton.style.opacity = '';
      }
    });
  }

  // --- 4. Book a Site Visit Multi-Step Modal Form ---
  const siteVisitModal = document.getElementById('site-visit-modal');
  const heroSiteVisitBtn = document.getElementById('hero-site-visit-btn');
  const headerSiteVisitBtn = document.getElementById('header-site-visit-btn');
  const mobileSiteVisitBtn = document.getElementById('mobile-site-visit-btn');
  const floatingSiteVisitBtn = document.getElementById('floating-site-visit-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalStepsContainer = document.getElementById('modal-steps-container');
  const modalProgressBar = document.getElementById('modal-progress-bar');
  const currentStepNum = document.getElementById('current-step-num');
  const currentStepNumZh = document.getElementById('current-step-num-zh');
  const modalBackBtn = document.getElementById('modal-back-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const modalSuccessScreen = document.getElementById('modal-success-screen');
  const modalSuccessWhatsappBtn = document.getElementById('modal-success-whatsapp-btn');

  // Modal State
  let currentStep = 1;
  const totalSteps = 4;
  const leadData = {
    propertyType: '',
    scopeWork: '',
    budget: '',
    name: '',
    phone: '',
    email: '',
    preferredDate: ''
  };

  // Open Modal
  const openModal = () => {
    if (siteVisitModal) {
      siteVisitModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      resetModal();
    }
  };

  [heroSiteVisitBtn, headerSiteVisitBtn, mobileSiteVisitBtn, floatingSiteVisitBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', openModal);
    }
  });

  // Close Modal
  if (modalCloseBtn && siteVisitModal) {
    modalCloseBtn.addEventListener('click', closeModal);
    siteVisitModal.addEventListener('click', (e) => {
      if (e.target === siteVisitModal) closeModal();
    });
  }

  function closeModal() {
    siteVisitModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Reset Modal State
  function resetModal() {
    currentStep = 1;
    leadData.propertyType = '';
    leadData.scopeWork = '';
    leadData.budget = '';
    leadData.name = '';
    leadData.phone = '';
    leadData.email = '';
    leadData.preferredDate = '';

    // Clear visual selections
    const selectedCards = siteVisitModal.querySelectorAll('.card-option.selected');
    selectedCards.forEach(card => card.classList.remove('selected'));

    // Clear inputs
    const inputs = siteVisitModal.querySelectorAll('.form-control');
    inputs.forEach(input => {
      input.value = '';
      input.style.borderColor = '';
      input.style.boxShadow = '';
    });

    // Reset Custom Calendar
    if (modalCalendar) {
      modalCalendar.reset();
    }

    // Reset Success Screen
    if (modalSuccessScreen) {
      modalSuccessScreen.classList.remove('active');
    }

    goToStep(1);
  }

  // Handle Card Option clicks (Steps 1, 2, 3)
  const cardOptions = siteVisitModal.querySelectorAll('.card-option');
  cardOptions.forEach(card => {
    card.addEventListener('click', () => {
      const group = card.getAttribute('data-group');
      const value = card.getAttribute('data-value');

      // Unselect siblings
      const siblings = siteVisitModal.querySelectorAll(`.card-option[data-group="${group}"]`);
      siblings.forEach(sib => sib.classList.remove('selected'));

      // Select clicked card
      card.classList.add('selected');

      // Record Value
      if (group === 'property-type') leadData.propertyType = value;
      if (group === 'scope-work') leadData.scopeWork = value;
      if (group === 'budget') leadData.budget = value;

      // Enable navigation
      modalNextBtn.disabled = false;

      // Premium UX Detail: Auto-advance to the next step after a short delay (350ms)
      if (currentStep < 3) {
        setTimeout(() => {
          // Double check that we are still on the same step (prevent quick click double advancing)
          if (currentStep < 3) {
            currentStep++;
            goToStep(currentStep);
          }
        }, 350);
      }
    });
  });

  // Navigation: Back Button
  if (modalBackBtn) {
    modalBackBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        goToStep(currentStep);
      }
    });
  }

  // Navigation: Next / Submit Button
  if (modalNextBtn) {
    modalNextBtn.addEventListener('click', async () => {
      if (currentStep < totalSteps) {
        currentStep++;
        goToStep(currentStep);
      } else {
        // Step 4: Submission
        if (validateStep4()) {
          await submitSiteVisitBooking();
        }
      }
    });
  }

  // Navigate to specific step index
  function goToStep(stepIndex) {
    // 1. Slide to the step
    const offset = -(stepIndex - 1) * 100;
    modalStepsContainer.style.transform = `translateX(${offset}%)`;

    // 2. Update Progress Bar
    const progressPercent = (stepIndex / totalSteps) * 100;
    modalProgressBar.style.width = `${progressPercent}%`;

    // 3. Update Progress texts
    currentStepNum.innerText = stepIndex;
    currentStepNumZh.innerText = stepIndex;

    // 4. Update Back Button visibility
    if (stepIndex === 1) {
      modalBackBtn.style.visibility = 'hidden';
    } else {
      modalBackBtn.style.visibility = 'visible';
    }

    // 5. Update Next Button state & text
    if (stepIndex === totalSteps) {
      modalNextBtn.innerHTML = 'Book Site Visit | 立即预约';
      modalNextBtn.disabled = false; // Always enabled to allow trigger validation on click
    } else {
      modalNextBtn.innerHTML = 'Next | 下一步';
      
      // Determine if already has a selected value to enable next button
      let hasValue = false;
      if (stepIndex === 1 && leadData.propertyType) hasValue = true;
      if (stepIndex === 2 && leadData.scopeWork) hasValue = true;
      if (stepIndex === 3 && leadData.budget) hasValue = true;

      modalNextBtn.disabled = !hasValue;
    }
  }

  // Input Validation for Step 4
  function validateStep4() {
    let isValid = true;
    const nameInput = document.getElementById('modal-name');
    const phoneInput = document.getElementById('modal-phone');
    const emailInput = document.getElementById('modal-email');
    const dateInput = document.getElementById('modal-date');
    const calendarWidget = document.getElementById('modal-calendar-widget');

    const inputs = [nameInput, phoneInput, emailInput];
    inputs.forEach(input => {
      input.style.borderColor = '';
      input.style.boxShadow = '';
    });
    if (calendarWidget) {
      calendarWidget.style.borderColor = '';
      calendarWidget.style.boxShadow = '';
    }

    if (!nameInput.value.trim()) {
      isValid = false;
      highlightError(nameInput);
    }

    const phoneRegex = /^[+]?[0-9\s\-()]{7,18}$/;
    if (!phoneInput.value.trim() || !phoneRegex.test(phoneInput.value.trim())) {
      isValid = false;
      highlightError(phoneInput);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      isValid = false;
      highlightError(emailInput);
    }

    if (!dateInput.value) {
      isValid = false;
      if (calendarWidget) {
        calendarWidget.style.borderColor = '#ff4d4f';
        calendarWidget.style.boxShadow = '0 0 0 3px rgba(255, 77, 79, 0.15)';
      }
    }

    return isValid;
  }

  function highlightError(field) {
    field.style.borderColor = '#ff4d4f';
    field.style.boxShadow = '0 0 0 3px rgba(255, 77, 79, 0.15)';
  }

  // Submit site visit booking to webhook
  async function submitSiteVisitBooking() {
    const nameInput = document.getElementById('modal-name');
    const phoneInput = document.getElementById('modal-phone');
    const emailInput = document.getElementById('modal-email');
    const dateInput = document.getElementById('modal-date');

    leadData.name = nameInput.value.trim();
    leadData.phone = phoneInput.value.trim();
    leadData.email = emailInput.value.trim();
    leadData.preferredDate = dateInput.value;

    const payload = {
      timestamp: new Date().toISOString(),
      form_type: 'Site Visit Booking',
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email,
      property_type: leadData.propertyType,
      scope_of_work: leadData.scopeWork,
      budget_tier: leadData.budget,
      preferred_date: leadData.preferredDate
    };

    // UI Loading state
    const originalText = modalNextBtn.innerHTML;
    modalNextBtn.disabled = true;
    modalNextBtn.innerHTML = 'Booking... | 正在提交...';
    modalNextBtn.style.opacity = '0.7';

    try {
      if (WEBHOOK_URL) {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Server error');
      } else {
        console.warn('Form Webhook URL is empty. Running in Site Visit Demo mode.');
        console.log('Submitted Site Visit Payload:', payload);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Show success screen inside modal
      if (modalSuccessScreen) {
        modalSuccessScreen.classList.add('active');
      }

      // Setup dynamic WhatsApp link for immediate booking notification
      if (modalSuccessWhatsappBtn) {
        const textParam = encodeURIComponent(
          `Hi E Build, I just booked a Site Visit for my project.\n\nName: ${payload.name}\nProperty: ${payload.property_type}\nScope: ${payload.scope_of_work}\nBudget: ${payload.budget_tier}\nPreferred Date: ${payload.preferred_date}`
        );
        modalSuccessWhatsappBtn.href = `https://wa.me/60123456789?text=${textParam}`;
      }

    } catch (error) {
      console.error('Booking submission failed:', error);
      alert('Booking submission failed. Please try again or contact us directly via WhatsApp.\n提交预约失败。请重试或直接通过 WhatsApp 联系我们。');
    } finally {
      modalNextBtn.disabled = false;
      modalNextBtn.innerHTML = originalText;
      modalNextBtn.style.opacity = '';
    }
  }

  // --- 5. Visual Custom Calendar Component ---
  function initCalendar(containerId, dateInputId, displayId) {
    const container = document.getElementById(containerId);
    const dateInput = document.getElementById(dateInputId);
    const displayElement = document.getElementById(displayId);

    if (!container || !dateInput || !displayElement) return null;

    let today = new Date();
    let displayMonth = today.getMonth();
    let displayYear = today.getFullYear();
    let selectedDate = null;

    function render() {
      container.innerHTML = '';

      const header = document.createElement('div');
      header.className = 'calendar-header';

      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'calendar-prev-btn';
      prevBtn.innerHTML = '&lt;';
      
      if (displayYear === today.getFullYear() && displayMonth === today.getMonth()) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.3';
        prevBtn.style.cursor = 'not-allowed';
      }

      prevBtn.addEventListener('click', () => {
        if (displayMonth === 0) {
          displayMonth = 11;
          displayYear--;
        } else {
          displayMonth--;
        }
        render();
      });

      const title = document.createElement('div');
      title.className = 'calendar-month-year';
      const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthNamesZh = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
      title.innerHTML = `<span class="en">${monthNamesEn[displayMonth]} ${displayYear}</span><span class="zh">${monthNamesZh[displayMonth]} ${displayYear}年</span>`;

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'calendar-next-btn';
      nextBtn.innerHTML = '&gt;';
      
      let maxFutureDate = new Date();
      maxFutureDate.setMonth(today.getMonth() + 3);
      if (displayYear === maxFutureDate.getFullYear() && displayMonth === maxFutureDate.getMonth()) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.3';
        nextBtn.style.cursor = 'not-allowed';
      }

      nextBtn.addEventListener('click', () => {
        if (displayMonth === 11) {
          displayMonth = 0;
          displayYear++;
        } else {
          displayMonth++;
        }
        render();
      });

      header.appendChild(prevBtn);
      header.appendChild(title);
      header.appendChild(nextBtn);
      container.appendChild(header);

      const weekdays = document.createElement('div');
      weekdays.className = 'calendar-weekdays';
      const weekdaysEn = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
      weekdaysEn.forEach(day => {
        const d = document.createElement('div');
        d.innerText = day;
        weekdays.appendChild(d);
      });
      container.appendChild(weekdays);

      const daysContainer = document.createElement('div');
      daysContainer.className = 'calendar-days';

      const firstDay = new Date(displayYear, displayMonth, 1).getDay();
      const totalDays = new Date(displayYear, displayMonth + 1, 0).getDate();

      for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        daysContainer.appendChild(empty);
      }

      for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.innerText = dayNum;

        const cellDate = new Date(displayYear, displayMonth, dayNum);
        const checkDate = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
        const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (checkDate.getTime() === compareToday.getTime()) {
          dayCell.classList.add('today');
        }

        if (checkDate.getTime() <= compareToday.getTime()) {
          dayCell.classList.add('disabled');
        } else {
          if (selectedDate && checkDate.getTime() === selectedDate.getTime()) {
            dayCell.classList.add('selected');
          }

          dayCell.addEventListener('click', () => {
            selectedDate = checkDate;
            const yearStr = selectedDate.getFullYear();
            const monthStr = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const dayStr = String(selectedDate.getDate()).padStart(2, '0');
            const formattedDate = `${yearStr}-${monthStr}-${dayStr}`;
            
            dateInput.value = formattedDate;

            // Clear errors
            container.style.borderColor = '';
            container.style.boxShadow = '';

            const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const dayNamesZh = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
            const weekdayEn = dayNamesEn[selectedDate.getDay()];
            const weekdayZh = dayNamesZh[selectedDate.getDay()];

            displayElement.innerHTML = `
              <span class="en">Selected: ${formattedDate} (${weekdayEn})</span>
              <span class="zh" style="margin-left:0.5rem;color:var(--accent-bright);font-weight:700;">已选: ${formattedDate} (${weekdayZh})</span>
            `;

            render();
          });
        }

        daysContainer.appendChild(dayCell);
      }

      container.appendChild(daysContainer);
    }

    function reset() {
      selectedDate = null;
      dateInput.value = '';
      displayElement.innerHTML = `
        <span class="en">No date selected</span>
        <span class="zh">未选择日期</span>
      `;
      container.style.borderColor = '';
      container.style.boxShadow = '';
      displayMonth = today.getMonth();
      displayYear = today.getFullYear();
      render();
    }

    render();

    return { reset };
  }

  // Initialize custom calendar widgets
  modalCalendar = initCalendar('modal-calendar-widget', 'modal-date', 'modal-date-display');
  inlineCalendar = initCalendar('inline-calendar-widget', 'inline-date', 'inline-date-display');
});
