#!/usr/bin/env node
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

console.log("Executing install_plugins.js hook in before_platform_add");

// List of plugins to install
var pluginlist = [
    {
        id: 	"org.apache.cordova.file"
    },
    {
        id: 	"org.apache.cordova.device"
    },
    {
        id: 	"org.apache.cordova.console"
    },  
	{
        id: 	"org.apache.cordova.statusbar"
    },    
    {
        id: 	"org.apache.cordova.geolocation"
    },
    {
        id: 	"org.apache.cordova.network-information"
    },
    {
        id: 	"org.apache.cordova.splashscreen"
    }
];

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

// Define endsWith function
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function puts(error, stdout, stderr) {
    console.log(stdout);
}

function pluginIsAlreadyInstalled(pluginId, installedPlugins) {
    for (var i = 0; i < installedPlugins.length; i++) {
        var currentPlugin = installedPlugins[i];
        if (currentPlugin.endsWith(pluginId)) {
            console.log('already installed: ' + pluginId);
            return true;
        }
    }

    console.log('not installed: ' + pluginId);
    return false;
}

// Get current list of plugins
exec('phonegap local plugin list', function(error, stdout, stderr) {
    if (error) {
        console.log('error reading plugin list. code: [' + error.code + ']');
    }
    else {
        // Output is expected in the following form:
        // [phonegap] org.apache.cordova.file-transfer
        // [phonegap] org.apache.cordova.splashscreen

        // Split at the newline to get an array of plugin entries
        var pluginListOutput = stdout.split('\n');
        var currentPlugins = [];
        for (var i = 0; i < pluginListOutput.length; i++) {
            var pluginEntry = pluginListOutput[i];

            if (pluginEntry.indexOf('phonegap') !== -1) {
                currentPlugins.push(pluginEntry);
            }
        }

        // Iterate through list of plugins, install those which are missing
        pluginlist.forEach(function(plugin) {
            if (pluginIsAlreadyInstalled(plugin.id, currentPlugins) === false) {
                console.log('installing plugin: ' + plugin.id);
                exec('phonegap local plugin add ' + plugin.id, puts);
            }
        });
    }
});