const Renderer = function(canvas, pixelSize) {
  this.context = canvas.getContext('2d');
  this.canvas = canvas;
  this.width = 64;
  this.height = 32;
  this.pixelSize = pixelSize;
  this.fgColor = 'green';
  this.bgColor = 'black';
  this.canvas.width = this.width * this.pixelSize;
  this.canvas.height = this.height * this.pixelSize;
}

Renderer.prototype = {

  clear: function () {
    this.context.fillStyle = "green";
    this.context.fillRect(0, 0, this.width * this.pixelSize, this.height * this.pixelSize);
  },


  render: function(display) {
    console.log('render draw call');
    this.clear();
    for (let pixel = 0; pixel < display.length; pixel++) {
      const x = (pixel % this.width) * this.pixelSize;
      const y = Math.floor(pixel / this.width) * this.pixelSize;
      this.context.fillStyle = display[pixel] ? this.fgColor : this.bgColor;
      this.context.fillRect(x, y, this.pixelSize, this.pixelSize); 
    }
  }
}

export default Renderer;