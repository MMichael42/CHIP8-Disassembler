console.log('CPU loaded');

let Chip8 = function() {
  let memory = new ArrayBuffer(0xfff); // 4096 bytes
  this.memory = new Uint8Array(memory);
  this.stack = new Array(16);
  this.stackPointer = 0;
  this.programCounter = 0;
  this.v = new Array(16); // registers v0 - vF
  this.I = null; // index register
  this.cycleCount = 0;

  // display
  this.displayWidth = 64;
  this.displayHeight = 32;
  this.display = new Array(this.displayWidth * this.displayHeight);

  // timers
  this.soundTimer = 0;
  this.delayTimer = 0;

  // flags
  this.running = false;
  this.drawFlag = false;

  // input
  this.keys = new Array(16);
}

Chip8.prototype = {
  init: function() {
    console.log('init CPU');
    this.cycleCount = 0;
    this.programCounter = 0x200;
    this.I = 0;
    this.stackPointer = 0;
    this.running = true;

    // clear memory
    for (let i = 0; i < this.memory.length; i++) {
      this.memory[i] = 0x0;
    }

    // font set
    const hexChars = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ];

    // load font set into memory
    for (let i = 0; i < hexChars.length; i++) {
      this.memory[i] = hexChars[i];
    }
  
    // clear the display
    for (let i = 0; i < this.display.length; i++) {
      this.display[i] = 0x0;
    }

    // reset stack, registers, and keys
    for (let i = 0; i < 16; i++) {
      this.stack[i] = 0x0;
      this.v[i] = 0x0;
      this.keys[i] = 0x0;
    }
  },

  loadROM: function(rom) {
    console.log('load rom');
    for (let i = 0; i < rom.length; i++) {
      this.memory[i + 0x200] = rom[i];
    }
  },

  run: function() {
    console.log('run');
    const self = this; // use closure to keep reference to 'this' for the requestAnimationFrame function
    requestAnimationFrame(function me() {
      if (self.running) {
        for (let i = 0; i < 10; i++) {
          // check again so we don't try to step the CPU 
          // needlessly 10 times when it's not running
          if (self.running) {
            self.emulateCycle();
          }
        }
      }

      if (self.drawFlag) {
        console.log('draw call');
        self.drawFlag = false;
      }

      // handle timers here if cycle count is what exactly?
      // if (!(self.cycleCount % 2)) {
      //   self.handleTimers();
      // }

      requestAnimationFrame(me);
    });
  },

  handleTimers: function() {
    console.log('timers');
  },

  emulateCycle: function() {
    this.cycleCount++;
    
    // fetch opcode
    const opcode = this.memory[this.programCounter] << 8 | this.memory[this.programCounter + 1];
    console.log('opcode: ' + opcode.toString(16));


    // execute opcode
    switch (opcode & 0xF000) {
      case 0x0000:
        switch (opcode & 0x000F) {
          case 0x000:
            // 00E0 - clear screen
            for (let i = 0; i < this.display.length; i++) {
              this.display[i] = 0x0;
            }
            this.drawFlag = true;
            this.programCounter += 2;
            break;
          case 0x000E:
            // 00EE - return from subroutine
            this.stackPointer--;
            this.programCounter = this.stack[this.stackPointer];
            this.programCounter += 2;
            break;
          default:
            console.log('unknown opcode ' + opcode.toString(16));
            console.log('cycles: ' + this.cycleCount)
            this.running = false;
            break;
        }
        break;
      case 0x1000:
        // 1NNN - jumps to address NNN
        this.programCounter = opcode & 0x0FFF;
        break;
      case 0x2000:
        // 2NNN - calls subroutine at NNN
        this.stack[this.stackPointer] = this.programCounter;
        this.stackPointer++;
        this.programCounter = opcode & 0x0FFF;
        break;
      case 0x3000:
        // 3XNN - skips the next instruction if Vx === NN
        if (this.v[(opcode & 0x0F00) >> 8] === (opcode & 0x00FF)) {
          this.programCounter += 4;
        } else {
          this.programCounter += 2;
        }
        break;
      case 0x5000:
        // 5XY0 - skips the next opcode if Vx === Vy
        if (this.v[(opcode & 0x0F00) >> 8] === this.v[(opcode & 0x00F0) >> 4]) {
          this.programCounter += 4;
        } else {
          this.programCounter += 2;
        }
        break;
      case 0x6000:
        // 6XNN - sets Vx to NN
        this.v[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
        this.programCounter += 2;
        break;
      case 0x7000:
        // 7XNN - Adds NN to Vx
        this.v[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
        this.programCounter += 2;
        break;
      case 0x8000:
        switch (opcode & 0x000F) {
          case 0x0000:
            // 8XY0 - sets Vx to the value of Vy
            this.v[(opcode & 0x0F00) >> 8] = this.v[(opcode & 0x00F0) >> 4];
            this.programCounter += 2;
            break;
          case 0x0004:
            // 8XY4 - adds Vy to Vx. 
            // VF is set to 1 when there's a carry
            // VF set to 0 when there isn't a carry
            this.v[(opcode & 0x0F00) >> 8] += this.v[(opcode & 0x00F0) >> 4];
            if (this.v[(opcode & 0x00F0) >> 4] > (0xFF - this.v[(opcode & 0x0F00 >> 8)])) {
              this.v[0xF] = 1;
            } else {
              this.v[0xF] = 0;
            }
            this.programCounter += 2;
            break;
          case 0x0005:
            // 8XY5 - Vy subtracted from Vx
            // VF set to 0 when there's a borrow
            // VF set to 1 when there isn't
            if (this.v[(opcode & 0x00F0) >> 4] > this.v[(opcode & 0x0F00) >> 8]) {
              // there is a borrow
              this.v[0xF] = 0;
            } else {
              // no borrow
              this.v[0xF] = 1;
            }
            this.v[(opcode & 0x0F00) >> 8] -= this.v[(opcode & 0x00F0) >> 4];
            this.programCounter += 2;
            break;
          default:
            console.log('unhandled 0x8000 opcode: ' + opcode.toString(16));
            console.log('cycles: ' + this.cycleCount);
            this.running = false;
        }
        break;
      case 0x9000:
        // 9XY0 - skips the next opcode if Vx !== Vy
        if (this.v[(opcode & 0x0F00) >> 8] !== this.v[(opcode & 0x00F0) >> 4]) {
          this.programCounter += 4;
        } else {
          this.programCounter += 2;
        }
        break;
      case 0xA000:
        // ANNN - sets I to the addess NNN
        this.I = opcode & 0x0FFF;
        this.programCounter += 2;
        break;
      case 0xC000:
        // CXNN - sets Vx to a random numbers, masked by NN
        this.v[(opcode & 0x0F00) >> 8] = Math.floor(Math.random() * 0xFF) & (opcode & 0x00FF);
        this.programCounter += 2;
        break;
      case 0xD000:
        // DXYN - draws sprite at display pos Vx, Vy, with
        // width of 8 pixels, height of N pixels
        // each row of 8 pixels is read as bit-coded starting
        // from memory location I
        // I value doesn't change after the calling this instruction
        // VF is set to 1 (collision) if any pixels are flipped from set/unset
        // VF is set to 0 if no pixels are flipped
        const x = this.v[(opcode & 0x0F00) >> 8];
        const y = this.v[(opcode & 0x00F0) >> 4];
        const height = opcode & 0x000F;
        let pixel = null;

        this.v[0xF] = 0;
        for (let yLine = 0; yLine < height; yLine++) {
          pixel = this.memory[this.I + yLine];
          for (let xLine = 0; xLine < 8; xLine++) {
            if ((pixel & (0x80 >> xLine)) != 0) {
              if(this.display[(x + xLine + ((y + yLine) * 64))] == 1) {
                // a pixel has been set/unset
                this.v[0xF] = 1;
              }
              this.display[x + xLine + ((y + yLine) * 64)] ^= 1;
            }
          }
        }
        this.drawFlag = true;
        this.programCounter += 2;
        break;
      case 0xF000:
        // FX__
        switch(opcode & 0x0FF) {
          case 0x0007:
            // FX07 - ses Vc to the value of the delay timer
            this.v[(opcode & 0x0F00) >> 8] = this.delayTimer;
            this.programCounter += 2;
            break;
          case 0x000A:
            // FX0A - a key press is awaited, then stored in Vx
            let keyPressed = false;
            for (let i = 0; i < 16; i++) {
              if (this.keys[i] != 0) {
                this.v[(opcode & 0x0F00) >> 8] = i;
                keyPressed = true;
              }
            }
            if (!keyPressed) {
              return;
            }
            this.programCounter += 2;
            break;
          case 0x0015:
            // FX15 - sets the delay timer to Vx
            this.delayTimer = this.v[(opcode & 0x0F00) >> 8];
            this.programCounter += 2;
            break;
          case 0x0018:
            // FX18 - sets the sound timer to Vx
            this.soundTimer = this.v[(opcode & 0x0F00) >> 8];
            this.programCounter += 2;
            break;
          case 0x001E:
            // FX1E - adds Vx to I
            // VF is set to 1 when range overflow: I + Vx > 0xFFF
            if (this.I + this.v[(opcode & 0x0F00) >> 8] > 0xFFF) {
              this.v[0xF] = 1;
            } else {
              this.v[0xF] = 0;
            }
            this.I += this.v[(opcode & 0x0F00) >> 8];
            this.programCounter += 2;
            break;
          case 0x029:
            // FX29 - sets I to te location of the sprite for the character in Vx
            this.I = this.v[(opcode & 0x0F00) >> 8] * 0x5; // ?
            this.programCounter += 2;
            break;
          case 0x0033:
            // FX33 - stores the binary coded decimal representation of Vx
            // at the addresses I, I plus 1, and I plus 2
            this.memory[this.I]     = this.v[(opcode & 0x0F00) >> 8] / 100;
            this.memory[this.I + 1] = (this.v[(opcode & 0x0F00) >> 8] / 10 ) % 10;
            this.memory[this.I + 2] = this.v[(opcode & 0x0F00) >> 8] % 10; 
            this.programCounter += 2;
            break;
          case 0x0055:
            // FX55 - stores V0 to Vx in memory starting at address I
            for (let i = 0; i <= this.v[(opcode & 0x0F00) >> 8]; i++) {
              this.memory[this.I + i] = this.v[i];
            }
            // in original interpreter, when this operation is done
            // I = I + Vx + 1;
            this.I += ((opcode & 0x0F00) >> 8) + 1;
            this.programCounter += 2;
            break;
          case 0x0065:
            for (let i = 0; i <= this.v[(opcode & 0x0F00) >> 8]; i++) {
              this.v[i] = this.memory[this.I + i];
            }
            // in original interpreter, when this operation is done
            // I = I + Vx + 1;
            this.I += ((opcode & 0x0F00) >> 8) + 1;
            this.programCounter += 2;
            break;
          default:
            console.log('unknown opcode: ' + opcode.toString(16));
            this.running = false;
        }
        break;
      default:
        console.log('opcode not handled: ' + opcode.toString(16));
        console.log('CPU cycle: ' + this.cycleCount);
        this.running = false;
    }
  }
}

export default Chip8;