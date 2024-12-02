import Character from '../Character';

export default class Daemon extends Character {
  constructor(level) {
    super(level, 'daemon');
    this.attack = 10;
    this.defence = 10;
    this.movementRadius = 1;
    this.attackRadius = 4;
    if(level > 1) {
      for(let i = 1; i < level; i++) {
        this.upgradeStats();
      }
    }
  }
}