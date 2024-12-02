import themes from './themes';
import cursors from './cursors';
import { generatePositions, generateTeam } from './generators';
import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Daemon from './characters/Daemon';
import { characterStats, isEnemy, getCoord, coordToIndex, calcDamage } from './utils';
import GamePlay from './GamePlay';
import GameState from './GameState';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.state = new GameState();
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addSaveGameListener(this.saveGame.bind(this));
    this.gamePlay.addLoadGameListener(this.loadGame.bind(this));
    this.gamePlay.addNewGameListener(this.newGame.bind(this));
  }

  init() {
    this.gamePlay.drawUi(themes.prairie);
    this.loadGame();
    if (this.state.positions.length === 0) {
      this.newGame();
    }
  }

  onCellClick(index) {
    const player = this.state.playerPositions.find(item => item.position === index);
    if (player) {
      if (this.state.selected) {
        this.gamePlay.deselectCell(this.state.selected.position);
      }
      this.state.selected = player;
      this.gamePlay.selectCell(index);
      return;
    }
    const enemy = this.state.enemyPositions.find(item => item.position === index);
    if (enemy) {
      if (this.state.selected === null) {
        GamePlay.showError('Это персонаж противника');
        return;
      }
      else if (this.canAttack(this.state.selected, index)) {
        this.attack(this.state.selected, enemy);
      }
      return;
    }
    if (this.state.selected && this.canMove(this.state.selected, index)) {
      this.move(this.state.selected, index);
    }
  }

  onCellEnter(index) {
    const player = this.state.playerPositions.find(item => item.position === index);
    const enemy = this.state.enemyPositions.find(item => item.position === index);
    if (player) {
      this.gamePlay.showCellTooltip(characterStats(player.character), index);
      this.gamePlay.setCursor(cursors.pointer);
    }
    else if (enemy) {
      this.gamePlay.showCellTooltip(characterStats(enemy.character), index);
      if (this.state.selected) {
        if (this.canAttack(this.state.selected, enemy.position)) {
          this.gamePlay.setCursor(cursors.crosshair);
          this.gamePlay.selectCell(index, 'red');
        }
        else {
          this.gamePlay.setCursor(cursors.notallowed);
        }
      }
    }
    else {
      if (this.state.selected && this.canMove(this.state.selected, index)) {
        this.gamePlay.setCursor(cursors.pointer);
        this.gamePlay.selectCell(index, 'green');
      }
      else {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    }
  }

  onCellLeave(index) {
    const player = this.state.playerPositions.find(item => item.position === index);
    const enemy = this.state.enemyPositions.find(item => item.position === index);
    if (!player) {
      this.gamePlay.deselectCell(index);
    }
    if (player || enemy) {
      this.gamePlay.hideCellTooltip(index);
    }
    this.gamePlay.setCursor(cursors.auto);
  }

  newGame() {
    if (this.state) {
      this.deselectAll();
    }
    this.setTheme(themes.prairie);
    const teamSize = 3;
    const playerCells = generatePositions(teamSize, [0, 1], this.gamePlay.boardSize);
    const enemyCells = generatePositions(teamSize,
      [this.gamePlay.boardSize - 1, this.gamePlay.boardSize - 2],
      this.gamePlay.boardSize);
    const playerPositions = generateTeam([Bowman, Swordsman, Magician], 1, teamSize, playerCells);
    const enemyPositions = generateTeam([Vampire, Undead, Daemon], 1, teamSize, enemyCells);
    this.state = new GameState(playerPositions.characters, enemyPositions.characters);
    this.gamePlay.redrawPositions(this.state.positions);
  }

  saveGame() {
    if (this.state.selected) {
      this.state.selected = null;
    }
    this.stateService.save(this.state);
  }

  loadGame() {
    if (this.state && this.state.selected) {
      this.deselectAll();
    }
    try {
      const loaded = this.stateService.load();
      if (loaded !== null) {
        this.state = GameState.from(loaded);
        this.gamePlay.drawUi(this.state.theme);
        this.gamePlay.redrawPositions(this.state.positions);
      }
    } catch (e) {
      GamePlay.showError(e);
      console.error(e);
    }
  }

  deselectAll() {
    if (this.state.selected) {
      this.state.selected = null;
    }
    for (let i = 0; i < this.gamePlay.boardSize ** 2; i++) {
      this.gamePlay.deselectCell(i);
    }
  }

  canMove(currentPChar, targetIndex) {
    if (this.state.positions.find(pos => pos.position === targetIndex)) {
      return false;
    }
    const position = getCoord(currentPChar.position, this.gamePlay.boardSize);
    const radius = currentPChar.character.movementRadius;
    const target = getCoord(targetIndex, this.gamePlay.boardSize);
    if (Math.abs(target.row - position.row) <= radius
      && Math.abs(target.col - position.col) <= radius
      && (target.col === position.col
        || target.row === position.row
        || Math.abs(target.row - position.row) === Math.abs(target.col - position.col)
      )) {
      return true;
    }
    return false;
  }

  canAttack(currentPChar, targetIndex) {
    if (currentPChar.position === targetIndex)
      return false;
    const target = getCoord(targetIndex, this.gamePlay.boardSize);
    const position = getCoord(currentPChar.position, this.gamePlay.boardSize);
    const radius = currentPChar.character.attackRadius;
    return Math.abs(target.row - position.row) <= radius
      && Math.abs(target.col - position.col) <= radius;
  }

  move(pChar, targetIndex) {
    const currentIndex = pChar.position;
    this.state.positions.find(pos => pos.position === currentIndex).position = targetIndex;
    this.deselectAll();
    this.gamePlay.redrawPositions(this.state.positions);
    this.next();
  }

  attack(pChar, targetPChar) {
    const damage = calcDamage(pChar.character.attack, targetPChar.character.defence);
    targetPChar.character.health -= damage;
    this.gamePlay.showDamage(targetPChar.position, damage.toFixed(0)).then(() => {
      if (targetPChar.character.health <= 0) {
        this.characterDeath(targetPChar);
        if (this.state.enemyPositions.length === 0) {
          this.levelUp(this.state.selected.character);
          this.deselectAll();
          return;
        }
        else if (this.state.playerPositions.length === 0) {
          this.endGame('Вы проиграли!');
          this.deselectAll();
          return;
        }
      }
      this.deselectAll();
      this.gamePlay.redrawPositions(this.state.positions);
      this.next();
    });
  }

  characterDeath(pChar) {
    if (isEnemy(pChar.character)) {
      this.state.enemyPositions.splice(this.state.enemyPositions.indexOf(pChar), 1);
    }
    else {
      this.state.playerPositions.splice(this.state.playerPositions.indexOf(pChar), 1);
    }
    this.gamePlay.redrawPositions(this.state.positions);
  }

  enemyMove() {
    /* Поиск персонажей игрока, которые могут атаковать на следующем ходе,
    и персонажей, которых можно атаковать сейчас,
    вычисление относительного урона */
    const toAvoid = [];
    const toAttack = [];
    this.state.enemyPositions.forEach(enemy => {
      this.state.playerPositions.forEach(player => {
        if (this.canAttack(player, enemy.position)) {
          toAvoid.push({
            enemy: enemy,
            player: player,
            damage: calcDamage(player.character.attack, enemy.character.defence)
              / enemy.character.health
          });
        }
        if (this.canAttack(enemy, player.position)) {
          toAttack.push({
            enemy: enemy,
            player: player,
            damage: calcDamage(enemy.character.attack, player.character.defence)
              / player.character.health
          });
        }
      });
    });
    /* В приоритете наибольший относительный урон:
    который можно нанести, или которого требуется избежать */
    toAvoid.sort((a, b) => b.damage - a.damage);
    toAttack.sort((a, b) => b.damage - a.damage);
    if (toAttack[0] && toAvoid[0]) { // Возможна атака с обех сторон,
      if (toAvoid[0].damage > toAttack[0].damage) { // удар игрока может нанести больший урон
        const avoid = this.searchSafeZone(toAvoid[0].enemy, toAvoid[0].player);
        if (avoid === -1) { // Возможности отступить нет, атакуем игрока
          this.attack(toAttack[0].enemy, toAttack[0].player);
        }
        else { // Персонаж уходит из зоны поражения
          this.move(toAvoid[0].enemy, avoid);
        }
      }
      else { // Атака по игроку выгоднее отступления
        this.attack(toAttack[0].enemy, toAttack[0].player);
      }
    }
    else if (toAttack[0] && toAvoid.length === 0) { // Персонажи противника в безопасной зоне, есть цель 
      this.attack(toAttack[0].enemy, toAttack[0].player);
    }
    else if (toAvoid[0] && toAttack.length === 0) { // Есть опасность со стороны игрока, цели нет
      const safeCell = this.searchSafeZone(toAvoid[0].enemy, toAvoid[0].player);
      if (safeCell === -1) { // Безопасной зоны нет - случайное перемещение по полю
        this.randomEnemyMove();
      }
      else { // Персонаж уходит из зоны поражения 
        this.move(toAvoid[0].enemy, safeCell);
      }
    }
    else { // Доступной цели и опасности нет, случайное перемещение 
      this.randomEnemyMove();
    }
  }

  searchSafeZone(enemy, player) {
    const radius = enemy.character.radius;
    const current = getCoord(enemy.position, this.gamePlay.boardSize);
    const top = current.row - radius < 0 ? 0 : current.row - radius;
    const bottom = current.row + radius >= this.gamePlay.boardSize
      ? this.gamePlay.boardSize - 1
      : current.row + radius;
    const left = current.col - radius < 0
      ? 0
      : current.col - radius;
    const right = current.col + radius >= this.gamePlay.boardSize
      ? this.gamePlay.boardSize - 1
      : current.col + radius;
    const safeCells = [];
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        const index = coordToIndex({ row, col }, this.gamePlay.boardSize);
        if (this.canMove(enemy, index) && !this.canAttack(player, index)) {
          safeCells.push(index);
        }
      }
    }
    if (safeCells.length > 0) {
      return safeCells[Math.floor(Math.random() * safeCells.length)];
    }
    return -1;
  }

  randomEnemyMove() {
    const randomEnemy = this.state.enemyPositions[Math.floor(Math.random()
      * this.state.enemyPositions.length)];
    const current = getCoord(randomEnemy.position, this.gamePlay.boardSize);
    const radius = randomEnemy.character.movementRadius;
    let targetCoord;
    do {
      const direction = Math.floor(Math.random() * 8);
      const step = Math.ceil(Math.random() * radius);
      switch (direction) {
        case 0: targetCoord = { row: current.row - step, col: current.col };
          break;
        case 1: targetCoord = { row: current.row - step, col: current.col + step };
          break;
        case 2: targetCoord = { row: current.row, col: current.col + step };
          break;
        case 3: targetCoord = { row: current.row + step, col: current.col + step };
          break;
        case 4: targetCoord = { row: current.row + step, col: current.col };
          break;
        case 5: targetCoord = { row: current.row + step, col: current.col - step };
          break;
        case 6: targetCoord = { row: current.row, col: current.col - step };
          break;
        default: targetCoord = { row: current.row - step, col: current.col - step };
      }
      targetCoord.row = Math.max(0, Math.min(targetCoord.row, this.gamePlay.boardSize - 1));
      targetCoord.col = Math.max(0, Math.min(targetCoord.col, this.gamePlay.boardSize - 1));
    } while (!this.canMove(randomEnemy, coordToIndex(targetCoord, this.gamePlay.boardSize)));
    this.move(randomEnemy, coordToIndex(targetCoord, this.gamePlay.boardSize));
  }

  next() {
    this.state.playersTurn = !(this.state.playersTurn);
    if (this.state.playersTurn === false) {
      this.enemyMove();
    }
  }

  levelUp(character) {
    if (this.state.level === 4) {
      this.endGame('Вы выиграли!');
      return;
    }
    this.state.level += 1;
    character.level += 1;
    character.attack = Math.max(character.attack,
      character.attack * (80 + character.health) / 100);
    character.defence = Math.max(character.defence,
      character.defence * (80 + character.health) / 100);
    character.health = Math.min(100, character.health + 80);
    const playerPositions = generatePositions(this.state.playerPositions.length, [0, 1], this.gamePlay.boardSize)
    for (let i = 0; i < this.state.playerPositions.length; i++) {
      this.state.playerPositions[i].position = playerPositions[i];
    }
    const teamSize = 3;
    const enemyPositions = generatePositions(teamSize,
      [this.gamePlay.boardSize - 1, this.gamePlay.boardSize - 2],
      this.gamePlay.boardSize);
    const enemyTeam = generateTeam([Vampire, Undead, Daemon],
      Math.max(...this.state.playerPositions.map(pChar => pChar.character.level)),
      teamSize,
      enemyPositions);
    this.state.enemyPositions = enemyTeam.characters;
    this.nextTheme();
    this.gamePlay.redrawPositions(this.state.positions);
  }

  endGame(message) {
    GamePlay.showMessage(message);
    this.gamePlay.container.querySelector('.board').style.pointerEvents = 'none';
  }

  nextTheme() {
    switch (this.state.theme) {
      case themes.prairie:
        this.setTheme(themes.desert);
        break;
      case themes.desert:
        this.setTheme(themes.arctic);
        break;
      case themes.arctic:
        this.setTheme(themes.mountain);
        break;
      default:
        this.setTheme(themes.prairie);
    }
  }

  setTheme(theme) {
    this.gamePlay.drawUi(theme);
    this.state.theme = theme;
  }
}