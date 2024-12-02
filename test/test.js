import { calcTileType, characterStats } from '../src/js/utils';
import { characterGenerator, generateTeam, generatePositions } from '../src/js/generators';
import Character from '../src/js/Character';
import Bowman from '../src/js/characters/Bowman';
import Swordsman from '../src/js/characters/Swordsman';
import Magician from '../src/js/characters/Magician';
import Vampire from '../src/js/characters/Vampire';
import Undead from '../src/js/characters/Undead';
import Daemon from '../src/js/characters/Daemon';
import PositionedCharacter from '../src/js/PositionedCharacter';
import GameController from '../src/js/GameController';
import GamePlay from '../src/js/GamePlay';
import GameState from '../src/js/GameState';
import GameStateService from '../src/js/GameStateService';

test('calcTileType tests', () => {
  const expected = [
    'top-left', 'top-right', 'top',
    'left', 'right', 'center',
    'bottom-left', 'bottom-right', 'bottom'
  ];
  const input = [
    [0, 8], [6, 7], [1, 8],
    [7, 7], [15, 8], [9, 8],
    [56, 8], [63, 8], [47, 7]
  ];
  const output = input.map(e => calcTileType(e[0], e[1]));
  expect(output).toEqual(expected);
});

test('Character instance test', () => {
  expect(() => new Character(1)).toThrow(TypeError);
});

describe('Character classes:', () => {
  test.each([
    [new Bowman(1), 25, 25],
    [new Swordsman(1), 40, 10],
    [new Magician(1), 10, 40],
    [new Vampire(1), 25, 25],
    [new Undead(1), 40, 10],
    [new Daemon(1), 10, 10],
    [new Bowman(3), 57, 57],
    [new Swordsman(3), 93, 23],
    [new Magician(3), 23, 93],
    [new Vampire(2), 32, 32],
    [new Undead(2), 52, 13],
    [new Daemon(2), 13, 13]
  ])(`instance creation test`, (character, attack, defence) => {
    expect([character.attack, character.defence]).toEqual([attack, defence]);
  });
});

describe('characterGenerator test:', () => {
  const maxLevel = 5;
  const playerGenerator = characterGenerator([Swordsman, Bowman], maxLevel);
  const characters = [];
  for (let i = 0; i < 15; i++) {
    characters.push(playerGenerator.next().value)
  }

  test.each(characters)('valid level', character => {
    expect(character.level).toBeGreaterThanOrEqual(1);
    expect(character.level).toBeLessThanOrEqual(maxLevel);
  });

  test.each(characters)('valid class', character => {
    expect(character instanceof Swordsman || character instanceof Bowman).toBe(true);
  });
});

describe('generatePositions test for 4 characters, columns 6 & 7, 8x8 board', () => {
  const output = generatePositions(4, [6, 7], 8);
  test('genereted array size', () => {
    expect(output.length).toBe(4);
  });
  test.each(output)('valid values', value => {
    const possibleValues = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
    expect(possibleValues).toContain(value);
  });
});


describe('generateTeam test:', () => {
  const maxLevel = 3;
  const count = 4;
  const team = generateTeam([Bowman, Swordsman], maxLevel, count, [1, 2, 3, 4]);

  test('team size test', () => {
    expect(team.characters.length).toBe(count);
  });

  test.each(team.characters)('valid team member test', (member) => {
    expect((member.character instanceof Bowman || member.character instanceof Swordsman)
      && member.character.level <= maxLevel).toBe(true);
  });
});

test('characterStats test', () => {
  const character = new Magician(1);
  const expected = '🎖1 ⚔10 🛡40 ❤50';
  expect(characterStats(character)).toBe(expected);
});

describe('canMove tests, for 8 x 8 board, test character at cell 35', () => {
  const currentPos = 35;
  const someOtherCharacter = new PositionedCharacter(new Bowman(1), 27);
  const radius1expected = [26, 28, 34, 36, 42, 43, 44];
  const radius2expected = [17, 19, 21, 26, 28, 33, 34, 36, 37, 42, 43, 44, 49, 51, 53];
  const radius4expected = [3, 7, 8, 11, 14, 17, 19, 21, 26, 28, 32, 33, 34, 36, 37, 38,
    39, 42, 43, 44, 49, 51, 53, 56, 59, 62];
  const input = [{
    character: new PositionedCharacter(new Magician(1), currentPos),
    expected: radius1expected
  },
  {
    character: new PositionedCharacter(new Daemon(1), currentPos),
    expected: radius1expected
  },
  {
    character: new PositionedCharacter(new Bowman(1), currentPos),
    expected: radius2expected
  },
  {
    character: new PositionedCharacter(new Vampire(1), currentPos),
    expected: radius2expected
  },
  {
    character: new PositionedCharacter(new Swordsman(1), currentPos),
    expected: radius4expected
  },
  {
    character: new PositionedCharacter(new Undead(1), currentPos),
    expected: radius4expected
  }];

  test.each(input)('testing movement ranges of each character type', ({ character, expected }) => {
    const controller = new GameController(new GamePlay(), null);
    controller.state = new GameState([character], [someOtherCharacter]);
    const results = [];
    for (let i = 0; i < controller.gamePlay.boardSize ** 2; i++) {
      if (controller.canMove(character, i)) {
        results.push(i);
      }
    }
    expect(results).toEqual(expected);
  });
});

describe('canAttack test, for 8 x 8 board, test character at cell 25', () => {
  const currentPosition = 25;
  const radius1expected = [16, 17, 18, 24, 26, 32, 33, 34];
  const radius2expected = [8, 9, 10, 11,
    16, 17, 18, 19,
    24, 26, 27,
    32, 33, 34, 35,
    40, 41, 42, 43];
  const radius4expected = [0, 1, 2, 3, 4, 5,
    8, 9, 10, 11, 12, 13,
    16, 17, 18, 19, 20, 21,
    24, 26, 27, 28, 29,
    32, 33, 34, 35, 36, 37,
    40, 41, 42, 43, 44, 45,
    48, 49, 50, 51, 52, 53,
    56, 57, 58, 59, 60, 61];
  const input = [
    {
      pChar: new PositionedCharacter(new Swordsman(1), currentPosition),
      expected: radius1expected
    },
    {
      pChar: new PositionedCharacter(new Undead(1), currentPosition),
      expected: radius1expected
    },
    {
      pChar: new PositionedCharacter(new Bowman(1), currentPosition),
      expected: radius2expected
    },
    {
      pChar: new PositionedCharacter(new Vampire(1), currentPosition),
      expected: radius2expected
    },
    {
      pChar: new PositionedCharacter(new Magician(1), currentPosition),
      expected: radius4expected
    },
    {
      pChar: new PositionedCharacter(new Daemon(1), currentPosition),
      expected: radius4expected
    }
  ];
  test.each(input)('testing attack ranges of each type of characters',
    ({ pChar, expected }) => {
      const controller = new GameController(new GamePlay(), null);
      controller.state = GameState.from([pChar], []);
      const results = [];
      for (let i = 0; i < controller.gamePlay.boardSize ** 2; i++) {
        if (controller.canAttack(pChar, i)) {
          results.push(i);
        }
      }
      expect(results).toEqual(expected)
    });
});

describe('GameStateService.load test', () => {
  class StorageMock {
    constructor() {
      this.storage = {};
    }
    getItem(key) {
      return this.storage[key] || null;
    }
    setItem(key, value) {
      this.storage[key] = String(value);
    }
  }

  test('error on load test', () => {
    const controller = new GameController(new GamePlay(), new GameStateService(null));
    GamePlay.showError = jest.fn();
    controller.loadGame();
    expect(controller.stateService.load).toThrow('Invalid state');
    expect(GamePlay.showError).toHaveBeenCalled();
  });

  test('successful load test', () => {
    const controller = new GameController(new GamePlay(), new GameStateService(new StorageMock()));
    controller.state = new GameState(
      [new PositionedCharacter(new Bowman(2), 0)],
      [new PositionedCharacter(new Undead(2), 35)]
    );;
    controller.saveGame();
    controller.state = null;
    controller.loadGame();
    expect(controller.state).toEqual(new GameState(
      [new PositionedCharacter(new Bowman(2), 0)],
      [new PositionedCharacter(new Undead(2), 35)]
    ));
  });
});