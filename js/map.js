/***

	Config File for corona Maproom v1.0

	Author: yohman
	Last updated: March 13, 2020

***/

/***

	Namespace and defaults

***/

	var corona = {};
	corona.data = {};
	corona.scale = 'log' // log | proportional
	corona.data_label = 'confirmed' // deaths | recovered
	corona.circles = [] //placeholder for the circles
	corona.currentDate = ''
	corona.infopanel = false

/***

	Get the data

***/

$(document).ready(function() {
	corona.getData();
});
	var allResults = [];

corona.getData = function()
{
	var urls = ["https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv", "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv","https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv"];

	for (var i = 0; i < urls.length; i++)
	{
		Papa.parse(urls[i], {
			download: true,
			error: function(err, file, inputElem, reason) { alert('Data is not loading properly. Please try again later. (debug:'+reason+')') },
			complete: function(results,url) {
				console.log('papa parsing '+url)
				allResults.push(results);

				// add data to object
				if(url == urls[0])
				{
					corona.data.confirmed = results
				}
				else if (url == urls[1])
				{
					corona.data.deaths = results
				}
				else if (url == urls[2])
				{
					corona.data.recovered = results
				}

				// when all three datasets are loaded, then...
				if (allResults.length == urls.length)
				{

					console.log(corona.data)

					// add data to object
					corona.data.confirmed.max = getMaxData()
					corona.data.deaths.max = getMaxData()
					corona.data.recovered.max = getMaxData()

					// transpose data
					corona.transposeDataByDate(corona.data.confirmed)
					corona.transposeDataByDate(corona.data.deaths)
					corona.transposeDataByDate(corona.data.recovered)

					// get the headers
					const headers = []
					for (var i = corona.data.confirmed.data[0].length - 1; i > 3; i--) {
						headers.unshift(corona.data.confirmed.data[0][i])
					}

					corona.data.headers = headers
					
					// check data is not empty
					if(findEmptyData())
					{
						corona.data.headers.pop()
					}

					// update last updated
					$('#last-updated').html('Last updated: '+corona.data.headers[corona.data.headers.length-1])

					if (typeof corona.map == 'undefined')
					{
						corona.setParameters()
					}
					else
					{
						corona.init()
					}



					// Do whatever you need to do
				}
			}
		});
	}

	// if(corona.data_label == 'confirmed cases')
	// {
	// 	url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv'
	// }
	// else if (corona.data_label == 'deaths')
	// {
	// 	url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv'
	// }

	// Papa.parse(url, {
	// 	download: true,
	// 	complete: function(results) {


	// 	}
	// });

}

corona.transposeDataByDate = function(data)
{
	console.log('transposing...')
	console.log(data)
	for (var i = data.data[0].length - 1; i >= 0; i--) {
		
		// data is in the 4th column and beyond
		if(i>3)
		{
			thisdate = data.data[0][i]
			// create an object array for each date
			data[thisdate] = []

			$.each(data.data,function(j,val){
				thisarray = []
				
				// add the first couple of columns for place name and lat/lng
				if(j>0)
				{
					for (var k = 3; k >= 0; k--) {
						thisarray.unshift(val[k])
					}
					thisarray.push(val[i])
					// add the 
					data[thisdate].push(thisarray)
				}

			})
		}
	}
}

/***

	Map Settings

***/
corona.setParameters = function()
{

	// instantiate the map
	corona.map = L.map('map',{
		zoomControl: false,
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
	// corona.displayLegend();

	// add the timebar
	corona.setTimebar();
	corona.init()
}

/***

	Initialize the Map

***/
corona.init = function()
{
	console.log('initializing...')

	timebar.update({from:0})

	// start the animation by default
	corona.animate()

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

	$(document).keydown(
		function(e)
		{    

			if (e.keyCode == 39) {      
				console.log('right')

			}
			if (e.keyCode == 37) {      
				console.log('left')

			}
		}
	);


}

/***

	Animate the Map

***/
corona.animate = function()
{
	console.log('animating...')

	// disable buttons while animating
	$('#btn-confirmed').prop('disabled',true)
	$('#btn-deaths').prop('disabled',true)
	$('#btn-recovered').prop('disabled',true)

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
				$('#btn-confirmed').prop('disabled',false)
				$('#btn-deaths').prop('disabled',false)
				$('#btn-recovered').prop('disabled',false)
			},time*i)
		}
	})

}

// change map to show confirmed cases or deaths
corona.changeDataLabel = function(label)
{
	corona.data_label = label
	corona.init()
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
	var emptydata = false
	// find max num in all of the data
	$.each(corona.data.confirmed.data,function(i,val){
		for (var i = val.length - 1; i >= 0; i--) {
			// first 4 columns are not data values
			if(i>3)
			{
				if(val[i] == "")
				{
					emptydata = true
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
		// console.log(val[4])
		if (typeof val[4] !== 'undefined')
		{
			maxdata =  maxdata + parseInt(val[4])
		}
	})

	return maxdata
}

// this determines the size of the circles
function getProportionalCircleSize(num)
{

	const maxsize = 100
	const minsize = 3

	if(corona.scale == 'proportional')
	{
		// anything above this will be the same size
		const max = corona.data[corona.data_label].max*.75


		if(num>max){
			num = max
		}
		circlesize = num*maxsize/max
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
		circlesize = Math.log2(num)*2
		if(circlesize < minsize)
		{
			circlesize = minsize
		}
	}

	return circlesize
}


/***

	Map the data

***/

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

corona.mapCoronaData = function(date)
{
	corona.currentDate = date
	$('#datedisplay').html('<h1>'+getTotalByDate(date)+'</h1>'+corona.data_label+' on '+date)
	// get max of currrent date
	getTotalByDate(date)
	// remove circles
	for (var i = corona.circles.length - 1; i >= 0; i--) {
		if(corona.circles[i] !== undefined)
		{
			corona.circles[i].remove()
		}
	}
	// add circles
	$.each(corona.data[corona.data_label][date],function(i,val){
		// only map if it is a country
		if(val[4]>0)
		{

			prev_day_record = corona.getPreviousDataValue(i);
			prev_day_value = prev_day_record[4]
			cur_day_value = val[4]
			percent_increase = Math.round((cur_day_value- prev_day_value)/prev_day_value*100)

			if(percent_increase>50)
			{
				fillColor = '#de2d26',
				fillOpacity = 0.6
			}
			else if (percent_increase>20)
			{
				fillColor = '#fc9272',
				fillOpacity = 0.4
			}
			else
			{
				fillColor = '#fee0d2',
				fillOpacity = 0.2		
			}

			var circleStyle = {
				"radius": getProportionalCircleSize(val[4]),
				"color": "white",
				"fillColor": fillColor,
				"weight": 1,
				"opacity": fillOpacity,
				"fillOpacity": fillOpacity
			};

			corona.circles[i] = L.circleMarker([val[2], val[3]], circleStyle).addTo(corona.map);			
			corona.circles[i].bindPopup('<h2 style="text-align:center;font-size:3em;">'+val[4]+'</h2><p style="text-align:center;padding:0px;margin:0px">Previous day: '+prev_day_value +' ('+percent_increase+'% increase)'+'</p><p style="text-align:center;font-size:1em;padding:0px;margin:0px">'+corona.data_label+' in '+val[0]+' '+val[1]+'</p>')




			corona.circles[i].on('mouseover',function(e){

				console.log(e)
				// content = $('#spark').sparkline(corona.getSparklineData(i), {
				// 	type: 'bar'
				// });


				// var popup = e.target.getPopup();
				// // var chart_div = document.getElementById("graphdiv");
				// popup.setContent( content );
				this.openPopup()


				// $.sparkline_display_visible();


			})
			corona.circles[i].on('mouseout',function(e){
				this.closePopup()
			})
		}
		
	})

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


corona.changeBaseMap = function(i)
{
	corona.map.removeLayer(corona.basemap)
	corona.basemap = corona.basemaps[i]
	corona.map.addLayer(corona.basemap)
}

corona.displayLegend = function()
{
	var html = ''
	$.each(corona.colorPallete,function(i,val){
		if(i == corona.colorPallete.length-1)
		{
			rightside = '未満'
		}
		else if (i == 0)
		{
			rightside = '以上'
		}
		else
		{
			rightside = '~'+corona.dataBreaks[i-1]
		}

		html += '<tr><td style="background-color:'+val+'"> </td>'
		html += '<td>'+corona.dataBreaks[i]+rightside+'</td></tr>'
	})
	$('#data-legend > tbody:last-child').append(html);

}

corona.toggleInfopanel = function()
{
	console.log('toggling...')
	if(corona.infopanel)
	{
		$('#info-panel').hide()
		corona.infopanel = false
	}
	else
	{
		$('#info-panel').show()
		corona.infopanel = true
	}
}