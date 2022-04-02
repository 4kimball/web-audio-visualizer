class App {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    document.body.appendChild(this.canvas);

    this.pixelRatio = window.devicePixelRatio > 1 ? 2 : 1;

    window.addEventListener("resize", this.resize.bind(this), false);
    this.resize();

    // audio
    this.audioCtx = new (AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.distortion = this.audioCtx.createWaveShaper();
    this.gainNode = this.audioCtx.createGain();
    this.biquadFilter = this.audioCtx.createBiquadFilter();
    this.convolver = this.audioCtx.createConvolver();

    this.getUserMedia();
  }

  resize() {
    this.stageWidth = document.body.clientWidth;
    this.stageHeight = document.body.clientHeight;

    this.canvas.width = this.stageWidth * this.pixelRatio;
    this.canvas.height = this.stageHeight * this.pixelRatio;

    this.ctx.scale(this.pixelRatio, this.pixelRatio);
  }

  getUserMedia() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.source = this.audioCtx.createMediaStreamSource(stream);
        this.source.connect(this.distortion);
        this.distortion.connect(this.biquadFilter);
        this.biquadFilter.connect(this.gainNode);
        this.convolver.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        this.visualize();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  visualize() {
    this.analyser.fftSize = 2048;
    this.bufferLength = this.analyser.fftSize;
    this.dataArray = new Uint8Array(this.bufferLength);

    this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);

    this.draw();
  }

  draw() {
    window.requestAnimationFrame(this.draw.bind(this));
    this.analyser.getByteTimeDomainData(this.dataArray);

    this.ctx.fillStyle = "rgba(200, 200, 200)";
    this.ctx.fillRect(0, 0, this.stageWidth, this.stageHeight);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "#000";

    this.ctx.beginPath();

    this.sliceWidth = (this.stageWidth * 1.0) / this.bufferLength;
    let x = 0;

    for (let i = 0; i < this.bufferLength; i++) {
      let v = this.dataArray[i] / 128.0;
      let y = (v * this.stageHeight) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      x += this.sliceWidth;
    }

    this.ctx.lineTo(this.stageWidth, this.stageHeight / 2);
    this.ctx.stroke();
  }
}

window.onload = () => {
  new App();
};
