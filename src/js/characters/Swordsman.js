import Character from '../Character';

export default class Swordsman extends Character {
  constructor(level) {
    super(level, 'swordsman');
    this.attack = 40;
    this.defence = 10;
    this.movementRadius = 4;
    this.attackRadius = 1;
    if(level > 1) {
      for(let i = 1; i < level; i++) {
        this.upgradeStats();
      }
    }
  }
}