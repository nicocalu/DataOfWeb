1. `$x("/Company/Employee")`
2. `$x("/Company/Employee/Email")`
3. `$x("//Employee/@salary")` @ for tag attributes
4. `$x("count(//Employee)")` count()
5. `$x("//Employee[2]")`
6. `$x("//Employee[position()<4]")` position()
7. `$x("//Employee[@id=6]/Age")`
8. `$x("//Employee[child::LastName='Wayne']/Age")`
9. `$x("//Employee[Age/text()<30]")`
10. `$x("sum(//@salary)")`
11. `$x("//Employee/LastName[following-sibling::Category='Officer']") `
12. `$x("//Employee[string-length(LastName)>4]")`
13. `$x("//Employee[contains(Position,'Chief')]")`
14. `$x("//Employee[contains(Email,LastName)]")` -> `$x("//Employee[contains(substring-after(Email,'@'),LastName)]")`
15. `$x("//Employee[position()=last()-1]/node()[position()=last()]")`

### Average Bike Stand Number
- $x("sum(//velovstation/bike_stands) div count(//velovstation)")

### Position of Velov Station "10006 - CHARPENNES" in Villeurbanne
- $x("count(//velovstation[commune='Villeurbanne' and preceding-sibling::velovstation[commune='Villeurbanne']]/name[.='10006 - CHARPENNES']) + 1")

### Velov Stations with Available Bikes Greater Than Twice the Average
- $x("//velovstation[availabilityInfo/available_bikes > 2 * (sum(//velovstation/availabilityInfo/available_bikes) div count(//velovstation))]/name")

### Unique Commune Names That Don't Contain "Lyon"
- $x("//velovstation[not(contains(commune, 'Lyon'))]/commune[not(. = preceding::velovstation/commune)]")
