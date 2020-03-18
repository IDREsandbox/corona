import requests
import lxml.etree,json
from datetime import datetime
import time

# function to get the data
def get_raw_data(url,today):
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:61.0) Gecko/20100101 Firefox/74.0'}
    response = requests.get(url,headers=headers,verify=False)
    js = lxml.etree.HTML(response.content).find('.//body/script').text
    json_objects = js.partition('=')[2].strip()
    filename = "./data/_raw_"+today+".txt"
    target_file = open(filename,"w+")
    target_file.write(json_objects)
    write_the_data_by_line(target_file,today)

# function to write the json
def write_file(variable_name,day,data):
    target_file = variable_name+"_"+day+".json"
    target = open("./data/"+target_file,"a")
    target.write(data)

# function for getting the url and time
def the_scraper(url):
    while True:
        today = datetime.today().strftime('%Y_%m_%d')
        print('now getting record for'+str(today) )
        get_raw_data(url,today)
        time.sleep(72000)
        

def write_the_data_by_line(target_file,today):
    count = 0
    for count, line in enumerate(target_file):
        if count == 0:
            variable_name = "CALIFORNIA_BY_DAY"
            data = str(variable_name)+" = "+line      
            write_file(variable_name,today,data)
        elif count == 1:
            variable_name = "COUNTY_DATA"
            line.replace('window.COUNTY_DATA','COUNTY_DATA')
            write_file(variable_name,today,data)
        elif count == 2:
            variable_name = "STATES"
            line.replace('window.STATES','STATES')
            write_file(variable_name,today,data)

# main application
if __name__ == '__main__':
    url = 'https://www.latimes.com/projects/california-coronavirus-cases-tracking-outbreak/'
    the_scraper(url)
