/**
 * Базовый класс, от которого наследуются классы персонажей
 * @property level - уровень персонажа, от 1 до 4
 * @property attack - показатель атаки
 * @property defence - показатель защиты
 * @property health - здоровье персонажа
 * @property type - строка с одним из допустимых значений:
 * swordsman
 * bowman
 * magician
 * daemon
 * undead
 * vampire
 */
export default class Character {
  constructor(level, type = 'generic') {
    if (this.constructor === Character) {
      throw new TypeError('Невозможно создать экземпляр класса Character');
    }
    this.level = level;
    this.health = 50;
    this.attack = 0;
    this.defence = 0;
    this.type = type;
  }

  upgradeStats() {
    this.attack = Math.max(this.attack,
      this.attack * (80 + this.health) / 100);
    this.defence = Math.max(this.defence,
      this.defence * (80 + this.health) / 100);
    this.health = Math.min(100, this.health + 80);
  }
}
