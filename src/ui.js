import { fmt, pctLabel } from "./data.js";
import { renderReceiptImage } from "./shareCard.js";

export function createUI() {
  const $ = (id) => document.getElementById(id);
  const dom = {
    hud: $("hud"),
    clock: $("clock"),
    floats: $("floats"),
    toasts: $("toasts"),
    panelStall: $("panel-stall"),
    stallName: $("stall-name"),
    stallNote: $("stall-note"),
    stallItems: $("stall-items"),
    stallExtra: $("stall-extra"),
    modalGuess: $("modal-guess"),
    guessTitle: $("guess-title"),
    guessInput: $("guess-input"),
    guessOk: $("guess-ok"),
    modalReceipt: $("modal-receipt"),
    receiptTitle: $("receipt-title"),
    receiptComment: $("receipt-comment"),
    receiptHero: $("receipt-hero"),
    receiptSpent: $("receipt-spent"),
    receiptGuess: $("receipt-guess"),
    receiptPct: $("receipt-pct"),
    receiptDir: $("receipt-dir"),
    lines: $("receipt-lines"),
    stats: $("receipt-stats"),
    btnSaveImage: $("btn-save-image"),
    btnCopyImage: $("btn-copy-image"),
    btnAgain: $("btn-again"),
    start: $("start"),
    btnStart: $("btn-start"),
    intro: $("intro"),
    btnEnter: $("btn-enter"),
    btnSound: $("btn-sound"),
    btnHome: $("btn-home"),
    btnInteract: $("btn-interact"),
    interactLabel: $("interact-label"),
  };

  let stall = null;
  let receiptData = null;
  let imageBusy = false;

  function stamp() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  }

  async function makeReceiptImage() {
    if (!receiptData || imageBusy) return null;
    imageBusy = true;
    try {
      return await renderReceiptImage(receiptData);
    } finally {
      imageBusy = false;
    }
  }

  async function saveReceiptImage() {
    try {
      const blob = await makeReceiptImage();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `夜市账单-${stamp()}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast("账单图片已保存");
    } catch {
      toast("图片没生成出来，再试一次");
    }
  }

  async function copyReceiptImage() {
    try {
      const blob = await makeReceiptImage();
      if (!blob) return;
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") throw new Error("unsupported");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast("账单图片已复制");
    } catch {
      toast("这个浏览器不支持复制图片，用保存吧");
    }
  }

  dom.btnSaveImage.addEventListener("click", saveReceiptImage);
  dom.btnCopyImage.addEventListener("click", copyReceiptImage);

  function toast(text) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    dom.toasts.append(el);
    setTimeout(() => el.remove(), 2100);
  }

  function addFloat(text) {
    const el = document.createElement("div");
    el.className = "float";
    el.textContent = text;
    dom.floats.append(el);
    return el;
  }

  function purchaseFeedback(button, text) {
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const pop = document.createElement("div");
    pop.className = "purchase-pop";
    pop.textContent = text;
    pop.style.left = `${rect.left + rect.width / 2}px`;
    pop.style.top = `${rect.top - 8}px`;
    document.body.append(pop);
    requestAnimationFrame(() => pop.classList.add("leaving"));
    setTimeout(() => pop.remove(), 2100);
  }

  function renderItems(target, handlers) {
    dom.stallItems.classList.remove("hidden");
    dom.stallExtra.classList.add("hidden");
    dom.stallItems.innerHTML = "";
    let currentGroup = "";
    for (const item of target.items) {
      if (item.group && item.group !== currentGroup) {
        currentGroup = item.group;
        const heading = document.createElement("div");
        heading.className = "item-group";
        heading.textContent = item.group;
        dom.stallItems.append(heading);
      }
      const button = document.createElement("button");
      button.className = "item";
      const left = document.createElement("span");
      const label = document.createElement("span");
      label.textContent = item.label;
      left.append(label);
      if (item.tip) {
        const tip = document.createElement("small");
        tip.textContent = item.tip;
        left.append(tip);
      }
      const price = document.createElement("span");
      price.className = "price";
      price.textContent = item.free
        ? "0元"
        : item.addon
          ? `+¥${fmt(item.price)}`
          : `¥${fmt(item.price)}`;
      button.append(left, price);
      button.addEventListener("click", () => handlers.buy(target, item, button));
      dom.stallItems.append(button);
    }
  }

  function renderConfigurableItems(target, handlers) {
    dom.stallItems.classList.remove("hidden");
    dom.stallExtra.classList.add("hidden");
    dom.stallItems.innerHTML = "";
    const buttons = new Map();
    const selectedAddons = new Set();
    let selectedBase = null;
    let currentGroup = "";

    const summary = document.createElement("div");
    summary.className = "config-summary";
    const buy = document.createElement("button");
    buy.className = "btn primary";
    buy.type = "button";
    buy.textContent = "买下";
    summary.append(buy);

    const update = () => {
      for (const [id, button] of buttons) {
        const selected = selectedBase?.id === id || selectedAddons.has(id);
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      }
      buy.disabled = !selectedBase;
    };

    for (const item of target.items) {
      if (item.group && item.group !== currentGroup) {
        currentGroup = item.group;
        const heading = document.createElement("div");
        heading.className = "item-group";
        heading.textContent = item.group;
        dom.stallItems.append(heading);
      }

      const button = document.createElement("button");
      button.className = "item";
      button.type = "button";
      const left = document.createElement("span");
      const label = document.createElement("span");
      label.textContent = item.label;
      left.append(label);
      if (item.tip) {
        const tip = document.createElement("small");
        tip.textContent = item.tip;
        left.append(tip);
      }
      const price = document.createElement("span");
      price.className = "price";
      price.textContent = item.free
        ? "0元"
        : item.addon
          ? `+¥${fmt(item.price)}`
          : `¥${fmt(item.price)}`;
      button.append(left, price);
      button.addEventListener("click", () => {
        if (!item.addon) {
          selectedBase = item;
        } else if (selectedAddons.has(item.id)) {
          selectedAddons.delete(item.id);
        } else {
          if (item.exclusiveGroup) {
            for (const id of [...selectedAddons]) {
              const other = target.items.find((entry) => entry.id === id);
              if (other?.exclusiveGroup === item.exclusiveGroup) selectedAddons.delete(id);
            }
          }
          selectedAddons.add(item.id);
        }
        update();
      });
      buttons.set(item.id, button);
      dom.stallItems.append(button);
    }

    dom.stallItems.append(summary);
    update();

    buy.addEventListener("click", () => {
      if (!selectedBase) return;
      const addons = target.items.filter((item) => selectedAddons.has(item.id));
      const price = selectedBase.price + addons.reduce((sum, item) => sum + item.price, 0);
      const label = [selectedBase.label, ...addons.map((item) => item.label)].join(" + ");
      if (handlers.buy(target, { label, price }, buy)) {
        selectedBase = null;
        selectedAddons.clear();
        update();
      }
    });
  }

  function renderQuantityItems(target, handlers) {
    dom.stallItems.classList.remove("hidden");
    dom.stallExtra.classList.add("hidden");
    dom.stallItems.innerHTML = "";
    const counts = new Map();
    const buttons = new Map();
    let currentGroup = "";

    const summary = document.createElement("div");
    summary.className = "quantity-summary";
    const title = document.createElement("div");
    title.className = "selected-title";
    title.textContent = "已选";
    const selectedList = document.createElement("div");
    selectedList.className = "selected-list";
    const buy = document.createElement("button");
    buy.className = "btn primary";
    buy.type = "button";
    buy.textContent = "买下";
    summary.append(title, selectedList, buy);

    const changeCount = (item, delta) => {
      const amount = Math.max(0, (counts.get(item.id) || 0) + delta);
      if (amount === 0) counts.delete(item.id);
      else counts.set(item.id, amount);
      update();
    };

    const update = () => {
      for (const [id, button] of buttons) {
        const selected = (counts.get(id) || 0) > 0;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      }

      selectedList.innerHTML = "";
      const selected = target.items.filter((item) => (counts.get(item.id) || 0) > 0);
      if (!selected.length) {
        const empty = document.createElement("span");
        empty.className = "selected-empty";
        empty.textContent = "还没选";
        selectedList.append(empty);
      }
      for (const item of selected) {
        const row = document.createElement("div");
        row.className = "selected-item";
        const name = document.createElement("span");
        name.className = "selected-name";
        const amount = document.createElement("b");
        amount.className = "selected-count";
        amount.textContent = `×${counts.get(item.id)}`;
        name.append(document.createTextNode(item.label), amount);
        const minus = document.createElement("button");
        minus.className = "selected-step";
        minus.type = "button";
        minus.textContent = "−";
        minus.setAttribute("aria-label", `少一份${item.label}`);
        minus.addEventListener("click", () => changeCount(item, -1));
        const plus = document.createElement("button");
        plus.className = "selected-step";
        plus.type = "button";
        plus.textContent = "+";
        plus.setAttribute("aria-label", `加一份${item.label}`);
        plus.addEventListener("click", () => changeCount(item, 1));
        row.append(name, minus, plus);
        selectedList.append(row);
      }
      buy.disabled = !selected.length;
    };

    for (const item of target.items) {
      if (item.group && item.group !== currentGroup) {
        currentGroup = item.group;
        const heading = document.createElement("div");
        heading.className = "item-group";
        heading.textContent = item.group;
        dom.stallItems.append(heading);
      }

      const button = document.createElement("button");
      button.className = "item";
      button.type = "button";
      const left = document.createElement("span");
      const label = document.createElement("span");
      label.textContent = item.label;
      left.append(label);
      if (item.tip) {
        const tip = document.createElement("small");
        tip.textContent = item.tip;
        left.append(tip);
      }
      const price = document.createElement("span");
      price.className = "price";
      price.textContent = `¥${fmt(item.price)}`;
      button.append(left, price);
      button.addEventListener("click", () => changeCount(item, 1));
      buttons.set(item.id, button);
      dom.stallItems.append(button);
    }

    dom.stallItems.append(summary);
    update();

    buy.addEventListener("click", () => {
      const selected = target.items.filter((item) => (counts.get(item.id) || 0) > 0);
      if (!selected.length) return;
      const price = selected.reduce((sum, item) => sum + item.price * counts.get(item.id), 0);
      const label = selected.map((item) => `${item.label}×${counts.get(item.id)}`).join(" + ");
      if (handlers.buy(target, { label, price }, buy)) {
        counts.clear();
        update();
      }
    });
  }

  function renderWeighed(target, handlers) {
    dom.stallItems.innerHTML = "";
    dom.stallItems.classList.add("hidden");
    dom.stallExtra.classList.remove("hidden");
    dom.stallExtra.innerHTML = "";

    const pieces = document.createElement("div");
    pieces.className = "pieces";
    const chosen = new Map();
    const updaters = [];
    for (const piece of target.pieces) {
      const card = document.createElement("div");
      card.className = "piece-card";
      const minus = document.createElement("button");
      minus.className = "piece-step";
      minus.type = "button";
      minus.textContent = "−";
      minus.setAttribute("aria-label", `少一${piece.unit}${piece.label}`);
      const label = document.createElement("span");
      label.className = "piece-label";
      const copy = document.createElement("span");
      copy.className = "piece-copy";
      const name = document.createElement("span");
      name.className = "piece-name";
      name.textContent = piece.label;
      const approxWeight = document.createElement("small");
      approxWeight.className = "piece-weight";
      approxWeight.textContent = `约 ${Number(piece.weight.toFixed(1))}两/${piece.unit}`;
      const count = document.createElement("b");
      count.className = "piece-count";
      const plus = document.createElement("button");
      plus.className = "piece-step";
      plus.type = "button";
      plus.textContent = "+";
      plus.setAttribute("aria-label", `加一${piece.unit}${piece.label}`);

      const update = () => {
        const amount = chosen.get(piece.id) || 0;
        count.textContent = `${amount}${piece.unit}`;
        minus.disabled = amount === 0;
        card.classList.toggle("on", amount > 0);
      };
      plus.addEventListener("click", () => {
        chosen.set(piece.id, (chosen.get(piece.id) || 0) + 1);
        update();
      });
      minus.addEventListener("click", () => {
        const amount = (chosen.get(piece.id) || 0) - 1;
        if (amount <= 0) chosen.delete(piece.id);
        else chosen.set(piece.id, amount);
        update();
      });
      copy.append(name, approxWeight);
      label.append(copy, count);
      card.append(minus, label, plus);
      pieces.append(card);
      updaters.push(update);
      update();
    }

    const row = document.createElement("div");
    row.className = "row";
    const result = document.createElement("span");
    result.className = "weigh-result";
    result.textContent = `荤 ${fmt(target.unitPrices.meat)} 元/两 · 素 ${fmt(target.unitPrices.veg)} 元/两 · 还没称`;
    const weigh = document.createElement("button");
    weigh.className = "btn";
    weigh.textContent = "称重";
    const buy = document.createElement("button");
    buy.className = "btn primary hidden";
    buy.textContent = "买下";

    weigh.addEventListener("click", () => {
      if (!chosen.size) {
        result.textContent = `荤 ${fmt(target.unitPrices.meat)} 元/两 · 素 ${fmt(target.unitPrices.veg)} 元/两 · 先夹点东西`;
        return;
      }
      result.textContent = "秤上…";
      buy.classList.add("hidden");
      setTimeout(() => {
        const picked = [];
        for (const [id, amount] of chosen) {
          for (let i = 0; i < amount; i += 1) picked.push(id);
        }
        const data = handlers.weigh(target, picked);
        if (!data) {
          result.textContent = "这份的量，口袋吃不住";
          return;
        }
        const parts = [];
        if (data.meatWeight > 0) {
          parts.push(`荤 ${data.meatWeight}两 × ${fmt(data.unitPrices.meat)}`);
        }
        if (data.vegWeight > 0) {
          parts.push(`素 ${data.vegWeight}两 × ${fmt(data.unitPrices.veg)}`);
        }
        result.textContent = `${data.label} · 共 ${data.weight}两 · ${parts.join(" + ")} = ¥${fmt(data.price)}`;
        buy.classList.remove("hidden");
        buy.onclick = () => {
          if (handlers.buy(target, { label: data.label, price: data.price, note: "称重" }, buy)) {
            buy.classList.add("hidden");
            chosen.clear();
            updaters.forEach((update) => update());
          }
        };
      }, 900);
    });

    row.append(result, weigh, buy);
    dom.stallExtra.append(pieces, row);
  }

  return {
    showHud() {
      dom.hud.classList.remove("hidden");
    },
    hideStart() {
      dom.start.classList.add("hidden");
    },
    showIntro() {
      dom.intro.classList.remove("hidden");
    },
    hideIntro() {
      dom.intro.classList.add("hidden");
    },
    setClock(text) {
      dom.clock.textContent = text;
    },
    setSoundLabel(text) {
      dom.btnSound.textContent = text;
    },
    onStart(cb) {
      dom.btnStart.addEventListener("click", cb);
    },
    onEnter(cb) {
      dom.btnEnter.addEventListener("click", cb);
    },
    onHome(cb) {
      dom.btnHome.addEventListener("click", cb);
    },
    onInteract(cb) {
      dom.btnInteract.addEventListener("click", cb);
    },
    showInteract(text) {
      dom.interactLabel.textContent = text;
      dom.btnInteract.classList.remove("hidden");
    },
    hideInteract() {
      dom.btnInteract.classList.add("hidden");
    },
    onSound(cb) {
      dom.btnSound.addEventListener("click", cb);
    },
    onAgain(cb) {
      dom.btnAgain.addEventListener("click", cb);
    },
    onClose(cb) {
      document.querySelectorAll("[data-close]").forEach((button) => {
        button.addEventListener("click", () => cb(button.dataset.close));
      });
    },
    toast,
    addFloat,
    purchaseFeedback,
    openStall(target, handlers) {
      stall = target;
      dom.stallName.textContent = target.name;
      dom.stallNote.textContent = target.note || "";
      if (target.weighed) renderWeighed(target, handlers);
      else if (target.quantityMode) renderQuantityItems(target, handlers);
      else if (target.configure) renderConfigurableItems(target, handlers);
      else renderItems(target, handlers);
      dom.panelStall.classList.remove("hidden");
    },
    closeStall() {
      stall = null;
      dom.panelStall.classList.add("hidden");
    },
    currentStall() {
      return stall;
    },
    openGuess(options, onDone) {
      dom.guessTitle.textContent = options.title;
      dom.guessInput.removeAttribute("max");
      dom.guessInput.value = String(options.value ?? 100);
      dom.guessOk.textContent = options.confirmLabel || "记下";
      dom.modalGuess.classList.remove("hidden");
      requestAnimationFrame(() => {
        dom.guessInput.focus();
        dom.guessInput.select();
      });
      const finish = (value) => {
        dom.modalGuess.classList.add("hidden");
        onDone(value);
      };
      dom.guessOk.onclick = () => {
        if (dom.guessInput.value.trim() === "") return;
        const value = Number(dom.guessInput.value);
        if (!Number.isFinite(value)) return;
        finish(Math.max(0, value));
      };
    },
    closeGuess() {
      dom.modalGuess.classList.add("hidden");
    },
    showReceipt(data) {
      const hasGuess = data.guess != null;
      receiptData = data;
      dom.receiptTitle.textContent = data.title;
      dom.receiptComment.textContent = data.comment || "";
      dom.receiptSpent.textContent = `¥${fmt(data.spent)}`;
      dom.receiptGuess.textContent = hasGuess ? `¥${fmt(data.guess)}` : "-";
      dom.receiptPct.textContent = hasGuess && data.pct != null ? `${pctLabel(data.pct)}%` : "-";
      dom.receiptDir.textContent = data.diffText || "";
      dom.receiptDir.classList.toggle("hidden", !hasGuess);
      dom.receiptHero.classList.toggle("solo", !hasGuess);

      dom.lines.innerHTML = "";
      for (const purchase of data.purchases) {
        const line = document.createElement("div");
        line.className = "line";
        const left = document.createElement("span");
        left.className = "name";
        left.textContent = purchase.name;
        if (purchase.note) {
          const tip = document.createElement("span");
          tip.className = "tip";
          tip.textContent = ` ${purchase.note}`;
          left.append(tip);
        }
        const right = document.createElement("span");
        right.textContent = `¥${fmt(purchase.price)}`;
        line.append(left, right);
        dom.lines.append(line);
      }

      dom.stats.innerHTML = "";
      for (const stat of data.stats) {
        const box = document.createElement("div");
        box.className = "stat";
        const value = document.createElement("b");
        value.textContent = stat.value;
        const label = document.createElement("span");
        label.textContent = stat.label;
        box.append(value, label);
        dom.stats.append(box);
      }

      dom.modalReceipt.classList.remove("hidden");
    },
    hideReceipt() {
      dom.modalReceipt.classList.add("hidden");
    },
  };
}
