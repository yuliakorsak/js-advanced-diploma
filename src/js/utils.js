/**
 * @param index - индекс поля
 * @param boardSize - размер квадратного поля (в длину или ширину)
 * @returns строка - тип ячейки на поле:
 *
 * top-left
 * top-right
 * top
 * bottom-left
 * bottom-right
 * bottom
 * right
 * left
 * center
 *
 * @example
 * ```js
 * calcTileType(0, 8); // 'top-left'
 * calcTileType(1, 8); // 'top'
 * calcTileType(63, 8); // 'bottom-right'
 * calcTileType(7, 7); // 'left'
 * ```
 * */
export function calcTileType(index, boardSize) {
  if (index < boardSize) {
    if (index === 0) {
      return 'top-left';
    }
    if (index === boardSize - 1) {
      return 'top-right';
    }
    return 'top';
  }
  if (index % boardSize === 0) {
    if (index === boardSize * (boardSize - 1)) {
      return 'bottom-left';
    }
    return 'left';
  }
  if (index % boardSize === boardSize - 1) {
    if (index === (boardSize * boardSize) - 1) {
      return 'bottom-right';
    }
    return 'right';
  }
  if (index > boardSize * (boardSize - 1)) {
    return 'bottom';
  }
  return 'center';
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}

export function characterStats(character) {
  return `\u{1F396}${character.level} \u{2694}${character.attack} \u{1F6E1}${character.defence} \u{2764}${character.health}`;
}

export function isEnemy(character) {
  return (character.type === 'undead'
    || character.type === 'vampire'
    || character.type === 'daemon');
}

export function getCoord(index, boardSize) {
  return {
    row: Math.floor(index / boardSize),
    col: index % boardSize
  };
}

export function coordToIndex(coord, boardSize) {
  return coord.row * boardSize + coord.col;
}

export function calcDamage(attack, defence) {
  return Math.max(attack - defence, attack * 0.1);
}