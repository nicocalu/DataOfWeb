# Queries:

### 1. List all stations located in the city of VILLEURBANNE
```mongodb
db.velov_geo.find({"properties.commune":"VILLEURBANNE"})
```

### 2. List all stations not located in VILLEURBANNE
```nosql
db.velov_geo.find({"properties.commune":{$ne:"VILLEURBANNE"}})
```

### 3. List all stations that do not have a second address (address2 is empty).
```nosql
db.velov_geo.find({"properties.address2":""})
```

### 4. Count the number of stations where the second address has a value.
```nosql
db.velov_geo.find({"properties.address2":{$ne:""}}).count()
```

### 5. List stations with more than 2 bikes available (available_bikes).
```nosql
db.velov_geo.find({"properties.available_bikes":{$gt:2}})
```

### 6. List all distinct cities (communes).
```nosql
db.velov_geo.distinct("properties.commune")
```

### 7. List all distinct cities, sorted in alphabetical order.
```nosql
db.velov_geo.distinct("properties.commune").sort()
```

### 8. List stations in the 9th arrondissement (Lyon 9ème) in ascending order of available bikes.
```nosql
db.velov_geo.find({"properties.commune":"Lyon 9 ème"}).sort({"properties.available_bikes":1})
```
> use -1 in the sort argument to sort descreasing

### 9. Project results onto the station name, address, and number of available bikes.
```nosql
db.velov_geo.find({"properties.commune":"Lyon 9 ème"},
				  {"properties.commune":1,"properties.available_bikes":1,_id:0})
				  .sort({"properties.available_bikes":1})
```

### 10. Display cities and the number of Vélo’V stations in each commune.
```nosql
db.velov_geo.aggregate([{
	$group:{_id:"$properties.commune", nb_station:{$sum:1}}
}])
```

### 11. Sort the results by commune.
```nosql
db.velov_geo.aggregate([{
	$group:{_id:"$properties.commune", nb_station:{$sum:1}}
}]).sort({"_id":1})
```

### 12. Sort the results by the number of stations in descending order.
```nosql
db.velov_geo.aggregate([{
	$group:{_id:"$properties.commune", nb_station:{$sum:1}}
}]).sort({"nb_station":-1})
```

### 13. Count the number of Vélo’V stations in VILLEURBANNE, grouped by the number of available bikes, sorted by this number.
```nosql
db.velov_geo.aggregate([{
	$match:{"properties.commune":"VILLEURBANNE"}},
	{$group:{_id:"$properties.available_bikes", nb_station:{$sum:1}, available:{$push:"$properties.name"}}
}]).sort({"available":-1})
```

### 14. Add to the previous result the names of stations for each number of available bikes.

### 15. Calculate the average number of available bikes per city.
```nosql
db.velov_geo.aggregate([{
	$group:{_id:"$properties.commune", nb_station:{$avg:"$properties.available_bikes"}}
}])
```

### 16. Find Vélo’V Stations Within 500m of a Point
create index :
```nosql
db.velov_geo.createIndex({ "geometry.coordinates": "2dsphere" })
```

```json
$geometry: { type: "Point", coordinates: [ 4.863132722360224, 45.77022676914935 ] }
```

```nosql
db.velov_geo.find({
	"geometry.coordinates":{
		$near:{
			$geometry : {type: "Point", coordinates :[ 4.863132722360224, 45.77022676914935 ]},
			$minDistance : 0,
			$maxDistance : 500
		}
	}
})
```

### 17. List the 5 Closest Stations to Specific Coordinates
```nosql
db.velov_geo.aggregate([
	{
		$geoNear:{
			near : {type: "Point", coordinates :[ 4.863132722360224, 45.77022676914935 ]},
			distanceField : "geometry",
			spherical : true
		}
	}, 
	{$limit:5}	])
```

### 18. Find Stations Where the pole Field Matches "quartiers"
create index:
```nosql
db.velov_geo.createIndex({ "properties.pole": "text" }, { default_language: "french" });
```

# Data Enrichment

### Database link 1 : Historique des disponibilités des stations Vélo'v de la Métropole de Lyon

```url
https://data.grandlyon.com/fr/datapusher/ws/timeseries/jcd_jcdecaux.historiquevelov/all.json?maxfeatures=1000&filename=stations-velo-v-de-la-metropole-de-lyon---disponibilites-temps-reel
```
We can use the historic data for each velo'v station to provide valuable insights into the usage patterns of Vélo’V stations.

### Database link 2 : Stations de climatologie Météo France sur le territoire de la Métropole de Lyon
We can use this small dataset to locate the closest weather station to each velo'v station, to then analyze using hourly data:
```url
https://data.grandlyon.com/fr/datapusher/ws/rdata/meteofrance.climatologie_station/all.json?maxfeatures=-1&filename=stations-de-climatologie-meteo-france-sur-le-territoire-de-la-metropole-de-lyon
```
### Database link 3 : Mesures horaires des stations de climatologie sur le territoire de la Métropole de Lyon
```url
https://data.grandlyon.com/fr/datapusher/ws/timeseries/meteofrance.climatologie_mesure_horaire/all.json?maxfeatures=1000&filename=mesures-horaires-des-stations-de-climatologie-sur-le-territoire-de-la-metropole-de-lyon
```
We use this last dataset to analyze the use patterns of velo'v stations depending on the weather.

## Procedure:
### 1. Data Treatment
1. We need to transform the meteo_station data into something that mongoDB understands. I made a small python script for this:
```python
import json

with open('stations_meteo.json', 'r') as file:
    data = json.load(file)

values = data['values']

with open('stations_meteo_transformed.json', 'w') as file:
    for value in values:
        if value["actif"]==True:
            longitude = value["positions"][-1]["longitude"]
            latitude = value["positions"][-1]["latitude"]
            value.pop("positions")
            value["geometry"] = {
                "type": "Point",
                "coordinates": [longitude, latitude]
            }
            json.dump(value, file)
            file.write('\n')

```

1. We also need to modify the meteo readings to something mongodb understands:
```python
import json

with open('meteo.json', 'r') as file:
    data = json.load(file)

values = data['values']

with open('meteo_precipitation.json', 'w') as pfile:
    with open('meteo_temperature.json', 'w') as tfile:
        for value in values:
            date = list(value["horodate"])
            value.pop("horodate")
            date[10]='T'
            date = date[:19]
            value["horodate"] = ''.join(date)
            # timezone supposed to be france
            if value["observation"] == "RR1":
                json.dump(value, pfile)
                pfile.write('\n')
            elif value["observation"] == "T":
                json.dump(value, tfile)
                tfile.write('\n')
```

And finally, we modify the velov_tr :
```python
import json

with open('velov_tr.json', 'r') as file:
    data = json.load(file)

values = data['values']

with open('velov_tr_transformed.json', 'w') as file:
        for value in values:
            date = list(value["horodate"])
            value.pop("horodate")
            date[10]='T'
            date = date[:19]
            value["horodate"] = ''.join(date)
            # timezone supposed to be france
            json.dump(value, file)
            file.write('\n')
```
### 2. Integrating the data onto MongoDB
2. Download the JSON files and put them all in the `bin` folder of your MongoDB installation.
	1. Be sure to run the python scripts before, so that the data can be imported an used correcly
	2. Then, run the following command in a shell: `mongoimport --db mongoLab --collection [nom_de_coll] --file "[nom_du_fichier]"`
	3. Replace the variables `[nom_de_coll]` by your collection name, and `[nom_du_fichier]` by the name of the downloaded JSON
	4. In my machine, I used the names `velov_tr`, `stations_meteo` and `meteo_precipitation`/`meteo_temperature`.
	5. We add a geographical index to the stations_meteo collection: `db.stations_meteo.createIndex({ "geometry": "2dsphere" })`
### 3. Premiers pas
We start by looking for the closest meteo station to one of the velov station (in this case, the first one in the velov_geo database)
```nosql
 db.stations_meteo_latest.aggregate([
{
       $geoNear: {
         near: { type: "Point", coordinates: [ 4.814373779400059, 45.787384084955846 ] },
         distanceField: "dist.calculated",
         spherical: true
       }
     },
       {$limit : 1}
   ])
```

We can then iterate through all of the velov stations in order to list their closest station
```nosql
db.velov_geo.find().forEach(function(velovStation) {
  var closestMeteoStation = db.stations_meteo.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: velovStation.geometry.coordinates },
        distanceField: "dist.calculated",
        spherical: true
      }
    },
      {$limit : 1}
  ]).next();

  print("Vélo'V Station: " + velovStation.properties.name);
  print("Closest Meteo Station: " + closestMeteoStation.identifiant);
  print("Distance: " + closestMeteoStation.dist.calculated + " meters");
});
```

To make work easier, we will modify all of the velov_geo database to include the closest meteo station, and the distance to it:
We can add this code to the function before:d
```nosql
  db.velov_geo.updateOne(
    { _id: velovStation._id },
    {
      $set: {
        closest_meteo_station_id: closestMeteoStation.identifiant,
        distance_to_closest_meteo_station: closestMeteoStation.dist.calculated
      }
    }
  );
```

### Getting the data
Next, we can create a temporary collection in order to store the data, so that we can export it to csv an analyze it graphically:
Here, we analyze the data for the velov station number 1002 (opera)
```nosql
db.velov_geo.aggregate([
  { 
    $match: { "properties.number": 1002 } 
  },
  {
    $lookup: {
      from: "meteo_temperature",
      localField: "closest_meteo_station_id",
      foreignField: "identifiant",
      as: "temperature_data"
    }
  },
  { 
    $unwind: "$temperature_data" 
  },
  {
    $project: {
      _id: 0, // Exclude the original _id to avoid duplicate key errors
      temperature_data: 1
    }
  },
  {
    $out: "temp_data"
  }
]);

db.velov_geo.aggregate([
  { 
    $match: { "properties.number": 1002 } 
  },
  {
    $lookup: {
      from: "meteo_precipitation",
      localField: "closest_meteo_station_id",
      foreignField: "identifiant",
      as: "precipitation_data"
    }
  },
  { 
    $unwind: "$precipitation_data" 
  },
  {
    $project: {
      _id: 0, // Exclude the original _id to avoid duplicate key errors
      precipitation_data: 1
    }
  },
  {
    $out: "prec_data"
  }
]);


db.velov_geo.aggregate([
  {
	  $match:{"properties.number":1002}
  },
  {
    $lookup: {
      from: "velov_tr",
      localField: "properties.number",
      foreignField: "number",
      as: "usage_data"
    }
  },
  { 
    $unwind: "$usage_data" 
  },
  {
    $project: {
	  _id:0,
      "usage_data.main_stands.availabilities.bikes": 1,
      "usage_data.horodate": 1,
    }
  },
  {$out:"usage_data"}
]);
```

We can use the following command in CMD to export the file to a csv:
```
mongoexport --db mongoLab --collection usage_data --fields "usage_data.main_stands.availabilities.bikes,usage_data.horodate" --out usage_data.csv --type=csv

mongoexport --db mongoLab --collection temp_data --out station_weather_data.csv --fields "temperature_data.identifiant,temperature_data.measurement,temperature_data.horodate" --type=csv

mongoexport --db mongoLab --collection prec_data --out station_preci_data.csv --fields "precipitation_data.identifiant,precipitation_data.measurement,precipitation_data.horodate" --type=csv
```

We can then use a program like Excel to generate the graphs:
