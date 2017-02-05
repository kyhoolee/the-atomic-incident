module.exports = Color;

var PColor = Phaser.Color;

/**
 * Light-weight RGBA color class based on Phaser.Color utils. Channels are in
 * the range 0 - 255.
 * 
 * @param {r,g,b,a|integer color|hex color string|CSS color string} arguments If
 * 3 or more arguments are passed, they are interpreted as: r, g, b, a. If 1 
 * argument is passed, it is interpreted as an int, hex or css color 
 * representation.
 */
function Color(color) {
    if (arguments.length >= 3) {
        this.r = arguments[0] || 0;
        this.g = arguments[1] || 0;
        this.b = arguments[2] || 0;
        this.a = arguments[3] !== undefined ? arguments[3] : 255;
    } else {
        var colorObject = PColor.valueToColor(color);
        this.r = colorObject.r;
        this.g = colorObject.g;
        this.b = colorObject.b;
        this.a = colorObject.a * 255;
    }
}

/**
 * Get a 32-bit integer representation of the color which includes alpha
 * @returns {Number} 32-bit integer, e.g. 0xFF00FFFF
 */
Color.prototype.getRgbaColorInt = function () {
    return PColor.getColor32(this.a, this.r, this.g, this.b);
};

/**
 * Get a 24-bit integer representation of the color which excludes alpha
 * @returns {Number} 24-bit integer, e.g. 0xFF00FF
 */
Color.prototype.getRgbColorInt = function () {
    return PColor.getColor(this.r, this.g, this.b);
};

/**
 * Get an RGBA CSS string of the color
 * @returns {String} RGBA CSS String "rgba(0, 0, 255, 1)"
 */
Color.prototype.getWebColor = function () {
    return PColor.getWebRGB(this);
};

/**
 * Return deep copy of the color
 * @returns {Color}
 */
Color.prototype.clone = function () {
    return new Color(this.r, this.g, this.b, this.a);
};