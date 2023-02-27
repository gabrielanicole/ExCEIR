// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/grouped-bar-chart
function GroupedBarChart(data, {
	x = (d, i) => i, // given d in data, returns the (ordinal) x-value
	y = d => d, // given d in data, returns the (quantitative) y-value
	z = () => 1, // given d in data, returns the (categorical) z-value
	title, // given d in data, returns the title text
	marginTop = 30, // top margin, in pixels
	marginRight = 0, // right margin, in pixels
	marginBottom = 30, // bottom margin, in pixels
	marginLeft = 40, // left margin, in pixels
	width = 640, // outer width, in pixels
	height = 400, // outer height, in pixels
	xDomain, // array of x-values
	xRange = [marginLeft, width - marginRight], // [xmin, xmax]
	xPadding = 0.1, // amount of x-range to reserve to separate groups
	yType = d3.scaleLinear, // type of y-scale
	yDomain, // [ymin, ymax]
	yRange = [height - marginBottom, marginTop], // [ymin, ymax]
	zDomain, // array of z-values
	zPadding = 0.05, // amount of x-range to reserve to separate bars
	yFormat, // a format specifier string for the y-axis
	yLabel, // a label for the y-axis
	colors = d3.schemeTableau10, // array of colors
	div_name,
	test_system,
  } = {}) {


	// Compute values.
	const X = d3.map(data, x);
	const Y = d3.map(data, y);
	const Z = d3.map(data, z);
  
	// Compute default domains, and unique the x- and z-domains.
	if (xDomain === undefined) xDomain = X;
	if (yDomain === undefined) yDomain = [d3.min(Y)<0 ? d3.min(Y) : 0, d3.max(Y) < 0 ? 0 :  d3.max(Y) ];
	if (zDomain === undefined) zDomain = Z;
	xDomain = new d3.InternSet(xDomain);
	zDomain = new d3.InternSet(zDomain);
  
	// Omit any data not present in both the x- and z-domain.
	const I = d3.range(X.length).filter(i => xDomain.has(X[i]) && zDomain.has(Z[i]));
  
	// Construct scales, axes, and formats.
	const xScale = d3.scaleBand(xDomain, xRange).paddingInner(xPadding);
	const xzScale = d3.scaleBand(zDomain, [0, xScale.bandwidth()]).padding(zPadding);
	const yScale = yType(yDomain, yRange);
	// const zScale = d3.scaleOrdinal(zDomain, colors);
	const zScale = d3.scaleOrdinal(['test', 'baseline'], colors);
	const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
	const yAxis = d3.axisLeft(yScale).ticks(height / 60, yFormat);
  
	// Compute titles.
	if (title === undefined) {
	  const formatValue = yScale.tickFormat(100, yFormat);
	  title = i => `${X[i]}\n${Z[i]}\n${formatValue(Y[i])}`;
	  title = i => `<em>system ${Z[i]} </em><br> \n round ${X[i]}\n<br>${formatValue(Y[i])}`; 
	} else {
	  const O = d3.map(data, d => d);
	  const T = title;
	  title = i => T(O[i], i, data);

	//   (d, i) => "<em>" +sys[0] +"</em><br> <u> "+ x_type +" "+ x_values[i] +" </u> <br> <b>"+d.toString().substring(0,5) +"</b>") 
	}


	svg = d3.selectAll(div_name)
			.append("svg")
			// .attr("viewBox", [0, 0, width, height]);
			// const svg = d3.create("svg")
			.attr("width", width)
			.attr("height", height)
			.attr("viewBox", [0, 0, width, height])
			.attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
	svg.append("g")
		.attr("transform", `translate(${marginLeft},0)`)
		.call(yAxis)
		.call(g => g.select(".domain").remove())
		.call(g => g.selectAll(".tick line").clone()
			.attr("x2", width - marginLeft - marginRight)
			.attr("stroke-opacity", 0.1))
		.call(g => g.append("text")
			.attr("x", -marginLeft)
			.attr("y", 10)
			.attr("fill", "currentColor")
			.attr("text-anchor", "start")
			.text(yLabel));
  
	const bar = svg.append("g")
	  .selectAll("rect")
	  .data(I)
	  .join("rect")
		.attr("x", i => xScale(X[i]) + xzScale(Z[i]))
		.attr("y", i => Y[i] > 0 ? yScale(Y[i]) : yScale(0))
		.attr("width", xzScale.bandwidth())
		.attr("height", i => Math.abs(yScale(0) - yScale(Y[i])))
		// .attr("fill", i => zScale(Z[i]))
		.attr("fill", i => Z[i] == test_system ? zScale('test') : ( Y[i] < 0 ? zScale('test') :zScale('baseline')))
		.attr("data-bs-toggle", 'tooltip')
		.attr("data-bs-title", title) 
		.attr("data-bs-html", "true")
		;
  
	// if (title) bar.append("title")
	// 	.text(title);


  
	svg.append("g")
		.attr("transform", `translate(0,${height - marginBottom})`)
		.call(xAxis);
  
	return svg;  //Object.assign(svg.node(), {scales: {color: zScale}});
  }


  // Copyright 2021, Observable Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/color-legend
function Legend(color, {
	title,
	tickSize = 6,
	width = 320, 
	height = 44 + tickSize,
	marginTop = 18,
	marginRight = 0,
	marginBottom = 16 + tickSize,
	marginLeft = 0,
	ticks = width / 64,
	tickFormat,
	tickValues, 
	div_name = ""
  } = {}) {
  
	function ramp(color, n = 256) {
	  const canvas = document.createElement("canvas");
	  canvas.width = n;
	  canvas.height = 1;
	  const context = canvas.getContext("2d");
	  for (let i = 0; i < n; ++i) {
		context.fillStyle = color(i / (n - 1));
		context.fillRect(i, 0, 1, 1);
	  }
	  return canvas;
	}
  

	d3.selectAll(div_name).html(''); 
	


	// const svg = d3.create("svg")
	svg = d3.selectAll(div_name)
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", [0, 0, width, height])
		.style("overflow", "visible")
		.style("display", "block");
  
	let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
	let x;
  
	// Continuous
	if (color.interpolate) {
	  const n = Math.min(color.domain().length, color.range().length);
  
	  x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));
  
	  svg.append("image")
		  .attr("x", marginLeft)
		  .attr("y", marginTop)
		  .attr("width", width - marginLeft - marginRight)
		  .attr("height", height - marginTop - marginBottom)
		  .attr("preserveAspectRatio", "none")
		  .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
	}
  
	// Sequential
	else if (color.interpolator) {
	  x = Object.assign(color.copy()
		  .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
		  {range() { return [marginLeft, width - marginRight]; }});
  
	  svg.append("image")
		  .attr("x", marginLeft)
		  .attr("y", marginTop)
		  .attr("width", width - marginLeft - marginRight)
		  .attr("height", height - marginTop - marginBottom)
		  .attr("preserveAspectRatio", "none")
		  .attr("xlink:href", ramp(color.interpolator()).toDataURL());
  
	  // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
	  if (!x.ticks) {
		if (tickValues === undefined) {
		  const n = Math.round(ticks + 1);
		  tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
		}
		if (typeof tickFormat !== "function") {
		  tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
		}
	  }
	}
  
	// Threshold
	else if (color.invertExtent) {
	  const thresholds
		  = color.thresholds ? color.thresholds() // scaleQuantize
		  : color.quantiles ? color.quantiles() // scaleQuantile
		  : color.domain(); // scaleThreshold
  
	  const thresholdFormat
		  = tickFormat === undefined ? d => d
		  : typeof tickFormat === "string" ? d3.format(tickFormat)
		  : tickFormat;
  
	  x = d3.scaleLinear()
		  .domain([-1, color.range().length - 1])
		  .rangeRound([marginLeft, width - marginRight]);
  
	  svg.append("g")
		.selectAll("rect")
		.data(color.range())
		.join("rect")
		  .attr("x", (d, i) => x(i - 1))
		  .attr("y", marginTop)
		  .attr("width", (d, i) => x(i) - x(i - 1))
		  .attr("height", height - marginTop - marginBottom)
		  .attr("fill", d => d);
  
	  tickValues = d3.range(thresholds.length);
	  tickFormat = i => thresholdFormat(thresholds[i], i);
	}
  
	// Ordinal
	else {
	  x = d3.scaleBand()
		  .domain(color.domain())
		  .rangeRound([marginLeft, width - marginRight]);
  
	  svg.append("g")
		.selectAll("rect")
		.data(color.domain())
		.join("rect")
		  .attr("x", x)
		  .attr("y", marginTop)
		  .attr("width", Math.max(0, x.bandwidth() - 1))
		  .attr("height", height - marginTop - marginBottom)
		  .attr("fill", color);
  
	  tickAdjust = () => {};
	}
  
	svg.append("g")
		.attr("transform", `translate(0,${height - marginBottom})`)
		.call(d3.axisBottom(x)
		  .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
		  .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
		  .tickSize(tickSize)
		  .tickValues(tickValues))
		.call(tickAdjust)
		.call(g => g.select(".domain").remove())
		.call(g => g.append("text")
		  .attr("x", marginLeft)
		  .attr("y", marginTop + marginBottom - height - 6)
		  .attr("fill", "currentColor")
		  .attr("text-anchor", "start")
		  .attr("font-weight", "bold")
		  .attr("class", "title")
		  .text(title));
	
	return svg.node();
  }


// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/diverging-bar-chart
function DivergingBarChart(data, {
	x = d => d, // given d in data, returns the (quantitative) x-value
	y = (d, i) => i, // given d in data, returns the (ordinal) y-value
	title, // given d in data, returns the title text
	marginTop = 30, // top margin, in pixels
	marginRight = 40, // right margin, in pixels
	marginBottom = 10, // bottom margin, in pixels
	marginLeft = 40, // left margin, in pixels
	width = 640, // outer width of chart, in pixels
	height, // the outer height of the chart, in pixels
	xType = d3.scaleLinear, // type of x-scale
	xDomain, // [xmin, xmax]
	xRange = [marginLeft, width - marginRight], // [left, right]
	xFormat, // a format specifier string for the x-axis
	xLabel, // a label for the x-axis
	yPadding = 0.1, // amount of y-range to reserve to separate bars
	yDomain, // an array of (ordinal) y-values
	yRange, // [top, bottom]
	colors = d3.schemePiYG[3] // [negative, …, positive] colors
  } = {}) {
	// Compute values.
	const X = d3.map(data, x);
	const Y = d3.map(data, y);
  
	// Compute default domains, and unique the y-domain.
	if (xDomain === undefined) xDomain = d3.extent(X);
	if (yDomain === undefined) yDomain = Y;
	yDomain = new d3.InternSet(yDomain);
  
	// Omit any data not present in the y-domain.
	// Lookup the x-value for a given y-value.
	const I = d3.range(X.length).filter(i => yDomain.has(Y[i]));
	const YX = d3.rollup(I, ([i]) => X[i], i => Y[i]);
  
	// Compute the default height.
	if (height === undefined) height = Math.ceil((yDomain.size + yPadding) * 25) + marginTop + marginBottom;
	if (yRange === undefined) yRange = [marginTop, height - marginBottom];
  
	// Construct scales, axes, and formats.
	const xScale = xType(xDomain, xRange);
	const yScale = d3.scaleBand(yDomain, yRange).padding(yPadding);
	const xAxis = d3.axisTop(xScale).ticks(width / 80, xFormat);
	const yAxis = d3.axisLeft(yScale).tickSize(0).tickPadding(6);
	const format = xScale.tickFormat(100, xFormat);
  
	// Compute titles.
	if (title === undefined) {
	  title = i => `${Y[i]}\n${format(X[i])}`;
	} else if (title !== null) {
	  const O = d3.map(data, d => d);
	  const T = title;
	  title = i => T(O[i], i, data);
	}
  
	const svg = d3.create("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", [0, 0, width, height])
		.attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
	svg.append("g")
		.attr("transform", `translate(0,${marginTop})`)
		.call(xAxis)
		.call(g => g.select(".domain").remove())
		.call(g => g.selectAll(".tick line").clone()
			.attr("y2", height - marginTop - marginBottom)
			.attr("stroke-opacity", 0.1))
		.call(g => g.append("text")
			.attr("x", xScale(0))
			.attr("y", -22)
			.attr("fill", "currentColor")
			.attr("text-anchor", "center")
			.text(xLabel));
  
	const bar = svg.append("g")
	  .selectAll("rect")
	  .data(I)
	  .join("rect")
		.attr("fill", i => colors[X[i] > 0 ? colors.length - 1 : 0])
		.attr("x", i => Math.min(xScale(0), xScale(X[i])))
		.attr("y", i => yScale(Y[i]))
		.attr("width", i => Math.abs(xScale(X[i]) - xScale(0)))
		.attr("height", yScale.bandwidth());
  
	if (title) bar.append("title")
		.text(title);
  
	svg.append("g")
		.attr("text-anchor", "end")
		.attr("font-family", "sans-serif")
		.attr("font-size", '20px')
	  .selectAll("text")
	  .data(I)
	  .join("text")
		.attr("text-anchor", i => X[i] < 0 ? "end" : "start")
		.attr("x", i => xScale(X[i]) + Math.sign(X[i] - 0) * 4)
		.attr("y", i => yScale(Y[i]) + yScale.bandwidth() / 2)
		.attr("dy", "0.35em")
		.text(i => format(X[i]));
  
	svg.append("g")
		.attr("transform", `translate(${xScale(0)},0)`)
		.call(yAxis)
		.call(g => g.selectAll(".tick text")
		  .filter(y => YX.get(y) < 0)
			.attr("text-anchor", "start")
			.attr("x", 6));
  
	return svg.node();
  }






// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/dot-plot
function DotPlot(data, {
  x = ([x]) => x, // given d in data, returns the (quantitative) value x
  y = ([, y]) => y, // given d in data, returns the (categorical) value y
  z = () => 1, // given d in data, returns the (categorical) value z
  r = 3.5, // (fixed) radius of dots, in pixels
  xFormat, // a format specifier for the x-axis
  yFormat, // a format specifier for the y-axis
  marginTop = 30, // top margin, in pixels
  marginRight = 30, // right margin, in pixels
  marginBottom = 10, // bottom margin, in pixels
  marginLeft = 30, // left margin, in pixels
  width = 640, // outer width, in pixels
  height, // outer height, in pixels, defaults to heuristic
  xType = d3.scaleLinear, // type of x-scale
  xDomain, // [xmin, xmax]
  xRange = [marginLeft, width - marginRight], // [left, right]
  xLabel, // a label for the x-axis
  yLabel, // a label for the x-axis
  yDomain, // an array of (ordinal) y-values
  yRange, // [top, bottom]
  yPadding = 1, // separation for first and last dots from axis
  zDomain, // array of z-values
  colors, // color scheme
  stroke = "currentColor", // stroke of rule connecting dots
  strokeWidth, // stroke width of rule connecting dots
  strokeLinecap, // stroke line cap of rule connecting dots
  strokeOpacity, // stroke opacity of rule connecting dots
  duration: initialDuration = 250, // duration of transition, if any
  delay: initialDelay = (_, i) => i * 10, // delay of transition, if any
  div_name,
  test_system,
  text_px = '15px',
} = {}) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const Z = d3.map(data, z);

  // Compute default domains, and unique them as needed.
  if (xDomain === undefined) xDomain = d3.extent(X);
  if (yDomain === undefined) yDomain = Y;
  if (zDomain === undefined) zDomain = Z;
  yDomain = new d3.InternSet(yDomain);
  zDomain = new d3.InternSet(zDomain);
  
  // Omit any data not present in the y- and z-domains.
  const I = d3.range(X.length).filter(i => yDomain.has(Y[i]) && zDomain.has(Z[i]));

  // Compute the default height.
  if (height === undefined) height = Math.ceil((yDomain.size + yPadding) * 16) + marginTop + marginBottom;
//   height = height*2; 
  if (yRange === undefined) yRange = [marginTop, height - marginBottom];

  // Chose a default color scheme based on cardinality.
  if (colors === undefined) colors = d3.schemeSpectral[zDomain.size];
  if (colors === undefined) colors = d3.quantize(d3.interpolateSpectral, zDomain.size);

  // Construct scales and axes.
  const xScale = xType(xDomain, xRange);
  const yScale = d3.scalePoint(yDomain, yRange).round(true).padding(yPadding);
  const color = d3.scaleOrdinal(zDomain, colors);
  const xAxis = d3.axisTop(xScale).ticks(width / 80, xFormat);
  const xAxisB = d3.axisBottom(xScale).ticks(width / 80, xFormat);
  const yAxis = d3.axisLeft(yScale).ticks(height / 60, yFormat);


  // // symbolDiamond
var sym = d3.symbol()
	.type(d3.symbolDiamond).size(50);
	// d3.select("#gfg")
// 	.append("path")
// 	.attr("d", sym)
// 	.attr("fill", "green")
// 	.attr("transform", "translate(50,50)");

//   const svg = d3.create("svg")
  var svg = d3.selectAll(div_name).append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width-50, height+30])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

	svg.append("g")
	  .attr("transform", `translate(0,${height - marginBottom})`)
	  .call(xAxisB)
	  .call(g => g.selectAll("text").attr("font-size", text_px));

  svg.append("g")
      .attr("transform", `translate(0,${marginTop})`)
      .call(xAxis)
	  .call(g => g.selectAll("text").attr("font-size", text_px))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("y2", height - marginTop - marginBottom)
          .attr("stroke-opacity", 0.1))
		  .attr("font-size", '15px')
      .call(g => g.append("text")
          .attr("x", width - marginRight)
          .attr("y", -22)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
		  .attr("font-size", text_px)
          .text(xLabel));

	svg.append("g")
		.attr("transform", `translate(${marginLeft},0)`)
		.call(yAxis)
		.call(g => g.selectAll("text").attr("font-size", text_px))
		.call(g => g.select(".domain").remove())
		.call(g => g.selectAll(".tick line").clone()
			.attr("x2", width - marginLeft - marginRight)
			.attr("stroke-opacity", 0.1))
		.call(g => g.append("text")
			.attr("x", -marginLeft)
			.attr("y", 10)
			.attr("fill", "currentColor")
			.attr("text-anchor", "start")
			.attr("font-size", text_px)
			.text(yLabel));

  const g = svg.append("g")
      .attr("text-anchor", "end")
      .attr("font-family", "sans-serif")
      .attr("font-size", '30px')
    .selectAll()
    .data(d3.group(I, i => Y[i]))
    .join("g")
      .attr("transform", ([y]) => `translate(0,${yScale(y)})`);

  g.append("line")
      .attr("stroke", stroke)
      .attr("stroke-width", strokeWidth)
      .attr("stroke-linecap", strokeLinecap)
      .attr("stroke-opacity", strokeOpacity)
      .attr("x1", ([, I]) => xScale(d3.min(I, i => X[i])))
      .attr("x2", ([, I]) => xScale(d3.max(I, i => X[i])));


	  g.selectAll("circle")
	  .data(([, I]) => I)
	  .join("path")
	  .attr("d", sym)
	  .attr("fill", i => color(Z[i]))
	  .attr('transform',  i => 'translate(' + xScale(X[i]) + ', 0)'); 
	//   .attr("transform", "translate(50,50)");
	  // 	.append("path")
	  // 	.attr("d", sym)
	  // 	.attr("fill", "green")
	  // 	.attr("transform", "translate(50,50)");

  g.selectAll("circle")
    .data(([, I]) => I)
    .join("circle")
      .attr("cx", i => xScale(X[i]))
      .attr("fill", i => color(Z[i]))
      .attr("r", r);

//   g.append("text")
//       .attr("dy", "0.35em")
//       .attr("x", ([, I]) => xScale(d3.min(I, i => X[i])) - 6)
//       .text(([y]) => y);

  return Object.assign(svg.node(), {
    color,
    update(yDomain, {
      duration = initialDuration, // duration of transition
      delay = initialDelay, // delay of transition
    } = {}) {
      yScale.domain(yDomain);
      const t = g.transition().duration(duration).delay(delay);
      t.attr("transform", ([y]) => `translate(0,${yScale(y)})`);
    }
  });
}



function parallelPlot(data, {
	x = ([x]) => x, // given d in data, returns the (quantitative) value x
	y = ([, y]) => y, // given d in data, returns the (categorical) value y
	z = () => 1, // given d in data, returns the (categorical) value z
	width = 640, // outer width, in pixels
	height, // outer height, in pixels, defaults to heuristic
	duration: initialDuration = 250, // duration of transition, if any
	delay: initialDelay = (_, i) => i * 10, // delay of transition, if any
	div_name,
	test_system,
}={}
	){

		keys = rounds, 
		x = new Map(Array.from(keys, key => [key, d3.scaleLinear(d3.extent(data, d => d[key]), [margin.left, width - margin.right])]))
		y = d3.scalePoint(keys, [margin.top, height - margin.bottom]);
		z = d3.scaleSequential(x.get(keyz).domain(), t => d3.interpolateBrBG(1 - t));

	const svg = d3.create("svg")
		.attr("viewBox", [0, 0, width, height]);
  
	svg.append("g")
		.attr("fill", "none")
		.attr("stroke-width", 1.5)
		.attr("stroke-opacity", 0.4)
	  .selectAll("path")
	  .data(data.slice().sort((a, b) => d3.ascending(a[keyz], b[keyz])))
	  .join("path")
		.attr("stroke", d => z(d[keyz]))
		.attr("d", d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])))
	  .append("title")
		.text(d => d.name);
  
	svg.append("g")
	  .selectAll("g")
	  .data(keys)
	  .join("g")
		.attr("transform", d => `translate(0,${y(d)})`)
		.each(function(d) { d3.select(this).call(d3.axisBottom(x.get(d))); })
		.call(g => g.append("text")
		  .attr("x", margin.left)
		  .attr("y", -6)
		  .attr("text-anchor", "start")
		  .attr("fill", "currentColor")
		  .text(d => d))
		.call(g => g.selectAll("text")
		  .clone(true).lower()
		  .attr("fill", "none")
		  .attr("stroke-width", 5)
		  .attr("stroke-linejoin", "round")
		  .attr("stroke", "white"));
  
	return svg.node();
  }


  function example_chart_sys(data, params= {'test': 'tf_idf_run', 'bl': ['bm25_run', 'pl2_run']},  div_name = "#d3_example", x_type="round"){
		

	var params = {'color_test': '#0d6efd', 'color_bl':'#6c757d'}; 
	var sys_test = $('#select_test').val();
	
	var systems = Object.entries(data); 
	var sys_name = systems[0][0]; 
	var sys_values = Object.entries(systems[0][1]); 

	// console.log(sys_values); // [[qid, value]]

	var all_x_values = []
	var all_values = []

	systems.forEach(sys => {
		sys_values = Object.entries(sys[1]);
		all_x_values = all_x_values.concat(sys_values.map(x => x[0]));
		all_values = all_values.concat(sys_values.map(x => x[1]));
	})
	var sys_values = Object.entries(systems[0][1]); 

	var x_values = sys_values.map(x => x[0]); 
	var values = sys_values.map(x => x[1]); 

	
	margin = ({top: 20, right: 0, bottom: 30, left: 40});
	height = 500;
	width = d3.select("body").node().getBoundingClientRect().width;


	y = d3.scaleLinear()
		.domain([0, d3.max(all_values)*1.1])
		// .domain([0, d3.max(values)*1.1])
		.range([height - margin.bottom, margin.top])

	x = d3.scaleBand()
		.domain(all_x_values)
		// .domain(x_values)
		.rangeRound([margin.left, width - margin.right])
		.padding(0.1)


	d3.selectAll(div_name).html(''); 
	
	svg = d3.selectAll(div_name)
			.append("svg")
			.attr("viewBox", [0, 0, width, height]);

	svg.append("g")
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.call(d3.axisBottom(x));

	svg.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.call(d3.axisLeft(y));

	xTitle = g => g.append("text")
		.attr("x", width)
		.attr("y", height - 10)
		.attr("fill", "currentColor")
		.attr("text-anchor", "end")
		.text('Round');
	
	yTitle = g => g.append("text")
		.attr("fill", "currentColor")
		// .attr("font-size", 20)
		.attr("y", 20)
		.text("Metric")

	yAxis = g => g
		.attr("transform", `translate(${margin.left},0)`)
		// .call(d3.axisLeft(y).ticks(null, "%"))
		.call(g => g.select(".domain").remove())

		
	// create a tooltip
	var Tooltip = d3.selectAll(div_name)
		.append("div")
		// .attr("class", "popover")
		.attr("stroke", "#000")
		.attr("stroke-width", "1px")
		// .style("position", "absolute")
		.style("visibility", "hidden")
		.style("background", "#fff")
		// .attr("width", width/10)
		.text("I'm a circle!");
				
	var mouseover = function (sys) {
		pointer = d3.pointer(event);

		Tooltip
			.style("opacity", 1)
			.style("visibility", "visible")
			// .style("top", (event.pageY-height)+"px").style("left",(event.pageX-width)+"px")
		d3.select(this)
			.style("stroke", "red")
			.attr("strokeWidth", 2)
			.style("opacity", 1)
	}
	var mousemove = function (e,d) {

		pointer = d3.pointer(e);
		system_name = (e.srcElement).getAttribute('info-system'); 
		round_name = (e.srcElement).getAttribute('info-round'); 
		

		Tooltip
			.html("The exact value of<br> " + system_name +" at" +round_name +": "+ d.toString().substring(0,5))
			// .style("top", ((e.pageY ) - (height*2)) +"px")
			// .attr("transform", `translate(${pointer[0]},0)`)
			.style("top", height - pointer[1] +"px")
			.style("left", pointer[0]+"px")
			// .style("left",(e.pageX - x.bandwidth() )+"px")
			// .style("top", (height - e.pageY) + "px")
			// .style("left", (d3.pointer(this)[0]) + "px")
			// .style("top", (d3.pointer(this)[1]) + "px")
			
	}
	var mouseleave = function (e, d) {
		
		Tooltip
			.style("opacity", 0)
			.style("top", (height - e.pageY) + "px")
			.style("left", (d3.pointer(this)[0]) + "px")
		d3.select(this)
			.style("stroke", "currentColor")
			.style("opacity", 0.7)
	}
	
	systems.forEach(sys => {
		sys_values = Object.entries(sys[1]);
		x_values = sys_values.map(x => x[0]);
		values = sys_values.map(x => x[1]);
		svg.append("g")
			.attr("fill", sys[0] == sys_test ? params['color_test'] : params['color_bl'] )
			.style("opacity", 0.7)
			.attr("stroke", "currentColor")
			.attr("strokeWidth", 0.8)
			.selectAll("circle")
			.data(values)
			.join("circle")
			.attr("class", "circle_perf")
			.attr('info-system', sys[0])
			.attr('info-round', (d, i) => x_values[i])
			.attr("id", (d, i) => "circle_line_" + sys[0] + "_x_" + x_values[i])
			.attr("cx", (d, i) => x(x_values[i]) + x.bandwidth() / 2)
			.attr("cy", (d, i) => y(d))
			.attr("r", 10)
			.attr('eval-type', sys[0] == sys_test ? 'test' : 'baseline')
			.attr("data-bs-toggle", 'tooltip')
			.attr("data-bs-title", (d, i) => "<em>" +sys[0] +"</em><br> <u> "+ x_type +" "+ x_values[i] +" </u> <br> <b>"+d.toString().substring(0,5) +"</b>") // The exact value of<br> " + system_name +" at" +round_name +": "+ d.toString().substring(0,5)
			.attr("data-bs-html", "true")
			// .on("mouseover", mouseover)
			// .on("mousemove", mousemove)
			// .on("mouseleave", mouseleave);
	})

		// svg.append("g")
		// 	.call(xAxis);

		svg.append("g")
			.call(yAxis);

		svg.call(yTitle);
		svg.call(xTitle);


		// return svg.node();
		// }

	div = d3.create("div")
			.style("font", "10px sans-serif")
			.style("text-align", "right")
			.style("color", "white");

	return svg.node();
}