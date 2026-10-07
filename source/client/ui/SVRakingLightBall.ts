/**
 * Funded by the Netherlands eScience Center in the context of the
 * [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
 *
 * @author Carsten Schnober <c.schnober@esciencecenter.nl>
 */

import Property from "@ff/graph/Property";
import CustomElement, {
  customElement,
  html,
  property,
  PropertyValues,
} from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

/**
 * Trackball widget for controlling the direction of a raking light.
 */
@customElement("sv-raking-light-ball")
export default class SVRakingLightBall extends CustomElement {
  @property({ attribute: false })
  azimuthProperty: Property = null; // azimuth angle in degrees

  @property({ attribute: false })
  elevationProperty: Property = null; // elevation angle in degrees

  @property({ attribute: false })
  colorProperty: Property = null;

  @property({ type: Number })
  diameter: number = 192; // diameter in CSS pixels

  private _dragging = false;

  protected firstConnected() {
    this.classList.add("sv-raking-light-ball");
  }

  protected update(changedProperties: PropertyValues) {
    for (const key of [
      "azimuthProperty",
      "elevationProperty",
      "colorProperty",
    ] as const) {
      if (changedProperties.has(key)) {
        const prev = changedProperties.get(key) as Property | null;
        if (prev) prev.off("value", this.onUpdate, this);
        if (this[key]) (this[key] as Property).on("value", this.onUpdate, this);
      }
    }
    super.update(changedProperties);
  }

  protected disconnected() {
    if (this.azimuthProperty)
      this.azimuthProperty.off("value", this.onUpdate, this);
    if (this.elevationProperty)
      this.elevationProperty.off("value", this.onUpdate, this);
    if (this.colorProperty)
      this.colorProperty.off("value", this.onUpdate, this);
  }

  protected render() {
    return html`<canvas
      width="${this.diameter}"
      height="${this.diameter}"
      style="width:${this.diameter}px;height:${this
        .diameter}px;cursor:crosshair;touch-action:none;display:block;"
      @pointerdown=${this._onPointerDown}
      @pointermove=${this._onPointerMove}
      @pointerup=${this._onPointerUp}
      @pointercancel=${this._onPointerUp}
    ></canvas>`;
  }

  protected updated() {
    this._draw();
  }

  // -------------------------------------------------------------------
  // Drawing

  private _draw() {
    const canvas = this.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dia = this.diameter;
    const cx = dia / 2;
    const cy = dia / 2;
    const radius = cx - 2;

    ctx.clearRect(0, 0, dia, dia);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    const bg = ctx.createRadialGradient(
      cx * 0.85,
      cy * 0.75,
      0,
      cx,
      cy,
      radius,
    );
    bg.addColorStop(0, "#2e2c00");
    bg.addColorStop(0.5, "#181600");
    bg.addColorStop(1, "#090800");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, dia, dia);

    // --- Convert angles → canvas position ---
    const azimuth = ((this.azimuthProperty?.value ?? 0) * Math.PI) / 180;
    const elevation = ((this.elevationProperty?.value ?? 15) * Math.PI) / 180;

    const distance = Math.cos(elevation) * radius;
    const spotX = cx + Math.sin(azimuth) * distance;
    const spotY = cy - Math.cos(azimuth) * distance; // screen Y inverted

    const lightColor: number[] = this.colorProperty?.value ?? [1, 1, 0.2];
    const cr = Math.round(Math.min(lightColor[0], 1) * 255);
    const cg = Math.round(Math.min(lightColor[1], 1) * 255);
    const cb = Math.round(Math.min(lightColor[2] ?? 0, 1) * 255);

    const ambientR = radius * 1.4;
    const ambient = ctx.createRadialGradient(
      spotX,
      spotY,
      0,
      spotX,
      spotY,
      ambientR,
    );
    ambient.addColorStop(0, `rgba(${cr},${cg},${cb},0.25)`);
    ambient.addColorStop(
      0.5,
      `rgba(${Math.round(cr * 0.4)},${Math.round(cg * 0.4)},0,0.12)`,
    );
    ambient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, dia, dia);

    // --- Specular highlight: bright spot ---
    const glowRadius = radius * 0.38;
    const glow = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, glowRadius);
    glow.addColorStop(0, `rgba(255,255,255,1.0)`);
    glow.addColorStop(0.12, `rgba(${cr},${cg},${cb},1.0)`);
    glow.addColorStop(
      0.45,
      `rgba(${Math.round(cr * 0.7)},${Math.round(cg * 0.7)},0,0.55)`,
    );
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, dia, dia);

    // --- Elevation rings (subtle guide rings at 30° and 60°) ---
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 0.8;
    for (const elDeg of [30, 60]) {
      const ringR = Math.cos((elDeg * Math.PI) / 180) * radius;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // --- Crosshair at exact spot position ---
    const xLen = 5;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(spotX - xLen, spotY);
    ctx.lineTo(spotX + xLen, spotY);
    ctx.moveTo(spotX, spotY - xLen);
    ctx.lineTo(spotX, spotY + xLen);
    ctx.stroke();

    ctx.restore(); // end clip

    // --- Border ring ---
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(128,128,128,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // -------------------------------------------------------------------
  // Pointer interaction

  private _onPointerDown = (event: PointerEvent) => {
    this._dragging = true;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this._updateFromPointer(event);
  };

  private _onPointerMove = (event: PointerEvent) => {
    if (!this._dragging) return;
    this._updateFromPointer(event);
  };

  private _onPointerUp = (_event: PointerEvent) => {
    this._dragging = false;
  };

  private _updateFromPointer(event: PointerEvent) {
    const canvas = this.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const r = Math.min(cx, cy) - 2;

    // Position relative to centre, in CSS pixels.
    const px = event.clientX - rect.left - cx;
    const py = event.clientY - rect.top - cy;

    // Clamp to the circle.
    const dist = Math.sqrt(px * px + py * py);
    const normDist = Math.min(dist / r, 1.0);

    // Azimuth: 0° = up (north), increases clockwise when viewed from above.
    const azimuth = ((Math.atan2(px, -py) * 180) / Math.PI + 360) % 360;

    // Elevation: center → 90°, edge → 0°.
    const elevation = (Math.acos(normDist) * 180) / Math.PI;

    if (this.azimuthProperty) this.azimuthProperty.setValue(azimuth);
    if (this.elevationProperty) this.elevationProperty.setValue(elevation);
  }
}
