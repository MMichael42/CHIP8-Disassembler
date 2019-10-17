console.log('index');
import CPU from '/js/cpu.js';
import DisplayRenderer from '/js/renderer.js';

const pong = '/roms/pong.ch8';

async function loadFile(fileDirStr) {
  let response = await fetch(fileDirStr);
  let data = await response.arrayBuffer();
  return data;
}


loadFile(pong).then ( data => {
  console.log('pong loaded');
  let cpu = new CPU();
  cpu.reset();
  cpu.loadROM(new Uint8Array(data));
  cpu.printMemory();
  cpu.run();
});

