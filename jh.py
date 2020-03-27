import requests
import lxml.etree,json
from datetime import datetime
from datetime import timedelta
import time,os,sys,re
import subprocess as cmd
# from git import Repo

# function to get the data
def get_jh_data(today):
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:61.0) Gecko/20100101 Firefox/74.0'}
    filename = "./data/daily/"+today+".csv"
    url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/"+today+".csv"
    get_file = requests.get(url,headers=headers)
    target_file = open(filename, 'wb').write(get_file.content)
    print("Finished writing file for today "+filename)

# function to get old data
def get_old_data(start,end,month):
    for date in range(start,end):
        day = str(date)
        filename = "./data/daily/"+month+"-"+day+"-2020.csv"
        url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/"+month+"-"+day+"-2020.csv"
        get_file = requests.get(url)
        target_file = open(filename, 'wb').write(get_file.content)
        print("Finished writing old file "+filename)

def jhscraper():
        today_git = datetime.today().strftime('%m-%d-%Y')
        print('Getting records for '+str(today_git) )
        get_jh_data(today_git)

# main application
if __name__ == '__main__':
    url = 'https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports'
    jhscraper(url)
