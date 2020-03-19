import requests
import lxml.etree,json
from datetime import datetime
from datetime import timedelta
import time
import os,sys,re

# function to get the data
def get_raw_data(url,today):
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:61.0) Gecko/20100101 Firefox/74.0'}
    response = requests.get(url,headers=headers)
    js = lxml.etree.HTML(response.content).find('.//body/script').text
    json_objects = js.partition('=')[2].strip()
    filename = "./data/_raw_"+today+".json"
    target_file = open(filename,"w+")
    target_file.write(json_objects)
    target_file.close()
    return filename

# function to write the json
def write_file(variable_name,day,data):
    target_file = variable_name+"_"+day+".json"
    target = open("./data/"+target_file,"w")
    target.write(data)

# function for getting the url and time
def the_scraper(url):
    while True:
        today = datetime.today().strftime('%Y_%m_%d')
        print('now getting record for '+str(today) )
        file_name = get_raw_data(url,today)
        write_the_data_by_line(file_name,today)
        time.sleep(72000)
        

def data_exporter(line,variable,today,pattern=False):
    if pattern != False:
        match = re.search(pattern, line)
        if match:
            msg = variable +"_" + today +" data written."
            if variable == "COUNTY_DATA":
                data = match.group(1)
                cleaned = data.replace(":","",1)
                write_file(variable,today,cleaned)
                print(msg)
            else:
                print(msg)
                write_file(variable,today,line)
        

def write_the_data_by_line(file_name,today):
    the_file = (str(file_name))
    f = open(the_file, "r")
    for count, line in enumerate(f):
        data_exporter(line,'COUNTY_DATA',today,pattern=r"window\.COUNTY_DATA =.+?(?=:{\")(.*)};")
        data_exporter(line,'LATIMES_CALIFORNIA_BY_DAY',today,pattern=r"window\.LATIMES_CALIFORNIA_BY_DAY =.+?(?=\[)(.*)]")
        data_exporter(line,'STATES',today,pattern=r"window.STATES =.+?(?=\[)(.*)];")

    print('======================')
    print('Finished scraping for '+ today)
    print('======================')
    today = datetime.now()
    delta = timedelta(days=1)
    tmr = (today + delta).strftime("%a %m/%d at %H:%M:%S")
    print('Now waiting 24 hours for next scrape on '+ tmr)
    print('======================')
        
# main application
if __name__ == '__main__':
    url = 'https://www.latimes.com/projects/california-coronavirus-cases-tracking-outbreak/'
    the_scraper(url)
