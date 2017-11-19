function Plotter(fps, drawPointFramesInterval, ball) {
  this.fps = fps;
  this.drawPointFramesInterval = drawPointFramesInterval;
  this.ball = ball;

	this.traceY = {
		x: [],
		y: [],
		type: 'scatter',
		mode: 'lines+markers',
		marker: {
			color: 'rgb(128, 0, 128)',
			size: 4
		},
		line: {
			color: 'rgb(128, 0, 128)',
			width: 1,
			simplify: false,
		},
		domID: 'y-plot'
	};
	this.traceX = JSON.parse(JSON.stringify(this.traceY));
	this.traceX.domID = 'x-plot';
	this.traceZ = JSON.parse(JSON.stringify(this.traceY));
	this.traceZ.domID = 'z-plot';
	this.plotDatas = {x: [this.traceX], y: [this.traceY], z: [this.traceZ]};

	//layouts
	this.layoutY = {
		title: 'time vs y-axis',
		xaxis: {
			range: [0, 6],
			showgrid: true,
			zeroline: true,
			showline: true,
			ticks: 'outside',
			title: 'time (s)'
		},
		yaxis: {
			range: [0, 25],
			showgrid: true,
			zeroline: true,
			showline: true,
			ticks: 'outside',
			title: 'y-axis (vertical)'
		},
		autosize: false,
		width: screenWidth/3,
		height: 280,
		paper_bgcolor: '#ffe0b3',
		plot_bgcolor: '#fff5e6'
	}
	this.layoutX = JSON.parse(JSON.stringify(this.layoutY));
	this.layoutX.title = 'time vs x-axis';
	this.layoutX.yaxis.title = 'x-axis';
	this.layoutX.yaxis.range = [-20, 20];
	this.layoutZ =JSON.parse(JSON.stringify(this.layoutY));
	this.layoutZ.title = 'time vs z-axis';
	this.layoutZ.yaxis.title = 'z-axis';
	this.layoutZ.yaxis.range = [-20, 20];
	this.plotLayouts = {x: this.layoutX, y: this.layoutY, z: this.layoutZ};

	//plotting
	Plotly.newPlot('y-plot', this.plotDatas.y, this.plotLayouts.y);
	Plotly.newPlot('x-plot', this.plotDatas.x, this.plotLayouts.x);
	Plotly.newPlot('z-plot', this.plotDatas.z, this.plotLayouts.z);

  this.updateRepeatCount = 0;
  this.finishedPlotting = false;

  this.updatePlots = function(){
    this.updateRepeatCount++;
		var newXTime = this.drawPointFramesInterval*this.updateRepeatCount/fps;
    // this.updateSpecificPlot(this.traceY);
    // this.updateSpecificPlot(this.traceX);
    // this.updateSpecificPlot(this.traceZ);
		this.traceX.x.push(newXTime);
		this.traceX.y.push(this.ball.position.x);
		this.traceY.x.push(newXTime);
		this.traceY.y.push(this.ball.position.y);
		this.traceZ.x.push(newXTime);
		this.traceZ.y.push(this.ball.position.z);
  }

  this.updateSpecificPlot = function(trace){
    trace.x.push(this.drawPointFramesInterval*this.updateRepeatCount/fps);
    trace.y.push(this.ball.position[trace.domID.charAt(0)]);
  }

	this.fillAllPlots = function(){
    this.fillSpecificPlot(this.traceX);
    this.fillSpecificPlot(this.traceY);
    this.fillSpecificPlot(this.traceZ);
    this.finishedPlotting = true;
	}

	this.fillSpecificPlot = function(trace){
    //Plotly.extendTraces(trace.domID, {x: [trace.x], y: [trace.y]}, [0]);
		Plotly.animate(trace.domID, {
			data: [{x: trace.x, y: trace.y}],
			transition: {
				duration: 10,
				easing: 'cubic-in-out'
			},
			frame: {
				duration: 10,
				redraw: false
			}
		});
	}

  this.resetPlots = function(){
    this.updateRepeatCount = 0;
    this.resetSpecificPlot(this.traceX);
    this.resetSpecificPlot(this.traceY);
    this.resetSpecificPlot(this.traceZ);
    this.finishedPlotting = false;
  }

  this.resetSpecificPlot = function(trace){
    trace.x.length = 0;
    trace.y.length = 0;
    Plotly.animate(trace.domID, {
      data: [{x: trace.x, y: trace.y}],
      transition: {
        easing: 'cubic-in-out'
      },
      frame: {
      }
    });
  }
}
