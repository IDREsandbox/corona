
/***

	Map Settings

***/
corona.setParameters = function()
{

	// instantiate the map
	corona.map = L.map('map',{
		zoomControl: false,
		keyboard: false
	});

	//add zoom control with your options
	L.control.zoom({
		 position:'topright'
	}).addTo(corona.map);

	// info control
	corona.info = L.control();

	corona.basemapmapoptions = {
		maxZoom: 		20,
		tileSize: 		512,
		zoomOffset: 	-1,
		// retina: '@2x',
		// detectRetina: true,
		attribution: 	'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
	}

	corona.basemaps = [
		L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', corona.basemapmapoptions),
		L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', corona.basemapmapoptions),
		L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', corona.basemapmapoptions),
	]

	// the basemap default
	corona.basemap = corona.basemaps[1] //0: light 1: dark 2: satellite
	corona.map.setView([20,30], 2);
	corona.map.addLayer(corona.basemap); 

	var circlegroup = new L.featureGroup(corona.circles)

	// if usa, set bounds
	if(corona.geo_scale == 'us')
	{

		var usaBounds = [
			[1.137353581598554,-168.69644165039065], //Southwest
			[58.67426035784768,-27.983551025390625]  //Northeast
		];
		corona.map.setMaxBounds(usaBounds)
		corona.map.fitBounds(usaBounds)

	}
	else if(corona.geo_scale == 'ca')
	{

		var caBounds = [
			[28.684338162917783,-133.99792671203616], //Southwest
			[43.12786211357268,-104.44470405578615]  //Northeast
		];
		corona.map.setMaxBounds(caBounds)
		corona.map.fitBounds(caBounds)

	}
	else if(corona.geo_scale == 'la')
	{

		var laBounds = [
			[33.247875947924385,-120.35247802734376],
			[34.99175369350488,-115.95520019531251]  //Northeast
		];
		corona.map.setMaxBounds(laBounds)
		corona.map.fitBounds(laBounds)
		// corona.map.setZoom(10)

	}
	else
	{
		var globalBounds = [
			[-65.80277639340238,-171.21093750000003],
			[81.97243132048267,192.65625000000003]  //Northeast
		];
		corona.map.setMaxBounds(globalBounds)
		corona.map.fitBounds(globalBounds)
	}

	// add the timebar
	corona.setTimebar();
	corona.init()
}

/***

	Add the timebar

***/
var timebar = ''
corona.setTimebar = function()
{

	$("#timebar").ionRangeSlider({

		skin: 	"round",
		from: 	0,
		grid: 	true,
		grid_num: 10,
		keyboard: true,
		step:	1,
		values:	corona.data.headers,
		onChange: function (data) {
			corona.mapCoronaData(data.from_value)
		},
		onUpdate: function (data) {
			corona.mapCoronaData(data.from_value)
		},
	});
	timebar = $("#timebar").data("ionRangeSlider");
}

/***

	Initialize the Map

***/
corona.init = function()
{
	console.log('initializing...')

	timebar.update({from:0})

	// add basemap toggles
	$('#basemap-light').click(function(){
		corona.changeBaseMap(0)
	})
	$('#basemap-dark').click(function(){
		corona.changeBaseMap(1)
	})
	$('#basemap-satellite').click(function(){
		corona.changeBaseMap(2)
	})

	// enable arrow key navigation
	$(document).keydown(
		function(e)
		{    

			if (e.keyCode == 39) {
				console.log('time shift from '+ timebar.result.from + ' to '+ (timebar.result.from+1)) 
				timebar.update({from:timebar.result.from+1})

			}
			if (e.keyCode == 37) {      
				console.log('time shift from '+ timebar.result.from + ' to '+ (timebar.result.from-1)) 
				timebar.update({from:timebar.result.from-1})

			}
		}
	);

	// start the animation by default
	if(corona.animate)
	{
		$("#coronamodal").on("hidden.bs.modal", function () {
			corona.startAnimation()
		});
	}
}

/***

	Animate the Map

***/
corona.startAnimation = function()
{
	console.log('animating...')

	// disable buttons while animating
	$('#btn-confirmed').prop('disabled',true)
	$('#btn-deaths').prop('disabled',true)
	$('#btn-play').prop('disabled',true)
	$('#btn-proportional').prop('disabled',true)
	$('#btn-log').prop('disabled',true)
	// $('#btn-recovered').prop('disabled',true)

	time = 200
	// loop through each date, wait, and then go to the next one
	$.each(corona.data.headers,function(i,val){
		var t = setTimeout(function(){
			timebar.update({from:i})
		},time*i)

		// when you've reached the last date, enable the buttons
		if(corona.data.headers.length-1 == i)
		{
			var t = setTimeout(function(){
				$('#btn-play').prop('disabled',false)
				$('#btn-confirmed').prop('disabled',false)
				$('#btn-proportional').prop('disabled',false)
				$('#btn-log').prop('disabled',false)
				// only enable if data exists
				if(typeof corona.data['deaths'].data !== 'undefined')
				{
					$('#btn-deaths').prop('disabled',false)
				}
				// if(typeof corona.data['recovered'].data !== 'undefined')
				// {
				// 	$('#btn-recovered').prop('disabled',false)
				// }
			},time*i)
		}
	})

}


/***

	Map the data

***/
corona.mapCoronaData = function(date)
{
	console.log(date)
	corona.currentDate = date
	$('#datedisplay').html('<h1>'+getTotalByDate(date)+'</h1>'+corona.data_label+' on '+date)

	// get max of currrent date
	getTotalByDate(date)

	// do the rankings table
	getRankingsByDate(date)

	// remove circles if they exists
	for (var i = corona.circles.length - 1; i >= 0; i--) {
		if(corona.circles[i] !== undefined)
		{
			corona.circles[i].remove()
		}
	}

	// add circles
	$.each(corona.data[corona.data_label][date],function(i,val){
		// only map if it has more than zero
		if(val[4]>0)
		{
			// set the colors based on percent increase from previous day
			prev_day_record = corona.getPreviousDataValue(i);
			prev_day_value = prev_day_record[4]
			cur_day_value = val[4]
			percent_increase = Math.round((cur_day_value- prev_day_value)/prev_day_value*100)

			// color pallette from color brewer
			// https://colorbrewer2.org/#type=sequential&scheme=Reds&n=4
			if(percent_increase>30) //reddest
			{
				fillColor = '#cb181d',
				fillOpacity = 0.8
			}
			else if(percent_increase>20) //reddest
			{
				fillColor = '#fb6a4a',
				fillOpacity = 0.6
			}
			else if (percent_increase>10) //medium red
			{
				fillColor = '#fcae91',
				fillOpacity = 0.4
			}
			else //transparent white
			{
				fillColor = '#fee5d9',
				fillOpacity = 0.2		
			}

			var circleStyle = {
				"radius": getProportionalCircleSize(val[4]),
				"color": "white",
				"fillColor": fillColor,
				"weight": 1,
				"opacity": fillOpacity,
				"fillOpacity": fillOpacity,
				"data": val
			};

			corona.circles[i] = L.circleMarker([val[2], val[3]], circleStyle).addTo(corona.map);			
			corona.circles[i].bindPopup('<h2 style="text-align:center;font-size:3em;">'+numberWithCommas(val[4])+'</h2><p style="text-align:center;padding:0px;margin:0px">Previous day: '+numberWithCommas(prev_day_value) +' ('+percent_increase+'% increase)'+'</p><p style="text-align:center;font-size:1em;padding:0px;margin:0px">'+corona.data_label+' in '+val[0]+' '+val[1]+'</p>',{autoClose:false})

			corona.circles[i].on('mouseover',function(e){
				corona.drawChart(val)
				this.openPopup()

			})
			corona.circles[i].on('mouseout',function(e){
				$('#chart-container').hide();
				this.closePopup()
			})
		}
		
	})

}


/***

	Additional misc functions...

***/

// this determines the size of the circles
function getProportionalCircleSize(num)
{

	var maxsize = 200
	var minsize = 2

	if(corona.scale == 'proportional')
	{
		// In order to control the size of the circles, add a factor for each scale
		// for this, larger factor is smaller circles
		var factor = .1
		if(corona.geo_scale == 'la')
		{
			factor = 1
			maxsize = 100
		}
		else if(corona.geo_scale == 'us')
		{
			factor = 1
			maxsize = 100
		}
		else if(corona.geo_scale == 'global')
		{
			factor = 1
			maxsize = 200
		}
		// anything above this will be the same size
		var max = corona.data[corona.data_label].max*factor
		if(num>max){
			num = max
		}
		circlesize = num*maxsize/max

		// set min size of circle
		if(circlesize < minsize)
		{
			circlesize = minsize
		}
	}

	/***
		
		logarithmic numbers allows outliers,
		in this case China, not to dominate the map

	***/
	else if (corona.scale == 'log')
	{
		var factor = 2
		if(corona.geo_scale == 'la')
		{
			factor = 3
		}
		if(corona.geo_scale == 'us')
		{
			factor = 1.5
			minsize = 1
		}
		circlesize = Math.log2(num)*factor
		if(circlesize < minsize)
		{
			circlesize = minsize
		}
	}

	return circlesize
}

corona.addLatLonToData = function(data)
{
	// var thisdata = Object.values(data)
	// var thisfips = thisdata[1]

	// join by fips code
	$.each(confirmed,function(i,val)
	{
		if(val[0] == data.fips)
		{
			whattoreturn = {county: val[2], state: val[1],lat: val[3], lon: val[4],confirmed: data.confirmed_cases, deaths: data.deaths, fips: data.fips, date: data.date}
		}
	})
			return whattoreturn

}

corona.getLatLonByFIPS = function(fips)
{
	$.each(corona.data.ca_counties.data,function(i,val){
		if(fips == val[4])
		{
			latlon = [val[6],val[7]]
			return false
		}
	})
	return latlon
}

// change map to show confirmed cases or deaths
corona.changeDataLabel = function(label)
{
	corona.data_label = label
	corona.startAnimation()
	// corona.init()
}


// change circle size format (log vs proportional)
corona.changeScale = function(scale)
{
	corona.scale = scale
	corona.startAnimation()
	// corona.init()
}

// find the max for any day in the data
function getMaxData(data)
{
	var maxdata = 0
	// find max num in all of the data
	$.each(data,function(i,val){
		for (var i = val.length - 1; i >= 0; i--) {
			// first 4 columns are not data values
			if(i>3)
			{
				if(parseInt(val[i])>maxdata)
				{
					maxdata = parseInt(val[i])
				}
			}
		}
	})

	return maxdata
}

function findEmptyData()
{
	var emptydata = true
	// find max num in all of the data
	$.each(corona.data.confirmed.data,function(i,val){
		for (var i = val.length - 1; i >= 0; i--) {
			// first 4 columns are not data values
			if(i>3)
			{
				if(val[i] !== '')
				{
					emptydata = false
				}
			}
		}
	})

	return emptydata
}

// find the total for any given day
function getTotalByDate(date)
{
	var maxdata = 0
	// find max num in all of the data
	$.each(corona.data[corona.data_label][date],function(i,val){
		if (typeof val[4] !== 'undefined')
		{
			if($.isNumeric(val[4]))
			{
				maxdata =  maxdata + parseInt(val[4])
			}
		}
	})

	return numberWithCommas(maxdata)
}

corona.sortedArray = []
// get rankings for any given day
function getRankingsByDate(date)
{
	// empty table
	$("#rankingtable").find("tr:gt(0)").remove();

	// rank based on values
	var ranked = corona.data[corona.data_label][date]
	corona.sortedArray = ranked.sort(function(a, b) { return b[4] - a[4]; });
	$.each(corona.sortedArray,function(i,val){

		// only show if value is gt 0
		if(val[4]>0)
		{
			var deaths = '<span style="opacity:0.5">n/a</span>'
			// var recovered = '<span style="opacity:0.5">n/a</span>'
			// find death values
			$.each(corona.data['deaths'][date],function(j,dval){
				if(val[0] == dval[0] && val[1] == dval[1] && val[2] == dval[2])
				{
					deaths = dval[4]
				}
			})

			// // find recovered values
			// $.each(corona.data['recovered'][date],function(k,rval){
			// 	if(val[0] == rval[0] && val[1] == rval[1] && val[2] == rval[2])
			// 	{
			// 		recovered = rval[4]
			// 	}
			// })

			if(val[0] == '')
			{
				var place = val[1]
			}
			else
			{
				var place = val[1] + ', ' + val[0]
			}

			$('#rankingtable tbody').append('<tr onmouseover="corona.rankingMouseover('+i+')" onmouseout="corona.rankingMouseout('+i+')"><td>'+place+'</td><td align="right">'+numberWithCommas(val[4])+'</td><td align="right">'+deaths+'</td></tr>');
			// $('#rankingtable tbody').append('<tr onmouseover="corona.rankingMouseover('+i+')" onmouseout="corona.rankingMouseout('+i+')"><td>'+place+'</td><td align="right">'+val[4]+'</td><td align="right">'+deaths+'</td><td align="right">'+recovered+'</td></tr>');
		}
	})
}

var prev_opacity
corona.rankingMouseover = function(i)
{
	// highlight the circle on map
	prev_opacity = corona.circles[i].options.opacity
	corona.circles[i].setStyle({weight:2,opacity:1})
	corona.circles[i].openPopup()

	// draw corresponding chart
	corona.drawChart(corona.sortedArray[i])

}

corona.rankingMouseout = function(i)
{
	// prev_opacity = corona.circles[i].options.opacity
	corona.circles[i].setStyle({weight:1,opacity:prev_opacity})
	corona.circles[i].closePopup()
}

corona.getPreviousDataValue = function(pos)
{
	// find where in the array the current date is
	const cur = corona.data.headers.indexOf(corona.currentDate)
	if (cur > 0)
	{
		const prev = cur -1
		const prev_date = corona.data.headers[prev]
		return corona.data[corona.data_label][prev_date][pos]
	}
	else
	{
		return false
	}
}

corona.getSparklineData = function(pos)
{
	const placedata = corona.data[corona.data_label].data[pos+1]
	const sparkdata = []
	$.each(placedata,function(i,val){
		if(i>3)
		{
			sparkdata.push(val)
		}
	})
	return sparkdata
}

corona.changeBaseMap = function(i)
{
	corona.map.removeLayer(corona.basemap)
	corona.basemap = corona.basemaps[i]
	corona.map.addLayer(corona.basemap)
}

corona.changeGeo = function(geo)
{
	console.log('changing geo...')
	corona.geo_scale = geo
	corona.setGeo()

}

corona.drawChart = function(data)
{
	if(data[0] == '')
	{
		var thistitle = data[1]
	}
	else
	{
		var thistitle = data[1]+', '+data[0]
	}

	$('#chart-title').html(thistitle)
	$('#chart-container').show();

	var thisplace = []
	$.each(corona.data[corona.data_label].data,function(i,val){
		// if(($.inArray(data[0],val)>=0))
		if(($.inArray(data[1],val)>=0) && ($.inArray(data[0],val)>=0))
		{
			thisplace = val
		}
	})

	// get rid of first 4 coloumns
	// var datatochart = thisplace.slice(4,100000000000)
	var datatochart = thisplace.slice(4,100000000000)
	new Chartist.Line('.ct-chart', {
		// labels: corona.data.headers,
		series: [
			datatochart
			// [1,2,3,3,3,4,5]
		]
		}, {
			fullWidth: true,
			height: 100,
			chartPadding: {
			right: 0
		}
	});
}

function numberWithCommas(x) {
	if(typeof x !== 'undefined')
	{
    	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
	else
	{
    	return x	
	}
}