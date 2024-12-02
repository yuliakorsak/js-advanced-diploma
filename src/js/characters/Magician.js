import Character from '../Character';

export default class Magician extends Character {
  constructor(level) {
    super(level, 'magician');
    this.attack = 10;
    this.defence = 40;
    this.movementRadius = 1;
    this.attackRadius = 4;
    if(level > 1) {
      for(let i = 1; i < level; i++) {
        this.upgradeStats();
      }
    }
  }
}