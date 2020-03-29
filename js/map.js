/***

	Config File for corona Maproom v1.0

	Author: yohman
	Last updated: March 13, 2020

***/

/***

	Namespace and defaults

***/

	var corona = {};
	corona.data = {
		confirmed: {
			data: []
		},
		deaths: {
			data: []
		},
		recovered: {
			data: []
		}
	}
	// corona.animate = false
	corona.animate = true
	corona.scale = 'log' // log | proportional
	// corona.scale = 'proportional' // log | proportional
	corona.data_label = 'confirmed' // deaths | recovered
	corona.circles = [] //placeholder for the circles
	corona.currentDate = ''
	corona.infopanel = false
	corona.data.headers = []
	corona.geo_scale = 'us' // global | la
	corona.urls = {
		// global: ["https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv", "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv","https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv"],
		global: ["https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv", "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv"],
		// global: ["https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv", "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv","https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv"],
		la: ["./data/COVID19LA_confirmed.csv"],
		us: ["https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-28-2020.csv",
		"https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-27-2020.csv",
		"https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-26-2020.csv",
		"https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-25-2020.csv",
		"https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-24-2020.csv",
		"https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-23-2020.csv",
		"https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-22-2020.csv"]
	}

/***

	Get the data

***/
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

$(document).ready(function() {

	// put the about stuff in the modal
	$('.modal-body').load('about.html')
	$('#coronamodal').modal('show')

	// hide stuff if mobile
	if ($(window).width() < 500)
	{
		$('#rankingtable').hide()
		$('#info-panel').hide()
		$('#maptype').hide()
	}

	// set the height of the rankings table to half the window height
	$('#rankingtable-container').height($(window).height()/2)

	corona.setGeo()
});


corona.setGeo = function()
{
	console.log('setting new geo...')

	// allow url paramter to set the geo scale (global vs LA)
	const geo = urlParams.get('geo')
	if(geo !== null)
	{
		corona.geo_scale = geo
	}

	// change the data source based on the data and route to the right "get data" function
	if(corona.geo_scale == 'global')
	{
		$('#datasource').html('<a href="https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data" target="_blank">COVID-19 Data Repository by Johns Hopkins CSSE</a>')
		// disable/enable button
		$('#btn-global').prop('disabled',true)
		$('#btn-ca').prop('disabled',false)
		$('#btn-la').prop('disabled',false)
		$('#btn-us').prop('disabled',false)
		corona.getData();
	}
	else if (corona.geo_scale == 'la')
	{
		$('#datasource').html('<a href="https://www.latimes.com/projects/california-coronavirus-cases-tracking-outbreak/" target="_blank">LA Times</a>')
		// disable/enable button
		$('#btn-global').prop('disabled',false)
		$('#btn-ca').prop('disabled',false)
		$('#btn-la').prop('disabled',true)
		$('#btn-us').prop('disabled',false)
		// no death data in LA
		$('#btn-deaths').hide()
		corona.getData();
	}
	else if (corona.geo_scale == 'ca')
	{
		$('#datasource').html('<a href="https://www.latimes.com/projects/california-coronavirus-cases-tracking-outbreak/" target="_blank">LA Times</a>')
		// disable/enable button
		$('#btn-global').prop('disabled',false)
		$('#btn-ca').prop('disabled',true)
		$('#btn-la').prop('disabled',false)
		$('#btn-us').prop('disabled',false)
		corona.getCAData()
	}
	else if (corona.geo_scale == 'us')
	{
		$('#datasource').html('<a href="https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data" target="_blank">COVID-19 Data Repository by Johns Hopkins CSSE</a>')
		// disable/enable button
		$('#btn-global').prop('disabled',false)
		$('#btn-ca').prop('disabled',false)
		$('#btn-la').prop('disabled',false)
		$('#btn-us').prop('disabled',true)
		corona.getUSData()
	}
}

// holder variables 
var allResults = [];
var cafiles = []
var confirmed = []
var deaths = []

corona.getCAData = function()
{
	console.log('parsing ca...')

	// first get all the CA datasets in the data/ca directory
	$.when(

		$.get('./data/ca',function(data){ 
			var find =  $(data).find('a')
			$.each(find,function(i,val){
				if(val.text.search('json')>=0)
				{
					cafiles.push(window.location.origin+window.location.pathname+'data/ca/'+val.text)
				}
			})
		})

	)
	.done
	(function(){

		// papa parse is cool!
		Papa.parse('./data/ca_counties.csv', {
			download: true,
			error: function(err, file, inputElem, reason) { alert('Data is not loading properly. Please try again later. (debug:'+reason+')') },
			complete: function(master,url) {

				corona.data.ca_counties = master
				allResults.push(master);

				
				confirmed.push(['fips','state','county','lat','lon'])
				deaths.push(['fips','state','county','lat','lon'])
				// add the county data lat/lons to the confirmed data
				// also add the fips which will be deleted later to conform
				// with other data formats
				$.each(master.data,function(i,val){
					if(i > 0)
					{
						var thisrow = [val[4],val[2],val[1],val[6],val[7]]
						confirmed.push(thisrow)					
						// deaths.push(thisrow)					
					}
				})
				$.each(master.data,function(i,val){
					if(i > 0)
					{
						var thisrow = [val[4],val[2],val[1],val[6],val[7]]
						// confirmed.push(thisrow)					
						deaths.push(thisrow)					
					}
				})

				// now add the data
				var thisarray = []
				// loop through each date file
				$.each(cafiles,function(i,val){
					// get the date from file name to add as headers
					var header = val.substring(val.length-15,val.length-5)
					// var header = val.substring(48,58)
					header = header.substring(5,7)+'/'+header.substring(8,10)+'/'+header.substring(0,2)
					confirmed[0].push(header)
					deaths[0].push(header)

					// get the data inside the date file
					$.getJSON(val,function(data){

						$.each(data, function(i,val){
							newval = corona.addLatLonToData(val)
							// add newval to the confirmed data
							$.each(confirmed,function(i,confirmedvalue){

								if(confirmedvalue[2]==val.county)
								// if(confirmedvalue[0]==val.fips)
								{
									confirmedvalue.push(val.confirmed_cases)
									// confirmedvalue.shift()
								}

							})
							$.each(deaths,function(i,deathsvalue){
								if(deathsvalue[2]==val.county)
								// if(deathsvalue[0]==val.fips)
								{
									deathsvalue.push(val.deaths)
									// confirmedvalue.shift()
								}

							})
						})

						// when both files have been json'ed
	 					if (i == cafiles.length-1)
	 					{
	 						console.log('both files done...')
	 						$.each(confirmed,function(i,val){
	 							val.shift()
	 						})
	 						$.each(deaths,function(i,val){
	 							val.shift()
	 						})
	 						corona.data.confirmed.data = confirmed
	 						corona.data.deaths.data = deaths
							corona.getHeaders()
							corona.transposeDataByDate(corona.data.confirmed)
							corona.transposeDataByDate(corona.data.deaths)
							// corona.setParameters()

							if (typeof corona.map == 'undefined')
							{
								corona.setParameters()
							}
							else
							{
								corona.init()
							}

	 					}

 					})
				})
			}
		})
	})
}

/***

	Get the Data from remote sources

***/
corona.getUSData = function()
{
	console.log('parsing usa data...')
	// get the right data based on the geo requested
	var urls = corona.urls[corona.geo_scale]
	var counter = 0

	// add the data to corona.confirmed.data
	corona.data.confirmed.data.push(['city','state','lat','lon'])
	corona.data.deaths.data.push(['city','state','lat','lon'])

	// for each data url, parse the csv and convert to JSON
	for (var i = 0; i < urls.length; i++)
	{
		// papa parse is cool!
		Papa.parse(urls[i], {
			download: true,
			error: function(err, file, inputElem, reason) { alert('Data is not loading properly. Please try again later. (debug:'+reason+')') },
			complete: function(master,url) {

				// clear data if it exists
				confirmed = []
				deaths = []
				allResults.push(master);
				counter++

				// get header from file name
				var header = url.substring(url.length-19,url.length-5)
				header = header.substring(5,7)+'/'+header.substring(8,10)+'/'+header.substring(11,13)

				// add to headers
				corona.data.headers.push(header)

				// add the county data lat/lons to the confirmed data
				// also add the fips which will be deleted later to conform
				// with other data formats
				/*

					data format:
					["FIPS", "Admin2", "Province_State", "Country_Region", "Last_Update", "Lat", "Long_", "Confirmed", "Deaths", "Recovered", "Active", "Combined_Key"]

				*/
				$.each(master.data,function(i,val){
					if(val[3] == 'US' && Number(val[6]) !== 0) // only if US
					{
						var confirmedrow = [val[1],val[2],val[5],val[6],val[7]]
						var deathrow = [val[1],val[2],val[5],val[6],val[8]]
						var recoveredrow = [val[1],val[2],val[5],val[6],val[9]]
						confirmed.push(confirmedrow)					
						deaths.push(deathrow)					
					}
				})

				// add to corona data by date
				corona.data.confirmed[header] = confirmed
				corona.data.deaths[header] = deaths

				// when both files have been json'ed
				if (counter == urls.length)
				{

					// sort the headers because they don't necessarily come in order (it's an ajax thing)
					corona.data.headers.sort()

					// Now that all the data is in, create the data format for the chart
					$.each(corona.data.headers,function(i,header){
						// for the first row, add the header
						corona.data.confirmed.data[0].push(header)
						corona.data.deaths.data[0].push(header)
						// note the position in the array it was added to
						pos = corona.data.confirmed.data.length
						// now loop through each value for that date, and add it 
						$.each(corona.data.confirmed[header],function(j,val2){
							// see if this place exists already
							var exists_or_not = corona.data.confirmed.data.find(function(data){
								return data[0] == val2[0] && data[1] == val2[1]
							})
							if(exists_or_not == undefined) //it doesn't exist so add new row
							{
								corona.data.confirmed.data.push(val2)
								corona.data.deaths.data.push(val2)
							}
							else //it exists, append to it
							{
								// where is it?
								var index = corona.data.confirmed.data.indexOf(exists_or_not)
								// add the value
								corona.data.confirmed.data[index].push(val2[4])
								corona.data.deaths.data[index].push(val2[4])
							}
						})

					})

					if (typeof corona.map == 'undefined')
					{
						corona.setParameters()
					}
					else
					{
						corona.init()
					}
				}
			}
		})
	}

}


corona.getData = function()
{
	
	// get the right data based on the geo requested
	var urls = corona.urls[corona.geo_scale]

	// for each data url, parse the csv and convert to JSON
	for (var i = 0; i < urls.length; i++)
	{
		// papa parse is cool!
		Papa.parse(urls[i], {
			download: true,
			error: function(err, file, inputElem, reason) { alert('Data is not loading properly. Please try again later. (debug:'+reason+')') },
			complete: function(results,url) {
				allResults.push(results);
				console.log(url)
				// add data to object
				if(url == urls[0])
				{
					corona.data.confirmed = results
				}
				else if (url == urls[1])
				{
					corona.data.deaths = results
				}
				// else if (url == urls[2])
				// {
				// 	corona.data.recovered = results
				// }

				// when all three datasets are loaded, then...
				if (allResults.length == urls.length)
				{

					// add data to object

					// transpose data
					if(typeof corona.data.confirmed.data !== 'undefined')
					{
						corona.data.confirmed.max = getMaxData(corona.data.confirmed.data)
						corona.transposeDataByDate(corona.data.confirmed)
					}
					if(typeof corona.data.deaths.data.length > 0)
					{
						corona.data.deaths.max = getMaxData(corona.data.deaths.data)
						corona.transposeDataByDate(corona.data.deaths)
					}
					// if(typeof corona.data.recovered.data !== 'undefined')
					// {
					// 	corona.data.recovered.max = getMaxData(corona.data.recovered.data)
					// 	corona.transposeDataByDate(corona.data.recovered)
					// }

					corona.getHeaders()

					if (typeof corona.map == 'undefined')
					{
						corona.setParameters()
					}
					else
					{
						corona.init()
					}

				}
			}
		});
	}


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
corona.getHeaders=function()
{

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

}
corona.transposeDataByDate = function(data)
{
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
				$('#btn-confirmed').prop('disabled',false)
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

// change map to show confirmed cases or deaths
corona.changeDataLabel = function(label)
{
	corona.data_label = label
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

	return maxdata
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

			$('#rankingtable tbody').append('<tr onmouseover="corona.rankingMouseover('+i+')" onmouseout="corona.rankingMouseout('+i+')"><td>'+place+'</td><td align="right">'+val[4]+'</td><td align="right">'+deaths+'</td></tr>');
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

// this determines the size of the circles
function getProportionalCircleSize(num)
{

	var maxsize = 60
	var minsize = 2

	if(corona.scale == 'proportional')
	{
		// anything above this will be the same size
		var max = corona.data[corona.data_label].max*.1


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
		var factor = 2
		if(corona.geo_scale == 'la')
		{
			factor = 2
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
	getRankingsByDate(date)


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

			if(percent_increase>40)
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
				"fillOpacity": fillOpacity,
				"data": val
			};

			corona.circles[i] = L.circleMarker([val[2], val[3]], circleStyle).addTo(corona.map);			
			corona.circles[i].bindPopup('<h2 style="text-align:center;font-size:3em;">'+val[4]+'</h2><p style="text-align:center;padding:0px;margin:0px">Previous day: '+prev_day_value +' ('+percent_increase+'% increase)'+'</p><p style="text-align:center;font-size:1em;padding:0px;margin:0px">'+corona.data_label+' in '+val[0]+' '+val[1]+'</p>',{autoClose:false})




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

	}
	else
	{
		corona.map.fitBounds(circlegroup.getBounds())
	}
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