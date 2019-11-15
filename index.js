console.log('index');
import CPU from './js/cpu.js';
import Renderer from './js/renderer.js';



let canvas = document.getElementById('screen');
const buttonLoad = document.getElementById('reset');

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
gameArray.forEach( (game, index) => {
  let option = document.createElement('option');
  option.textContent = game;
  option.value = game;
  selectEle.appendChild(option);
});

// enable button once the select element has been enaged
selectEle.addEventListener('change', event => {
  buttonLoad.disabled = false;
});

buttonLoad.addEventListener('click', event => {
  // console.log(event);
  const selectEleValue = selectEle.selectedIndex - 1;
  const selectedGame = './roms/' + gameArray[selectEleValue];

  loadFile(selectedGame).then( data => {
    console.log('rom loaded');
    cpu.init();
    cpu.loadROM(new Uint8Array(data));
    cpu.run();
  });
});

async function loadFile(fileDirStr) {
  let response = await fetch(fileDirStr);
  let data = await response.arrayBuffer();
  return data;
}
