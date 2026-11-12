import act1 from '../../content/act1.json';
import act2 from '../../content/act2.json';
import act3 from '../../content/act3.json';
import act4 from '../../content/act4.json';
import cards from '../../content/cards.json';
import knowledge from '../../content/knowledge.json';
import type { AnyNode, Content, FoodCard, KnowledgeCard } from './types';

/**
 * 剧情直接 import 进包，不走 fetch：
 * 这样构建出来的单文件也能离线打开，不怕路径和跨域问题。
 */
export function loadContent(): Content {
  return {
    acts: {
      act1: act1 as unknown as AnyNode[],
      act2: act2 as unknown as AnyNode[],
      act3: act3 as unknown as AnyNode[],
      act4: act4 as unknown as AnyNode[],
    },
    cards: cards as unknown as FoodCard[],
    knowledge: knowledge as unknown as KnowledgeCard[],
  };
}
