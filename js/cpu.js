console.log('CPU loaded');

let Chip8 = function() {
  let memory = new ArrayBuffer(0xfff); // 4096 bytes
  this.memory = new Uint8Array(memory);
  this.stack = new Array(16);
  this.stackPointer = 0;
  this.programCounter = 0;
  this.registers = new Array(16); // registers v0 - vF
  this.I = null;

  this.displayWidth = 64;
  this.displayHeight = 32;
  this.display = new Array(this.displayHeight * this.displayWidth);

  this.soundTimer = null;
  this.delayTimer = null;

  this.running = false;
  this.drawFlag = false;
  this.cycleCount = 0;
}

Chip8.prototype = {
  reset: function() {
    console.log('reset CPU');
    this.programCounter = 0x200;
    this.I = 0;
    this.cycleCount = 0;
    this.drawFlag = false;
    this.running = true;
  
    // clear the display
    for (let i = 0; i < this.display.length; i++) {
      this.display[i] = 0x0;
    }

    // reset stack and stack pointer
    this.stackPointer = 0;
    for (let i = 0; i < this.stack.length; i++) {
      this.stack[i] = 0x0;
    }

    // clear registers
    for (let i = 0; i < this.registers.length; i++) {
      this.registers[i] = 0x0;
    }

    // clear memory
    for (let i = 0; i < this.memory.length; i++) {
      this.memory[i] = 0x0;
    }
  },

  loadROM: function(rom) {
    console.log('load rom');
    for(let i = 0; i < rom.length; i++) {
      this.memory[0x200 + i] = rom[i];
    }
  },

  printMemory: function() {
    console.log(this.memory);
  },

  printStack: function() {
    console.log(this.stack);
  },

  run: function() {
    let self = this; // use closure to keep reference to 'this' for the requestAnimationFrame function
    requestAnimationFrame(function me() {
      if (self.running) {
        self.emulateCycle();
      }
      requestAnimationFrame(me);
    });
  },
  
  step: function() {
    this.emulateCycle();
  },

  emulateCycle: function() {
    this.cycleCount++;
    console.log(this.cycleCount);
    // fetch opcode
    const opcode = this.memory[this.programCounter] << 8 | this.memory[this.programCounter + 1];
    console.log('opcode: ' + opcode.toString(16));

    // decode opcode
    const highByte = this.memory[this.programCounter];
    const lowByte = this.memory[this.programCounter + 1];
    const highNibble = opcode >> 12;
    const x = opcode >> 8 & 0x0F;
    const y = opcode >> 4 & 0x0F;
    const lowNibble = opcode & 0x0F;
    const kk = opcode & 0xFF;
    const nnn = opcode & 0xFFF;

    // console.log('high nibble: ' + highNibble.toString(16));
    // console.log('x: ' + x.toString(16));
    // console.log('y: ' + y.toString(16));
    // console.log('low nibble: ' + lowNibble.toString(16));
    // console.log('kk: ' + kk.toString(16));
    // console.log('nnn: ' + nnn.toString(16));

    // execute opcode
    switch (highNibble) {
      case 0x00:
        if (lowByte === 0xE0) {
          // clear the display
          for (let i = 0; i < this.display.length; i++) {
            this.display[i] = 0x0;
          }
          this.drawFlag = true;
        } else if (lowByte === 0xEE) {
          // return from subroutine
          this.programCounter = this.stack.pop();
        } else {
          // 0nnn - SYS addr
          // Jump to a machine code routine at nnn.
          // This instruction is only used on the old computers on which Chip-8 
          // was originally implemented. It is ignored by modern interpreters.
        }
        this.programCounter += 2;
        break;
      case 0x01:
        // Jump to location nnn.
        // The interpreter sets the program counter to nnn.
        this.programCounter = nnn;
        // this.programCounter += 2;
        break;
      case 0x02:
        // 2nnn - CALL addr
        // Call subroutine at nnn.
        // The interpreter increments the stack pointer, then puts the current PC on the top 
        // of the stack. The PC is then set to nnn.
        this.programCounter += 2;
        this.stack.push(this.programCounter);
        this.programCounter = nnn;
        break;
      case 0x03:
        // 3xkk - SE Vx, byte
        // Skip next instruction if Vx = kk.
        // The interpreter compares register Vx to kk, and if they are equal, 
        // increments the program counter by 2.
        if (this.registers[x] === kk) {
          this.programCounter += 2;
        }
        this.programCounter += 2;
        break;
      case 0x06:
        // 6xkk - LD Vx, byte
        // Set Vx = kk.
        // The interpreter puts the value kk into register Vx.
        //console.log('case 0x06');
        this.registers[x] = kk;
        this.programCounter += 2;
        break;
      case 0x07:
        // 7xkk - ADD Vx, byte
        // Set Vx = Vx + kk.
        // Adds the value kk to the value of register Vx, then stores the result in Vx.
        this.registers[x] = this.registers[x] + kk;
        this.programCounter += 2;  
        break;
      case 0x0A:
        // Annn - LD I, addr
        // Set I = nnn.
        // The value of register I is set to nnn.
        //console.log('case 0x0A');
        this.I = nnn;
        this.programCounter += 2;
        break;
      case 0x0D:
        // Dxyn - DRW Vx, Vy, nibble
        // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
        
        /*  
        The interpreter reads n bytes from memory, starting at the address stored in I. 
        These bytes are then displayed as sprites on screen at coordinates (Vx, Vy). 
        Sprites are XORed onto the existing screen. If this causes any pixels to be erased, 
        VF is set to 1, otherwise it is set to 0. If the sprite is positioned so part of it is 
        outside the coordinates of the display, it wraps around to the opposite side of the screen. 
        See instruction 8xy3 for more information on XOR, and section 2.4, Display, for more 
        information on the Chip-8 screen and sprites.
        */
        // console.log('case 0x0D');

        this.drawFlag = true;
        this.programCounter += 2;
        break;
      case 0x0F:
        // Fx07 - LD Vx, DT
        // Set Vx = delay timer value.
        // The value of DT is placed into Vx.
        this.registers[x] = this.delayTimer;
        this.programCounter += 2;
        break;
      default:
        console.log('opcode not handled: ' + opcode.toString(16));
        console.log('program counter: ' + this.programCounter);
        console.log('memory block: ' + this.memory[this.programCounter] + '-' + this.memory[this.programCounter + 1]);
        console.log('stack: ' + this.stack);
        console.log('CPU cycle: ' + this.cycleCount);
        this.running = false;
    }

    // update timers

    if (this.drawFlag) {
      // draw call, request animaitionframe?
      console.log('draw call');
      this.drawFlag = false;
    }
  }
  
}

export default Chip8;