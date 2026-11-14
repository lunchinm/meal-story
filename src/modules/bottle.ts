/**
 * 可旋转饮料瓶：用 canvas 做圆柱投影，标签贴图绕在瓶身上。
 *
 * 不依赖任何 3D 库：按列把贴图从圆柱面投到屏幕，左侧亮右侧暗。
 * 贴图是一整圈：前半圈是正面设计，后半圈是配料表与营养成分表。
 */

export interface BottleDesign {
  /** 正面主色 */
  main: string;
  /** 辅助色（瓶盖/瓶身） */
  accent: string;
  name: string;
  subtitle: string;
  /** 背面文字行 */
  back: string[];
}

const W = 220;
const H = 400;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** 画一整圈标签贴图：0～0.5 是正面，0.5～1 是背面 */
function makeTexture(design: BottleDesign): HTMLCanvasElement {
  const tex = document.createElement('canvas');
  tex.width = 1024;
  tex.height = 360;
  const ctx = tex.getContext('2d')!;

  // 正面
  ctx.fillStyle = design.main;
  ctx.fillRect(0, 0, 512, 360);
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  roundRect(ctx, 40, 40, 432, 280, 26);
  ctx.fill();

  ctx.fillStyle = design.main;
  ctx.font = 'bold 64px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(design.name, 256, 150);
  ctx.fillStyle = '#3a3a34';
  ctx.font = '30px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(design.subtitle, 256, 210);
  ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#6b6b60';
  ctx.fillText('净含量 500ml', 256, 268);

  // 背面：配料与营养成分
  ctx.fillStyle = '#fdfcf7';
  ctx.fillRect(512, 0, 512, 360);
  ctx.fillStyle = '#2f2e29';
  ctx.textAlign = 'left';
  ctx.font = 'bold 26px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('配料', 546, 52);
  ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
  let y = 92;
  for (const line of design.back) {
    ctx.fillText(line, 546, y);
    y += 34;
  }
  ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#6b6b60';
  ctx.fillText('每 100 毫升', 830, 52);
  const rows = [['能量', '184kJ'], ['蛋白质', '0.6g'], ['碳水', '7.2g'], ['— 糖', '4.0g'], ['钠', '26mg']];
  let ry = 92;
  for (const [k, v] of rows) {
    ctx.fillText(k, 830, ry);
    ctx.fillText(v, 950, ry);
    ry += 42;
  }
  return tex;
}

/** 瓶身轮廓路径 */
function bodyPath(ctx: CanvasRenderingContext2D): void {
  const cx = W / 2;
  ctx.beginPath();
  ctx.moveTo(cx - 44, H - 18);
  ctx.quadraticCurveTo(cx - 74, H - 22, cx - 74, H - 74);
  ctx.lineTo(cx - 74, 120);
  ctx.quadraticCurveTo(cx - 74, 88, cx - 34, 76);
  ctx.lineTo(cx - 34, 34);
  ctx.quadraticCurveTo(cx - 34, 22, cx - 28, 18);
  ctx.lineTo(cx + 28, 18);
  ctx.quadraticCurveTo(cx + 34, 22, cx + 34, 34);
  ctx.lineTo(cx + 34, 76);
  ctx.quadraticCurveTo(cx + 74, 88, cx + 74, 120);
  ctx.lineTo(cx + 74, H - 74);
  ctx.quadraticCurveTo(cx + 74, H - 22, cx + 44, H - 18);
  ctx.closePath();
}

/** 把贴图绕圆柱投到瓶身上 */
function paintLabel(ctx: CanvasRenderingContext2D, tex: HTMLCanvasElement, angle: number): void {
  const cx = W / 2;
  const radius = 74;
  const top = 138;
  const bandH = 200;
  const tctx = tex.getContext('2d')!;

  for (let sx = -radius; sx <= radius; sx += 1) {
    const x = cx + sx;
    // 屏幕横坐标 → 圆柱角
    const sin = Math.max(-1, Math.min(1, sx / radius));
    const theta = Math.asin(sin);
    // 视线方向可见的是正面半圈
    const u = ((theta + angle) / (Math.PI * 2)) % 1;
    const texX = Math.floor(((u + 1) % 1) * tex.width);

    const shade = Math.max(0.35, Math.cos(theta));
    ctx.globalAlpha = 1;
    ctx.drawImage(
      tex,
      texX, 0, 1, tex.height,
      x, top, 1, bandH,
    );
    if (shade < 0.98) {
      ctx.globalAlpha = (1 - shade) * 0.85;
      ctx.fillStyle = '#0d1a14';
      ctx.fillRect(x, top, 1, bandH);
      ctx.globalAlpha = 1;
    }
  }
}

export class Bottle {
  private tex: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private angle = 0;
  private velocity = 0;
  private dragging = false;
  private lastX = 0;
  private raf = 0;

  constructor(private canvas: HTMLCanvasElement, design: BottleDesign) {
    this.canvas.width = W;
    this.canvas.height = H;
    this.savedDesign = design;
    this.tex = makeTexture(design);
    this.ctx = canvas.getContext('2d')!;
    this.bindPointer();
    this.draw();
    this.tick();
  }

  private bindPointer(): void {
    const onDown = (event: PointerEvent) => {
      this.dragging = true;
      this.lastX = event.clientX;
      this.velocity = 0;
      this.canvas.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!this.dragging) return;
      const dx = event.clientX - this.lastX;
      this.lastX = event.clientX;
      this.angle += dx / 140;
      this.velocity = dx / 140;
      this.draw();
    };
    const onUp = () => {
      this.dragging = false;
    };
    this.canvas.addEventListener('pointerdown', onDown);
    this.canvas.addEventListener('pointermove', onMove);
    this.canvas.addEventListener('pointerup', onUp);
    this.canvas.addEventListener('pointercancel', onUp);

    this.canvas.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') this.angle -= 0.25;
      if (event.key === 'ArrowRight') this.angle += 0.25;
      this.draw();
    });
  }

  private tick = (): void => {
    if (!this.dragging && Math.abs(this.velocity) > 0.0005) {
      this.velocity *= 0.94;
      this.angle += this.velocity;
      this.draw();
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  /** 转到正面/背面 */
  show(front: boolean): void {
    this.angle = front ? 0 : Math.PI;
    this.draw();
  }

  /** 当前是否朝向背面（给外部判断提示用） */
  facingBack(): boolean {
    const norm = ((this.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return norm > Math.PI * 0.5 && norm < Math.PI * 1.5;
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);

    // 瓶身玻璃
    ctx.save();
    bodyPath(ctx);
    ctx.fillStyle = 'rgba(226, 238, 232, 0.92)';
    ctx.fill();
    ctx.restore();

    // 标签绕在瓶身上
    ctx.save();
    bodyPath(ctx);
    ctx.clip();
    paintLabel(ctx, this.tex, this.angle);
    // 瓶身表面高光
    const grad = ctx.createLinearGradient(W / 2 - 96, 0, W / 2 + 96, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0.42)');
    grad.addColorStop(0.28, 'rgba(255,255,255,0.05)');
    grad.addColorStop(0.75, 'rgba(0,0,0,0.10)');
    grad.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // 轮廓与瓶盖
    ctx.save();
    bodyPath(ctx);
    ctx.strokeStyle = 'rgba(45, 60, 52, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = this.savedDesign.accent;
    roundRect(ctx, W / 2 - 26, 6, 52, 16, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(45, 60, 52, 0.35)';
    ctx.stroke();
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
  }

  private savedDesign: BottleDesign;

  setDesign(design: BottleDesign): void {
    this.savedDesign = design;
    this.tex = makeTexture(design);
    this.draw();
  }
}
