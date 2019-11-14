console.log('index');
import CPU from './js/cpu.js';
import Renderer from './js/renderer.js';



const canvas = document.getElementById('screen');
const buttonLoad = document.getElementById('reset');

const cpu = new CPU();
const renderer = new Renderer(canvas, 10);

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

async function loadFile(fileDirStr) {
  let response = await fetch(fileDirStr);
  let data = await response.arrayBuffer();
  return data;
}

buttonLoad.addEventListener('click', event => {
  // console.log(event);
  const selectEleValue = document.getElementById('selectGame').selectedIndex - 1;

  const selectedGame = './roms/' + gameArray[selectEleValue];

  loadFile(selectedGame).then( data => {
    console.log('rom loaded');
    cpu.init();
    cpu.loadROM(new Uint8Array(data));
    cpu.run();
  });

});



