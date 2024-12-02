import Character from '../Character';

export default class Bowman extends Character {
  constructor(level) {
    super(level, 'bowman');
    this.attack = 25;
    this.defence = 25;
    this.movementRadius = 2;
    this.attackRadius = 2;
    if(level > 1) {
      for(let i = 1; i < level; i++) {
        this.upgradeStats();
      }
    }
  }
}