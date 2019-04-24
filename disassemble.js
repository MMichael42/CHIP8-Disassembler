console.log('CHIP-8 Disassembler');

let dataDiv = document.querySelector('#data');

let fishie = '../roms/Fishie.ch8';
let pong = '../roms/pong.ch8';

// load the file
fetch(pong)
  .then( response => {
    return response.arrayBuffer();
  }).then( buffer => {
    let hexArr = createHexArrayFromBuffer(buffer);
    // console.log(hexArr);

    let numArr = new Uint8Array(buffer);
    // console.log(numArr);

    let pc = 0;
    let outputText = '';

    while(pc < numArr.length) {
      let decode = decodeRom(numArr, pc);
      // console.log(decode);
      outputText += decode + '\n\n';
      pc += 2;
    }
    dataDiv.innerText = outputText;

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

  let highNibbleByte1 = byte1 >> 4; // the high four bits from byte1
  let lowNibbleByte1 = byte1 & 0x0F; // low four bits from byte1
  let highNibbleByte2 = byte2 >> 4; // the hight four bits from byte2
  let lowNibbleByte2 = byte2 & 0x0F; // the low four bits from byte2

  let addressSpace = (0x200 + programCounter).toString(16).toUpperCase(); //chip8 program addr space starts at 0x200
  let AddressAndHexInfo = (addressSpace + ': $' + byte1HexString + byte2HexString + '\n').toUpperCase();
  
  // strings
  let addressHi = highNibbleByte2.toString(16); // high 4 bits of 12bit address
  let registerX = lowNibbleByte1.toString(16); // registerX, lower 4 bits of the first byte
  let registerY = highNibbleByte2.toString(16) // registerY, high 4 bits from second byte
  let lowNibble = lowNibbleByte2.toString(16); // lowest 4 bits of opcode
  let decodedString = '';

  // opcodes key:
  // nnn or addr: 12 bit value, lowest bits of the opcode
  // n or nibble: 4 bit value, lowest bits of the opcode
  // x: 4 bit value, lowest bits of the high byte (byte1) of the opcode
  // y: 4 bit value, highest bits of the low byte (byte2) of the opcode
  // kk o byte: 8 bit value, lowest bits of the opcode (aka byte2);
  switch(highNibbleByte1) {
    case 0x00:
      switch(byte2) {
        case 0xE0:
          //00E0
          // clear screen
          decodedString = 'CLS';
          break;
        case 0xEE:
          // 00EE
          // return from subroutine
          decodedString = 'RET';
          break;
        default:
          decodedString = 'this 0x00 case not handled, NO OP?';
          break;
      }
      break;

    case 0x01:
      // 1nnn
      // jump to address nnn
      decodedString = `JP #$${addressHi}${byte2HexString}`;
      break;

    case 0x02:
      // 2nnn
      // Calls subroutine at nnn
      decodedString = `CALL #$${addressHi}${byte2HexString}`;
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
      // 5xy0
      // Skip next instruction if Vx == Vy
      decodedString = `SE V${registerX}, V${registerY}`;
      break;

    case 0x06:
      // 6xkk
      // Sets Vx to kk
      decodedString = `LD V${registerX}, #$${byte2HexString}`;
      break;

    case 0x07:
      // 7xkk
      // adds kk to Vx, then stores that in Vx
      decodedString =  `ADD V${registerX}, #$${byte2HexString}`;
      break;

    case 0x08:      
      // check the lower four bits to find out what insturction to run
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
        default:
          decodedString = 'this 0x08 case not handled yet';
          break;
      }
      break;
      
    case 0x09:
      // 9xy0
      // skip next instruction if Vx != Vy
      decodedString = `SNE V${registerX}, V${registerY}`;
      break;

    case 0x0A:
      // Annn
      // sets I = nnn
      decodedString = `LD I, #$${addressHi}${byte2HexString}`;
      break;

    case 0x0B:
      // Bnnn
      // jump to location nnn + V0
      decodedString = `JP V0, #$${addressHi}${byte2HexString}`;
      break;

    case 0x0C:
      // Cxkk
      // set Vx = random byte AND kk
      decodedString = `RND V${registerX}, #$${byte2HexString}`;
      break;

    case 0x0D:
      // Dxyn
      // display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
      decodedString = `DRW V${registerX}, V${registerY}, ${lowNibble}`;
      break;

    case 0x0E:
      switch(byte2) {
        case 0x9E:
          // Ex9E
          // skip next instruction if key with the value of Vx is pressed
          decodedString = `SKP V${registerX}`;
          break;
        case 0xA1:
          // ExA1
          // skip next insturction if key with the value of Vx is not pressed
          decodedString = `SKNP V${registerX}`;
          break;
        default:
          decodedString = 'this 0x0E not handled yet';
          break;
      }
      break;

    case 0x0F:
      switch(byte2) {
        case 0x07:
          // Fx07
          // set Vx = delay timer value
          decodedString = `LD V${registerX}, DT`;
          break;
        case 0x0A:
          // Fx0A
          // wait for a key press, store the value of the key press into Vx
          decodedString = `LD V${registerX}, K`;
          break;
        case 0x15:
          // Fx15
          // set delay timer = Vx
          decodedString = `LD DT, V${registerX}`;
          break;
        case 0x18:
          // Fx18
          // set sound timer = Vx
          decodedString = `LD ST, V${registerX}`;
          break;
        case 0x1E:
          // Fx1E
          // Set I = I + Vx
          decodedString = `ADD I, V${registerX}`;
          break;
        case 0x29:
          // Fx29
          // set I = location of sprite for digit Vx
          decodedString = `LD F, V${registerX}`;
          break;
        case 0x33:
          // Fx33
          // store BCD represenation of Vx in memory locations I, I+1, and I+2
          decodedString = `LD B, V${registerX}`;
          break;
        case 0x55:
          // Fx55
          // store registers V0 through Vx in memory starting at location I
          decodedString = `LD [I], V${registerX}`;
          break;
        case 0x65:
          // Fx65
          // read registers V0 through Vx from memory location I
          decodedString = `LD V${registerX}, [I]`;
          break;
        default:
          decodedString = 'this 0x0F not handled yet';
          break;
      }
      break;
      
    default:
      decodedString = 'unrecongized opcode - something went wrong';
      break;
  }
  return (AddressAndHexInfo + decodedString).toUpperCase();
}
