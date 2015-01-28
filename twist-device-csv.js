var config = require('./config'),
    fs = require('fs'),
    glob = require('glob'),
    readline = require('readline'),
    colors = require('colors'),
    csv = require('csv'),
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    }),
    addDevice = function() {
        var deviceFields = [],
            currentDeviceIndex = 0,
            callback = function(answer) {
                deviceFields.push(answer);
                currentDeviceIndex++;
                if (currentDeviceIndex < config.fields.length) {
                    addDeviceField(config.fields[currentDeviceIndex], callback);
                } else {
                    addDeviceToCsv(deviceFields);
                }
            };

        addDeviceField(config.fields[currentDeviceIndex], callback);
    },
    addDeviceField = function(deviceField, cb) {
        rl.question('Add field - ' + deviceField.bold + ' :', function(answer) {
            cb(answer);
        });
    },
    removeDevice = function() {
        var parsedCsv;

        fs.readFile(config.referenceFile, function(err, data) {
            if (err && err.code == 'ENOENT') {
                console.log('Reference file does not exist'.red.bold);
            } else if (!err) {
                csv.parse(data, {columns: true}, function(err, output) {
                    if (err) {
                        console.log('Error occured parsing reference file'.red.bold);
                        console.log(err);
                    } else {
                        parsedCsv = output;
                        console.log('Choose a device to remove');
                        outputDevices(parsedCsv);
                    }
                });
            } else {
                console.log('Error occured whilst opening reference file'.red.bold);
                console.log(err);
            }
        });
        rl.on('line', function(input) {
            if (isNaN(input) || parsedCsv.length < parseInt(input, 10)) {
                console.log('Input has to be a number'.red.bold);
            } else {
                parsedCsv.splice(parseInt(input, 10), 1);
                csv.stringify(parsedCsv, {header: true}, function(err, output) {
                    if (err) {
                        console.log('Error occured'.red.bold);
                        console.log(err);
                    } else {
                        fs.writeFile(config.referenceFile, output, function(err) {
                            if (err) {
                                console.log('There was an error creating the reference file'.red.bold);
                                console.log(err);
                                process.kill(1);
                            } else {
                                console.log('Removed device'.green.bold);
                                process.kill(0);
                            }
                        });
                    }
                });
            } 
        });
    },
    outputDevices = function(devices) {
        devices.forEach(function(device, index) {
            console.log(index + ' - ' + device.deviceName);
        });
    },
    sanitiseDevices = function() {
        glob('*.scn.csv', function(err, files) {
            if (err) {
                console.log('Error reading files'.red.bold);
                console.log(err);
            } else {
                var stream = fs.createReadStream(config.referenceFile);
                stream.setMaxListeners(1000);
                files.forEach(function(fileName) {
                    stream.pipe(fs.createWriteStream(fileName));
                });
                stream.on('end', function() {
                    console.log('Copied devices to scenario CSVs'.green.bold);
                    process.kill(0); 
                });
            }
        });
    },
    checkArguments = function() {
        var validCommands = ['add', 'remove', 'sanitise', 'help'];

        if (process.argv.length !== 3 ||
            validCommands.indexOf(process.argv[2]) === -1) {
            displayHelp();
        } else {
            verifyReferenceFile(function() {
                if (process.argv[2] === 'add') {
                    addDevice();
                }
                if (process.argv[2] === 'remove') {
                    removeDevice();
                }
                if (process.argv[2] === 'sanitise') {
                    sanitiseDevices();
                }
                if (process.argv[2] === 'help') {
                    displayHelp();
                }
            });
        }
    },
    verifyReferenceFile = function(cb) {
        fs.open(config.referenceFile, 'r', function(err, fd) {
            if (err && err.code == 'ENOENT') {
                console.log('Reference file does not exist'.red.bold);
                createReferenceFile(cb);
            } else if (!err) {
                fs.close(fd);
                cb();
            } else {
                console.log('Error occured whilst opening reference file'.red.bold);
                console.log(err);
            }
        });
    },
    createReferenceFile = function(cb, fields) {
        console.log('Creating reference file'.green);
        csv.stringify(fields || [config.fields], function(err, output) {
            if (err) {
                console.log('There was an error creating the reference file'.red.bold);
                console.log(err);
            } else {
                fs.writeFile(config.referenceFile, output, function(err) {
                    if (err) {
                        console.log('There was an error creating the reference file'.red.bold);
                        console.log(err);
                    } else {
                        console.log('Created reference file'.green.bold);
                        cb();
                    }
                });
            }
        });
    },
    addDeviceToCsv = function(deviceFields) {
        csv.stringify([deviceFields], function(err, output) {
             if (err) {
                 console.log('There was an error appending the reference file'.red.bold);
                 console.log(err);
             } else {
                 fs.appendFile(config.referenceFile, output, function(err) {
                     if (err) {
                         console.log('There was an error appending the reference file'.red.bold);
                         console.log(err);
                     } else {
                         console.log('Appended reference file with device'.green.bold);
                         rl.close();
                     }
                 });
             }
        });
    },
    displayHelp = function() {
        console.log('Instructions!'.red.bold);
        console.log('Commands available');
        console.log('-------------------'.rainbow.bold);
        console.log('add'.bold + ' - Add a new device to existing CSV files');
        console.log('remove'.bold + ' - Remove a device to existing CSV files');
        console.log('sanitise'.bold + ' - Sanitise twist csv files with existing reference devices');
        process.exit(1);
    };
process.stdin.setMaxListeners(0);
checkArguments();
