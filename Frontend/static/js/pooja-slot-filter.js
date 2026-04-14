// Pooja Slot Time Filter
(function() {
  'use strict';
  
  document.addEventListener('DOMContentLoaded', function() {
    const poojaTypeSelect = document.getElementById('poojaType');
    const slotTimeSelect = document.getElementById('slotTime');
    
    if (!poojaTypeSelect || !slotTimeSelect) {
      return;
    }

    // Define slot availability for each pooja
    const poojaSlots = {
      'Mahapooja vitthal': ['morning'],  // Nitya Pooja Vitthal - Morning only
      'Mahapooja Rukmini mata': ['morning'],  // Nitya Pooja Rukmini mata - Morning only
      'Padya Pooja': ['evening'],  // Padya Pooja - Evening only
      'Tulsi pooja': ['morning', 'afternoon', 'evening']  // Tulsi pooja - All slots
    };

    function updateSlotOptions() {
      const selectedPooja = poojaTypeSelect.value;
      
      // Reset slot selection
      slotTimeSelect.value = '';
      
      // Get all option elements
      const morningOption = slotTimeSelect.querySelector('option[value="morning"]');
      const afternoonOption = slotTimeSelect.querySelector('option[value="afternoon"]');
      const eveningOption = slotTimeSelect.querySelector('option[value="evening"]');
      
      if (!selectedPooja) {
        // No pooja selected - show all slots but disabled
        if (morningOption) {
          morningOption.disabled = false;
          morningOption.style.display = '';
        }
        if (afternoonOption) {
          afternoonOption.disabled = false;
          afternoonOption.style.display = '';
        }
        if (eveningOption) {
          eveningOption.disabled = false;
          eveningOption.style.display = '';
        }
        return;
      }
      
      const availableSlots = poojaSlots[selectedPooja] || ['morning', 'afternoon', 'evening'];
      
      // Show/hide options based on availability
      if (morningOption) {
        if (availableSlots.includes('morning')) {
          morningOption.disabled = false;
          morningOption.style.display = '';
        } else {
          morningOption.disabled = true;
          morningOption.style.display = 'none';
        }
      }
      
      if (afternoonOption) {
        if (availableSlots.includes('afternoon')) {
          afternoonOption.disabled = false;
          afternoonOption.style.display = '';
        } else {
          afternoonOption.disabled = true;
          afternoonOption.style.display = 'none';
        }
      }
      
      if (eveningOption) {
        if (availableSlots.includes('evening')) {
          eveningOption.disabled = false;
          eveningOption.style.display = '';
        } else {
          eveningOption.disabled = true;
          eveningOption.style.display = 'none';
        }
      }
      
      // Update helper text
      const slotError = document.getElementById('slotTime_error');
      if (slotError) {
        let message = '';
        if (availableSlots.length === 1) {
          message = `Only ${availableSlots[0]} slot available for this pooja`;
        } else if (availableSlots.length === 2) {
          message = `${availableSlots[0]} and ${availableSlots[1]} slots available`;
        } else {
          message = 'All time slots available';
        }
        slotError.textContent = message;
        slotError.className = 'text-xs text-blue-600 mt-1';
      }
    }
    
    // Listen for pooja type changes
    poojaTypeSelect.addEventListener('change', updateSlotOptions);
    
    // Initial update
    updateSlotOptions();
  });
})();
