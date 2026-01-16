/**
 * Generates a deterministic color based on a string input.
 * Returns an object with CSS variable-ready values.
 */
export const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate HSL
    // Hue: 0-360 based on hash
    const h = Math.abs(hash) % 360;
    // Saturation: Fixed high for vibrancy (e.g. 70-80%)
    const s = 70;
    // Lightness: Fixed mid-range for readability against dark bg (e.g. 60%)
    const l = 60;

    return {
        // Full color for text/border
        color: `hsl(${h}, ${s}%, ${l}%)`,
        // RGB components roughly approximated (hard to do purely with HSL in CSS without conversions, 
        // but for transparency we can use hsla)
        // Let's return a background color string with opacity
        bg: `hsla(${h}, ${s}%, ${l}%, 0.1)`,
        border: `hsl(${h}, ${s}%, ${l}%)`
    };
};
