console.log('CHIP-8 Disassembler');

let fishie = '../roms/Fishie.ch8';
let pong = '../roms/pong.ch8';

let bytetest = 0xef;
let masked = (bytetest & 0xf0) >>> 4;
console.log(bytetest.toString(2));
console.log(masked.toString(2));


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
  let lowNibbleFirstByte = byte1 & 0x0F;

  let addressSpace = (0x200 + programCounter).toString(16).toUpperCase(); //chip8 program addr space starts at 0x200
  let AddressAndHexInfo = (addressSpace + ': $' + byte1HexString + byte2HexString + '\n').toUpperCase();
  let addressHi = (byte1 & 0x0F).toString(16); // high 4 bits of 12bit address
  let registerX = (byte1 & 0x0F).toString(16); // registerX, lower 4 bits of the first byte
  let registerY = ((byte2 % 0xF0) >>> 4).toString(16) // registerY, high 4 bits from second byte

  let decodedString = '';

  // opcodes
  switch(firstNibble) {
    case 0x00:
      decodedString = '0x00 not handled yet'

      switch(byte2) {
        case 0xE0:
          // clear screen
          decodedString = 'CLS';
          break;
        case 0xEE:
          // return from subroutine
          decodedString = 'RET';
          break;
      }
      break;
    case 0x01:
      // 1nnn
      // jump to address NNN
      decodedString = `JP #$${addressHi}${byte2HexString}`.toUpperCase();
      break;
    case 0x02:
      // 2nnn
      // Calls subroutine at NNN
      decodedString = `Call #$${addressHi}${byte2HexString}`.toUpperCase();
      break;
    case 0x03:
      // 3xkk
      // Skip next instruction if Vx == kk
      decodedString = `SE V${registerX}, #$${byte2HexString}`;
      break;
    case 0x04:
      // 4xkk
      // Skip next instruction if Vx !== kk
      decodedString = `SNE V${registerX}, #$${byte2HexString}`;
      break;
    case 0x05:
      //5xy0
      // Skip next instruction if Vx == Vy
      decodedString = `SE V${registerX}, V${registerY}`;
      break;
    case 0x06:
      // 6xnn 
      // Sets Vx to NN
      decodedString = `MVI V${registerX}, #$${byte2HexString}`.toUpperCase();
      break;
    case 0x07:
      // 7xkk
      // adds kk to Vx, then stores that in Vx
      decodedString =  `ADD V${registerX}, #$${byte2HexString}`;
      break;
    case 0x08:      
      decodedString = '0x08 not handled yet';
      switch(byte2 & 0x0F) {
        case 0x00:
          // 8xy0
          // set Vx = Vy
          decodedString = `LD V${registerX}, V${registerY}`;
          break;
        case 0x01:
          // 8xy1
          // set Vx = Vx OR Vx
          decodedString = `OR V${registerX}, V${registerY}`;
          break;
        case 0x02:
          // 8xy2
          // set Vx = Vx AND Vy
          decodedString = `AND V${registerX}, V${registerY}`;
          break;
        case 0x03:
          // 8xy3
          // set Vx = Vx OR Vy
          decodedString = `XOR V${registerX}, V${registerY}`;
          break;
        case 0x04:
          // 8xy4
          // set Vx = Vx + Vy, set VF = carry
          decodedString = `ADD V${registerX}, V${registerY}`;
          break;
        case 0x05:
          // 8xy5
          // set Vx = Vx - Vy, set VF = NOT borrow
          decodedString = `SUB V${registerX}, V${registerY}`;
          break;
        case 0x06:
          // 8xy6
          // set Vx = Vx SHR 1
          decodedString = `SHR V${registerX} {, V${registerY}}`;
          break;
        case 0x07:
          // 8xy7
          // set Vx = Vy - Vx, set VF = NOT borrow
          decodedString = `SUBN V${registerX}, V${registerY}`;
          break;
        case 0x0E:
          // 8xyE
          // set Vx = Vx SHL 1
          decodedString = `SHL V${registerX} {, V${registerY}}`;
          break;
      }
      break;
    case 0x09:
      decodedString = '0x09 not handled yet';
      break;
    case 0x0A:
      // ANNN: Sets I to the address NNN;
      addressHi = (byte1 & 0x0F).toString(16); // high 4 bits of 12bit address
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
  return (AddressAndHexInfo + decodedString).toUpperCase();
}
