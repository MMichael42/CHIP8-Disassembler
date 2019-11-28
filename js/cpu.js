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
  this.renderer = null;
  this.frameRequestID = null;

  // timers
  this.soundTimer = 0;
  this.delayTimer = 0;

  // flags
  this.running = false;
  this.drawFlag = false;

  // input, prefill with 0
  this.keys = Array(16).fill(0);
}

Chip8.prototype = {
  setRenderer: function(renderer) {
    this.renderer = renderer;
  },

  init: function() {
    console.log('init CPU');
    this.cycleCount = 0;
    this.programCounter = 0x200;
    this.I = 0;
    this.stackPointer = 0;
    this.running = true;

    // cancel animation frame request if there is one currently running
    if (this.frameRequestID) {
      cancelAnimationFrame(this.frameRequestID);
    }
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
    // console.log(this.memory);
  
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
    // this.keys[5] = 1; 
    // console.log(this.keys);
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
      if (self.drawFlag) {
        self.renderer.render(self.display);
        self.drawFlag = false;
      }

      for (let i = 0; i < 10; i++) {
        if (self.running) {
          // step the cpu
          self.emulateCycle();
        }
      }
  
      self.frameRequestID = requestAnimationFrame(me);
    });
  },

  kill: function() {
    this.running = false;
    cancelAnimationFrame = this.frameRequestID;
  },

  emulateCycle: function() {
    this.cycleCount++;
    
    // fetch opcode
    const opcode = this.memory[this.programCounter] << 8 | this.memory[this.programCounter + 1];
    // console.log('opcode: ' + opcode.toString(16));

    const Vx = (opcode & 0x0F00) >> 8;
    const Vy = (opcode & 0x00F0) >> 4;
    const nn = opcode & 0x00FF;
    const nnn = opcode & 0x0FFF;

    // execute opcode
    switch (opcode & 0xF000) {
      case 0x0000:
        // 00E_
        switch (opcode & 0x000F) {
          case 0x000:
            // 00E0 - clear screen
            console.log('clear screen');
            for (let i = 0; i < this.display.length; i++) {
              this.display[i] = 0;
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
        this.programCounter = nnn;
        break;
      case 0x2000:
        // 2NNN - calls subroutine at NNN
        this.stack[this.stackPointer] = this.programCounter;
        this.stackPointer++;
        this.programCounter = nnn;
        break;
      case 0x3000:
        // 3XNN - skips the next instruction if Vx === NN
        if (this.v[Vx] === nn) {
          this.programCounter += 4;
        } else {
          this.programCounter += 2;
        }
        break;
      case 0x4000:
        // 4XNN - skips next instrution if Vx does not equal NN
        if (this.v[Vx] !== nn) {
          this.programCounter += 4;
        } else {
          this.programCounter += 2;
        }
        break;
      case 0x5000:
        // 5XY0 - skips the next opcode if Vx === Vy
        if (this.v[Vx] === this.v[Vy]) {
          this.programCounter += 4;
        } else {
          this.programCounter += 2;
        }
        break;
      case 0x6000:
        // 6XNN - sets Vx to NN
        this.v[Vx] = nn;
        this.programCounter += 2;
        break;
      case 0x7000:
        // 7XNN - Adds NN to Vx
        this.v[Vx] += nn;
        if (this.v[Vx] > 0xFF) {
          // checking for overflow
          this.v[Vx] -= 256;
        }
        this.programCounter += 2;
        break;
      case 0x8000:
        // console.log('0x8000');
        // console.log(opcode.toString(16));
        switch (opcode & 0x000F) {
          case 0x0000:
            // 8XY0 - sets Vx to the value of Vy
            this.v[Vx] = this.v[Vy];
            this.programCounter += 2;
            break;
          case 0x0001:
            // 8XY1 - set Vx = Vx OR Vy
            this.v[Vx] = this.v[Vx] | this.v[Vy];
            this.programCounter += 2;
            break;
          case 0x0002:
            // 8XY2 - sets Vx to (Vx & Vy)
            this.v[Vx] &= this.v[Vy];
            this.programCounter += 2;
            break;
          case 0x0003:
            // 8XY3 - sets Vx to (Vx XOR Vy)
            this.v[Vx] ^= this.v[Vy];
            this.programCounter += 2;
            break;
          case 0x0004:
            // 8XY4 - adds Vy to Vx. 
            // VF is set to 1 when there's a carry
            // VF set to 0 when there isn't a carry
            this.v[Vx] += this.v[Vy];
            if (this.v[Vx] > 0xFF) {
              this.v[0xF] = 1;
              this.v[Vx] -= 256;
            } else {
              this.v[0xF] = 0;
            }
            this.programCounter += 2;
            break;
          case 0x0005:
            // 8XY5 - Vy subtracted from Vx
            // VF set to 0 when there's a borrow
            // VF set to 1 when there isn't

            if (this.v[Vy] > this.v[Vx]) {
              // there is a borrow
              this.v[0xF] = 0;
            } else {
              this.v[0xF] = 1;
            }

            this.v[Vx] -= this.v[Vy];

            // check for underflow and correct if true
            if (this.v[Vx] < 0x00) {
              this.v[Vx] = 0xFF - (Math.abs(this.v[Vx] + 1));
            }
            this.programCounter += 2;
            break;
          case 0x0006:
            // 8XY6 - shifts Vx right by one. 
            // VF set to the value of least significant bit of Vx before the shift
            this.v[0xF] = this.v[Vx] & 0x1;
            this.v[Vx] >>= 1;
            this.programCounter += 2;
            break;
          case 0x000E:
            // 8XYE - shifts Vx left by one
            // VF set to least signifcnat bit of Vx before shit
            this.v[0xF] = this.v[Vx] >> 7;
            this.v[Vx] <<= 1; // multiply by 2 ? this could be overflowing?
            if (this.v[Vx] > 255) {
              this.v[Vx] -= 256
            }
            this.programCounter += 2;
            break;
          default:
            console.log('unhandled 0x8000 opcode: ' + opcode.toString(16));
            console.log('cycles: ' + this.cycleCount);
            this.running = false;
        }
        // console.log('unknown 0x8000? : ' + opcode.toString(16));
        // this.running = false;
        break;
      case 0x9000:
        // 9XY0 - skips the next opcode if Vx !== Vy
        if (this.v[Vx] !== this.v[Vy]) {
          this.programCounter += 4;
        } else {
          this.programCounter += 2;
        }
        break;
      case 0xA000:
        // ANNN - sets I to the addess NNN
        this.I = nnn;
        this.programCounter += 2;
        break;
      case 0xC000:
        // CXNN - sets Vx to a random numbers, masked by NN
        this.v[Vx] = (Math.floor(Math.random() * 0xFF)) & nn;
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
        const x = this.v[Vx];
        const y = this.v[Vy];
        const height = opcode & 0x000F;
        let pixel = null;

        this.v[0xF] = 0;

        for (let yLine = 0; yLine < height; yLine++) {
          pixel = this.memory[this.I + yLine];

          for (let xLine = 0; xLine < 8; xLine++) {

            if ((pixel & (0x80 >> xLine)) !== 0) {

              if (this.display[(x + xLine + ((y + yLine) * 64))] === 1) {
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
      case 0xE000:
        // EX__
        switch (opcode & 0x00FF) {
          case 0x009E:
            //EX9E - skips next opcode if the key stored at index Vx is active
            console.log('EX9E - control opcode');
            if (this.keys[this.v[Vx]] !== 0) {
              console.log('key pressed!');
              this.programCounter += 4;
            } else {
              this.programCounter += 2;
            }
            break;
          case 0x00A1:
            // EXA1 - skips next opcode if the key stored at index Vx isn't active
            if (this.keys[this.v[Vx]] === 0) {
              this.programCounter += 4;
            } else {
              console.log('key pressed!');
              this.programCounter += 2;
            }
            break;
          default:
            console.log('unhandled EX__ opcode: ' + opcode.toString(16));
            this.running = false;
        }
        break;
      case 0xF000:
        // FX__
        switch(opcode & 0x0FF) {
          case 0x0007:
            // FX07 - ses Vx to the value of the delay timer
            this.v[Vx] = this.delayTimer;
            this.programCounter += 2;
            break;
          case 0x000A:
            // FX0A - a key press is awaited, then stored in Vx
            let keyPressed = false;
            for (let i = 0; i < 16; i++) {
              if (this.keys[i] !== 0) {
                this.v[Vx] = i;
                keyPressed = true;
              }
            }
            if (!keyPressed) {
              // should we increment program counter here?
              return;
            }
            this.programCounter += 2;
            break;
          case 0x0015:
            // FX15 - sets the delay timer to Vx
            this.delayTimer = this.v[Vx];
            this.programCounter += 2;
            break;
          case 0x0018:
            // FX18 - sets the sound timer to Vx
            this.soundTimer = this.v[Vx];
            this.programCounter += 2;
            break;
          case 0x001E:
            // FX1E - adds Vx to I
            // VF is set to 1 when range overflow: I + Vx > 0xFFF
            // ? 0xFFF? should it be 0xFF?
            if (this.I + this.v[Vx] > 0xFFF) {
              this.v[0xF] = 1;
            } else {
              this.v[0xF] = 0;
            }
            this.I += this.v[Vx];
            this.programCounter += 2;
            break;
          case 0x029:
            // FX29 - sets I to the location of the sprite for the character in Vx
            this.I = this.v[Vx] * 0x5; // ? why .5, and should we be rounding it?
            this.programCounter += 2;
            break;
          case 0x0033:
            // FX33 - stores the binary coded decimal representation of Vx
            // at the addresses I, I plus 1, and I plus 2
            // should these be rounded down?
            this.memory[this.I]     = this.v[Vx] / 100;
            this.memory[this.I + 1] = (this.v[Vx] / 10 ) % 10;
            this.memory[this.I + 2] = this.v[Vx] % 10; 
            this.programCounter += 2;
            break;
          case 0x0055:
            // FX55 - stores V0 to Vx in memory starting at address I
            for (let i = 0; i <= Vx; i++) {
              this.memory[this.I + i] = this.v[i];
            }
            // in original interpreter, when this operation is done
            // I = I + Vx + 1;
            this.I += Vx + 1;
            this.programCounter += 2;
            break;
          case 0x0065:
            // FX65 - Read registers V0 through Vx from memory starting at location I.
            for (let i = 0; i <= Vx; i++) {
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

    //  check for overflow
    if (this.v[Vx] > 0xFF 
      || this.v[Vy] > 0xFF 
      || this.I > 0xFFFF 
      || this.soundTimer > 0xFF 
      || this.delayTimer > 0xFF) {
      console.log('OVERFLOW!');
      console.log('opcode: ' + opcode.toString(16));
      console.log('Vx: ' + this.v[Vx]);
      console.log('Vy: ' + this.v[Vy]);
      console.log('I: ' + this.I.toString(16));
      console.log('soundTimer: ' +  this.soundTimer);
      console.log('delayTimer: ' + this.delayTimer);
      this.running = false;
    }

    //  check for underflow
    if (this.v[Vx] < 0x00 
      || this.v[Vy] < 0x00 
      || this.I < 0x00 
      || this.soundTimer < 0x00 
      || this.delayTimer < 0x00) {
      console.log('UNDERFLOW!');
      console.log('opcode: ' + opcode.toString(16));
      console.log('Vx: ' + this.v[Vx]);
      console.log('Vy: ' + this.v[Vy]);
      console.log('I: ' + this.I.toString(16));
      console.log('soundTimer: ' +  this.soundTimer);
      console.log('delayTimer: ' + this.delayTimer);
      this.running = false;
    }

    // check timers
    if (this.delayTimer > 0) {
      this.delayTimer--;
    }
    if (this.soundTimer > 0) {
      if (this.soundTimer === 1) {
        // console.log('beep!');
      }
      this.soundTimer--;
    }
  }
}

export default Chip8;