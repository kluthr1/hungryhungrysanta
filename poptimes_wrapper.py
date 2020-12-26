import sys
#sys.path.insert(1, '/app/test_poptimes/populartimes/')

#from populartimes.crawler import *
from crawler import *
import json
from datetime import datetime

def get_popularity_info(place_id, weekday, hour):
    api_key = "AIzaSyBjqoKTMlzPkY9EE9luDcpTXrftaxjifik"
    place_info = get_populartimes(api_key,place_id)
    try:
        expected_popularity = place_info["populartimes"][weekday]["data"][hour]
    except:
        expected_popularity = 0

    try:
        current_popularity = place_info["current_popularity"]
    except:
        current_popularity = 0

    place_info['current_popularity'] = current_popularity
    place_info['expected_popularity'] = expected_popularity
    return(place_info)

def multiple_locations(place_list,  weekday, hour):
    place_dict = {}
    for location in place_list:
        details = get_popularity_info(location, weekday, hour)
        place_dict[location] = details
    return(place_dict)

temp_place = sys.argv[1]
temp_place = temp_place.split(",")
weekday = int(sys.argv[2])
hour = int(sys.argv[3])
#temp_place =  ["ChIJPWuhSAV644kRBAzOCF4Bqno"]

# hour = int(datetime.today().strftime("%H:%M:%S").split(":")[0])
# weekday = datetime.today().weekday()
json_object = json.dumps(multiple_locations(temp_place, weekday, hour))
print(json_object)
