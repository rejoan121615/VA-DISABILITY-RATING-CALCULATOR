$(document).ready(function () {
  let selectedDisability = null;

  // VA Calculator Data (2025 rates)
  var standard_payment_list = {
    0: 0,
    10: 175.51,
    20: 346.95,
    30: 537.42,
    40: 774.16,
    50: 1102.04,
    60: 1395.93,
    70: 1759.18,
    80: 2044.89,
    90: 2297.95,
    100: 3831.3,
  };

  var child_payment = {
    // 2025 DONE 1child - standardPayment
    30: 42.02,
    40: 56.38,
    50: 70.72,
    60: 85.07,
    70: 99.43,
    80: 113.77,
    90: 128.13,
    100: 143.85,
  };

  var child18_payment_differ = {
    // 2025 DONE childOver18 Table
    30: 102.5,
    40: 136.33,
    50: 171.18,
    60: 205,
    70: 239.85,
    80: 273.68,
    90: 308.53,
    100: 342.85,
  };

  var spouse_child_diff = {
    // 2025 DONE 1childWithSpouse - childPayment - noAid - StandardPayment
    30: 5.13,
    40: 6.14,
    50: 7.18,
    60: 8.2,
    70: 10.25,
    80: 11.28,
    90: 12.3,
    100: 12.58,
  };

  var spouse_no_aid = {
    // 2025 DONE withSpouse - standardPayment
    30: 63.55,
    40: 85.08,
    50: 106.6,
    60: 128.13,
    70: 148.63,
    80: 170.15,
    90: 191.68,
    100: 213.61,
  };

  var spouse_aid = {
    // 2025 DONE withSpouse - standardPayment + spouseAid
    30: 121.98,
    40: 162.98,
    50: 213.2,
    60: 203.98,
    70: 285.98,
    80: 326.98,
    90: 367.98,
    100: 409.53,
  };

  var parent_payment = {
    // DONE with1Parent - standardPayment
    30: 51.25,
    40: 67.65,
    50: 85.07,
    60: 102.5,
    70: 119.92,
    80: 136.32,
    90: 153.75,
    100: 171.44,
  };

  var part_disability_rate = {
    bd: [],
    la: [],
    ra: [],
    ll: [],
    rl: [],
    head: [],
    cervical: [],
    spine: [],
    mental: [],
    addition: [],
    spouse: 0,
    children: [],
    children18: [],
    parent: [],
  };

  // Disability name to body part mapping
  function getBodyPartKey(disabilityName) {
    switch (disabilityName.toLowerCase()) {
      case "mental":
        return "mental";
      case "head":
        return "head";
      case "cervical / neck":
        return "cervical";
      case "right arm":
        return "ra";
      case "left arm":
        return "la";
      case "spine / back":
        return "spine";
      case "gerd/ibs":
        return "bd";
      case "right leg":
        return "rl";
      case "left leg":
        return "ll";
      case "other":
        return "addition";
      default:
        return "addition";
    }
  }

  // Handle disability item clicks
  $(".disab-item").click(function () {
    // Remove active class from all items
    // $('.disab-item').removeClass('active');

    // Add active class to clicked item
    // $(this).addClass("active");

    // Store the selected disability
    // selectedDisability = $(this).find("span").text();

    // Remove active class from percentage buttons
    // $('.percent-btn').removeClass('active');

    // Prevent selecting if already selected (except for "Other" which can be selected up to 3 times)
    const bodyPartKey = getBodyPartKey($(this).find("span").text());
    const disabilityName = $(this).find("span").text();
    
    if (
      selectedDisability === null &&
      Array.isArray(part_disability_rate[bodyPartKey]) &&
      (part_disability_rate[bodyPartKey].length === 0 || 
       (disabilityName.toLowerCase() === "other" && part_disability_rate[bodyPartKey].length < 3))
    ) {
      $(this).addClass("active");
      // Store the selected disability
      selectedDisability = disabilityName;
    }
  });

  // Handle percentage button clicks
  $(".percent-btn").click(function () {
    if (selectedDisability) {
      const percentage = parseInt($(this).text().replace("%", ""));

      // Mark the percentage button as active
      // $('.percent-btn').removeClass('active');
      // $(this).addClass('active');

      // Add to disability rates
      const bodyPartKey = getBodyPartKey(selectedDisability);
      part_disability_rate[bodyPartKey].push(percentage);

      // Update the selections display
      updateSelectionsDisplay();

      //   update disability class
      updateDisabilitiesDisplay('select', selectedDisability);
      updateSelectBoxesDisplay('select', selectedDisability);

      // Calculate and update combined rating
      display_rate_payment();

      // Reset selected disability
      selectedDisability = null;
      // $('.disab-item').removeClass('active');
      $(".percent-btn").removeClass("active");
    }
  });

  // Function to update the selections display
  function updateSelectionsDisplay() {
    const selectionsList = $(".select-list");
    selectionsList.empty();

    // Only process actual disability body parts (exclude spouse, children, children18, parent)
    const disabilityBodyParts = ['bd', 'la', 'ra', 'll', 'rl', 'head', 'cervical', 'spine', 'mental', 'addition'];
    
    let hasSelections = false;
    
    disabilityBodyParts.forEach((bodyPart) => {
      if (
        Array.isArray(part_disability_rate[bodyPart]) &&
        part_disability_rate[bodyPart].length > 0
      ) {
        hasSelections = true;
        part_disability_rate[bodyPart].forEach((percentage, index) => {
          const disabilityName = getDisabilityName(bodyPart);
          const selectionItem = $(`
                        <div class="select-item" data-bodypart="${bodyPart}" data-index="${index}">
                            <div class="select-result">
                                ${percentage}% - ${disabilityName}
                            </div>
                            <button class="remove-btn" data-bodypart="${bodyPart}" data-index="${index}"></button>
                        </div>
                    `);

          selectionsList.append(selectionItem);
        });
      }
    });

    // If no selections, show placeholder
    if (!hasSelections) {
      const placeholderItem = $(`
        <div class="select-item no-select-item">
          <div class="select-result">
            Select disabilities and percentages
          </div>
        </div>
      `);
      selectionsList.append(placeholderItem);
    }
  }

  // Function to update the disabilities display
  function updateDisabilitiesDisplay(type, text) {
    const selectionsList = $(".disab-list");
    if (type === "select") {
      selectionsList.find(".disab-item").each(function () {
        const itemText = $(this).find("span").text().trim();
        if (itemText.toLowerCase() === text.toLowerCase()) {
          // For "Other", mark as selected only when we reach 3 items
          if (text.toLowerCase() !== "other") {
            $(this).removeClass("active").addClass("selected");
          } else {
            $(this).removeClass("active");
            // Check if "Other" has reached the 3-item limit
            if (part_disability_rate.addition.length >= 3) {
              $(this).addClass("selected");
            }
          }
        }
      });
    } else if (type === "remove") {
      selectionsList.find(".disab-item").each(function () {
        const itemText = $(this).find("span").text().trim();
        // Use getDisabilityName to compare the body part key with the displayed name
        const disabilityName = getDisabilityName(text);
        if (itemText.toLowerCase() === disabilityName.toLowerCase()) {
          // For "Other", only remove "selected" class if we go below 3 items
          if (disabilityName.toLowerCase() !== "other") {
            $(this)
              .removeClass("selected")
              .removeClass("active");
          } else {
            // For "Other", remove selected class if count drops below 3, or if no items left
            if (part_disability_rate.addition.length < 3) {
              $(this).removeClass("selected");
            }
            if (part_disability_rate.addition.length === 0) {
              $(this).removeClass("active");
            }
          }
        }
      });
    }
  }

  // Function to update the select boxes display (disable/enable options)
  function updateSelectBoxesDisplay(type, text) {
    if (type === "select") {
      // Find the option in disability select and disable it
      $("#disability-select option").each(function () {
        const optionText = $(this).val();
        if (optionText && optionText.toLowerCase() === text.toLowerCase()) {
          // For "Other", disable only when we reach 3 items
          if (text.toLowerCase() !== "other") {
            $(this).prop("disabled", true);
          } else {
            // Check if "Other" has reached the 3-item limit
            if (part_disability_rate.addition.length >= 3) {
              $(this).prop("disabled", true);
            }
          }
        }
      });
    } else if (type === "remove") {
      // Find the option in disability select and enable it
      const disabilityName = getDisabilityName(text);
      $("#disability-select option").each(function () {
        const optionText = $(this).val();
        if (optionText && optionText.toLowerCase() === disabilityName.toLowerCase()) {
          // For "Other", enable only if we go below 3 items
          if (disabilityName.toLowerCase() !== "other") {
            $(this).prop("disabled", false);
          } else {
            // For "Other", enable if count drops below 3
            if (part_disability_rate.addition.length < 3) {
              $(this).prop("disabled", false);
            }
          }
        }
      });
    }
  }

  // Convert body part key back to disability name
  function getDisabilityName(bodyPartKey) {
    switch (bodyPartKey) {
      case "mental":
        return "Mental";
      case "head":
        return "Head";
      case "cervical":
        return "Cervical / Neck";
      case "ra":
        return "Right Arm";
      case "la":
        return "Left Arm";
      case "spine":
        return "Spine / Back";
      case "bd":
        return "GERD/IBS";
      case "rl":
        return "Right Leg";
      case "ll":
        return "Left Leg";
      case "addition":
        return "Other";
      default:
        return "Other";
    }
  }

  // Handle remove button clicks
  $(document).on("click", ".remove-btn", function () {
    const bodyPart = $(this).data("bodypart");
    const index = $(this).data("index");

    // Remove from disability rates
    part_disability_rate[bodyPart].splice(index, 1);

    // Update displays
    updateSelectionsDisplay();
    updateDisabilitiesDisplay('remove', bodyPart);
    updateSelectBoxesDisplay('remove', bodyPart);
    display_rate_payment();
  });

  // Bilateral factor calculation
  function bilateral_factor_rate() {
    let bilateral_rate = 0;
    let sum = 0;

    if (
      part_disability_rate["la"].length &&
      part_disability_rate["ra"].length
    ) {
      for (let i = 0; i < part_disability_rate["la"].length; i++) {
        sum += ((100 - sum) * part_disability_rate["la"][i]) / 100;
        sum = Math.round(sum);
      }
      for (let i = 0; i < part_disability_rate["ra"].length; i++) {
        sum += ((100 - sum) * part_disability_rate["ra"][i]) / 100;
        sum = Math.round(sum);
      }
    }

    if (
      part_disability_rate["ll"].length &&
      part_disability_rate["rl"].length
    ) {
      for (let i = 0; i < part_disability_rate["ll"].length; i++) {
        sum += ((100 - sum) * part_disability_rate["ll"][i]) / 100;
        sum = Math.round(sum);
      }
      for (let i = 0; i < part_disability_rate["rl"].length; i++) {
        sum += ((100 - sum) * part_disability_rate["rl"][i]) / 100;
        sum = Math.round(sum);
      }
    }

    bilateral_rate = Math.round(sum);
    if (bilateral_rate) return bilateral_rate / 10;
    else return 0;
  }

  // Total calculator using VA formula
  function total_calculator() {
    let sum = 0;

    for (let i = 0; i < part_disability_rate["la"].length; i++) {
      sum += Math.round(((100 - sum) * part_disability_rate["la"][i]) / 100);
    }
    for (let i = 0; i < part_disability_rate["ra"].length; i++) {
      sum += Math.round(((100 - sum) * part_disability_rate["ra"][i]) / 100);
    }
    for (let i = 0; i < part_disability_rate["ll"].length; i++) {
      sum += Math.round(((100 - sum) * part_disability_rate["ll"][i]) / 100);
    }
    for (let i = 0; i < part_disability_rate["rl"].length; i++) {
      sum += Math.round(((100 - sum) * part_disability_rate["rl"][i]) / 100);
    }

    sum += bilateral_factor_rate(sum);

    for (let i = 0; i < part_disability_rate["bd"].length; i++) {
      sum += Math.round(((100 - sum) * part_disability_rate["bd"][i]) / 100);
    }
    for (let i = 0; i < part_disability_rate["head"].length; i++) {
      sum += Math.round(((100 - sum) * part_disability_rate["head"][i]) / 100);
    }
    for (let i = 0; i < part_disability_rate["cervical"].length; i++) {
      sum += Math.round(
        ((100 - sum) * part_disability_rate["cervical"][i]) / 100
      );
    }
    for (let i = 0; i < part_disability_rate["spine"].length; i++) {
      sum += Math.round(((100 - sum) * part_disability_rate["spine"][i]) / 100);
    }
    for (let i = 0; i < part_disability_rate["mental"].length; i++) {
      sum += Math.round(
        ((100 - sum) * part_disability_rate["mental"][i]) / 100
      );
    }
    for (let i = 0; i < part_disability_rate["addition"].length; i++) {
      sum += Math.round(
        ((100 - sum) * part_disability_rate["addition"][i]) / 100
      );
    }

    return Math.round(sum);
  }

  // Dependency calculator
  function dependency_calculator() {
    let current_total_rate = Math.round(total_calculator() / 10) * 10;
    let dependency_sum = 0;

    if (current_total_rate >= 30) {
      // Children under 18
      if (
        part_disability_rate["children"].length &&
        part_disability_rate["children"][0] !== 0
      ) {
        const childCount = part_disability_rate["children"][0];
        const basePayment = child_payment[current_total_rate.toString()];

        if (current_total_rate === 100) {
          dependency_sum = basePayment + 106.14 * (childCount - 1);
        } else if (current_total_rate === 90) {
          dependency_sum = basePayment + 95.33 * (childCount - 1);
        } else if (current_total_rate === 80) {
          dependency_sum = basePayment + 84.05 * (childCount - 1);
        } else if (current_total_rate === 70) {
          dependency_sum = basePayment + 73.8 * (childCount - 1);
        } else if (current_total_rate === 60) {
          dependency_sum = basePayment + 63.55 * (childCount - 1);
        } else if (current_total_rate === 50) {
          dependency_sum = basePayment + 52.28 * (childCount - 1);
        } else if (current_total_rate === 40) {
          dependency_sum = basePayment + 42.03 * (childCount - 1);
        } else if (current_total_rate === 30) {
          dependency_sum = basePayment + 31.78 * (childCount - 1);
        }
      }

      // Children over 18
      if (
        part_disability_rate["children18"].length &&
        part_disability_rate["children18"][0] !== 0
      ) {
        const child18Count = part_disability_rate["children18"][0];
        const child18Payment =
          child18_payment_differ[current_total_rate.toString()];

        if (dependency_sum > 0) {
          dependency_sum += child18Payment * child18Count;
        } else {
          dependency_sum +=
            child_payment[current_total_rate.toString()] +
            child18Payment * (child18Count - 1);
        }
      }

      // Spouse
      switch (part_disability_rate["spouse"]) {
        case 1: // Spouse with aid
          if (dependency_sum > 0) {
            let child_diff = spouse_child_diff[current_total_rate.toString()];
            dependency_sum +=
              spouse_aid[current_total_rate.toString()] + child_diff;
          } else {
            dependency_sum += spouse_aid[current_total_rate.toString()];
          }
          break;
        case 2: // Spouse without aid
          if (dependency_sum > 0) {
            dependency_sum +=
              spouse_no_aid[current_total_rate.toString()] +
              spouse_child_diff[current_total_rate.toString()];
          } else {
            dependency_sum += spouse_no_aid[current_total_rate.toString()];
          }
          break;
      }

      // Parents
      if (part_disability_rate["parent"]) {
        dependency_sum +=
          part_disability_rate["parent"] *
          parent_payment[current_total_rate.toString()];
      }
    }

    return dependency_sum;
  }

  // Main display function
  function display_rate_payment() {
    let bilateral_rate = bilateral_factor_rate();
    let calculated_rate = Math.round(total_calculator());
    if (calculated_rate > 100) calculated_rate = 100;
    let disability_rate = Math.round(calculated_rate / 10) * 10;

    let total_payment =
      standard_payment_list[disability_rate.toString()] +
      dependency_calculator();

    // Add SMC-K if selected
    var smcOptionRadio = document.querySelector(
      'input[name="smc-k-amount"]:checked'
    );
    if (smcOptionRadio && smcOptionRadio.id === "smc-k-amount-yes") {
      total_payment += 136.06;
    }

    total_payment = (Math.round(total_payment * 100) / 100).toFixed(2);

    // Update bilateral factor
    $(".combined .result-card:first h2").text(
      bilateral_rate.toFixed(1)
    );

    // Update disability rating
    $(".combined .result-card:nth-child(2) h1").text(
      `${disability_rate}%`
    );

    // Update notice text
    if (calculated_rate > 0) {
      const roundDirection = calculated_rate % 10 < 5 ? "down" : "up";
      $(".combined .notice-text").html(`
                <span>Your Combined Disability Percentage is ${calculated_rate}%</span>
                <span>which the VA rounds ${roundDirection} to ${disability_rate}%</span>
            `);
    } else {
      $(".combined .notice-text").html(`
                <span>Add disabilities to calculate your rating</span>
                <span></span>
            `);
    }

    // Update monthly payment
    $(".combined .monthly h1").text(`$${total_payment}`);
  }

  // Handle form inputs for dependents
  function setupDependentHandlers() {
    // Children under 18
    $("#children-under-18").change(function () {
      part_disability_rate["children"] = [parseInt($(this).val())];
      display_rate_payment();
    });

    // Children over 18
    $("#children-over-18").change(function () {
      part_disability_rate["children18"] = [parseInt($(this).val())];
      display_rate_payment();
    });

    // Marital status
    $('input[name="marital-status"]').change(function () {
      if ($(this).attr("id") === "marital-status-married") {
        // Show spouse aid section
        $('.spouse').show();
        // Check spouse aid status
        const spouseAid = $('input[name="spouse-aid"]:checked').attr("id");
        part_disability_rate["spouse"] = spouseAid === "spouse-aid-yes" ? 1 : 2;
      } else {
        // Hide spouse aid section and reset spouse value
        $('.spouse').hide();
        part_disability_rate["spouse"] = 0;
      }
      display_rate_payment();
    });

    // Spouse aid
    $('input[name="spouse-aid"]').change(function () {
      if ($("#marital-status-married").is(":checked")) {
        part_disability_rate["spouse"] =
          $(this).attr("id") === "spouse-aid-yes" ? 1 : 2;
        display_rate_payment();
      }
    });

    // Dependent parents
    $('input[name="d-parent"]').change(function () {
      if ($(this).attr("id") === "d-parent-yes") {
        // Show parent count section
        $(".parent-count").show();
        const parentCount = parseInt($("#parent-count").val()) || 1;
        part_disability_rate["parent"] = parentCount;
      } else {
        // Hide parent count section and reset value
        $(".parent-count").hide();
        part_disability_rate["parent"] = 0;
      }
      display_rate_payment();
    });

    // Parent count
    $("#parent-count").change(function () {
      if ($("#d-parent-yes").is(":checked")) {
        part_disability_rate["parent"] = parseInt($(this).val());
        display_rate_payment();
      }
    });

    // SMC-K
    $('input[name="smc-k-amount"]').change(function () {
      display_rate_payment();
    });
  }

  // Handle select boxes for disability and percentage
  function setupSelectBoxHandlers() {
    let selectedDisabilityFromSelect = null;
    let selectedPercentageFromSelect = null;

    // Handle disability select change
    $("#disability-select").change(function() {
      const selectedValue = $(this).val();
      if (selectedValue && selectedValue !== "Disabilities") {
        selectedDisabilityFromSelect = selectedValue;
        checkAndAddSelection();
      }
    });

    // Handle percentage select change
    $("#percentage-select").change(function() {
      const selectedValue = $(this).val();
      if (selectedValue && selectedValue !== "Percentage") {
        selectedPercentageFromSelect = parseInt(selectedValue.replace("%", ""));
        checkAndAddSelection();
      }
    });

    // Function to check if both disability and percentage are selected, then add them
    function checkAndAddSelection() {
      if (selectedDisabilityFromSelect && selectedPercentageFromSelect) {
        // Check if this disability can be added (not already selected, except for "Other" up to 3 times)
        const bodyPartKey = getBodyPartKey(selectedDisabilityFromSelect);
        
        if (Array.isArray(part_disability_rate[bodyPartKey]) && 
            (part_disability_rate[bodyPartKey].length === 0 || 
             (selectedDisabilityFromSelect.toLowerCase() === "other" && part_disability_rate[bodyPartKey].length < 3))) {
          
          // Add to disability rates
          part_disability_rate[bodyPartKey].push(selectedPercentageFromSelect);

          // Update displays
          updateSelectionsDisplay();
          updateDisabilitiesDisplay('select', selectedDisabilityFromSelect);
          updateSelectBoxesDisplay('select', selectedDisabilityFromSelect);
          display_rate_payment();

          // Reset select boxes
          $("#disability-select").val("Disabilities");
          $("#percentage-select").val("Percentage");
          selectedDisabilityFromSelect = null;
          selectedPercentageFromSelect = null;
        } else {
          // Reset select boxes when disability is already selected
          $("#disability-select").val("Disabilities");
          $("#percentage-select").val("Percentage");
          selectedDisabilityFromSelect = null;
          selectedPercentageFromSelect = null;
        }
      }
    }
  }

  $("#schedule-btn").click(function () {
    console.log('selected details:', part_disability_rate);
  })


  // Initialize
  setupDependentHandlers();
  setupSelectBoxHandlers();
  
  // Set initial state - hide spouse aid section since "Single" is checked by default
  $('.spouse').hide();
  
  // Set initial state - hide parent count section since "No" is checked by default
  $(".parent-count").hide();
  
  // Initialize displays
  updateSelectionsDisplay();
  display_rate_payment();
});
