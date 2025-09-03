document.addEventListener("DOMContentLoaded", () => {
  // --- Data & State ---
  const disabilities = [
    "Mental",
    "Head",
    "Cervical / Neck",
    "Right Arm",
    "Left Arm",
    "Spine / Back",
    "GERD/IBS",
    "Right Leg",
    "Left Leg",
    "Other",
  ];
  const percentages = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const paymentRates = {
    // Simplified rates for demonstration (Single Veteran, no dependents)
    0: 0,
    10: 165.92,
    20: 331.84,
    30: 508.05,
    40: 731.86,
    50: 1041.82,
    60: 1319.65,
    70: 1663.06,
    80: 1933.15,
    90: 2174.45,
    100: 3621.95,
  };

  let selectedDisability = null;
  let selectedRatings = [];

  // --- DOM Elements ---
  const disabilityListEl = document.getElementById("disability-list");
  const percentageGridEl = document.getElementById("percentage-grid");
  const selectionsListEl = document.getElementById("selections-list");
  const bilateralsEl = document.getElementById("bilaterals-value");
  const ratingEl = document.getElementById("rating-value");
  const monthlyPaymentEl = document.getElementById("monthly-payment");
  const roundedMessageEl = document.getElementById("rounded-message");
  const unroundedRatingEl = document.getElementById("unrounded-rating");
  const roundedRatingEl = document.getElementById("rounded-rating");

  const childrenUnder18El = document.getElementById("children-under-18");
  const childrenOver18El = document.getElementById("children-over-18");
  const maritalStatusEl = document.getElementById("marital-status-options");
  const dependentParentsEl = document.getElementById(
    "dependent-parents-options"
  );

  // --- Render Functions ---

  // Populates the list of disabilities on the left
  function renderDisabilityList() {
    disabilityListEl.innerHTML = "";
    disabilities.forEach((disability) => {
      const div = document.createElement("div");
      div.className =
        "flex items-center justify-between p-3 bg-[#1c325f] hover:bg-[#203a74] rounded-xl cursor-pointer transition-colors duration-200";
      div.dataset.disability = disability;
      div.innerHTML = `<span>${disability}</span><i class="fas fa-chevron-right text-gray-400"></i>`;
      div.addEventListener("click", () => {
        // Remove active state from previous selection
        const activeEl = document.querySelector(".active-disability");
        if (activeEl) {
          activeEl.classList.remove("active-disability", "bg-[#213e8b]");
          activeEl.querySelector("i").className =
            "fas fa-chevron-right text-gray-400";
        }
        // Add active state to current selection
        div.classList.add("active-disability", "bg-[#213e8b]");
        div.querySelector("i").className = "fas fa-check-circle text-blue-500";
        selectedDisability = disability;
      });
      disabilityListEl.appendChild(div);
    });
  }

  // Populates the grid of percentage buttons
  function renderPercentageGrid() {
    percentageGridEl.innerHTML = "";
    percentages.forEach((percent) => {
      const div = document.createElement("div");
      div.className =
        "p-3 md:p-4 bg-[#1c325f] hover:bg-[#203a74] rounded-xl flex items-center justify-center font-bold text-white transition-colors duration-200 cursor-pointer";
      div.textContent = `${percent}%`;
      div.dataset.percent = percent;
      div.addEventListener("click", () => {
        if (selectedDisability) {
          selectedRatings.push({
            disability: selectedDisability,
            percent: percent,
          });
          selectedDisability = null; // Reset selection
          const activeEl = document.querySelector(".active-disability");
          if (activeEl) {
            activeEl.classList.remove("active-disability", "bg-[#213e8b]");
            activeEl.querySelector("i").className =
              "fas fa-chevron-right text-gray-400";
          }
          updateCalculationsAndUI();
        }
      });
      percentageGridEl.appendChild(div);
    });
  }

  // Renders the selections and triggers all calculations
  function updateCalculationsAndUI() {
    selectionsListEl.innerHTML = "";
    if (selectedRatings.length === 0) {
      selectionsListEl.innerHTML = `<p class="text-gray-500 text-center py-4">No selections yet.</p>`;
    }

    // Sort ratings from highest to lowest for correct calculation
    const sortedRatings = [...selectedRatings].sort(
      (a, b) => b.percent - a.percent
    );
    let combinedRating = 0;
    let bilateralCombined = 0;

    // Simple Bilateral Check (for demonstration)
    const hasRightArm = selectedRatings.some(
      (s) => s.disability === "Right Arm"
    );
    const hasLeftArm = selectedRatings.some((s) => s.disability === "Left Arm");
    const hasRightLeg = selectedRatings.some(
      (s) => s.disability === "Right Leg"
    );
    const hasLeftLeg = selectedRatings.some((s) => s.disability === "Left Leg");

    if ((hasRightArm && hasLeftArm) || (hasRightLeg && hasLeftLeg)) {
      bilateralCombined = 8.4; // Placeholder value from the design
    }

    bilateralsEl.textContent = bilateralCombined.toFixed(1);

    // Combined Ratings Calculation
    if (sortedRatings.length > 0) {
      combinedRating = sortedRatings[0].percent;
      for (let i = 1; i < sortedRatings.length; i++) {
        const newRating = sortedRatings[i].percent;
        combinedRating =
          combinedRating + newRating * (1 - combinedRating / 100);
      }
    }

    const unroundedRating = parseFloat(combinedRating.toFixed(2));
    const roundedRating = Math.round(combinedRating / 10) * 10;

    // Update UI based on calculation
    ratingEl.textContent = `${roundedRating}%`;

    if (unroundedRating !== roundedRating) {
      roundedMessageEl.classList.remove("hidden");
      unroundedRatingEl.textContent = unroundedRating;
      roundedRatingEl.textContent = roundedRating;
    } else {
      roundedMessageEl.classList.add("hidden");
    }

    // Render selections list
    selectedRatings.forEach((selection, index) => {
      const div = document.createElement("div");
      div.className =
        "p-3 bg-[#1c325f] rounded-xl flex items-center justify-between";
      div.innerHTML = `<span>${selection.percent}% - ${selection.disability}</span><i class="fas fa-trash-alt text-red-500 cursor-pointer hover:text-red-400 transition-colors duration-200"></i>`;
      div.querySelector("i").addEventListener("click", () => {
        selectedRatings.splice(index, 1);
        updateCalculationsAndUI();
      });
      selectionsListEl.appendChild(div);
    });

    // Get dependent counts
    const childrenUnder18 = parseInt(childrenUnder18El.value);
    const childrenOver18 = parseInt(childrenOver18El.value);
    const married =
      document.querySelector('input[name="marital-status"]:checked').value ===
      "married";
    const parents =
      document.querySelector('input[name="dependent-parents"]:checked')
        .value === "yes";

    // Calculate and update monthly payment (simplified)
    let payment = paymentRates[roundedRating] || 0;
    // Add simplified dependent adjustments (not fully accurate, just for demo)
    if (married) payment += childrenUnder18 * 50 + childrenOver18 * 25;
    if (parents) payment += 100;

    monthlyPaymentEl.textContent = `$${payment.toFixed(2)}`;
  }

  // --- Event Listeners for Dependent and Marital Status ---
  childrenUnder18El.addEventListener("change", updateCalculationsAndUI);
  childrenOver18El.addEventListener("change", updateCalculationsAndUI);
  maritalStatusEl.addEventListener("change", updateCalculationsAndUI);
  dependentParentsEl.addEventListener("change", updateCalculationsAndUI);

  // Initial rendering on page load
  renderDisabilityList();
  renderPercentageGrid();
  updateCalculationsAndUI();
});
