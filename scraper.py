import requests
import lxml.etree,json
from datetime import datetime
from datetime import timedelta
import time,os,sys,re
import subprocess as cmd
from git import Repo
from jh import jhscraper, get_jh_data

# function to get the data
def get_raw_data(url,today):
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:61.0) Gecko/20100101 Firefox/74.0'}
    response = requests.get(url,headers=headers)
    js = lxml.etree.HTML(response.content).find('.//body/script').text
    json_objects = js.partition('=')[2].strip()
    filename = "./data/_raw/_raw_"+today+".json"
    target_file = open(filename,"w+")
    target_file.write(json_objects)
    target_file.close()
    return filename

# function to write the json
def write_file(variable_name,day,data,folder=False):
    target_file = variable_name+"_"+day+".json"
    target_location = "./data/"+folder+"/"+target_file
    target = open(target_location,"w")
    target.write(data)
    if folder == "la" or folder == "socal":
        with open(target_location, "a") as file_object:
            # Append ']' at the end of file
            file_object.write("]")
            print('appending ] to LA/SOCAL file')
    return target_location

# function for getting the url and time
def the_scraper(url):
    while True:
        today = datetime.today().strftime('%Y_%m_%d')
        print('Getting records for '+str(today) )
        print('======================')
        file_name = get_raw_data(url,today)
        jhscraper()
        write_the_data_by_line(file_name,today)
        time.sleep(72000)
        

def data_exporter(line,variable,today,pattern=False):
    file_list = []
    if pattern != False:
        match = re.search(pattern, line)
        if match:
            msg = variable +"_" + today +" data written."
            if variable == "COUNTIES_TOTALS":
                data = match.group(1)
                cleaned = data.replace(":","",1)
                file_list.append(write_file("COUNTY_DATA",today,cleaned,folder="ca"))
                print(msg)
            elif variable == "STATES":
                data = match.group(1)
                cleaned = data.replace("window."+variable+" = ",'')
                cleaned += ""
                file_list.append(write_file(variable,today,cleaned,folder="states"))
                print(msg)     
            elif variable == "LA_CITY_TOTALS":
                data = match.group(1)
                cleaned = data.replace("window."+variable+" = ",'')
                cleaned += ""
                file_list.append(write_file(variable,today,cleaned,folder="la"))
                print(msg)
            elif variable == "SOCAL_CITY_TOTALS":
                data = match.group(1)
                cleaned = data.replace("window."+variable+" = ",'')
                cleaned += ""
                file_list.append(write_file(variable,today,cleaned,folder="socal"))
                print(msg)                          
            elif variable == "LATIMES_CALIFORNIA_BY_DAY":
                data = match.group(1)
                cleaned = data.replace("window."+variable+" = ",'')
                file_list.append(write_file(variable,today,cleaned,folder="ca_by_day"))
                print(msg)                                     
    # git_push(file_list)
    return file_list
# function to push to github
def git_push(file_list):
    repo_dir = './'
    repo = Repo(repo_dir)
    if file_list != []:
        commit_message = 'added '+str(file_list)
        origin = repo.remote('origin')
        origin.pull()
        repo.index.add(file_list)
        repo.index.commit(commit_message)
        origin.push()
        print("=============================================")
        print('Finished adding'+str(file_list)+" to the GitHub Repo.")
        print("=============================================")
    return

def run(*popenargs, **kwargs):
    input = kwargs.pop("input", None)
    check = kwargs.pop("handle", False)

    if input is not None:
        if 'stdin' in kwargs:
            raise ValueError('stdin and input arguments may not both be used.')
        kwargs['stdin'] = cmd.PIPE

    process = cmd.Popen(*popenargs, **kwargs)
    try:
        stdout, stderr = process.communicate(input)
    except:
        process.kill()
        process.wait()
        raise
    retcode = process.poll()
    if check and retcode:
        raise cmd.CalledProcessError(
            retcode, process.args, output=stdout, stderr=stderr)
    return retcode, stdout, stderr

def github_commit(today):
    cp = run("git pull", shell=True)
    cp = run("git add --all", shell=True)
    message = "AUTO: "+str(today)+ "data added."
    cp = run("git commit -am 'autoupdate'", shell=True)
    cp = run("git push -u origin master -f", shell=True)

    
def write_the_data_by_line(file_name,today):
    the_file = (str(file_name))
    f = open(the_file, "r")
    for count, line in enumerate(f):
        data_exporter(line,'COUNTIES_TOTALS',today,pattern=r"window\.COUNTIES_TOTALS =.+?(?=:{\")(.*)};")
        data_exporter(line,'LATIMES_CALIFORNIA_BY_DAY',today,pattern=r"window\.LATIMES_CALIFORNIA_BY_DAY =.+?(?=\[)(.*)]")
        data_exporter(line,'LA_CITY_TOTALS',today,pattern=r"window\.LA_CITY_TOTALS =.+?(?=\[)(.*)]")
        data_exporter(line,'SOCAL_CITY_TOTALS',today,pattern=r"window\.SOCAL_CITY_TOTALS =.+?(?=\[)(.*)]")
        data_exporter(line,'STATES',today,pattern=r"window.STATES =.+?(?=\[)(.*);")

    print('======================')
    print('Finished scraping for '+ today)
    print('======================')
    today = datetime.now()
    delta = timedelta(days=1)
    github_commit(today)
    tmr = (today + delta).strftime("%a %m/%d at %H:%M:%S")
    print('Now waiting 24 hours for next scrape on '+ tmr)
    print('======================')
        
# main application
if __name__ == '__main__':
    url = 'https://www.latimes.com/projects/california-coronavirus-cases-tracking-outbreak/'
    the_scraper(url)
