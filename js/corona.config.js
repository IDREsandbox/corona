/***

	Config File for corona Maproom v1.0

	Author: yohman
	Last updated: April 6, 2020
	https://github.com/IDREsandbox/covid19
	
	This visualization is being offered under a CC BY-NC 4.0 license

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
	corona.scale = 'proportional' // log | proportional
	corona.data_label = 'confirmed' // deaths | recovered
	corona.circles = [] //placeholder for the circles
	corona.circles_deaths = [] //placeholder for the circles
	corona.currentDate = ''
	corona.data.headers = []
	corona.geo_scale = 'global' // global | us | la
	corona.urls = {
		global: ["https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv", "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv"],
		// la: ["./data/COVID19LA_confirmed.csv"],
		la: ["https://raw.githubusercontent.com/datadesk/california-coronavirus-data/master/latimes-place-totals.csv"],
		us: ["https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv","https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv"]
	}

/***

	Get this thing started!

***/
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

/***

	Set geography

***/
corona.setGeo = function()
{
	console.log('setting new geo...')

	// allow url paramter to set the geo scale (global vs LA)
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const geo = urlParams.get('geo')
	const scale = urlParams.get('scale')

	if(geo !== null)
	{
		corona.geo_scale = geo
	}
	if(scale !== null)
	{
		corona.scale = scale
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
		corona.getLAData();
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
		console.log('we are in the us...')
		corona.getData()
	}
}

