/***

	Get the data, parse it, convert it, massage it...

***/

// holder variables 
var allResults = [];
var cafiles = []
var confirmed = []
var deaths = []


// global and Los Angeles
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

				// when all datasets are loaded, then...
				if (allResults.length == urls.length)
				{
					// transpose data
					if(typeof corona.data.confirmed.data !== 'undefined')
					{
						console.log('transposing confirmed data...')
						corona.data.confirmed.max = getMaxData(corona.data.confirmed.data)
						corona.transposeDataByDate(corona.data.confirmed)
					}
					console.log('death length '+corona.data.deaths.data.length)
					if( corona.data.deaths.data.length > 0)
					{
						console.log('transposing death data...')
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

// global and Los Angeles
corona.getLAData = function()
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
			// step: function(row) {
			// 	console.log("row: ",row.data)
			// },
			complete: function(results,url) {
				allResults.push(results);
				corona.allResults = results
				var new_results = []
				// trim the data to only include data after 3/27/2020
				$.each(results.data,function(i,val){
					if(val[0]>'2020-03-26')
					{
						new_results.push(val)
					}
				})
				console.log(new_results)

				console.log("all done for url: ",url)
				// console.log(results)

				var ladata_array = []

				var ladata = new_results
				// console.log(ladata)

				// get distinct date
				// var headers = []
				//["date", "county", "fips", "place", "confirmed_cases", "note", "x", "y"]
				var distinct_place = []
				$.each(ladata,function(i,val){
					if(i>0 && val[0] !=="" && corona.data.headers.indexOf(val[0]) < 0)
					{
						corona.data.headers.unshift(val[0])
					}
					if(val[6] !=="" && distinct_place.indexOf(val[3]) < 0 && typeof val[3] !== 'undefined')
					{
						distinct_place.push(val[3])
						corona.data.confirmed.data.push([val[3],val[1],val[7],val[6]])
					}
				})
				console.log(corona.data.headers)
				// loop through each header to create object array (empty for now)
				$.each(corona.data.headers,function(i,val){
					corona.data.confirmed[val]=[]
					corona.data.confirmed.data[0].push(val) // also add to the master data
				})

				$.each(ladata,function(i,val){
					// console.log(val)
					// ladata_array.push([val[3],val[1],val[6],val[7],val[4]])
					if(i>0 && val[6] !=="" && corona.data.headers.indexOf(val[0]) >= 0)
					{
						// console.log(val[0])
						corona.data.confirmed[val[0]].push([val[3],val[1],val[7],val[6],val[4]])						
					}

					// now let's add the master data
					if(i>0 && val[6] !=="") // not the header nor empty lat/lon
					{
						// find it by place
						$.each(corona.data.confirmed.data,function(j,val2){
							if(val2[0] == val[3]) // that should be a join
							{
								// data is for what date?
								var pos = corona.data.headers.indexOf(val[0]) + 4
								val2[pos] = val[4]
							}
						})
						// corona.data.confirmed.data
					}


				})
				console.log(corona.data.confirmed)
				corona.data.confirmed.max = getMaxData(corona.data.confirmed.data)
				// console.log(ladata_array)
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
}

// USA
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

// california
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


corona.getHeaders=function()
{

	// get the headers
	const headers = []
	// find the array position of the first date
	var pos = corona.data.confirmed.data[0].indexOf('1/22/20')
	if (corona.geo_scale == 'la')
	{
		pos = 4
	}

	// create headers for only the dates
	for (var i = corona.data.confirmed.data[0].length - 1; i > pos-1; i--) {
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
	// console.log(data)
	// find the position for the first date in the array
	var pos = data.data[0].indexOf('1/22/20')
	console.log(pos)
	for (var i = data.data[0].length - 1; i >= 0; i--) {
		
		// data is in the 4th column and beyond
		if(i>pos-1)
		{
			thisdate = data.data[0][i]
			// create an object array for each date
			data[thisdate] = []

			$.each(data.data,function(j,val){
				thisarray = []
				// console.log(val)
				// make sure the array is valid (more than one value)
				if(val.length > 1)
				{
					// skip the header row
					if(j>0)
					{
						// for global add the first couple of columns for place name and lat/lng
						if (corona.geo_scale == 'us')
						{
							var Combined_Key_pos = corona.data.confirmed.data[0].indexOf('Combined_Key')
							var lat_pos = corona.data.confirmed.data[0].indexOf('Lat')
							var lon_pos = corona.data.confirmed.data[0].indexOf('Long_')
							thisarray = ['',val[Combined_Key_pos],val[lat_pos],val[lon_pos]]

						}
						else
						{
							for (var k = 3; k >= 0; k--) {
								thisarray.unshift(val[k])
							}
						}
						thisarray.push(val[i])
						// add the 
						data[thisdate].push(thisarray)
					}

				}

			})
		}
	}
}
