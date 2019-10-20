const Renderer = function(canvas, pixelSize) {
  this.context = canvas.getContext('2d');
  this.canvas = canvas;
  this.width = 64;
  this.height = 32;
  this.pixelSize = pixelSize;
  this.fgColor = 'red';
  this.bgColor = 'black';
}

Renderer.prototype = {


  render: function(display) {
    console.log('render draw call');
    this.canvas.width = this.width * this.pixelSize;
    this.canvas.height = this.height * this.pixelSize;

    for (let pixel = 0; pixel < display.length; pixel++) {
      const x = (pixel % this.width) * this.pixelSize;
      const y = Math.floor(pixel / this.width) * this.pixelSize;
      // console.log('x: ' + x + " y: " + y);
      this.context.fillStyle = display[pixel] ? this.fgColor : this.bgColor;
      // this.context.fillStyle = 'green';
      this.context.fillRect(x, y, this.pixelSize, this.pixelSize); 
    }
  }
}

export default Renderer;