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
        100: 3831.30,
    };
    
    var child_payment = {  // 2025 DONE 1child - standardPayment
        30: 42.02,
        40: 56.38,
        50: 70.72,
        60: 85.07,
        70: 99.43,
        80: 113.77,
        90: 128.13,
        100: 143.85,
    };
    
    var child18_payment_differ = {   // 2025 DONE childOver18 Table
        30: 102.50,
        40: 136.33,
        50: 171.18,
        60: 205,
        70: 239.85,
        80: 273.68,
        90: 308.53,
        100: 342.85,
    };
    
    var spouse_child_diff = {  // 2025 DONE 1childWithSpouse - childPayment - noAid - StandardPayment
        30: 5.13,
        40: 6.14,
        50: 7.18,
        60: 8.2,
        70: 10.25,
        80: 11.28,
        90: 12.3,
        100: 12.58,
    };
    
    var spouse_no_aid = {  // 2025 DONE withSpouse - standardPayment
        30: 63.55,
        40: 85.08,
        50: 106.60,
        60: 128.13,
        70: 148.63,
        80: 170.15,
        90: 191.68,
        100: 213.61,
    };
    
    var spouse_aid = {   // 2025 DONE withSpouse - standardPayment + spouseAid
        30: 121.98,
        40: 162.98,
        50: 213.20,
        60: 203.98,
        70: 285.98,
        80: 326.98,
        90: 367.98,
        100: 409.53,
    };
    
    var parent_payment = {  // DONE with1Parent - standardPayment
        30: 51.25,
        40: 67.65,
        50: 85.07,
        60: 102.50,
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
            case 'mental':
                return 'mental';
            case 'head':
                return 'head';
            case 'cervical / neck':
                return 'cervical';
            case 'right arm':
                return 'ra';
            case 'left arm':
                return 'la';
            case 'spine / back':
                return 'spine';
            case 'gerd/ibs':
                return 'bd';
            case 'right leg':
                return 'rl';
            case 'left leg':
                return 'll';
            case 'other':
                return 'addition';
            default:
                return 'addition';
        }
    }

    // Handle disability item clicks
    $('.select-disabilities__list-item').click(function () {
        // Remove active class from all items
        $('.select-disabilities__list-item').removeClass('select-disabilities__list-item--active');
        
        // Add active class to clicked item
        $(this).addClass('select-disabilities__list-item--active');
        
        // Store the selected disability
        selectedDisability = $(this).find('span').text();
        
        // Remove active class from percentage buttons
        $('.select-disabilities__percentage-button').removeClass('select-disabilities__percentage-button--active');
    });

    // Handle percentage button clicks
    $('.select-disabilities__percentage-button').click(function () {
        if (selectedDisability) {
            const percentage = parseInt($(this).text().replace('%', ''));
            
            // Mark the percentage button as active
            $('.select-disabilities__percentage-button').removeClass('select-disabilities__percentage-button--active');
            $(this).addClass('select-disabilities__percentage-button--active');
            
            // Add to disability rates
            const bodyPartKey = getBodyPartKey(selectedDisability);
            part_disability_rate[bodyPartKey].push(percentage);
            
            // Update the selections display
            updateSelectionsDisplay();
            
            // Calculate and update combined rating
            display_rate_payment();
            
            // Reset selected disability
            selectedDisability = null;
            $('.select-disabilities__list-item').removeClass('select-disabilities__list-item--active');
            $('.select-disabilities__percentage-button').removeClass('select-disabilities__percentage-button--active');
        }
    });

    // Function to update the selections display
    function updateSelectionsDisplay() {
        const selectionsList = $('.selections-list');
        selectionsList.empty();
        
        // Create selections from all disability rates
        Object.keys(part_disability_rate).forEach(bodyPart => {
            if (Array.isArray(part_disability_rate[bodyPart]) && part_disability_rate[bodyPart].length > 0) {
                part_disability_rate[bodyPart].forEach((percentage, index) => {
                    const disabilityName = getDisabilityName(bodyPart);
                    const selectionItem = $(`
                        <div class="selections-list__item" data-bodypart="${bodyPart}" data-index="${index}">
                            <div class="selections-list__item-result">
                                ${disabilityName} - ${percentage}%
                            </div>
                            <button class="selections-list__item-remove" data-bodypart="${bodyPart}" data-index="${index}"></button>
                        </div>
                    `);
                    
                    selectionsList.append(selectionItem);
                });
            }
        });
    }

    // Convert body part key back to disability name
    function getDisabilityName(bodyPartKey) {
        switch (bodyPartKey) {
            case 'mental': return 'Mental';
            case 'head': return 'Head';
            case 'cervical': return 'Cervical / Neck';
            case 'ra': return 'Right Arm';
            case 'la': return 'Left Arm';
            case 'spine': return 'Spine / Back';
            case 'bd': return 'GERD/IBS';
            case 'rl': return 'Right Leg';
            case 'll': return 'Left Leg';
            case 'addition': return 'Other';
            default: return 'Other';
        }
    }

    // Handle remove button clicks
    $(document).on('click', '.selections-list__item-remove', function () {
        const bodyPart = $(this).data('bodypart');
        const index = $(this).data('index');
        
        // Remove from disability rates
        part_disability_rate[bodyPart].splice(index, 1);
        
        // Update displays
        updateSelectionsDisplay();
        display_rate_payment();
    });

    // Bilateral factor calculation
    function bilateral_factor_rate() {
        let bilateral_rate = 0;
        let sum = 0;
        
        if (part_disability_rate["la"].length && part_disability_rate["ra"].length) {
            for (let i = 0; i < part_disability_rate["la"].length; i++) {
                sum += ((100 - sum) * part_disability_rate["la"][i]) / 100;
                sum = Math.round(sum);
            }
            for (let i = 0; i < part_disability_rate["ra"].length; i++) {
                sum += ((100 - sum) * part_disability_rate["ra"][i]) / 100;
                sum = Math.round(sum);
            }
        }

        if (part_disability_rate["ll"].length && part_disability_rate["rl"].length) {
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
            sum += Math.round(((100 - sum ) * part_disability_rate["bd"][i]) / 100);
        }
        for (let i = 0; i < part_disability_rate["head"].length; i++) {
            sum += Math.round(((100 - sum) * part_disability_rate["head"][i]) / 100);
        }
        for (let i = 0; i < part_disability_rate["cervical"].length; i++) {
            sum += Math.round(((100 - sum) * part_disability_rate["cervical"][i]) / 100);
        }
        for (let i = 0; i < part_disability_rate["spine"].length; i++) {
            sum += Math.round(((100 - sum) * part_disability_rate["spine"][i]) / 100);
        }
        for (let i = 0; i < part_disability_rate["mental"].length; i++) {
            sum += Math.round(((100 - sum) * part_disability_rate["mental"][i]) / 100);
        }
        for (let i = 0; i < part_disability_rate["addition"].length; i++) {
            sum += Math.round(((100 - sum) * part_disability_rate["addition"][i]) / 100);
        }

        return Math.round(sum);
    }

    // Dependency calculator
    function dependency_calculator() {
        let current_total_rate = Math.round(total_calculator() / 10) * 10;
        let dependency_sum = 0;
        
        if (current_total_rate >= 30) {
            // Children under 18
            if (part_disability_rate["children"].length && part_disability_rate["children"][0] !== 0) {
                const childCount = part_disability_rate["children"][0];
                const basePayment = child_payment[current_total_rate.toString()];
                
                if (current_total_rate === 100) {
                    dependency_sum = basePayment + 106.14 * (childCount - 1);
                } else if (current_total_rate === 90) {
                    dependency_sum = basePayment + 95.33 * (childCount - 1);
                } else if (current_total_rate === 80) {
                    dependency_sum = basePayment + 84.05 * (childCount - 1);
                } else if (current_total_rate === 70) {
                    dependency_sum = basePayment + 73.80 * (childCount - 1);
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
            if (part_disability_rate["children18"].length && part_disability_rate["children18"][0] !== 0) {
                const child18Count = part_disability_rate["children18"][0];
                const child18Payment = child18_payment_differ[current_total_rate.toString()];
                
                if (dependency_sum > 0) {
                    dependency_sum += child18Payment * child18Count;
                } else {
                    dependency_sum += child_payment[current_total_rate.toString()] + child18Payment * (child18Count - 1);
                }
            }

            // Spouse
            switch (part_disability_rate["spouse"]) {
                case 1: // Spouse with aid
                    if (dependency_sum > 0) {
                        let child_diff = spouse_child_diff[current_total_rate.toString()];
                        dependency_sum += spouse_aid[current_total_rate.toString()] + child_diff;
                    } else {
                        dependency_sum += spouse_aid[current_total_rate.toString()];
                    }
                    break;
                case 2: // Spouse without aid
                    if (dependency_sum > 0) {
                        dependency_sum += spouse_no_aid[current_total_rate.toString()] + spouse_child_diff[current_total_rate.toString()];
                    } else {
                        dependency_sum += spouse_no_aid[current_total_rate.toString()];
                    }
                    break;
            }
            
            // Parents
            if (part_disability_rate["parent"]) {
                dependency_sum += part_disability_rate["parent"] * parent_payment[current_total_rate.toString()];
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

        let total_payment = standard_payment_list[disability_rate.toString()] + dependency_calculator();
        
        // Add SMC-K if selected
        var smcOptionRadio = document.querySelector('input[name="smc-k-amount"]:checked');
        if (smcOptionRadio && smcOptionRadio.id === 'smc-k-amount-yes') {
            total_payment += 136.06;
        }

        total_payment = (Math.round(total_payment * 100) / 100).toFixed(2);

        // Update bilateral factor
        $('.combined__result:first .combined__number').text(bilateral_rate.toFixed(1));
        
        // Update disability rating
        $('.combined__result:nth-child(2) .combined__number').text(`${disability_rate}%`);
        
        // Update notice text
        if (calculated_rate > 0) {
            const roundDirection = calculated_rate % 10 < 5 ? 'down' : 'up';
            $('.combined__notice-text').html(`
                <span>Your Combined Disability Percentage is ${calculated_rate}%</span>
                <span>which the VA rounds ${roundDirection} to ${disability_rate}%</span>
            `);
        } else {
            $('.combined__notice-text').html(`
                <span>Add disabilities to calculate your rating</span>
                <span></span>
            `);
        }
        
        // Update monthly payment
        $('.combined__monthly .combined__number').text(`$${total_payment}`);
    }

    // Handle form inputs for dependents
    function setupDependentHandlers() {
        // Children under 18
        $('#children-under-18').change(function() {
            part_disability_rate["children"] = [parseInt($(this).val())];
            display_rate_payment();
        });
        
        // Children over 18
        $('#children-over-18').change(function() {
            part_disability_rate["children18"] = [parseInt($(this).val())];
            display_rate_payment();
        });
        
        // Marital status
        $('input[name="marital-status"]').change(function() {
            if ($(this).attr('id') === 'marital-status-married') {
                // Check spouse aid status
                const spouseAid = $('input[name="spouse-aid"]:checked').attr('id');
                part_disability_rate["spouse"] = spouseAid === 'spouse-aid-yes' ? 1 : 2;
            } else {
                part_disability_rate["spouse"] = 0;
            }
            display_rate_payment();
        });
        
        // Spouse aid
        $('input[name="spouse-aid"]').change(function() {
            if ($('#marital-status-married').is(':checked')) {
                part_disability_rate["spouse"] = $(this).attr('id') === 'spouse-aid-yes' ? 1 : 2;
                display_rate_payment();
            }
        });
        
        // Dependent parents
        $('input[name="d-parent"]').change(function() {
            if ($(this).attr('id') === 'd-parent-yes') {
                const parentCount = parseInt($('#parent-count').val()) || 1;
                part_disability_rate["parent"] = parentCount;
            } else {
                part_disability_rate["parent"] = 0;
            }
            display_rate_payment();
        });
        
        // Parent count
        $('#parent-count').change(function() {
            if ($('#d-parent-yes').is(':checked')) {
                part_disability_rate["parent"] = parseInt($(this).val());
                display_rate_payment();
            }
        });
        
        // SMC-K
        $('input[name="smc-k-amount"]').change(function() {
            display_rate_payment();
        });
    }

    // Initialize
    setupDependentHandlers();
    display_rate_payment();
});