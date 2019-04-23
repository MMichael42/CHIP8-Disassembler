console.log('CHIP-8 Disassembler');

let fishie = '../roms/Fishie.ch8';
let pong = '../roms/pong.ch8';

// load the file
fetch(fishie)
  .then( response => {
    return response.arrayBuffer();
  }).then( buffer => {
    let hexArr = createHexArrayFromBuffer(buffer);
    console.log(hexArr);

    let numArr = new Uint8Array(buffer);
    console.log(numArr);

    let pc = 0;
    let outputText = '';

    while(pc < numArr.length) {
      let decode = decodeRom(numArr, pc);
      console.log(decode);
      outputText += decode + '\n\n';
      pc += 2;
    }
    document.querySelector('body').innerText = outputText;

  });

function createHexArrayFromBuffer(arrBuff) {
  let numArr = new Uint8Array(arrBuff);
  // console.log(numArr);
  let hexArr = [];

  numArr.forEach( num => {
    let hex = num.toString(16).toUpperCase();
    if (hex.length === 1) hex = '0' + hex;
    hexArr.push(hex);
  })

  return hexArr;
}

function createInstructionsArray(hexArray) {
  let instructionsArr = [];

  hexArray.forEach( (byte, index) => {
    if (index % 2 === 0) {
      if (hexArray[index + 1]) {
        instructionsArr.push(byte + hexArray[index + 1]);
      } else {
        instructionsArr.push(byte);
      }
    }
  });

  return instructionsArr;
}


function decodeRom(romBuffer, programCounter) {
  let byte1 = romBuffer[programCounter];
  let byte2 = romBuffer[programCounter + 1];

  let byte1HexString = byte1.toString(16);
  if (byte1HexString.length === 1) byte1HexString = '0' + byte1HexString;
  let byte2HexString = byte2.toString(16);
  if (byte2HexString.length === 1) byte2HexString = '0' + byte2HexString;

  let firstNibble = byte1 >> 4; // the high four bits from byte1
  let addressSpace = (0x200 + programCounter).toString(16).toUpperCase(); //chip8 program addr space starts at 0x200
  let AddressAndHexInfo = (addressSpace + ': $' + byte1HexString + byte2HexString + '\n').toUpperCase();
  let decodedString = '';

  // opcodes
  switch(firstNibble) {
    case 0x00:
      decodedString = '0x00 not handled yet'
      break;
    case 0x01:
      decodedString = '0x01 not handled yet';
      break;
    case 0x02:
      decodedString = '0x02 note handled yet';
      break;
    case 0x03:
      decodedString = '0x03 not handled yet';
      break;
    case 0x04:
      decodedString = '0x04 not handled yet';
      break;
    case 0x05:
      decodedString = '0x05 not handled yet';
      break;
    case 0x06:
      // 6XNN: Sets VX to NN
      let register = (byte1 & 0x0F).toString(16); // this gets the lower 4 bits of the first byte
      decodedString = `MVI V${register}, #$${byte2HexString}`;
      break;
    case 0x07:
      decodedString = '0x07 not handled yet';
      break;
    case 0x08:
      decodedString = '0x08 not handled yet';
      break;
    case 0x09:
      decodedString = '0x09 not handled yet';
      break;
    case 0x0A:
      // ANNN: Sets I to the address NNN;
      let addressHi = (byte1 & 0x0F).toString(16); // high 4 bits of 12bit address
      decodedString = `MVI I, #$${addressHi}${byte2HexString}`;
      break;
    case 0x0B:
      decodedString = '0x0B not handled yet';
      break;
    case 0x0C:
      decodedString = '0x0C not handled yet';
      break;
    case 0x0D:
      decodedString = '0x0D not handled yet';
      break;
    case 0x0E:
      decodedString = '0x0E not handled yet';
      break;
    case 0x0F:
      decodedString = '0x0F not handled yet';
      break;
    default:
      decodedString = 'unrecongized opcode - something went wrong';
      break;
  }
  return AddressAndHexInfo + decodedString;
}

// function decodeRom(romBuffer, programCounter) {
//   console.log(decodeOpcode(romBuffer[programCounter], romBuffer[programCounter + 1]));
// }
