//
//  JavaScript Restrictor is a browser extension which increases level
//  of security, anonymity and privacy of the user while browsing the
//  internet.
//
//  Copyright (C) 2019  Libor Polcak
//  Copyright (C) 2019  Martin Timko
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.
//

if ((typeof browser) === "undefined") {
    var browser = chrome;
}

// levels of protection

var level_0 = {
    "level_id": "0",
    "level_text": "Built-in 0",
    "level_description": "No protection at all",
    "wrappers": [],
};

var level_1_time_precision = 2;
var level_1 = {
    "level_id": "1",
    "level_text": "Built-in 1",
    "level_description": "Minimal level of protection",
    "wrappers": [
        // HRT
        ["Performance.prototype.now", level_1_time_precision, false],
        // PT2
        ["performance.getEntries", level_1_time_precision],
        ["performance.getEntriesByName", level_1_time_precision],
        ["performance.getEntriesByType", level_1_time_precision],
        // ECMA
        ["window.Date", level_1_time_precision, false],
        // DM
        ["navigator.deviceMemory"],
        // HTML-LS
        ["navigator.hardwareConcurrency"],
    ]
};

var level_2_time_precision = 1;
var level_2 = {
    "level_id": "2",
    "level_text": "Built-in 2",
    "level_description": "Recomended level of protection for most sites",
    "wrappers": [
        // H-C
        ["CanvasRenderingContext2D.prototype.getImageData"],
        ["HTMLCanvasElement.prototype.toBlob"],
        ["HTMLCanvasElement.prototype.toDataURL"],
        // HRT
        ["Performance.prototype.now", level_2_time_precision, false],
        // PT2
        ["performance.getEntries", level_2_time_precision],
        ["performance.getEntriesByName", level_2_time_precision],
        ["performance.getEntriesByType", level_2_time_precision],
        // ECMA
        ["window.Date", level_2_time_precision, false],
        // DM
        ["navigator.deviceMemory"],
        // HTML-LS
        ["navigator.hardwareConcurrency"],
    ]
};

var level_3_time_precision = 0;
var level_3 = {
    "level_id": "3",
    "level_text": "Built-in 3",
    "level_description": "High level of protection",
    "wrappers": [
        // H-C
        ["CanvasRenderingContext2D.prototype.getImageData"],
        ["HTMLCanvasElement.prototype.toBlob"],
        ["HTMLCanvasElement.prototype.toDataURL"],
        // HRT
        ["Performance.prototype.now", level_3_time_precision, false],
        // PT2
        ["performance.getEntries", level_3_time_precision],
        ["performance.getEntriesByName", level_3_time_precision],
        ["performance.getEntriesByType", level_3_time_precision],
        // ECMA
        ["window.Date", level_3_time_precision, false],
        // AJAX
        ["window.XMLHttpRequest", false, true],
        // DM
        ["navigator.deviceMemory"],
        // HTML-LS
        ["navigator.hardwareConcurrency"],
    ]
};

var level_4_time_precision = 0;
var level_4 = {
    "level_id": "0",
    "level_text": "Built-in 4",
    "level_description": "Chrome Zero porting",
    "wrappers": [
        // ["window.Date", level_4_time_precision, true],
        // ["Performance.prototype.now", level_4_time_precision, true]
        // ["window.SharedArrayBuffer", false]
        ["window.Worker", 0]
    ]
};
// var typedArrays = [["window.Uint8Array"], ["window.Int8Array"], ["window.Uint8ClampedArray"], ["window.Int16Array"], ["window.Uint16Array"], ["window.Int32Array"], ["window.Uint32Array"], ["window.Float32Array"], ["window.Float64Array"]];
// level_4.wrappers = level_4.wrappers.concat(typedArrays);

// default extension_settings_data setting. used on install
var extension_settings_data = level_0;

// Level aliases
const L0 = "0";
const L1 = "1";
const L2 = "2";
const L3 = "3";
const L4 = "4";

var levels = {};
var default_level = {};
var domains = {};

function init_levels() {
    levels = {
        [level_0.level_id]: level_4,
        [level_1.level_id]: level_1,
        [level_2.level_id]: level_2,
        [level_3.level_id]: level_3,
        [level_4.level_id]: level_4
    };
    default_level = Object.create(levels[L0]);
    default_level.level_text = "Default";
}

init_levels();

let levels_initialised = false;
let levels_updated_callbacks = [];

function updateLevels(res) {
    init_levels();
    custom_levels = res["custom_levels"] || {};
    for (let key in custom_levels) {
        levels[custom_levels[key].level_id] = custom_levels[key];
    }
    var new_default_level = res["__default__"];
    if (new_default_level === undefined || new_default_level === null || !(new_default_level in levels)) {
        default_level = Object.create(levels[L2]);
        setDefaultLevel(L2);
    } else {
        default_level = Object.create(levels[new_default_level]);
    }
    default_level.is_default = true;
    var new_domains = res["domains"] || {};
    for (let d in new_domains) {
        domains[d] = new_domains[d];
    }
    var orig_levels_updated_callbacks = levels_updated_callbacks;
    levels_updated_callbacks = [];
    orig_levels_updated_callbacks.forEach((it) => it());
    levels_initialised = true;
}

browser.storage.sync.get(null, updateLevels);

function changedLevels(changed, area) {
    browser.storage.sync.get(null, updateLevels);
}

browser.storage.onChanged.addListener(changedLevels);

function setDefaultLevel(level) {
    browser.storage.sync.set({__default__: level});
}

function saveDomainLevels() {
    browser.storage.sync.set({domains: domains});
}

function getCurrentLevelJSON(url) {
    var subDomains = extractSubDomains(new URL(url).hostname.replace(/^www\./, ''));
    for (let domain of subDomains.reverse()) {
        if (domain in domains)
            return levels[domains[domain].level_id];
    }
    return default_level;
}
