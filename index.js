console.log('index');
import CPU from './js/cpu.js';
import Renderer from './js/renderer.js';

const canvas = document.getElementById('screen');
const buttonLoad = document.getElementById('reset');
const keyboardWrap = document.getElementById('keyboardWrap');

// create the cpu and renderer 
const cpu = new CPU();
const renderer = new Renderer(canvas, 1);
cpu.setRenderer(renderer);

const gameArray = [
  'test.ch8', 
  'pong1.ch8', 
  'pong2.ch8',
  'tetris.ch8', 
  'stars.ch8', 
  'maze.ch8', 
  'blinky.ch8', 
  'invaders.ch8', 
  'ufo.ch8',
  'TRON.ch8',
  'LANDING.ch8'
];

// grab the select element
let selectEle = document.getElementById('selectGame');
// populate it
gameArray.forEach( (game) => {
  let option = document.createElement('option');
  option.textContent = game;
  option.value = game;
  selectEle.appendChild(option);
});

// enable button once the select element has been engaged
selectEle.addEventListener('change', event => {
  buttonLoad.disabled = false;
});

buttonLoad.addEventListener('click', event => {
  const selectEleValue = selectEle.selectedIndex - 1;
  const selectedGame = './roms/' + gameArray[selectEleValue];

  loadFile(selectedGame).then( data => {
    console.log('rom loaded');
    cpu.init();
    cpu.loadROM(new Uint8Array(data));
    cpu.run();
  });
});

keyboardWrap.addEventListener('mousedown', function(event) {
  if (event.target.className === 'key') {
    console.log('mousedown');
    const keyPressed = parseInt(event.target.id);

    switch(keyPressed) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 14:
      case 15:
        console.log('key pressed, id = ' + keyPressed);
        cpu.keys[keyPressed] = 1;
        break;
      default:
        console.log('key not handled');
    }
  }
});

keyboardWrap.addEventListener('mouseup', function(event) {
  console.log('mouseup');
  cpu.keys.forEach( (key, index) => {
    cpu.keys[index] = 0;
  });
});

async function loadFile(filePath) {
  let response = await fetch(filePath);
  let data = await response.arrayBuffer();
  return data;
}