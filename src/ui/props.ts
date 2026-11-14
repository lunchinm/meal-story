/**
 * 道具面板：标签、便签、菜牌这类需要看清文字的东西，用 HTML 画，不用图。
 */

export type PropId =
  | 'product_front'
  | 'product_back'
  | 'nutrition'
  | 'note'
  | 'menu'
  | 'tray'
  | 'poster';

export interface PropView {
  title: string;
  body: HTMLElement;
}

function el(cls: string, text?: string): HTMLElement {
  const node = document.createElement('div');
  node.className = cls;
  if (text) node.textContent = text;
  return node;
}

function rows(table: string[][]): HTMLElement {
  const box = el('prop-table');
  for (const [name, value] of table) {
    const row = el('prop-row');
    row.append(el('prop-key', name), el('prop-val', value));
    box.append(row);
  }
  return box;
}

const NUTRITION: string[][] = [
  ['项目', '每 100 毫升'],
  ['能量', '184 千焦'],
  ['蛋白质', '0.6 克'],
  ['脂肪', '0 克'],
  ['碳水化合物', '7.2 克'],
  ['— 糖', '4.0 克'],
  ['钠', '26 毫克'],
];

export function buildProp(id: PropId, image?: string): PropView {
  switch (id) {
    case 'product_front': {
      const body = el('prop-body');
      const pack = el('pack pack-front');
      pack.append(el('pack-name', '柠檬茶'), el('pack-sub', '清爽解腻 · 500ml'));
      const art = el('pack-art');
      if (image) art.style.backgroundImage = `url(${image})`;
      pack.append(art);
      body.append(pack, el('prop-note', '正面写的是名字和感觉，配料在背面。'));
      return { title: '瓶子的正面', body };
    }
    case 'product_back': {
      const body = el('prop-body');
      const pack = el('pack pack-back');
      pack.append(el('pack-label', '产品名称：柠檬茶（果味茶饮料）'));
      pack.append(el('pack-label', '配料：水、白砂糖、红茶、柠檬浓缩汁、食品用香精'));
      pack.append(el('pack-label', '净含量：500 毫升'));
      pack.append(el('pack-label', '储存条件：常温避光，冷藏后风味更佳'));
      body.append(pack, el('prop-note', '配料按加入量从多到少排，排在前面的是量大的。'));
      return { title: '瓶子的背面', body };
    }
    case 'nutrition': {
      const body = el('prop-body');
      const title = el('prop-table-title', '营养成分表');
      body.append(title, rows(NUTRITION));
      body.append(el('prop-note', '注意看是「每 100 毫升」还是「整瓶」。这一瓶是 500 毫升。'));
      return { title: '营养成分表', body };
    }
    case 'note': {
      const body = el('prop-body');
      const note = el('sticky');
      note.append(el('sticky-line sticky-head', '今天下午'));
      note.append(el('sticky-line', '12:40 社团借场地'));
      note.append(el('sticky-line', '13:10 回教室'));
      note.append(el('sticky-line', '别忘了打印材料'));
      const crossed = el('sticky-line sticky-cross', '午饭再慢慢想');
      note.append(crossed);
      body.append(note);
      return { title: '被水杯压住的便签', body };
    }
    case 'menu': {
      const body = el('prop-body');
      const board = el('menu-board');
      for (const [dish, price, tag] of [
        ['米饭', '1 元', '主食'],
        ['清炒时蔬', '3 元', '蔬菜'],
        ['土豆丝', '3 元', '主食'],
        ['番茄炒蛋', '5 元', '蛋白'],
        ['肉菜', '7 元', '蛋白'],
        ['家常豆腐', '4 元', '蛋白'],
        ['水煮蛋', '2 元', '蛋白'],
        ['汤面', '6 元', '主食'],
      ]) {
        const row = el('menu-row');
        row.append(el('menu-dish', dish), el('menu-tag', tag), el('menu-price', price));
        board.append(row);
      }
      body.append(board);
      return { title: '窗口菜牌', body };
    }
    case 'poster': {
      const body = el('prop-body');
      const art = el('poster-card');
      if (image) art.style.backgroundImage = 'url(' + image + ')';
      const copy = el('poster-card-copy');
      copy.append(el('poster-card-title', '免疫满分套餐'));
      copy.append(el('poster-card-line', '一份承包全天营养'));
      copy.append(el('poster-card-line', '连吃七天，免疫力拉满！'));
      copy.append(el('poster-card-price', '原价 38，今天 22'));
      art.append(copy);
      body.append(art, el('prop-note', '图里有几句话给的是承诺，没给依据。'));
      return { title: '群里的宣传图', body };
    }
    case 'tray':
    default: {
      const body = el('prop-body');
      const photo = el('tray-photo');
      if (image) photo.style.backgroundImage = `url(${image})`;
      body.append(photo, el('prop-note', '一份套餐的实物：主食、蛋白、两种蔬菜。'));
      return { title: '套餐实物', body };
    }
  }
}
