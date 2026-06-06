/**
 * E Build Renovation & Construction - Interactive Landing Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Config: Set this to your Google Apps Script Webhook URL once deployed
  const WEBHOOK_URL = ''; 

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

  // --- 3. Form Validation & Webhook Submission ---
  const inquiryForm = document.getElementById('inquiry-form');
  const submitButton = document.getElementById('submit-button');
  const successScreen = document.getElementById('form-success-screen');

  inquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset previous invalid marks
    const inputs = inquiryForm.querySelectorAll('.form-control, .checkbox-grid');
    inputs.forEach(input => {
      input.style.borderColor = '';
      input.style.boxShadow = '';
    });

    // Extract Values
    const nameInput = document.getElementById('full-name');
    const phoneInput = document.getElementById('phone-number');
    const emailInput = document.getElementById('email');
    const propertyTypeSelect = document.getElementById('property-type');
    const projectBriefInput = document.getElementById('project-brief');
    
    // Checkboxes validation (must select at least one)
    const checkboxes = inquiryForm.querySelectorAll('input[name="services"]:checked');
    const servicesSelected = Array.from(checkboxes).map(cb => cb.value);

    // Simple Validation Rules
    let isValid = true;
    let errorFields = [];

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

    if (!propertyTypeSelect.value) {
      isValid = false;
      errorFields.push(propertyTypeSelect);
    }

    if (servicesSelected.length === 0) {
      isValid = false;
      const checkboxGrid = inquiryForm.querySelector('.checkbox-grid');
      errorFields.push(checkboxGrid);
    }

    // Highlight invalid inputs
    if (!isValid) {
      errorFields.forEach(field => {
        field.style.borderColor = '#ff4d4f';
        field.style.boxShadow = '0 0 0 3px rgba(255, 77, 79, 0.15)';
      });
      
      // Scroll to first invalid field
      errorFields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Prepare Payload
    const formData = {
      timestamp: new Date().toISOString(),
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      property_type: propertyTypeSelect.value,
      services: servicesSelected.join(', '),
      project_brief: projectBriefInput.value.trim()
    };

    // UI Loading state
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = 'Submitting... | 正在提交...';
    submitButton.style.opacity = '0.7';

    try {
      if (WEBHOOK_URL) {
        // Submit payload directly to Google Sheets Webhook / Apps Script
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Server returned error response');
        }
      } else {
        // Mock success delay (if no webhook url is configured yet)
        console.warn('Form Webhook URL is empty. Running in Demo mode.');
        console.log('Submitted Payload:', formData);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Show success screen overlay
      successScreen.classList.add('active');
      inquiryForm.reset();
      
      // Setup dynamic WhatsApp link for immediate followup
      const waBtn = document.getElementById('success-whatsapp-btn');
      const textParam = encodeURIComponent(
        `Hi E Build, I just submitted an inquiry for my project.\n\nName: ${formData.name}\nProperty: ${formData.property_type}\nService: ${formData.services}`
      );
      waBtn.href = `https://wa.me/60123456789?text=${textParam}`;

    } catch (error) {
      console.error('Submission failed:', error);
      alert('Submission failed. Please try again or contact us directly via WhatsApp.\n提交失败。请重试或直接通过 WhatsApp 联系我们。');
    } finally {
      // Restore CTA button
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
      submitButton.style.opacity = '';
    }
  });
});
