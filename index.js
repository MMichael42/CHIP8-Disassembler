console.log('index');
import CPU from '/js/cpu.js';
import Renderer from '/js/renderer.js';

const pong = '/roms/pong1.ch8';
const stars = '/roms/stars.ch8';

async function loadFile(fileDirStr) {
  let response = await fetch(fileDirStr);
  let data = await response.arrayBuffer();
  return data;
}

const canvas = document.getElementById('screen');


loadFile(stars).then( data => {
  console.log('pong loaded');
  let cpu = new CPU();
  cpu.init();
  cpu.loadROM(new Uint8Array(data));
  cpu.run();
});

