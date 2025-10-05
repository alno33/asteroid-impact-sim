document.addEventListener("DOMContentLoaded", () => {
    const kineticBtn = document.getElementById("kineticBtn");
    const gravityBtn = document.getElementById("gravityBtn");

    const impactEnergyEl = document.getElementById("impactEnergy");
    const craterRadiusEl = document.getElementById("craterRadius");
    const severityEl = document.getElementById("severity");
    const affectedAreaEl = document.getElementById("affectedArea"); // ← add this

    // Store original values for recalculation
    const originalEnergy = parseFloat(IMPACT_DATA.impact_energy);
    const originalCrater = parseFloat(IMPACT_DATA.crater_radius);
    const originalSeverity = IMPACT_DATA.severity;

    function applyDefense(type) {
        let reducedEnergy = originalEnergy;
        let reducedCrater = originalCrater;
        let newSeverity = originalSeverity;

        //calculating all impacts- generated with chatGPT

        if (type === "kinetic") {
            reducedEnergy *= 0.7;    // 30% reduction
            reducedCrater *= 0.8;    // 20% reduction
        } else if (type === "gravity") {
            reducedEnergy *= 0.85;   // 15% reduction
            reducedCrater *= 0.9;    // 10% reduction
        }

        // Update severity based on new crater radius
        if (reducedCrater > 10) newSeverity = "High";
        else if (reducedCrater > 5) newSeverity = "Medium";
        else newSeverity = "Low";

        // Calculate affected area (πr²)
        const affectedArea = Math.PI * Math.pow(reducedCrater, 2);

        // Update HTML
        impactEnergyEl.textContent = `Estimated Impact Energy: ${reducedEnergy.toFixed(2)} units`;
        craterRadiusEl.textContent = `Estimated Crater Radius: ${reducedCrater.toFixed(2)} km`;
        affectedAreaEl.textContent = `Estimated Affected Area: ${affectedArea.toFixed(2)} km²`; // ← fixed
        severityEl.textContent = `Severity: ${newSeverity}`;
    }

    kineticBtn.addEventListener("click", () => applyDefense("kinetic"));
    gravityBtn.addEventListener("click", () => applyDefense("gravity"));
});
