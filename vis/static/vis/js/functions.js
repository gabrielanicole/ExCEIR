
	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
	})

	$(function () {
		$('[data-bs-toggle="tooltip"]').tooltip()
	})

	$(function () {
		$('[data-toggle="popover"]').popover()
	})

	x = [];
	y = [];

	// Change test system to check. 
	$( ".check-sys" ).change(function() {
		var systems = get_systems(); 
		option = ['<option value=', '>', '</option>']; 
		$( "#select_test" ).html(""); 
		systems.forEach(sys => {
			$( "#select_test" ).append(option[0] + sys + option[1] + 'test systems: '+ sys + option[2]); 
		});

	});

	$( "#select_round" ).change(function() {
		var varSelect = $('#select_round').val() ;
		var datos = df_dict;
		var perf_system = df_sys;	
	});

	$( "#select_std" ).change(function() {
		// console.log("select_round.val: ", $('#select_round').val() );
		var varSelect = $('#select_std').val();

		if (varSelect == "normal" ){
			delta_plot(results_normal, div_name="#d3_deltas"); 

			example_chart_grouped(results_normal, div_name="#d3_normal"); 
		}
		if (varSelect == "uniform" ){
			delta_plot(results_uniform, div_name="#d3_deltas"); 
		}

		if (varSelect == "raw" ){
			delta_plot(result, div_name="#d3_deltas"); 
		}

		$('[data-bs-toggle="tooltip"]').tooltip(); 
	});

	function run_evaluation(){
		var varMetric = $('#select_metric').val() ;
		var varRound = $('#select_round').val() ;
		var rounds = get_rounds();
		var systems = get_systems(); 
		var qids = get_queries(); 
		var sys_test = $('#select_test').val();


		if (rounds.length == 1) { 
			// console.log(1); 
			data = { 
				metric: varMetric, 
				round: rounds[0]['id'], 
				systems : JSON.stringify(systems),
				sys_test : sys_test,
				sys_bl : 'BM25',
				type: 'qids_round',
				csrfmiddlewaretoken: csrf_token };
		} else {
			data = { 
				metric: varMetric, 
				list_rounds: JSON.stringify(rounds), 
				systems : JSON.stringify(systems),
				sys_test : sys_test,
				sys_bl : 'BM25',
				type: 'rounds',
				csrfmiddlewaretoken: csrf_token };
		}
		call_data(data);
	}

	function run_metaanalysis(){
		var sys_bl = $('#select_baseline').val() ;
		var std_method = $('#select_std').val() ;
		var rounds = get_rounds();
		var qids = get_queries(); 
		var varMetric = $('#select_metric').val() ;

		data = { 
				metric: varMetric, 
				list_rounds: rounds, 
				sys_test : sys_test,
				sys_bl : sys_bl,
				type: 'meta_an',
				std: std_method,
				csrfmiddlewaretoken: csrf_token };
		call_data(data);
	};


	$( "#run_eval" ).click(function(){
		run_evaluation();
	});


	$( "#select_metric" ).change(function() {
		run_evaluation();
	}); 


	function get_rounds(){
		// console.log(ees);
		// var ees = "{{ ees_list|escapejs }}"; 
		var checked_rounds = ees_cx.filter(
			ee => $("#btn-check-outlined-round".concat(ee['id'])).prop("checked")
			);
		return checked_rounds; 
	};

	function get_systems(){
		// var systems = '{{ systems|escapejs }}'; 
		var checked_systems = systems_cx.filter(
			sys => $("#btn-check-outlined-sys".concat(sys)).prop("checked")
			);
		return checked_systems; 
	};

	function get_queries(){
		// var queries = '{{ queries|safe }}'; 
		var checked_queries = queries_cx.filter(
			qid => $("#btn-check-outlined-query".concat(qid)).prop("checked")
			);
		return checked_queries; 
	};






	function delta_boxplot(data2, div_name){
		// const w = 300, h = 20, root = d3.select(DOM.svg(w, h))
		// const data = [1, 3, 3.4, 3.5, 3.6, 5, 6]
		// const stats = d3.boxplotStats(data)
		// const x = d3.scaleLinear()
		// 	.domain(d3.extent(data))
		// 	.range([10, w - 10])
		// const boxplot = d3.boxplot()
		// 	.jitter(0)
		// 	.showInnerDots(false)
		// 	.scale(x)
		// root.datum(stats).call(boxplot)


		// return root.node()

	}

	function meta_evaluation_plot(data_summary, data_me, div_name="#d3_metaEval"){
		console.table((data_summary));
		console.table((data_me));
		meta_values = []; 
		to_skip = ["fixed effect","fixed effect wls", "random effect wls"];
		Object.entries(data_me).forEach(study => {

			if ( ! (to_skip.includes(study[0])) ){
				// console.log(study[0], study[1], Object.entries(study[1]));
				meta_values = meta_values.concat({'y': study[0], 'x': study[1]['eff'] , z:'eff' }); 
				meta_values = meta_values.concat({'y': study[0], 'x': study[1]['ci_low']  , z:'min' }); 
				meta_values = meta_values.concat({'y': study[0], 'x':  study[1]['ci_upp'], z:'max' }); 
			}
		
			// x: study[0], y: value, z: effect_name
			// 
			// systems = systems.concat(sys[0]);
			// meta_values = meta_values.concat(Object.entries(study[1]).map(x => ({'system':study[0],'round': x[0],'value': x[1] }))); 
			
		}); 
		// console.log(meta_values); 
		var width = d3.select("body").node().getBoundingClientRect().width;
		var height = 400;
		d3.selectAll(div_name).html(''); 
		DotPlot(meta_values, {
			x: d => d.x,
			y: d => d.y,
			z: d => d.z,
			xFormat: "",
			yFormat: "-",
			xLabel: "effect",
			yLabel: "round", 
			width, 
			height:height,
			xDomain:[-1,1],
			div_name: div_name
			}); 
	}


	function delta_plot(data, type, div_name="#d3_deltas"){

		var sys_test = $('#select_test').val();
		
		if (!(sys_test in data)){
			all_data = Object.entries(data);
			sys_test = all_data[all_data.length-1][0];
			
		}

		// if (type == "rounds"){ // baseline: other rounds 
		// 	all_data = Object.entries(data);
		// 	sys_test = all_data[all_data.length-1][0];
		// }

		var delta = data[sys_test];


		var delta_values = [];
		systems = []

		Object.entries(data).forEach(sys => {
			if (sys[0] != sys_test){
				systems = systems.concat(sys[0]);
				// delta_values = delta_values.concat(Object.entries(sys[1]).map(x => ({'system':sys[0],'round': x[0],'value': (delta[x[0]] / x[1]) -1 }))); 
				delta_values = delta_values.concat(Object.entries(sys[1]).map(x => ({'system':sys[0],'round': x[0],'value': (delta[x[0]]- x[1]) }))); 
			}
		}); 
		
		d3.selectAll(div_name).html(''); 

		var margin = ({top: 20, right: 0, bottom: 30, left: 40});
		var height = 500;
		var width = d3.select("body").node().getBoundingClientRect().width;
		
		lColors = [d3.schemeSpectral[10][1], d3.schemeSpectral[10][8], d3.schemeSpectral[10][5]]; 
		GroupedBarChart(delta_values, {
			x: d => d.round,
			y: d => d.value,
			z: d => d.system,
			// xDomain: d3.groupSort(delta_values, D => d3.sum(D, d => -d.value), d => d.round), // .slice(0, top_best), // top best
			yLabel: "Performance",
			zDomain: systems,
			colors: lColors,
			width,
			// title:  d => d.system, 
			height: 500, 
			div_name: div_name,
			test_system: sys_test, 
			}); 

		if (systems.length > 1) {
			// leg = Legend(d3.scaleOrdinal([systems], d3.schemeSpectral[systems.length]), {
			leg = Legend(d3.scaleOrdinal(['worse', 'better'], lColors), {
				title: "Systems",
				tickSize: 0, 
				div_name: div_name +"_legend",
			})
			// console.log('Legend', leg);
		}

	}

	function example_chart_grouped(data, div_name="#d3_deltas"){
		// systems = ages.columns.slice(1)
		var systems = Object.entries(data).map(x => x[0]); 
		var sys_test = $('#select_test').val();

		if (!(sys_test in data)){
			sys_test = systems[systems.length-1]; 
		}

		var all_values = []

		Object.entries(data).forEach(sys => {
			all_values = all_values.concat(Object.entries(sys[1]).map(x => ({'system':sys[0],'round': x[0],'value': x[1]}))); 
		})

		d3.selectAll(div_name).html(''); 

		var margin = ({top: 20, right: 0, bottom: 30, left: 40});
		var height = 500;
		var width = d3.select("body").node().getBoundingClientRect().width;
		// schemeRdBu[3]
		twoC = [d3.schemeSpectral[6][1], d3.schemeSpectral[6][4], d3.schemeSpectral[6][3]];
		GroupedBarChart(all_values, {
			x: d => d.round,
			y: d => d.value,
			z: d => d.system,
			// xDomain: d3.groupSort(all_values, D => d3.sum(D, d => -d.value), d => d.round), // .slice(0, top_best), // top best
			yLabel: "Performance",
			zDomain: systems,
			colors: twoC,
			width,
			// title:  d => d.system, 
			height: 500, 
			div_name: div_name,
			test_system: sys_test, 
			}); 

		if (systems.length > 1) {
			// leg = Legend(d3.scaleOrdinal([systems], d3.schemeSpectral[systems.length]), {
			leg = Legend(d3.scaleOrdinal(['test_system', 'baselines'], twoC), {
				title: "Systems",
				tickSize: 0, 
				div_name: div_name +"_legend",
			})
		}

	}



	
