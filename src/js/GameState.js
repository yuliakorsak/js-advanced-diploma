import themes from "./themes";
export default class GameState {
  constructor(playerPositions = [], enemyPositions = [], theme = themes.prairie, level = 1) {
    this.playerPositions = playerPositions;
    this.enemyPositions = enemyPositions;
    this.theme = theme;
    this.level = level;
    this.playersTurn = true;
    this.selected = null;
  }

  get positions() {
    return [...this.playerPositions, ...this.enemyPositions];
  }

  static from(object) {
    return new GameState(object.playerPositions, object.enemyPositions, object.theme, object.level);
  }
}
