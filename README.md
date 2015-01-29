# twist-device-csv
Command line tool to add devices to csv files for use with Twist

# Instructions
Initially run the add command to set up a resource file which will be a master version of the devices set up

```javascript
node twist-device-csv.js add
```
This will ask questions as to the fields of the device you want to add

```javascript
node twist-device-csv.js remove
```
This will display a list of devices. Enter the number of the device you wish to remove

```javascript
node twist-device-csv.js sanitise path/
```
This will copy the resource file to all *.scn.csv files in the stated path

config.js contains some basic configuration to change the name of the fields etc
