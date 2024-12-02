import Character from '../Character';

export default class Vampire extends Character {
  constructor(level) {
    super(level, 'vampire');
    this.attack = 25;
    this.defence = 25;
    this.movementRadius = 2;
    this.attackRadius = 2;
    if (level > 1) {
      for (let i = 1; i < level; i++) {
        this.upgradeStats();
      }
    }
  }
}