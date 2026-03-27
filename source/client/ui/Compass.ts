/**
 * @author Carsten Schnober <c.schnober@esciencecenter.nl>
 * @license Apache-2.0
 */

import CustomElement, { customElement, html, property } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-compass")
export default class Compass extends CustomElement {
    readonly BASE_SIZE = 80;
    readonly MIN_SIZE = 40;

    @property({ type: Number })
    size = this.BASE_SIZE; // compass size in pixels

    @property({ type: Number })
    cameraRotation = 0; // (0 = North, clockwise positive)

    protected static readonly NORTH_DIRECTION = 0; // degrees (0 = up, 90 = right, 180 = down, 270 = left)

    protected firstConnected() {
        super.firstConnected();
        this.classList.add("sv-compass");
    }

    protected connected() {
        super.connected();
        this.onResize();
        window.addEventListener("resize", this.onResize);
    }

    protected disconnected() {
        window.removeEventListener("resize", this.onResize);
        super.disconnected();
    }

    protected onResize = () => {
        const denominator = 900;

        const windowSize = Math.min(window.innerWidth, window.innerHeight);
        const scale = windowSize >= denominator ? 1 : windowSize / denominator;
        const desired = Math.round(this.BASE_SIZE * scale);
        const newSize = Math.max(this.MIN_SIZE, Math.min(this.BASE_SIZE, desired));
        if (newSize !== this.size) {
            this.size = newSize;
        }
    };

    protected render() {
        const size = this.size;
        const halfSize = size / 2;

        const compassRotation = -this.cameraRotation + Compass.NORTH_DIRECTION;

        return html`
            <div class="sv-compass-container" style="width: ${size}px; height: ${size}px;">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <circle cx="${halfSize}" cy="${halfSize}" r="${halfSize - 2}" fill="rgba(255, 255, 255, 0.9)" stroke="rgba(0, 0, 0, 0.3)" stroke-width="2" />
                    
                    <g transform="rotate(${compassRotation} ${halfSize} ${halfSize})">
                        <!-- North -->
                        <line x1="${halfSize}" y1="${halfSize * 0.3}" x2="${halfSize}" y2="${halfSize * 0.5}" stroke="#e74c3c" stroke-width="3" stroke-linecap="round" />
                        <text x="${halfSize}" y="${halfSize * 0.25}" text-anchor="middle" font-size="14" font-weight="bold" fill="#e74c3c" >N</text>
                        
                        <!-- East -->
                        <line x1="${halfSize * 1.5}" y1="${halfSize}" x2="${halfSize * 1.7}" y2="${halfSize}" stroke="#34495e" stroke-width="2" stroke-linecap="round" />
                        <text x="${halfSize * 1.75}" y="${halfSize + 5}" text-anchor="middle" font-size="12" fill="#34495e" >E</text>
                        
                        <!-- South -->
                        <line x1="${halfSize}" y1="${halfSize * 1.5}" x2="${halfSize}" y2="${halfSize * 1.7}" stroke="#34495e" stroke-width="2" stroke-linecap="round" />
                        <text x="${halfSize}" y="${halfSize * 1.8}" text-anchor="middle" font-size="12" fill="#34495e" >S</text>
                        
                        <!-- West -->
                        <line x1="${halfSize * 0.3}" y1="${halfSize}" x2="${halfSize * 0.5}" y2="${halfSize}" stroke="#34495e" stroke-width="2" stroke-linecap="round" />
                        <text x="${halfSize * 0.25}" y="${halfSize + 5}" text-anchor="middle" font-size="12" fill="#34495e" >W</text>
                        
                        <!-- Needle -->
                        <path d="M ${halfSize} ${halfSize * 0.4} L ${halfSize - 8} ${halfSize} L ${halfSize} ${halfSize - 5} L ${halfSize + 8} ${halfSize} Z" fill="#e74c3c" stroke="#c0392b" stroke-width="1" />
                    </g>
                    
                    <circle cx="${halfSize}" cy="${halfSize}" r="3" fill="#34495e" />
                </svg>
            </div>
        `;
    }
}
