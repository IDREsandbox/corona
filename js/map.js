/***

	Config File for corona Maproom v1.0

	Author: yohman
	Last updated: August 12, 2018

***/

/***

	Namespace and defaults

***/

	var corona = {};
	corona.data = {};
	corona.scale = 'proportional' // log
	corona.data_label = 'confirmed cases'

/***

	Get the data

***/

$(document).ready(function() {
	corona.getData();
});

corona.changeDataLabel = function(label)
{
	corona.data_label = label
	corona.getData()
}

corona.getData = function()
{
	if(corona.data_label == 'confirmed cases')
	{
		url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv'
	}
	else if (corona.data_label == 'deaths')
	{
		url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv'
	}

	Papa.parse(url, {
		download: true,
		complete: function(results) {

			// add data to object
			corona.data.covid_time_series = results
			corona.data.covid_time_series.max = getMaxData()

			// get the headers
			const headers = []
			for (var i = corona.data.covid_time_series.data[0].length - 1; i > 3; i--) {
				headers.unshift(corona.data.covid_time_series.data[0][i])
			}
			corona.data.covid_time_series.headers = headers

			// cycle through results
			for (var i = results.data[0].length - 1; i >= 0; i--) {
				
				// data is in the 4th column and beyond
				if(i>3)
				{
					thisdate = results.data[0][i]
					// create an object array for each date
					corona.data.covid_time_series[thisdate] = []

					$.each(results.data,function(j,val){
						thisarray = []
						
						// add the first couple of columns for place name and lat/lng
						if(j>0)
						{
							for (var k = 3; k >= 0; k--) {
								thisarray.unshift(val[k])
							}
							thisarray.push(val[i])
							// add the 
							corona.data.covid_time_series[thisdate].push(thisarray)
						}

					})
				}
			}
			if (typeof corona.map == 'undefined')
			{
				corona.setParameters()
			}
			else
			{
				corona.init()
			}
		}
	});

}


corona.setParameters = function()
{

	/***

		Map Settings

	***/

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

		// the geography layer
		// corona.mapLayer = L.geoJson();

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


		// the basemap
		corona.basemap = corona.basemaps[1] //0: light 1: dark 2: satellite

	corona.init()
}

corona.init = function()
{
	/*

		Initialize the Map

	*/
	console.log('initializing...')

	corona.map.setView([0,0], 2);
	corona.map.addLayer(corona.basemap); 
	// corona.displayLegend();

	// add circles around F1 (10km, 20km, 30km)
	var circleStyle = {
		"color": "red",
		"weight": 1,
		"opacity": 0.8,
		"fillOpacity": 0.5
	};
	// L.circle([37.422116, 141.030259], 10000,circleStyle).addTo(corona.map);
	// L.circle([37.422116, 141.030259], 20000,circleStyle).addTo(corona.map);
	// L.circle([37.422116, 141.030259], 30000,circleStyle).addTo(corona.map);


	// add the timebar
	corona.setTimebar();
	timebar.update({from:0})
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



}

corona.animate = function()
{
	console.log('animating...')
	// disable buttons
	$('#btn-confirmed').prop('disabled',true)
	$('#btn-deaths').prop('disabled',true)
	// $('#btn-confirmed').addClass('disabled')
	// $('#btn-deaths').addClass('disabled')

	time = 200
	$.each(corona.data.covid_time_series.headers,function(i,val){
		var t = setTimeout(function(){
			timebar.update({from:i})
		},time*i)
			// console.log(i)

		if(corona.data.covid_time_series.headers.length-1 == i)
		{
			console.log('inside...')
			var t = setTimeout(function(){
				$('#btn-confirmed').prop('disabled',false)
				$('#btn-deaths').prop('disabled',false)
				// $('#btn-confirmed').removeClass('disabled')
				// $('#btn-deaths').removeClass('disabled')
			},time*i)
		}
		// time = time + 1000

	})

    // $("div").each(function(index) {        
    //     var that = this;
    //     var t = setTimeout(function() { 
    //         $(that).removeClass("invisible"); 
    //     }, 500 * index);        
    // });


}

function getMaxData()
{

	var maxdata = 0
	// find max num in all of the data
	$.each(corona.data.covid_time_series.data,function(i,val){
		for (var i = val.length - 1; i >= 0; i--) {
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

function getMaxDataByDate(date)
{
	var maxdata = 0
	// find max num in all of the data
	$.each(corona.data.covid_time_series[date],function(i,val){
		if(parseInt(val[4])>maxdata)
		{
			maxdata = parseInt(val[4])
		}
	})

	return maxdata
}

function getProportionalCircleSize(num)
{

	const maxsize = 100
	const minsize = 50
	// anything above this will be the same size
	const max = corona.data.covid_time_series.max*.75


	if(num>max){
		num = max
	}
	if(num<minsize){
		num = minsize
	}
	if(corona.scale == 'proportional')
	{
		circlesize = num*maxsize/max
	}
	else if (corona.scale == 'log')
	{
		circlesize = Math.log2(num)*2
	}
	// const maxsize = 100
	// const max = 10000
	// if(num>max){
	// 	num = max
	// }
	// circlesize = num*maxsize/max
	// circlesize = num*maxsize/max
	return circlesize
}


/*

	Map the data

*/
corona.circles = []
corona.currentDate = ''


corona.mapCoronaData = function(date)
{
	corona.currentDate = date
	$('#datedisplay').html('<h1>'+getMaxDataByDate(date)+'</h1>'+corona.data_label+' on '+date)
	// get max of currrent date
	getMaxDataByDate(date)
	// remove circles
	for (var i = corona.circles.length - 1; i >= 0; i--) {
		if(corona.circles[i] !== undefined)
		{
			corona.circles[i].remove()
		}
	}
	// add circles
	$.each(corona.data.covid_time_series[date],function(i,val){
		// only map if it is a country
		if(val[4]>0)
		{
			var circleStyle = {
				"radius": getProportionalCircleSize(val[4]),
				"color": "red",
				"weight": 1,
				"opacity": 0.8,
				"fillOpacity": 0.5
			};

			corona.circles[i] = L.circleMarker([val[2], val[3]], circleStyle).addTo(corona.map);			
			corona.circles[i].bindPopup('<h2>'+val[4]+'</h2>'+val[0]+' '+val[1])
			corona.circles[i].on('mouseover',function(e){
				this.openPopup()
			})
			corona.circles[i].on('mouseout',function(e){
				this.closePopup()
			})
		}
		
	})

}

/*

	Add the timebar

*/
var timebar = ''
corona.setTimebar = function()
{

	$("#timebar").ionRangeSlider({

		skin: 	"sharp",
		from: 	0,
		grid: 	true,
		step:	1,
		values:	corona.data.covid_time_series.headers,
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
