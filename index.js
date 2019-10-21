console.log('index');
import CPU from '/js/cpu.js';
import Renderer from '/js/renderer.js';


const pong = '/roms/pong1.ch8';
const pong2 = '/roms/pong2.ch8';
const stars = '/roms/stars.ch8';
const tetris = '/roms/tetris.ch8';
const maze = '/roms/maze.ch8';
const blinky = '/roms/blinky.ch8';

async function loadFile(fileDirStr) {
  let response = await fetch(fileDirStr);
  let data = await response.arrayBuffer();
  return data;
}

let canvas = document.getElementById('screen');

loadFile(pong2).then( data => {
  console.log('pong loaded');
  let cpu = new CPU();
  const renderer = new Renderer(canvas, 13);
  cpu.setRenderer(renderer);
  cpu.init();
  cpu.loadROM(new Uint8Array(data));
  cpu.run();
});

