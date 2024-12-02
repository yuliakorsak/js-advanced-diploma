import Team from './Team';
import { coordToIndex } from './utils';
import PositionedCharacter from './PositionedCharacter';

/**
 * Формирует экземпляр персонажа из массива allowedTypes со
 * случайным уровнем от 1 до maxLevel
 *
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @returns генератор, который при каждом вызове
 * возвращает новый экземпляр класса персонажа
 *
 */
export function* characterGenerator(allowedTypes, maxLevel) {
  while (true) {
    const level = Math.ceil(Math.random() * maxLevel);
    const type = Math.floor(Math.random() * allowedTypes.length);
    yield new allowedTypes[type](level);
  }
}

/**
 * Формирует массив персонажей на основе characterGenerator
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @param characterCount количество персонажей, которое нужно сформировать
 * @param positions позиции для размещения персонажей
 * @returns экземпляр Team, хранящий экземпляры персонажей. Количество персонажей в команде - characterCount
 * */
export function generateTeam(allowedTypes, maxLevel, characterCount, positions) {
  const charGenerator = characterGenerator(allowedTypes, maxLevel);
  const characters = [];
  for (let i = 0; i < characterCount; i++) {
    characters.push(new PositionedCharacter(charGenerator.next().value, positions[i]));
  }
  return new Team(characters);
}


/**
 * Формирует массив позиций для персонажей команды
 * @param characterCount количество персонажей
 * @param columns столбцы для размещения персонажей
 * @param boardSize размер стороны поля
 */
export function generatePositions(characterCount, columns, boardSize) {
  const positions = new Set();
  while (positions.size < characterCount) {
    positions.add(coordToIndex({
      row: Math.floor(Math.random() * boardSize),
      col: columns[Math.floor(Math.random() * columns.length)]
    }, boardSize));
  }
  return Array.from(positions);
}