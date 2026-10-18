import { fmt, pctLabel } from "./data.js";

// 把结算数据画成一张可以直接保存、复制的图片。纯 Canvas 2D，不依赖第三方库。
const FONT = '"Microsoft YaHei", "PingFang SC", system-ui, sans-serif';
const WIDTH = 640;
const PAD = 48;
const SCALE = 2;

const COLOR = {
  text: "#fff8ec",
  dim: "#c8c3b5",
  body: "#e6dfd0",
  amber: "#f0b45e",
  amberSoft: "#ffd9a0",
  line: "rgba(255, 255, 255, 0.14)",
  border: "rgba(255, 224, 181, 0.18)",
};

function font(weight, size) {
  return `${weight} ${size}px ${FONT}`;
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const char of text) {
    const next = line + char;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function dashedLine(ctx, x0, x1, y, paint) {
  if (!paint) return;
  ctx.save();
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(x0, y + 0.5);
  ctx.lineTo(x1, y + 0.5);
  ctx.stroke();
  ctx.restore();
}

// 同一套布局跑两遍：第一遍量高度，第二遍才真正落笔，保证图片高度贴合内容。
function layoutReceipt(ctx, data, paint) {
  const contentW = WIDTH - PAD * 2;
  const right = WIDTH - PAD;
  let y = 56;

  ctx.textAlign = "left";
  ctx.font = font(700, 46);
  if (paint) {
    ctx.fillStyle = COLOR.amberSoft;
    ctx.shadowColor = "rgba(240, 180, 94, 0.45)";
    ctx.shadowBlur = 26;
    ctx.fillText(data.title, PAD, y);
    ctx.shadowBlur = 0;
  }
  y += 60;

  ctx.font = font(400, 24);
  for (const line of wrapText(ctx, data.comment || "", contentW)) {
    if (paint) {
      ctx.fillStyle = COLOR.body;
      ctx.fillText(line, PAD, y);
    }
    y += 34;
  }
  y += 6;

  if (data.diffText) {
    ctx.font = font(500, 22);
    if (paint) {
      ctx.fillStyle = COLOR.dim;
      ctx.fillText(data.diffText, PAD, y);
    }
    y += 32;
  }

  y += 14;
  dashedLine(ctx, PAD, right, y, paint);
  y += 26;

  const half = contentW / 2;
  ctx.font = font(500, 22);
  if (paint) {
    ctx.fillStyle = COLOR.dim;
    ctx.fillText("实际花了", PAD, y);
    ctx.fillText("你的预估", PAD + half, y);
  }
  y += 30;

  ctx.font = font(700, 34);
  if (paint) {
    ctx.fillStyle = COLOR.text;
    ctx.fillText(`¥${fmt(data.spent)}`, PAD, y);
    ctx.fillText(data.guess != null ? `¥${fmt(data.guess)}` : "-", PAD + half, y);
  }
  y += 46;

  y += 14;
  ctx.font = font(500, 22);
  if (paint) {
    ctx.fillStyle = COLOR.dim;
    ctx.fillText("相差", PAD, y);
  }
  y += 30;

  ctx.font = font(700, 64);
  if (paint) {
    ctx.fillStyle = COLOR.amberSoft;
    ctx.shadowColor = "rgba(240, 180, 94, 0.5)";
    ctx.shadowBlur = 30;
    ctx.fillText(data.pct == null ? "-" : `${pctLabel(data.pct)}%`, PAD, y);
    ctx.shadowBlur = 0;
  }
  y += 78;

  y += 10;
  dashedLine(ctx, PAD, right, y, paint);
  y += 24;

  for (const purchase of data.purchases) {
    const text = purchase.note ? `${purchase.name}  ${purchase.note}` : purchase.name;
    ctx.font = font(400, 22);
    const lines = wrapText(ctx, text, contentW - 132);
    if (paint) {
      ctx.fillStyle = COLOR.text;
      lines.forEach((line, index) => ctx.fillText(line, PAD, y + index * 30));
      ctx.fillStyle = COLOR.amberSoft;
      ctx.font = font(600, 22);
      ctx.textAlign = "right";
      ctx.fillText(`¥${fmt(purchase.price)}`, right, y);
      ctx.textAlign = "left";
    }
    y += Math.max(34, lines.length * 30 + 6);
  }

  y += 16;
  dashedLine(ctx, PAD, right, y, paint);
  y += 22;

  ctx.font = font(400, 22);
  if (paint) {
    ctx.fillStyle = COLOR.dim;
    ctx.fillText(data.stats[0] ? `${data.stats[0].label} ${data.stats[0].value}` : "", PAD, y);
    ctx.textAlign = "right";
    ctx.fillText(data.stats[1] ? `${data.stats[1].label} ${data.stats[1].value}` : "", right, y);
    ctx.textAlign = "left";
  }
  y += 40;

  ctx.font = font(400, 18);
  if (paint) {
    ctx.fillStyle = "rgba(200, 195, 181, 0.55)";
    ctx.fillText("我的钱怎么就花完了？", PAD, y);
  }
  return y + 52;
}

export function renderReceiptImage(data) {
  const measure = document.createElement("canvas").getContext("2d");
  const height = Math.ceil(layoutReceipt(measure, data, false));

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "top";

  const backdrop = ctx.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, "#22303f");
  backdrop.addColorStop(1, "#141c26");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, WIDTH, height);

  roundRect(ctx, 16, 16, WIDTH - 32, height - 32, 8);
  ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
  ctx.fill();
  ctx.strokeStyle = COLOR.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  layoutReceipt(ctx, data, true);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
